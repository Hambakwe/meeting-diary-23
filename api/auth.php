<?php
/**
 * Meeting Diary - Authentication API
 * Updated to work with existing users table structure
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$data = getJsonInput();
$action = $data['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        if (empty($data['email']) || empty($data['password'])) {
            sendErrorResponse(400, 'Email and password are required');
        }

        $pdo = getDbConnection();
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch();

        if (!$user) {
            sendErrorResponse(401, 'Invalid email or password');
        }

        // Verify password
        if (!password_verify($data['password'], $user['password_hash'])) {
            sendErrorResponse(401, 'Invalid email or password');
        }

        // Return user data - handle both old and new column names
        $userName = $user['name'] ?? $user['username'] ?? 'User';
        $userRole = $user['role'] ?? $user['access_level'] ?? 'user';

        sendResponse([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'name' => $userName,
                'email' => $user['email'],
                'role' => $userRole,
            ]
        ]);
        break;

    case 'register':
        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            sendErrorResponse(400, 'Name, email, and password are required');
        }

        $pdo = getDbConnection();

        // Check if email exists
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            sendErrorResponse(400, 'Email already registered');
        }

        $id = generateId();
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

        // Check which columns exist and insert accordingly
        $stmt = $pdo->query("DESCRIBE users");
        $columns = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $columns[] = $row['Field'];
        }

        if (in_array('username', $columns) && !in_array('name', $columns)) {
            // Old structure with username
            $stmt = $pdo->prepare('
                INSERT INTO users (id, username, email, password_hash, access_level)
                VALUES (?, ?, ?, ?, ?)
            ');
            $stmt->execute([$id, $data['name'], $data['email'], $passwordHash, 'user']);
        } else {
            // New structure with name
            $stmt = $pdo->prepare('
                INSERT INTO users (id, name, email, password_hash, role)
                VALUES (?, ?, ?, ?, ?)
            ');
            $stmt->execute([$id, $data['name'], $data['email'], $passwordHash, 'user']);
        }

        sendResponse([
            'success' => true,
            'user' => [
                'id' => $id,
                'name' => $data['name'],
                'email' => $data['email'],
                'role' => 'user',
            ]
        ], 201);
        break;

    default:
        sendErrorResponse(400, 'Invalid action');
}

?>
