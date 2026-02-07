<?php
/**
 * Meeting Diary - Meetings API
 * Handles CRUD operations for meetings
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

// Get ID from query string if present
$id = $_GET['id'] ?? null;
$status = $_GET['status'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            // Get single meeting with person and hotel details
            $stmt = $pdo->prepare('
                SELECT m.*,
                       p.name as person_name, p.company as person_company, p.role as person_role,
                       h.name as hotel_name, h.city as hotel_city, h.country as hotel_country
                FROM meetings m
                LEFT JOIN persons p ON m.person_id = p.id
                LEFT JOIN hotels h ON m.hotel_id = h.id
                WHERE m.id = ?
            ');
            $stmt->execute([$id]);
            $meeting = $stmt->fetch();

            if ($meeting) {
                sendResponse($meeting);
            } else {
                sendErrorResponse(404, 'Meeting not found');
            }
        } else {
            // Get all meetings, optionally filtered by status
            $sql = '
                SELECT m.*,
                       p.name as person_name, p.company as person_company,
                       h.name as hotel_name, h.city as hotel_city
                FROM meetings m
                LEFT JOIN persons p ON m.person_id = p.id
                LEFT JOIN hotels h ON m.hotel_id = h.id
            ';

            if ($status) {
                $sql .= ' WHERE m.status = ?';
                $sql .= ' ORDER BY m.from_date DESC';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$status]);
            } else {
                $sql .= ' ORDER BY m.from_date DESC';
                $stmt = $pdo->query($sql);
            }

            $meetings = $stmt->fetchAll();
            sendResponse($meetings);
        }
        break;

    case 'POST':
        $data = getJsonInput();

        if (!validateRequired($data, ['title', 'personId', 'destination', 'fromDate', 'toDate'])) {
            sendErrorResponse(400, 'Title, person, destination, from date, and to date are required');
        }

        // Verify person exists
        $stmt = $pdo->prepare('SELECT id FROM persons WHERE id = ?');
        $stmt->execute([$data['personId']]);
        if (!$stmt->fetch()) {
            sendErrorResponse(400, 'Selected person does not exist');
        }

        // Verify hotel exists if provided
        if (!empty($data['hotelId'])) {
            $stmt = $pdo->prepare('SELECT id FROM hotels WHERE id = ?');
            $stmt->execute([$data['hotelId']]);
            if (!$stmt->fetch()) {
                sendErrorResponse(400, 'Selected hotel does not exist');
            }
        }

        $id = generateId();
        $stmt = $pdo->prepare('
            INSERT INTO meetings (id, title, person_id, hotel_id, destination, from_date, to_date, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');

        // Parse dates to ensure correct format
        $fromDate = date('Y-m-d', strtotime($data['fromDate']));
        $toDate = date('Y-m-d', strtotime($data['toDate']));

        $stmt->execute([
            $id,
            $data['title'],
            $data['personId'],
            $data['hotelId'] ?? null,
            $data['destination'],
            $fromDate,
            $toDate,
            $data['notes'] ?? null,
            $data['status'] ?? 'scheduled',
        ]);

        // Return created meeting
        $stmt = $pdo->prepare('SELECT * FROM meetings WHERE id = ?');
        $stmt->execute([$id]);
        $meeting = $stmt->fetch();

        sendResponse($meeting, 201);
        break;

    case 'PUT':
        if (!$id) {
            sendErrorResponse(400, 'Meeting ID is required');
        }

        $data = getJsonInput();

        if (!validateRequired($data, ['title', 'personId', 'destination', 'fromDate', 'toDate'])) {
            sendErrorResponse(400, 'Title, person, destination, from date, and to date are required');
        }

        // Parse dates to ensure correct format
        $fromDate = date('Y-m-d', strtotime($data['fromDate']));
        $toDate = date('Y-m-d', strtotime($data['toDate']));

        $stmt = $pdo->prepare('
            UPDATE meetings
            SET title = ?, person_id = ?, hotel_id = ?, destination = ?,
                from_date = ?, to_date = ?, notes = ?, status = ?
            WHERE id = ?
        ');

        $stmt->execute([
            $data['title'],
            $data['personId'],
            $data['hotelId'] ?? null,
            $data['destination'],
            $fromDate,
            $toDate,
            $data['notes'] ?? null,
            $data['status'] ?? 'scheduled',
            $id,
        ]);

        if ($stmt->rowCount() === 0) {
            sendErrorResponse(404, 'Meeting not found');
        }

        // Return updated meeting
        $stmt = $pdo->prepare('SELECT * FROM meetings WHERE id = ?');
        $stmt->execute([$id]);
        $meeting = $stmt->fetch();

        sendResponse($meeting);
        break;

    case 'DELETE':
        if (!$id) {
            sendErrorResponse(400, 'Meeting ID is required');
        }

        $stmt = $pdo->prepare('DELETE FROM meetings WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            sendErrorResponse(404, 'Meeting not found');
        }

        sendResponse(['success' => true, 'message' => 'Meeting deleted']);
        break;

    default:
        sendErrorResponse(405, 'Method not allowed');
}
