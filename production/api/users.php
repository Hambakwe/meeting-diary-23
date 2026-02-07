<?php
/**
 * Meeting Diary - Users API
 * Handles CRUD operations for users
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

// Get ID from query string if present
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            // Get single user (exclude password hash)
            $stmt = $pdo->prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?');
            $stmt->execute([$id]);
            $user = $stmt->fetch();

            if ($user) {
                sendResponse($user);
            } else {
                sendErrorResponse(404, 'User not found');
            }
        } else {
            // Get all users (exclude password hash)
            $stmt = $pdo->query('SELECT id, name, email, created_at, updated_at FROM users ORDER BY name ASC');
            $users = $stmt->fetchAll();
            sendResponse($users);
        }
        break;

    case 'POST':
        $data = getJsonInput();

        if (!validateRequired($data, ['name', 'email'])) {
            sendErrorResponse(400, 'Name and email are required');
        }

        // Check if email already exists
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            sendErrorResponse(400, 'Email already exists');
        }

        $id = generateId();
        $passwordHash = isset($data['password']) ? password_hash($data['password'], PASSWORD_DEFAULT) : null;

        $stmt = $pdo->prepare('
            INSERT INTO users (id, name, email, password_hash)
            VALUES (?, ?, ?, ?)
        ');

        $stmt->execute([
            $id,
            $data['name'],
            $data['email'],
            $passwordHash,
        ]);

        // Return created user (exclude password hash)
        $stmt = $pdo->prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        sendResponse($user, 201);
        break;

    case 'PUT':
        if (!$id) {
            sendErrorResponse(400, 'User ID is required');
        }

        $data = getJsonInput();

        if (!validateRequired($data, ['name', 'email'])) {
            sendErrorResponse(400, 'Name and email are required');
        }

        // Check if email already exists for another user
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        $stmt->execute([$data['email'], $id]);
        if ($stmt->fetch()) {
            sendErrorResponse(400, 'Email already exists');
        }

        if (isset($data['password']) && !empty($data['password'])) {
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare('
                UPDATE users
                SET name = ?, email = ?, password_hash = ?
                WHERE id = ?
            ');
            $stmt->execute([$data['name'], $data['email'], $passwordHash, $id]);
        } else {
            $stmt = $pdo->prepare('
                UPDATE users
                SET name = ?, email = ?
                WHERE id = ?
            ');
            $stmt->execute([$data['name'], $data['email'], $id]);
        }

        if ($stmt->rowCount() === 0) {
            sendErrorResponse(404, 'User not found');
        }

        // Return updated user
        $stmt = $pdo->prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        sendResponse($user);
        break;

    case 'DELETE':
        if (!$id) {
            sendErrorResponse(400, 'User ID is required');
        }

        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            sendErrorResponse(404, 'User not found');
        }

        sendResponse(['success' => true, 'message' => 'User deleted']);
        break;

    default:
        sendErrorResponse(405, 'Method not allowed');
}
