<?php
/**
 * Gantt Project Manager - File Verification Script
 *
 * @version v95
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * Verifies all deployment files are present and up to date.
 * Compatible with PHP 7.0+
 *
 * DELETE THIS FILE AFTER VERIFICATION IN PRODUCTION!
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/html; charset=utf-8');

// Base paths
$baseDir = dirname(__DIR__); // Parent of /api
$apiDir = __DIR__;

// Expected files with minimum sizes (bytes) to verify they're not empty
// Updated for v95
$expectedFiles = array(
    // Root files
    'index.html' => array('path' => $baseDir . '/index.html', 'min_size' => 20000, 'description' => 'Main application'),
    '404.html' => array('path' => $baseDir . '/404.html', 'min_size' => 5000, 'description' => 'Error page'),

    // API files
    'api/config.php' => array('path' => $apiDir . '/config.php', 'min_size' => 1500, 'description' => 'Database configuration'),
    'api/projects.php' => array('path' => $apiDir . '/projects.php', 'min_size' => 10000, 'description' => 'Projects API with template support'),
    'api/tasks.php' => array('path' => $apiDir . '/tasks.php', 'min_size' => 8000, 'description' => 'Tasks API'),
    'api/templates.php' => array('path' => $apiDir . '/templates.php', 'min_size' => 12000, 'description' => 'Templates API with CRUD'),
    'api/comments.php' => array('path' => $apiDir . '/comments.php', 'min_size' => 4000, 'description' => 'Comments API'),
    'api/auth.php' => array('path' => $apiDir . '/auth.php', 'min_size' => 5000, 'description' => 'Authentication API'),
    'api/statistics.php' => array('path' => $apiDir . '/statistics.php', 'min_size' => 2000, 'description' => 'Statistics API'),

    // SQL files
    'sql/schema.sql' => array('path' => $baseDir . '/sql/schema.sql', 'min_size' => 5000, 'description' => 'Core database schema'),
    'sql/seed.sql' => array('path' => $baseDir . '/sql/seed.sql', 'min_size' => 4000, 'description' => 'Sample data'),
    'sql/templates_schema.sql' => array('path' => $baseDir . '/sql/templates_schema.sql', 'min_size' => 8000, 'description' => 'Template tables schema'),
    'sql/migrate_project1_to_template.sql' => array('path' => $baseDir . '/sql/migrate_project1_to_template.sql', 'min_size' => 5000, 'description' => 'OCF Nordic Bond Issue migration'),
    'sql/update_users.sql' => array('path' => $baseDir . '/sql/update_users.sql', 'min_size' => 1000, 'description' => 'User sync script'),

    // Static assets
    '_next/static' => array('path' => $baseDir . '/_next/static', 'is_dir' => true, 'description' => 'Next.js static assets'),
    'images/logo' => array('path' => $baseDir . '/images/logo', 'is_dir' => true, 'description' => 'Logo images'),
);

// Key content checks - verify specific strings exist in files
$contentChecks = array(
    'api/projects.php' => array(
        'check' => 'createTasksFromTemplate',
        'description' => 'Template-based project creation'
    ),
    'api/templates.php' => array(
        'check' => 'task_templates',
        'description' => 'Template tasks support'
    ),
    'api/tasks.php' => array(
        'check' => 'start_date ASC',
        'description' => 'Date-based task ordering'
    ),
);

// Version markers to check
$versionMarkers = array(
    'projects.php' => 'createTasksFromTemplate', // v44+ feature
    'templates.php' => 'addTemplateTask', // v45+ feature
);

$passed = 0;
$failed = 0;
$warnings = 0;

function showPass($msg) {
    global $passed;
    $passed++;
    echo "<div class='pass'>✓ {$msg}</div>\n";
}

function showFail($msg) {
    global $failed;
    $failed++;
    echo "<div class='fail'>✗ {$msg}</div>\n";
}

function showWarn($msg) {
    global $warnings;
    $warnings++;
    echo "<div class='warn'>⚠ {$msg}</div>\n";
}

function formatSize($bytes) {
    if ($bytes >= 1048576) {
        return round($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return round($bytes / 1024, 2) . ' KB';
    }
    return $bytes . ' bytes';
}

// Output HTML
echo "<!DOCTYPE html>
<html>
<head>
    <title>File Verification - Gantt Project Manager v75</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1000px; margin: 40px auto; padding: 20px; background: #f5f5f4; }
        h1 { color: #1c1917; border-bottom: 3px solid #14b8a6; padding-bottom: 10px; }
        h2 { color: #44403c; margin-top: 30px; }
        .pass { background: #dcfce7; color: #166534; padding: 8px 12px; margin: 4px 0; border-radius: 4px; border-left: 4px solid #22c55e; }
        .fail { background: #fee2e2; color: #991b1b; padding: 8px 12px; margin: 4px 0; border-radius: 4px; border-left: 4px solid #ef4444; }
        .warn { background: #fef3c7; color: #92400e; padding: 8px 12px; margin: 4px 0; border-radius: 4px; border-left: 4px solid #f59e0b; }
        .info { background: #e0f2fe; color: #0369a1; padding: 8px 12px; margin: 4px 0; border-radius: 4px; border-left: 4px solid #0ea5e9; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; background: white; }
        th, td { padding: 10px; text-align: left; border: 1px solid #d6d3d1; }
        th { background: #f5f5f4; }
        .size { font-family: monospace; color: #57534e; }
        .summary { display: flex; gap: 15px; margin: 20px 0; }
        .summary div { padding: 15px 25px; border-radius: 8px; text-align: center; }
        .summary .pass-box { background: #dcfce7; }
        .summary .fail-box { background: #fee2e2; }
        .summary .warn-box { background: #fef3c7; }
        .count { font-size: 28px; font-weight: bold; }
        .warning-box { background: #fee2e2; border: 2px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .success-box { background: #dcfce7; border: 2px solid #22c55e; padding: 15px; border-radius: 8px; margin: 20px 0; }
        code { background: #e7e5e4; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
    </style>
</head>
<body>
    <h1>File Verification - v75</h1>
    <p>Gantt Project Manager | Checked: " . date('Y-m-d H:i:s') . "</p>
";

// ============================================================
// Section 1: Check Required Files
// ============================================================
echo "<h2>1. Required Files</h2>";
echo "<table>
    <tr><th>File</th><th>Description</th><th>Size</th><th>Status</th></tr>";

foreach ($expectedFiles as $name => $info) {
    $path = $info['path'];
    $isDir = isset($info['is_dir']) && $info['is_dir'];

    if ($isDir) {
        if (is_dir($path)) {
            $fileCount = count(glob($path . '/*'));
            echo "<tr>
                <td><code>{$name}/</code></td>
                <td>{$info['description']}</td>
                <td class='size'>{$fileCount} files</td>
                <td style='color:green'>✓ EXISTS</td>
            </tr>";
            $passed++;
        } else {
            echo "<tr>
                <td><code>{$name}/</code></td>
                <td>{$info['description']}</td>
                <td>-</td>
                <td style='color:red'>✗ MISSING</td>
            </tr>";
            $failed++;
        }
    } else {
        if (file_exists($path)) {
            $size = filesize($path);
            $minSize = isset($info['min_size']) ? $info['min_size'] : 0;

            if ($size >= $minSize) {
                echo "<tr>
                    <td><code>{$name}</code></td>
                    <td>{$info['description']}</td>
                    <td class='size'>" . formatSize($size) . "</td>
                    <td style='color:green'>✓ OK</td>
                </tr>";
                $passed++;
            } else {
                echo "<tr>
                    <td><code>{$name}</code></td>
                    <td>{$info['description']}</td>
                    <td class='size'>" . formatSize($size) . "</td>
                    <td style='color:orange'>⚠ TOO SMALL (expected >" . formatSize($minSize) . ")</td>
                </tr>";
                $warnings++;
            }
        } else {
            echo "<tr>
                <td><code>{$name}</code></td>
                <td>{$info['description']}</td>
                <td>-</td>
                <td style='color:red'>✗ MISSING</td>
            </tr>";
            $failed++;
        }
    }
}

echo "</table>";

// ============================================================
// Section 2: Version Feature Checks
// ============================================================
echo "<h2>2. Version Features (v75)</h2>";

foreach ($contentChecks as $file => $check) {
    $path = $apiDir . '/' . basename($file);

    if (file_exists($path)) {
        $content = file_get_contents($path);
        if (strpos($content, $check['check']) !== false) {
            showPass("{$file}: {$check['description']} - Feature present");
        } else {
            showWarn("{$file}: {$check['description']} - Feature NOT found (may be outdated)");
        }
    } else {
        showFail("{$file}: File not found");
    }
}

// ============================================================
// Section 3: Check Next.js Assets
// ============================================================
echo "<h2>3. Frontend Assets</h2>";

$nextStaticDir = $baseDir . '/_next/static';
if (is_dir($nextStaticDir)) {
    // Check for CSS
    $cssFiles = glob($nextStaticDir . '/css/*.css');
    if (count($cssFiles) > 0) {
        $totalCssSize = 0;
        foreach ($cssFiles as $css) {
            $totalCssSize += filesize($css);
        }
        showPass("CSS files: " . count($cssFiles) . " files (" . formatSize($totalCssSize) . ")");
    } else {
        showFail("No CSS files found in _next/static/css/");
    }

    // Check for JS chunks
    $jsFiles = glob($nextStaticDir . '/chunks/*.js');
    if (count($jsFiles) > 0) {
        $totalJsSize = 0;
        foreach ($jsFiles as $js) {
            $totalJsSize += filesize($js);
        }
        showPass("JavaScript chunks: " . count($jsFiles) . " files (" . formatSize($totalJsSize) . ")");
    } else {
        showFail("No JS chunks found in _next/static/chunks/");
    }

    // Check for fonts
    $fontFiles = glob($nextStaticDir . '/media/*.woff2');
    if (count($fontFiles) > 0) {
        showPass("Font files: " . count($fontFiles) . " woff2 files");
    } else {
        showWarn("No font files found - may affect typography");
    }
} else {
    showFail("_next/static directory not found - frontend assets missing!");
}

// ============================================================
// Section 4: Check Logo Files
// ============================================================
echo "<h2>4. Logo & Images</h2>";

$logoDir = $baseDir . '/images/logo';
if (is_dir($logoDir)) {
    $logoFiles = glob($logoDir . '/*.{png,jpg,svg,PNG,JPG,SVG}', GLOB_BRACE);
    if (count($logoFiles) > 0) {
        echo "<table><tr><th>Logo File</th><th>Size</th></tr>";
        foreach ($logoFiles as $logo) {
            $name = basename($logo);
            $size = formatSize(filesize($logo));
            echo "<tr><td><code>{$name}</code></td><td class='size'>{$size}</td></tr>";
        }
        echo "</table>";
        showPass("Found " . count($logoFiles) . " logo file(s)");
    } else {
        showWarn("No logo files found in images/logo/");
    }
} else {
    showWarn("images/logo directory not found");
}

// ============================================================
// Section 5: API Endpoint Tests
// ============================================================
echo "<h2>5. API Endpoint Syntax Check</h2>";

$apiFiles = array('projects.php', 'tasks.php', 'templates.php', 'comments.php', 'auth.php');

foreach ($apiFiles as $file) {
    $path = $apiDir . '/' . $file;
    if (file_exists($path)) {
        // Check for PHP syntax errors by trying to parse the file
        $output = array();
        $returnVar = 0;
        exec("php -l " . escapeshellarg($path) . " 2>&1", $output, $returnVar);

        if ($returnVar === 0) {
            showPass("{$file}: Syntax OK");
        } else {
            showFail("{$file}: Syntax error - " . implode(' ', $output));
        }
    }
}

// ============================================================
// Section 6: File Modification Times
// ============================================================
echo "<h2>6. Recent File Updates</h2>";

$recentFiles = array();
$checkFiles = array(
    $apiDir . '/projects.php',
    $apiDir . '/tasks.php',
    $apiDir . '/templates.php',
    $baseDir . '/index.html',
);

echo "<table><tr><th>File</th><th>Last Modified</th><th>Age</th></tr>";

foreach ($checkFiles as $path) {
    if (file_exists($path)) {
        $mtime = filemtime($path);
        $age = time() - $mtime;
        $ageDays = floor($age / 86400);
        $ageHours = floor(($age % 86400) / 3600);

        $ageStr = '';
        if ($ageDays > 0) {
            $ageStr = $ageDays . ' day' . ($ageDays > 1 ? 's' : '') . ' ago';
        } elseif ($ageHours > 0) {
            $ageStr = $ageHours . ' hour' . ($ageHours > 1 ? 's' : '') . ' ago';
        } else {
            $ageStr = 'Just now';
        }

        $name = str_replace(array($baseDir, $apiDir), array('', 'api'), $path);
        echo "<tr>
            <td><code>{$name}</code></td>
            <td>" . date('Y-m-d H:i:s', $mtime) . "</td>
            <td>{$ageStr}</td>
        </tr>";
    }
}

echo "</table>";

// ============================================================
// Summary
// ============================================================
echo "<h2>Summary</h2>";

echo "<div class='summary'>
    <div class='pass-box'><div class='count'>{$passed}</div>Passed</div>
    <div class='fail-box'><div class='count'>{$failed}</div>Failed</div>
    <div class='warn-box'><div class='count'>{$warnings}</div>Warnings</div>
</div>";

if ($failed === 0 && $warnings === 0) {
    echo "<div class='success-box'>
        <strong>✓ All files verified!</strong><br>
        Your deployment is complete and all v75 files are present.
    </div>";
} elseif ($failed === 0) {
    echo "<div class='warn' style='padding: 15px;'>
        <strong>⚠ Some warnings detected</strong><br>
        Core files are present but some optional files may be missing.
    </div>";
} else {
    echo "<div class='warning-box'>
        <strong>✗ Missing files detected!</strong><br>
        Please re-upload the missing files from gantt-project-manager-v75-deployment.zip
    </div>";
}

echo "<h2>Expected Version: v75</h2>
<p>This verification script checks for files included in <code>gantt-project-manager-v75-deployment.zip</code></p>

<h3>Key v75 Features to Verify:</h3>
<ul>
    <li><strong>Template System</strong> - projects.php includes <code>createTasksFromTemplate</code></li>
    <li><strong>Template CRUD</strong> - templates.php includes full create/update/delete</li>
    <li><strong>Date Ordering</strong> - tasks.php orders by <code>start_date ASC</code></li>
    <li><strong>OCF Nordic Bond Issue</strong> - Template available in database</li>
</ul>

<div class='warning-box' style='margin-top: 30px;'>
    <strong>⚠️ Security Notice:</strong> Delete this file (file_verify.php) after verification!
</div>

</body></html>";
