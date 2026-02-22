<?php
/**
 * Gantt Project Manager - Authentication API
 * PHP 8.x Compatible
 *
 * @version v86
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * Endpoints:
 * POST /api/auth.php?action=login   - Login
 * POST /api/auth.php?action=logout  - Logout
 * GET  /api/auth.php?action=me      - Get current user
 * POST /api/auth.php?action=register - Register new user (admin only)
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();
startSession();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $db = Database::getInstance();

    switch ($action) {
        case 'login':
            if ($method !== 'POST') {
                errorResponse('Method not allowed', 405);
            }
            login($db);
            break;

        case 'logout':
            logout();
            break;

        case 'me':
            getCurrentUser($db);
            break;

        case 'register':
            if ($method !== 'POST') {
                errorResponse('Method not allowed', 405);
            }
            register($db);
            break;

        case 'change-password':
            if ($method !== 'POST') {
                errorResponse('Method not allowed', 405);
            }
            changePassword($db);
            break;

        default:
            errorResponse('Invalid action', 400);
    }
} catch (Exception $e) {
    error_log('Auth API Error: ' . $e->getMessage());
    errorResponse('Server error: ' . $e->getMessage(), 500);
}

/**
 * Login user
 */
function login(PDO $db): void {
    $input = getJsonInput();

    $login = $input['login'] ?? $input['username'] ?? $input['email'] ?? '';
    $password = $input['password'] ?? '';

    if (empty($login) || empty($password)) {
        errorResponse('Username/email and password are required', 400);
    }

    // Find user by username or email
    $stmt = $db->prepare('
        SELECT * FROM users
        WHERE (username = ? OR email = ?) AND is_active = 1
    ');
    $stmt->execute([$login, $login]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        errorResponse('Invalid credentials', 401);
    }

    // Set session
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['login_time'] = time();

    // Regenerate session ID for security
    session_regenerate_id(true);

    logActivity('login', "User logged in: {$user['username']}");

    successResponse([
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'full_name' => $user['full_name'],
        'role' => $user['role'],
        'avatar_url' => $user['avatar_url']
    ], 'Login successful');
}

/**
 * Logout user
 */
function logout(): void {
    if (isset($_SESSION['user_id'])) {
        logActivity('logout', "User logged out");
    }

    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();

    successResponse(null, 'Logged out successfully');
}

/**
 * Get current authenticated user
 */
function getCurrentUser(PDO $db): void {
    if (!isAuthenticated()) {
        errorResponse('Not authenticated', 401);
    }

    $userId = getCurrentUserId();

    $stmt = $db->prepare('
        SELECT id, username, email, full_name, role, avatar_url, created_at
        FROM users WHERE id = ? AND is_active = 1
    ');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        // Session exists but user doesn't - clear session
        logout();
        return;
    }

    successResponse([
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'full_name' => $user['full_name'],
        'role' => $user['role'],
        'avatar_url' => $user['avatar_url'],
        'created_at' => $user['created_at']
    ]);
}

/**
 * Register new user (admin only)
 */
function register(PDO $db): void {
    // Check if current user is admin
    if (isAuthenticated()) {
        $userId = getCurrentUserId();
        $stmt = $db->prepare('SELECT role FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $currentUser = $stmt->fetch();

        if ($currentUser['role'] !== 'admin') {
            errorResponse('Only admins can register new users', 403);
        }
    }

    $input = getJsonInput();

    // Validate required fields
    $required = ['username', 'email', 'password'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            errorResponse("Field '$field' is required", 400);
        }
    }

    // Validate email format
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        errorResponse('Invalid email format', 400);
    }

    // Validate password strength
    if (strlen($input['password']) < 8) {
        errorResponse('Password must be at least 8 characters', 400);
    }

    // Check if username or email already exists
    $stmt = $db->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
    $stmt->execute([$input['username'], $input['email']]);
    if ($stmt->fetch()) {
        errorResponse('Username or email already exists', 409);
    }

    // Hash password
    $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);

    // Insert user
    $stmt = $db->prepare('
        INSERT INTO users (username, email, password_hash, full_name, role, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
    ');

    $stmt->execute([
        sanitize($input['username']),
        sanitize($input['email']),
        $passwordHash,
        sanitize($input['full_name'] ?? ''),
        $input['role'] ?? 'member'
    ]);

    $newUserId = (int)$db->lastInsertId();

    logActivity('user_registered', "New user registered: {$input['username']}");

    successResponse([
        'id' => $newUserId,
        'username' => $input['username'],
        'email' => $input['email']
    ], 'User registered successfully');
}

/**
 * Change password
 */
function changePassword(PDO $db): void {
    if (!isAuthenticated()) {
        errorResponse('Not authenticated', 401);
    }

    $input = getJsonInput();

    if (empty($input['current_password']) || empty($input['new_password'])) {
        errorResponse('Current and new passwords are required', 400);
    }

    if (strlen($input['new_password']) < 8) {
        errorResponse('New password must be at least 8 characters', 400);
    }

    $userId = getCurrentUserId();

    // Verify current password
    $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!password_verify($input['current_password'], $user['password_hash'])) {
        errorResponse('Current password is incorrect', 401);
    }

    // Update password
    $newHash = password_hash($input['new_password'], PASSWORD_DEFAULT);
    $stmt = $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $stmt->execute([$newHash, $userId]);

    logActivity('password_changed', 'User changed password');

    successResponse(null, 'Password changed successfully');
}
