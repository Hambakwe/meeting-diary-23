<?php
/**
 * Gantt Project Manager - Version Verification Script
 *
 * @version v86
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * Verifies all deployment files are version v75 and properly deployed.
 * Run this after deployment to ensure all files are correct.
 *
 * DELETE THIS FILE AFTER VERIFICATION IN PRODUCTION!
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/html; charset=utf-8');

// Expected version
define('EXPECTED_VERSION', 'v76');
define('EXPECTED_BUILD_DATE', '2026-02-20');

// Base paths
$baseDir = dirname(__DIR__);
$apiDir = __DIR__;

// Files to verify with expected version markers
$versionFiles = array(
    // API files
    'api/config.php' => array(
        'path' => $apiDir . '/config.php',
        'marker' => '@version v86',
        'required' => true,
        'description' => 'Database configuration'
    ),
    'api/projects.php' => array(
        'path' => $apiDir . '/projects.php',
        'marker' => '@version v86',
        'required' => true,
        'description' => 'Projects API'
    ),
    'api/tasks.php' => array(
        'path' => $apiDir . '/tasks.php',
        'marker' => '@version v86',
        'required' => true,
        'description' => 'Tasks API'
    ),
    'api/templates.php' => array(
        'path' => $apiDir . '/templates.php',
        'marker' => '@version v86',
        'required' => true,
        'description' => 'Templates API'
    ),
    'api/comments.php' => array(
        'path' => $apiDir . '/comments.php',
        'marker' => '@version v86',
        'required' => true,
        'description' => 'Comments API'
    ),
    'api/auth.php' => array(
        'path' => $apiDir . '/auth.php',
        'marker' => '@version v86',
        'required' => true,
        'description' => 'Authentication API'
    ),
    'api/statistics.php' => array(
        'path' => $apiDir . '/statistics.php',
        'marker' => '@version v86',
        'required' => true,
        'description' => 'Statistics API'
    ),

    // SQL files
    'sql/schema.sql' => array(
        'path' => $baseDir . '/sql/schema.sql',
        'marker' => 'Version: v75',
        'required' => true,
        'description' => 'Database schema'
    ),
    'sql/seed.sql' => array(
        'path' => $baseDir . '/sql/seed.sql',
        'marker' => 'Version: v75',
        'required' => true,
        'description' => 'Sample data'
    ),
    'sql/templates_schema.sql' => array(
        'path' => $baseDir . '/sql/templates_schema.sql',
        'marker' => 'Version: v75',
        'required' => true,
        'description' => 'Template tables'
    ),

    // Frontend
    'index.html' => array(
        'path' => $baseDir . '/index.html',
        'marker' => 'v75',
        'required' => true,
        'description' => 'Main application'
    ),
    '404.html' => array(
        'path' => $baseDir . '/404.html',
        'marker' => 'v75',
        'required' => false,
        'description' => 'Error page'
    ),
);

// Static asset directories to check
$assetDirs = array(
    '_next/static/css' => 'CSS files',
    '_next/static/chunks' => 'JavaScript chunks',
    '_next/static/media' => 'Font files',
    'images/logo' => 'Logo images',
);

$passed = 0;
$failed = 0;
$warnings = 0;

function showPass($msg) {
    global $passed;
    $passed++;
    echo "<div class='result pass'>✓ {$msg}</div>\n";
}

function showFail($msg) {
    global $failed;
    $failed++;
    echo "<div class='result fail'>✗ {$msg}</div>\n";
}

function showWarn($msg) {
    global $warnings;
    $warnings++;
    echo "<div class='result warn'>⚠ {$msg}</div>\n";
}

function formatSize($bytes) {
    if ($bytes >= 1048576) return round($bytes / 1048576, 2) . ' MB';
    if ($bytes >= 1024) return round($bytes / 1024, 2) . ' KB';
    return $bytes . ' bytes';
}

// Start HTML output
echo "<!DOCTYPE html>
<html>
<head>
    <title>Version Verification - Gantt Project Manager " . EXPECTED_VERSION . "</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1000px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f4;
            color: #1c1917;
        }
        h1 {
            color: #1c1917;
            border-bottom: 3px solid #14b8a6;
            padding-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        h1 .version-badge {
            background: #14b8a6;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 18px;
        }
        h2 {
            color: #44403c;
            margin-top: 30px;
            padding-bottom: 10px;
            border-bottom: 1px solid #d6d3d1;
        }
        .result {
            padding: 10px 15px;
            margin: 5px 0;
            border-radius: 6px;
            border-left: 4px solid;
        }
        .pass { background: #dcfce7; color: #166534; border-color: #22c55e; }
        .fail { background: #fee2e2; color: #991b1b; border-color: #ef4444; }
        .warn { background: #fef3c7; color: #92400e; border-color: #f59e0b; }
        .info { background: #e0f2fe; color: #0369a1; border-color: #0ea5e9; }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e7e5e4; }
        th { background: #f5f5f4; font-weight: 600; }
        tr:last-child td { border-bottom: none; }

        .summary {
            display: flex;
            gap: 15px;
            margin: 25px 0;
            flex-wrap: wrap;
        }
        .summary-box {
            padding: 20px 30px;
            border-radius: 12px;
            text-align: center;
            min-width: 120px;
        }
        .summary-box.pass-box { background: #dcfce7; }
        .summary-box.fail-box { background: #fee2e2; }
        .summary-box.warn-box { background: #fef3c7; }
        .summary-box .count { font-size: 36px; font-weight: bold; }
        .summary-box .label { font-size: 14px; color: #57534e; margin-top: 5px; }

        .status-ok { color: #22c55e; font-weight: 600; }
        .status-fail { color: #ef4444; font-weight: 600; }
        .status-warn { color: #f59e0b; font-weight: 600; }

        code { background: #e7e5e4; padding: 2px 8px; border-radius: 4px; font-size: 13px; }

        .warning-box {
            background: #fee2e2;
            border: 2px solid #ef4444;
            padding: 20px;
            border-radius: 12px;
            margin: 25px 0;
        }
        .success-box {
            background: #dcfce7;
            border: 2px solid #22c55e;
            padding: 20px;
            border-radius: 12px;
            margin: 25px 0;
        }

        .meta-info {
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
        }
        .meta-info div { display: flex; gap: 8px; }
        .meta-info .label { color: #78716c; }
        .meta-info .value { font-weight: 600; }
    </style>
</head>
<body>
    <h1>
        Version Verification
        <span class='version-badge'>" . EXPECTED_VERSION . "</span>
    </h1>

    <div class='meta-info'>
        <div><span class='label'>Expected Version:</span><span class='value'>" . EXPECTED_VERSION . "</span></div>
        <div><span class='label'>Build Date:</span><span class='value'>" . EXPECTED_BUILD_DATE . "</span></div>
        <div><span class='label'>Verified:</span><span class='value'>" . date('Y-m-d H:i:s') . "</span></div>
        <div><span class='label'>Server:</span><span class='value'>" . php_uname('n') . "</span></div>
    </div>
";

// ============================================================
// Section 1: Version Marker Verification
// ============================================================
echo "<h2>1. Version Markers in Files</h2>";
echo "<table>
    <tr><th>File</th><th>Description</th><th>Size</th><th>Version Status</th></tr>";

foreach ($versionFiles as $name => $info) {
    $path = $info['path'];

    if (!file_exists($path)) {
        if ($info['required']) {
            echo "<tr>
                <td><code>{$name}</code></td>
                <td>{$info['description']}</td>
                <td>-</td>
                <td class='status-fail'>✗ MISSING</td>
            </tr>";
            $failed++;
        } else {
            echo "<tr>
                <td><code>{$name}</code></td>
                <td>{$info['description']}</td>
                <td>-</td>
                <td class='status-warn'>⚠ Optional, not found</td>
            </tr>";
            $warnings++;
        }
        continue;
    }

    $content = file_get_contents($path);
    $size = formatSize(filesize($path));
    $hasMarker = strpos($content, $info['marker']) !== false;

    if ($hasMarker) {
        echo "<tr>
            <td><code>{$name}</code></td>
            <td>{$info['description']}</td>
            <td>{$size}</td>
            <td class='status-ok'>✓ " . EXPECTED_VERSION . "</td>
        </tr>";
        $passed++;
    } else {
        echo "<tr>
            <td><code>{$name}</code></td>
            <td>{$info['description']}</td>
            <td>{$size}</td>
            <td class='status-fail'>✗ Wrong version or missing marker</td>
        </tr>";
        $failed++;
    }
}

echo "</table>";

// ============================================================
// Section 2: Static Assets
// ============================================================
echo "<h2>2. Static Assets</h2>";
echo "<table><tr><th>Directory</th><th>Description</th><th>Files</th><th>Status</th></tr>";

foreach ($assetDirs as $dir => $desc) {
    $path = $baseDir . '/' . $dir;

    if (is_dir($path)) {
        $files = glob($path . '/*');
        $count = count($files);
        $totalSize = 0;
        foreach ($files as $f) {
            if (is_file($f)) $totalSize += filesize($f);
        }

        echo "<tr>
            <td><code>{$dir}/</code></td>
            <td>{$desc}</td>
            <td>{$count} files (" . formatSize($totalSize) . ")</td>
            <td class='status-ok'>✓ EXISTS</td>
        </tr>";
        $passed++;
    } else {
        echo "<tr>
            <td><code>{$dir}/</code></td>
            <td>{$desc}</td>
            <td>-</td>
            <td class='status-fail'>✗ MISSING</td>
        </tr>";
        $failed++;
    }
}

echo "</table>";

// ============================================================
// Section 3: Database Connection Test
// ============================================================
echo "<h2>3. Database Connection</h2>";

try {
    require_once $apiDir . '/config.php';
    $db = Database::getInstance();

    // Test query
    $stmt = $db->query("SELECT DATABASE() as db_name, VERSION() as db_version");
    $info = $stmt->fetch(PDO::FETCH_ASSOC);

    showPass("Connected to database: " . $info['db_name']);
    showPass("MySQL/MariaDB version: " . $info['db_version']);

    // Check GPM_VERSION constant
    if (defined('GPM_VERSION') && GPM_VERSION === EXPECTED_VERSION) {
        showPass("Config GPM_VERSION matches: " . GPM_VERSION);
    } else {
        showFail("Config GPM_VERSION mismatch. Expected " . EXPECTED_VERSION . ", got " . (defined('GPM_VERSION') ? GPM_VERSION : 'undefined'));
    }

    // Check tables
    $tables = array('users', 'projects', 'tasks', 'task_dependencies', 'project_templates', 'task_templates');
    $stmt = $db->query("SHOW TABLES");
    $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($tables as $table) {
        if (in_array($table, $existingTables)) {
            $countStmt = $db->query("SELECT COUNT(*) as cnt FROM `{$table}`");
            $count = $countStmt->fetch()['cnt'];
            showPass("Table '{$table}' exists ({$count} records)");
        } else {
            showFail("Table '{$table}' is missing");
        }
    }

} catch (Exception $e) {
    showFail("Database connection failed: " . $e->getMessage());
}

// ============================================================
// Section 4: API Endpoint Test
// ============================================================
echo "<h2>4. API Endpoints</h2>";

$endpoints = array(
    'projects.php' => 'Projects API',
    'tasks.php?project_id=1' => 'Tasks API',
    'templates.php' => 'Templates API',
    'statistics.php?project_id=1' => 'Statistics API',
);

foreach ($endpoints as $endpoint => $desc) {
    $url = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/' . $endpoint;

    $context = stream_context_create(array('http' => array('timeout' => 5)));
    $response = @file_get_contents($url, false, $context);

    if ($response !== false) {
        $data = json_decode($response, true);
        if (isset($data['success']) && $data['success']) {
            $version = isset($data['version']) ? $data['version'] : 'unknown';
            if ($version === EXPECTED_VERSION) {
                showPass("{$desc}: OK (version {$version})");
            } else {
                showWarn("{$desc}: Response OK but version is {$version}");
            }
        } else {
            showWarn("{$desc}: Response received but success=false");
        }
    } else {
        showFail("{$desc}: Could not fetch {$endpoint}");
    }
}

// ============================================================
// Summary
// ============================================================
echo "<h2>Summary</h2>";

echo "<div class='summary'>
    <div class='summary-box pass-box'><div class='count'>{$passed}</div><div class='label'>Passed</div></div>
    <div class='summary-box fail-box'><div class='count'>{$failed}</div><div class='label'>Failed</div></div>
    <div class='summary-box warn-box'><div class='count'>{$warnings}</div><div class='label'>Warnings</div></div>
</div>";

if ($failed === 0 && $warnings === 0) {
    echo "<div class='success-box'>
        <strong>✓ All verification checks passed!</strong><br>
        Your deployment is complete. All files are version <strong>" . EXPECTED_VERSION . "</strong>.
    </div>";
} elseif ($failed === 0) {
    echo "<div class='result warn' style='padding: 20px;'>
        <strong>⚠ Verification completed with warnings</strong><br>
        Core files are version " . EXPECTED_VERSION . " but some optional items need attention.
    </div>";
} else {
    echo "<div class='warning-box'>
        <strong>✗ Verification failed!</strong><br>
        Some files are missing or have incorrect versions. Please re-upload from the v75 deployment package.
    </div>";
}

echo "<h2>Deployment Package</h2>
<p>This verification checks files from: <code>gantt-project-manager-v75-deployment.zip</code></p>

<div class='warning-box' style='margin-top: 30px;'>
    <strong>⚠️ Security Notice:</strong> Delete this file (<code>version_verify.php</code>) after verification!<br>
    Also delete: <code>db_verify.php</code>, <code>file_verify.php</code>, <code>db_test.php</code>, <code>debug.php</code>
</div>

</body></html>";
