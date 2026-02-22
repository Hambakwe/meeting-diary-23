<?php
/**
 * Gantt Project Manager - Configuration
 *
 * @version v86
 * @package GanttProjectManager
 * @author Oasis Capital Finance
 * @build 2026-02-21
 */

// Version identifier for deployment verification
define('GPM_VERSION', 'v77');
define('GPM_BUILD_DATE', '2026-02-21');

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

date_default_timezone_set('UTC');

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'oasiscapfin_gantt_project_manager');
define('DB_USER', 'oasiscapfin_ganttuser');
define('DB_PASS', 'C1nd3r3ll4!$');
define('DB_CHARSET', 'utf8mb4');

// Application Configuration
define('APP_NAME', 'Gantt Project Manager');
define('APP_VERSION', GPM_VERSION);
define('CORS_ALLOWED_ORIGINS', '*');

class Database {
    private static $instance = null;

    public static function getInstance() {
        if (self::$instance === null) {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
            self::$instance = new PDO($dsn, DB_USER, DB_PASS, array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ));
        }
        return self::$instance;
    }
}

function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('X-GPM-Version: ' . GPM_VERSION);
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function errorResponse($message, $statusCode = 400) {
    jsonResponse(array('success' => false, 'error' => $message, 'version' => GPM_VERSION), $statusCode);
}

function successResponse($data = null, $message = '') {
    $response = array('success' => true, 'version' => GPM_VERSION);
    if ($data !== null) {
        $response['data'] = $data;
    }
    if ($message) {
        $response['message'] = $message;
    }
    jsonResponse($response);
}

function getJsonInput() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return is_array($data) ? $data : array();
}

function sanitize($input) {
    if (is_array($input)) {
        return array_map('sanitize', $input);
    }
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

function isValidDate($date, $format = 'Y-m-d') {
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}

function getCurrentUserId() {
    return null;
}

function logActivity($action, $desc = null, $projId = null, $taskId = null) {
    // Activity logging - can be enabled for production
}

function getVersionInfo() {
    return array(
        'version' => GPM_VERSION,
        'build_date' => GPM_BUILD_DATE,
        'app_name' => APP_NAME
    );
}
