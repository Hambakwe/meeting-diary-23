<?php
/**
 * Meeting Diary - Hotels API
 * Handles CRUD operations for hotels
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

// Get ID from query string if present
$id = $_GET['id'] ?? null;
$country = $_GET['country'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            // Get single hotel
            $stmt = $pdo->prepare('SELECT * FROM hotels WHERE id = ?');
            $stmt->execute([$id]);
            $hotel = $stmt->fetch();

            if ($hotel) {
                // Convert lat/lng to float
                $hotel['latitude'] = $hotel['latitude'] ? (float)$hotel['latitude'] : null;
                $hotel['longitude'] = $hotel['longitude'] ? (float)$hotel['longitude'] : null;
                sendResponse($hotel);
            } else {
                sendErrorResponse(404, 'Hotel not found');
            }
        } else {
            // Get all hotels, optionally filtered by country
            if ($country) {
                $stmt = $pdo->prepare('SELECT * FROM hotels WHERE country = ? ORDER BY name ASC');
                $stmt->execute([$country]);
            } else {
                $stmt = $pdo->query('SELECT * FROM hotels ORDER BY country, city, name ASC');
            }
            $hotels = $stmt->fetchAll();

            // Convert lat/lng to float
            foreach ($hotels as &$hotel) {
                $hotel['latitude'] = $hotel['latitude'] ? (float)$hotel['latitude'] : null;
                $hotel['longitude'] = $hotel['longitude'] ? (float)$hotel['longitude'] : null;
            }

            sendResponse($hotels);
        }
        break;

    case 'POST':
        $data = getJsonInput();

        if (!validateRequired($data, ['name', 'country', 'city', 'fullAddress'])) {
            sendErrorResponse(400, 'Name, country, city, and full address are required');
        }

        $id = generateId();
        $stmt = $pdo->prepare('
            INSERT INTO hotels (id, name, country, city, area, full_address, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');

        $stmt->execute([
            $id,
            $data['name'],
            $data['country'],
            $data['city'],
            $data['area'] ?? null,
            $data['fullAddress'],
            $data['latitude'] ?? null,
            $data['longitude'] ?? null,
        ]);

        // Return created hotel
        $stmt = $pdo->prepare('SELECT * FROM hotels WHERE id = ?');
        $stmt->execute([$id]);
        $hotel = $stmt->fetch();
        $hotel['latitude'] = $hotel['latitude'] ? (float)$hotel['latitude'] : null;
        $hotel['longitude'] = $hotel['longitude'] ? (float)$hotel['longitude'] : null;

        sendResponse($hotel, 201);
        break;

    case 'PUT':
        if (!$id) {
            sendErrorResponse(400, 'Hotel ID is required');
        }

        $data = getJsonInput();

        if (!validateRequired($data, ['name', 'country', 'city', 'fullAddress'])) {
            sendErrorResponse(400, 'Name, country, city, and full address are required');
        }

        $stmt = $pdo->prepare('
            UPDATE hotels
            SET name = ?, country = ?, city = ?, area = ?, full_address = ?, latitude = ?, longitude = ?
            WHERE id = ?
        ');

        $stmt->execute([
            $data['name'],
            $data['country'],
            $data['city'],
            $data['area'] ?? null,
            $data['fullAddress'],
            $data['latitude'] ?? null,
            $data['longitude'] ?? null,
            $id,
        ]);

        if ($stmt->rowCount() === 0) {
            sendErrorResponse(404, 'Hotel not found');
        }

        // Return updated hotel
        $stmt = $pdo->prepare('SELECT * FROM hotels WHERE id = ?');
        $stmt->execute([$id]);
        $hotel = $stmt->fetch();
        $hotel['latitude'] = $hotel['latitude'] ? (float)$hotel['latitude'] : null;
        $hotel['longitude'] = $hotel['longitude'] ? (float)$hotel['longitude'] : null;

        sendResponse($hotel);
        break;

    case 'DELETE':
        if (!$id) {
            sendErrorResponse(400, 'Hotel ID is required');
        }

        $stmt = $pdo->prepare('DELETE FROM hotels WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            sendErrorResponse(404, 'Hotel not found');
        }

        sendResponse(['success' => true, 'message' => 'Hotel deleted']);
        break;

    default:
        sendErrorResponse(405, 'Method not allowed');
}
