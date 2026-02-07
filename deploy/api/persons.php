<?php
/**
 * Meeting Diary - Persons API
 * Handles CRUD operations for persons/contacts
 */

require_once __DIR__ . '/config.php';

// Debug mode - add ?debug=1 to URL to see debug info
$debugMode = isset($_GET['debug']) && $_GET['debug'] === '1';

if ($debugMode) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    header('Content-Type: text/plain');
    echo "=== PERSONS.PHP DEBUG ===\n\n";
    echo "DB_NAME: " . DB_NAME . "\n";
    echo "File: " . __FILE__ . "\n";
    echo "Time: " . date('Y-m-d H:i:s') . "\n\n";
}

setCorsHeaders();

// Convert snake_case keys to camelCase
function toCamelCase($data) {
    if (!is_array($data)) return $data;

    $result = [];
    foreach ($data as $key => $value) {
        $camelKey = lcfirst(str_replace('_', '', ucwords($key, '_')));
        $result[$camelKey] = is_array($value) ? toCamelCase($value) : $value;
    }
    return $result;
}

function convertRecords($records) {
    return array_map('toCamelCase', $records);
}

/**
 * Delete a photo file from the pers-img directory
 */
function deletePhotoFile($photoPath) {
    if (empty($photoPath)) return;

    // Only delete if it's a pers-img path (not base64 or external URL)
    if (strpos($photoPath, '/pers-img/') === 0) {
        $filename = basename($photoPath);
        $filePath = __DIR__ . '/../pers-img/' . $filename;

        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

if ($debugMode) {
    echo "Method: $method\n";
    echo "PDO connected: " . ($pdo ? "YES" : "NO") . "\n\n";
}

// Get ID from query string if present
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare('SELECT * FROM persons WHERE id = ?');
            $stmt->execute([$id]);
            $person = $stmt->fetch();

            if ($person) {
                sendResponse(toCamelCase($person));
            } else {
                sendErrorResponse(404, 'Person not found');
            }
        } else {
            $stmt = $pdo->query('SELECT * FROM persons ORDER BY name ASC');
            $persons = $stmt->fetchAll();

            if ($debugMode) {
                echo "Query executed\n";
                echo "Raw count: " . count($persons) . "\n";
                echo "First 2 records:\n";
                print_r(array_slice($persons, 0, 2));
                echo "\nConverted:\n";
                print_r(array_slice(convertRecords($persons), 0, 2));
                exit;
            }

            sendResponse(convertRecords($persons));
        }
        break;

    case 'POST':
        $data = getJsonInput();

        if (!validateRequired($data, ['name'])) {
            sendErrorResponse(400, 'Name is required');
        }

        $id = generateId();
        $stmt = $pdo->prepare('
            INSERT INTO persons (id, name, email, company, role, phone, home_country, badge_color, notes, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');

        $stmt->execute([
            $id,
            $data['name'],
            $data['email'] ?? null,
            $data['company'] ?? null,
            $data['role'] ?? null,
            $data['phone'] ?? null,
            $data['homeCountry'] ?? null,
            $data['badgeColor'] ?? null,
            $data['notes'] ?? null,
            $data['photo'] ?? null,
        ]);

        $stmt = $pdo->prepare('SELECT * FROM persons WHERE id = ?');
        $stmt->execute([$id]);
        $person = $stmt->fetch();

        sendResponse(toCamelCase($person), 201);
        break;

    case 'PUT':
        if (!$id) {
            sendErrorResponse(400, 'Person ID is required');
        }

        $data = getJsonInput();

        if (!validateRequired($data, ['name'])) {
            sendErrorResponse(400, 'Name is required');
        }

        // Get existing person to check for photo change
        $stmt = $pdo->prepare('SELECT photo FROM persons WHERE id = ?');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            sendErrorResponse(404, 'Person not found');
        }

        // If photo is changing and old photo was in pers-img, delete it
        $oldPhoto = $existing['photo'] ?? '';
        $newPhoto = $data['photo'] ?? null;

        if ($oldPhoto !== $newPhoto && !empty($oldPhoto)) {
            deletePhotoFile($oldPhoto);
        }

        $stmt = $pdo->prepare('
            UPDATE persons
            SET name = ?, email = ?, company = ?, role = ?, phone = ?, home_country = ?, badge_color = ?, notes = ?, photo = ?
            WHERE id = ?
        ');

        $stmt->execute([
            $data['name'],
            $data['email'] ?? null,
            $data['company'] ?? null,
            $data['role'] ?? null,
            $data['phone'] ?? null,
            $data['homeCountry'] ?? null,
            $data['badgeColor'] ?? null,
            $data['notes'] ?? null,
            $newPhoto,
            $id,
        ]);

        $stmt = $pdo->prepare('SELECT * FROM persons WHERE id = ?');
        $stmt->execute([$id]);
        $person = $stmt->fetch();

        sendResponse(toCamelCase($person));
        break;

    case 'DELETE':
        if (!$id) {
            sendErrorResponse(400, 'Person ID is required');
        }

        // Get existing person to delete photo
        $stmt = $pdo->prepare('SELECT photo FROM persons WHERE id = ?');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();

        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM meetings WHERE person_id = ?');
        $stmt->execute([$id]);
        $result = $stmt->fetch();

        if ($result['count'] > 0) {
            sendErrorResponse(400, 'Cannot delete person with existing meetings');
        }

        $stmt = $pdo->prepare('DELETE FROM persons WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            sendErrorResponse(404, 'Person not found');
        }

        // Delete photo file if exists
        if ($existing && !empty($existing['photo'])) {
            deletePhotoFile($existing['photo']);
        }

        sendResponse(['success' => true, 'message' => 'Person deleted']);
        break;

    default:
        sendErrorResponse(405, 'Method not allowed');
}
