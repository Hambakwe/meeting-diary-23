<?php
/**
 * Meeting Diary - Database Configuration
 * Database: oasiscapi_meetings
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'oasiscapi_meetings');
define('DB_USER', 'oasiscapi_oasistravel');
define('DB_PASS', 'C1nd3r3ll4!$');
define('DB_CHARSET', 'utf8mb4');

// API Configuration
define('API_DEBUG', false);
define('CORS_ORIGIN', '*');

// Error reporting (disabled in production)
error_reporting(0);
ini_set('display_errors', 0);

/**
 * Get database connection
 * @return PDO
 */
function getDbConnection(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            sendErrorResponse(500, 'Database connection failed');
        }
    }

    return $pdo;
}

/**
 * Set CORS headers
 */
function setCorsHeaders(): void {
    header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Send JSON response
 */
function sendResponse($data, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Send error response
 */
function sendErrorResponse(int $statusCode, string $message): void {
    http_response_code($statusCode);
    echo json_encode(['error' => true, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Get JSON input from request body
 */
function getJsonInput(): array {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return $data ?? [];
}

/**
 * Generate unique ID
 */
function generateId(): string {
    return uniqid() . '-' . bin2hex(random_bytes(4));
}

/**
 * Validate required fields
 */
function validateRequired(array $data, array $required): bool {
    foreach ($required as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            return false;
        }
    }
    return true;
}
