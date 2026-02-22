<?php
/**
 * Gantt Project Manager - Version API
 *
 * @version v125
 * @package GanttProjectManager
 * @build 2026-02-22
 *
 * Returns version information from both file and database
 * GET /api/version.php - Get version info
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    errorResponse('Method not allowed', 405);
}

try {
    $db = Database::getInstance();

    // Get version from file (config.php constants)
    $fileVersion = defined('GPM_VERSION') ? GPM_VERSION : 'unknown';
    $fileBuildDate = defined('GPM_BUILD_DATE') ? GPM_BUILD_DATE : 'unknown';

    // Get version from database
    $dbVersion = null;
    $dbBuildDate = null;
    $dbFeatures = null;

    try {
        $stmt = $db->query("SELECT `key`, `value` FROM `system_settings` WHERE `key` IN ('portal_version', 'portal_build_date', 'portal_features')");
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $dbVersion = isset($settings['portal_version']) ? $settings['portal_version'] : null;
        $dbBuildDate = isset($settings['portal_build_date']) ? $settings['portal_build_date'] : null;
        $dbFeatures = isset($settings['portal_features']) ? $settings['portal_features'] : null;
    } catch (Exception $e) {
        // Database might not have system_settings table yet
        $dbVersion = null;
    }

    // Check if versions match
    $versionsMatch = ($fileVersion === $dbVersion);

    successResponse(array(
        'file' => array(
            'version' => $fileVersion,
            'build_date' => $fileBuildDate,
        ),
        'database' => array(
            'version' => $dbVersion,
            'build_date' => $dbBuildDate,
            'features' => $dbFeatures,
        ),
        'current_version' => $fileVersion,
        'versions_match' => $versionsMatch,
        'status' => $versionsMatch ? 'ok' : 'mismatch',
    ));

} catch (Exception $e) {
    error_log('Version API Error: ' . $e->getMessage());
    errorResponse('Server error: ' . $e->getMessage(), 500);
}
