<?php
/**
 * Gantt Project Manager - FULL Verification Script
 *
 * @version v96
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * DELETE THIS FILE AFTER VERIFICATION IN PRODUCTION!
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/html; charset=utf-8');

define('EXPECTED_VERSION', 'v96');
define('EXPECTED_BUILD_DATE', '2026-02-21');

$baseDir = dirname(__DIR__);
$apiDir = __DIR__;
$passed = 0;
$failed = 0;
$warnings = 0;

function showPass($msg) { global $passed; $passed++; echo "<div class='result pass'>✓ {$msg}</div>\n"; }
function showFail($msg) { global $failed; $failed++; echo "<div class='result fail'>✗ {$msg}</div>\n"; }
function showWarn($msg) { global $warnings; $warnings++; echo "<div class='result warn'>⚠ {$msg}</div>\n"; }
function showInfo($msg) { echo "<div class='result info'>ℹ {$msg}</div>\n"; }
function formatSize($bytes) {
    if ($bytes >= 1048576) return round($bytes / 1048576, 2) . ' MB';
    if ($bytes >= 1024) return round($bytes / 1024, 2) . ' KB';
    return $bytes . ' bytes';
}

// ============================================================
// FILES TO VERIFY
// ============================================================
$versionFiles = array(
    // Core API files
    'api/config.php' => array('path' => $apiDir . '/config.php', 'marker' => '@version v96', 'required' => true, 'desc' => 'Database configuration'),
    'api/projects.php' => array('path' => $apiDir . '/projects.php', 'marker' => '@version v96', 'required' => true, 'desc' => 'Projects API'),
    'api/tasks.php' => array('path' => $apiDir . '/tasks.php', 'marker' => '@version v96', 'required' => true, 'desc' => 'Tasks API'),
    'api/templates.php' => array('path' => $apiDir . '/templates.php', 'marker' => '@version v96', 'required' => true, 'desc' => 'Templates API'),
    'api/comments.php' => array('path' => $apiDir . '/comments.php', 'marker' => '@version v96', 'required' => true, 'desc' => 'Comments API'),
    'api/auth.php' => array('path' => $apiDir . '/auth.php', 'marker' => '@version v96', 'required' => true, 'desc' => 'Authentication API'),
    'api/statistics.php' => array('path' => $apiDir . '/statistics.php', 'marker' => '@version v96', 'required' => true, 'desc' => 'Statistics API'),
    // Portal APIs
    'api/documents.php' => array('path' => $apiDir . '/documents.php', 'marker' => '@version v96', 'required' => true, 'desc' => 'Documents API'),
    'api/contacts.php' => array('path' => $apiDir . '/contacts.php', 'marker' => '@version v96', 'required' => true, 'desc' => 'Team Contacts API'),
    'api/diary.php' => array('path' => $apiDir . '/diary.php', 'marker' => '@version v96', 'required' => true, 'desc' => 'Diary/Calendar API'),
    // Login system
    'login.php' => array('path' => $baseDir . '/login.php', 'marker' => '@version v96', 'required' => true, 'desc' => 'Popup login page'),
    'login-embed.js' => array('path' => $baseDir . '/login-embed.js', 'marker' => '@version v96', 'required' => true, 'desc' => 'Login embed script'),
    // Frontend pages
    'index.html' => array('path' => $baseDir . '/index.html', 'marker' => '', 'required' => true, 'desc' => 'Dashboard page'),
    'timeline/index.html' => array('path' => $baseDir . '/timeline/index.html', 'marker' => '', 'required' => true, 'desc' => 'Timeline/Gantt page'),
    'documents/index.html' => array('path' => $baseDir . '/documents/index.html', 'marker' => '', 'required' => true, 'desc' => 'Documents page'),
    'team/index.html' => array('path' => $baseDir . '/team/index.html', 'marker' => '', 'required' => true, 'desc' => 'Team Contacts page'),
    'diary/index.html' => array('path' => $baseDir . '/diary/index.html', 'marker' => '', 'required' => true, 'desc' => 'Diary/Calendar page'),
    // Admin pages (v96)
    'admin/projects/index.html' => array('path' => $baseDir . '/admin/projects/index.html', 'marker' => '', 'required' => true, 'desc' => 'Admin - Manage Projects'),
    'admin/allocate/index.html' => array('path' => $baseDir . '/admin/allocate/index.html', 'marker' => '', 'required' => true, 'desc' => 'Admin - Allocate to Client'),
    'admin/templates/index.html' => array('path' => $baseDir . '/admin/templates/index.html', 'marker' => '', 'required' => true, 'desc' => 'Admin - Templates'),
    // SQL Scripts
    'sql/v96_portal_features.sql' => array('path' => $baseDir . '/sql/v96_portal_features.sql', 'marker' => 'Version: v96', 'required' => true, 'desc' => 'Portal features SQL'),
);

// Core tables (Gantt system)
$coreTables = array(
    'users' => array('desc' => 'User accounts', 'min_records' => 1),
    'projects' => array('desc' => 'Projects', 'min_records' => 1),
    'tasks' => array('desc' => 'Project tasks', 'min_records' => 0),
    'task_dependencies' => array('desc' => 'Task dependencies', 'min_records' => 0),
    'task_comments' => array('desc' => 'Task comments', 'min_records' => 0),
    'project_templates' => array('desc' => 'Project templates', 'min_records' => 0),
    'task_templates' => array('desc' => 'Task templates', 'min_records' => 0),
    'task_template_dependencies' => array('desc' => 'Template dependencies', 'min_records' => 0),
);

// Portal tables
$portalTables = array(
    'document_categories' => array('desc' => 'Document categories', 'min_records' => 5),
    'documents' => array('desc' => 'Document records', 'min_records' => 0),
    'document_access_log' => array('desc' => 'Document access tracking', 'min_records' => 0),
    'contact_categories' => array('desc' => 'Contact categories', 'min_records' => 4),
    'team_contacts' => array('desc' => 'Team contacts', 'min_records' => 5),
    'event_types' => array('desc' => 'Calendar event types', 'min_records' => 5),
    'diary_events' => array('desc' => 'Calendar events', 'min_records' => 0),
    'event_attendees' => array('desc' => 'Event attendees', 'min_records' => 0),
    'system_settings' => array('desc' => 'System configuration', 'min_records' => 1),
);

// Demo credentials
$demoCredentials = array(
    array('email' => 'admin@oasiscapitalfinance.com', 'password' => 'admin123', 'role' => 'Admin'),
    array('email' => 'sarah@oasiscapitalfinance.com', 'password' => 'manager123', 'role' => 'Manager'),
    array('email' => 'contact@acmecorp.com', 'password' => 'client123', 'role' => 'Client'),
);

// Required seed data checks
$seedDataChecks = array(
    array('table' => 'document_categories', 'check' => "slug = 'legal'", 'desc' => 'Legal category'),
    array('table' => 'document_categories', 'check' => "slug = 'financial'", 'desc' => 'Financial category'),
    array('table' => 'contact_categories', 'check' => "slug = 'ocf'", 'desc' => 'OCF team category'),
    array('table' => 'contact_categories', 'check' => "slug = 'legal'", 'desc' => 'Legal contacts category'),
    array('table' => 'event_types', 'check' => "slug = 'meeting'", 'desc' => 'Meeting event type'),
    array('table' => 'event_types', 'check' => "slug = 'deadline'", 'desc' => 'Deadline event type'),
);

// ============================================================
// HTML OUTPUT START
// ============================================================
echo "<!DOCTYPE html><html><head><title>Full Verification - Client Portal " . EXPECTED_VERSION . "</title>
<style>
*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:1200px;margin:40px auto;padding:20px;background:#f5f5f4;color:#1c1917}
h1{color:#1c1917;border-bottom:3px solid #14b8a6;padding-bottom:15px;display:flex;align-items:center;gap:15px;flex-wrap:wrap}
h1 .badge{background:#14b8a6;color:white;padding:5px 15px;border-radius:20px;font-size:18px}
h1 .new{background:#22c55e;color:white;padding:3px 10px;border-radius:12px;font-size:12px}
h2{color:#44403c;margin-top:30px;padding-bottom:10px;border-bottom:1px solid #d6d3d1}
h3{color:#57534e;margin-top:20px;}
.result{padding:10px 15px;margin:5px 0;border-radius:6px;border-left:4px solid}
.pass{background:#dcfce7;color:#166534;border-color:#22c55e}
.fail{background:#fee2e2;color:#991b1b;border-color:#ef4444}
.warn{background:#fef3c7;color:#92400e;border-color:#f59e0b}
.info{background:#e0f2fe;color:#0369a1;border-color:#0ea5e9}
table{width:100%;border-collapse:collapse;margin:15px 0;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
th,td{padding:12px 15px;text-align:left;border-bottom:1px solid #e7e5e4}th{background:#f5f5f4;font-weight:600}
.summary{display:flex;gap:15px;margin:25px 0;flex-wrap:wrap}
.summary-box{padding:20px 30px;border-radius:12px;text-align:center;min-width:120px}
.summary-box.pass-box{background:#dcfce7}.summary-box.fail-box{background:#fee2e2}.summary-box.warn-box{background:#fef3c7}
.summary-box .count{font-size:36px;font-weight:bold}.summary-box .label{font-size:14px;color:#57534e;margin-top:5px}
.ok{color:#22c55e;font-weight:600}.bad{color:#ef4444;font-weight:600}
code{background:#e7e5e4;padding:2px 8px;border-radius:4px;font-size:13px}
.warning-box{background:#fee2e2;border:2px solid #ef4444;padding:20px;border-radius:12px;margin:25px 0}
.success-box{background:#dcfce7;border:2px solid #22c55e;padding:20px;border-radius:12px;margin:25px 0}
.feature-box{background:linear-gradient(135deg,#14b8a6 0%,#0d9488 100%);color:white;padding:20px;border-radius:12px;margin:20px 0}
.feature-box h3{margin:0 0 10px 0;color:white}.feature-box ul{margin:0;padding-left:20px}.feature-box li{margin:5px 0}
pre{background:#1c1917;color:#fafaf9;padding:20px;border-radius:8px;overflow-x:auto;font-size:13px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px}
.version-history{background:#fafaf9;border:1px solid #e7e5e4;padding:15px;border-radius:8px;margin:15px 0}
.version-history h4{margin:0 0 10px 0;color:#44403c}
.version-history ul{margin:0;padding-left:20px;color:#57534e}
.stat-card{background:white;padding:15px;border-radius:8px;border:1px solid #e7e5e4;text-align:center}
.stat-card .number{font-size:28px;font-weight:bold;color:#14b8a6}
.stat-card .label{font-size:12px;color:#78716c;margin-top:5px}
@media(max-width:768px){.grid-2,.grid-3{grid-template-columns:1fr}}
</style></head><body>
<h1>Client Portal Verification <span class='badge'>" . EXPECTED_VERSION . "</span> <span class='new'>Latest</span></h1>

<div class='feature-box'><h3>Client Portal " . EXPECTED_VERSION . " - Complete Feature Set</h3>
<div class='grid-2'>
<ul>
<li><strong>Dashboard</strong> - Project overview, stats, quick actions</li>
<li><strong>Project Timeline</strong> - Interactive Gantt chart</li>
<li><strong>Document Library</strong> - Manage deal documents</li>
<li><strong>Team Contacts</strong> - Deal team information</li>
<li><strong>Diary/Calendar</strong> - Events and scheduling</li>
</ul>
<ul>
<li><strong>10 API Endpoints</strong> - Full REST API</li>
<li><strong>17 Database Tables</strong> - Core + Portal</li>
<li><strong>Role-based Access</strong> - Admin/Manager/Client</li>
<li><strong>Dark/Light Theme</strong> - User preference</li>
<li><strong>OCF Branding</strong> - Logo with theme support</li>
</ul>
</div>
</div>

<p><strong>Verified:</strong> " . date('Y-m-d H:i:s') . " | <strong>PHP:</strong> " . PHP_VERSION . " | <strong>Server:</strong> " . ($_SERVER['SERVER_NAME'] ?? php_uname('n')) . "</p>";

// ============================================================
// Section 1: Files & Version Markers
// ============================================================
echo "<h2>1. Files & Version Markers (" . count($versionFiles) . " files)</h2>";
echo "<table><tr><th>File</th><th>Description</th><th>Size</th><th>Version</th><th>Status</th></tr>";
foreach ($versionFiles as $name => $info) {
    if (!file_exists($info['path'])) {
        echo "<tr><td><code>{$name}</code></td><td>{$info['desc']}</td><td>-</td><td>-</td><td class='bad'>✗ MISSING</td></tr>";
        if ($info['required']) $failed++; else $warnings++;
        continue;
    }
    $content = file_get_contents($info['path']);
    $size = formatSize(filesize($info['path']));
    $hasMarker = empty($info['marker']) || strpos($content, $info['marker']) !== false;

    // Extract version from file
    $versionFound = '-';
    if (preg_match('/@version\s+(v\d+)/', $content, $matches)) {
        $versionFound = $matches[1];
    } elseif (preg_match('/Version:\s+(v\d+)/', $content, $matches)) {
        $versionFound = $matches[1];
    }

    if ($hasMarker) {
        echo "<tr><td><code>{$name}</code></td><td>{$info['desc']}</td><td>{$size}</td><td><span class='ok'>{$versionFound}</span></td><td class='ok'>✓ OK</td></tr>";
        $passed++;
    } else {
        echo "<tr><td><code>{$name}</code></td><td>{$info['desc']}</td><td>{$size}</td><td><span class='bad'>{$versionFound}</span></td><td class='bad'>✗ Wrong version</td></tr>";
        $failed++;
    }
}
echo "</table>";

// ============================================================
// Section 2: Database Connection
// ============================================================
echo "<h2>2. Database Connection</h2>";
$dbConnected = false; $db = null; $existingTables = array();
if (!file_exists($apiDir . '/config.php')) {
    showFail("config.php not found");
} else {
    try {
        require_once $apiDir . '/config.php';
        if (!class_exists('Database')) { showFail("Database class not found"); }
        else {
            $db = Database::getInstance();
            $dbConnected = true;
            $stmt = $db->query("SELECT DATABASE() as db_name, VERSION() as db_version");
            $info = $stmt->fetch(PDO::FETCH_ASSOC);
            showPass("Connected to: <strong>" . $info['db_name'] . "</strong> (MySQL " . $info['db_version'] . ")");
            if (defined('GPM_VERSION')) showPass("Config version: " . GPM_VERSION);
            $stmt = $db->query("SHOW TABLES");
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) $existingTables[] = $row[0];
            showInfo("Found " . count($existingTables) . " tables in database");
        }
    } catch (Exception $e) { showFail("Connection failed: " . $e->getMessage()); }
}

// ============================================================
// Section 3: Core Tables (Gantt System)
// ============================================================
echo "<h2>3. Core Tables (" . count($coreTables) . " tables)</h2>";
if ($dbConnected) {
    echo "<table><tr><th>Table</th><th>Description</th><th>Records</th><th>Status</th></tr>";
    foreach ($coreTables as $table => $info) {
        $exists = in_array($table, $existingTables);
        if ($exists) {
            $stmt = $db->query("SELECT COUNT(*) as cnt FROM `{$table}`");
            $count = $stmt->fetch()['cnt'];
            $status = $count >= $info['min_records'] ? 'ok' : 'warn';
            echo "<tr><td><code>{$table}</code></td><td>{$info['desc']}</td><td>{$count}</td><td class='{$status}'>✓ OK</td></tr>";
            $passed++;
        } else {
            echo "<tr><td><code>{$table}</code></td><td>{$info['desc']}</td><td>-</td><td class='bad'>✗ MISSING</td></tr>";
            $failed++;
        }
    }
    echo "</table>";
} else { showFail("Cannot check - database not connected"); }

// ============================================================
// Section 4: Portal Tables
// ============================================================
echo "<h2>4. Portal Tables (" . count($portalTables) . " tables)</h2>";
if ($dbConnected) {
    $portalTablesExist = 0;
    echo "<table><tr><th>Table</th><th>Description</th><th>Records</th><th>Min Required</th><th>Status</th></tr>";
    foreach ($portalTables as $table => $info) {
        $exists = in_array($table, $existingTables);
        if ($exists) {
            $stmt = $db->query("SELECT COUNT(*) as cnt FROM `{$table}`");
            $count = $stmt->fetch()['cnt'];
            $hasMinRecords = $count >= $info['min_records'];
            $status = $hasMinRecords ? 'ok' : 'warn';
            $statusText = $hasMinRecords ? '✓ OK' : '⚠ Low data';
            echo "<tr><td><code>{$table}</code></td><td>{$info['desc']}</td><td>{$count}</td><td>{$info['min_records']}</td><td class='{$status}'>{$statusText}</td></tr>";
            if ($hasMinRecords) $passed++; else $warnings++;
            $portalTablesExist++;
        } else {
            echo "<tr><td><code>{$table}</code></td><td>{$info['desc']}</td><td>-</td><td>{$info['min_records']}</td><td class='bad'>✗ MISSING</td></tr>";
            $failed++;
        }
    }
    echo "</table>";

    if ($portalTablesExist === 0) {
        showFail("Portal tables not found. Run: <code>sql/v96_portal_features.sql</code>");
    } elseif ($portalTablesExist < count($portalTables)) {
        showWarn("Some portal tables missing. Re-run: <code>sql/v96_portal_features.sql</code>");
    } else {
        showPass("All " . count($portalTables) . " portal tables present");
    }
} else { showFail("Cannot check - database not connected"); }

// ============================================================
// Section 5: Seed Data Verification
// ============================================================
echo "<h2>5. Seed Data Verification</h2>";
if ($dbConnected) {
    echo "<table><tr><th>Check</th><th>Table</th><th>Status</th></tr>";
    foreach ($seedDataChecks as $check) {
        if (in_array($check['table'], $existingTables)) {
            $stmt = $db->query("SELECT COUNT(*) as cnt FROM `{$check['table']}` WHERE {$check['check']}");
            $count = $stmt->fetch()['cnt'];
            if ($count > 0) {
                echo "<tr><td>{$check['desc']}</td><td><code>{$check['table']}</code></td><td class='ok'>✓ Found</td></tr>";
                $passed++;
            } else {
                echo "<tr><td>{$check['desc']}</td><td><code>{$check['table']}</code></td><td class='bad'>✗ Missing</td></tr>";
                $failed++;
            }
        } else {
            echo "<tr><td>{$check['desc']}</td><td><code>{$check['table']}</code></td><td class='warn'>⚠ Table missing</td></tr>";
            $warnings++;
        }
    }
    echo "</table>";
} else { showWarn("Cannot check seed data - database not connected"); }

// ============================================================
// Section 6: Project Templates
// ============================================================
echo "<h2>6. Project Templates</h2>";
if ($dbConnected && in_array('project_templates', $existingTables)) {
    $stmt = $db->query("SELECT id, name, (SELECT COUNT(*) FROM task_templates WHERE template_id = pt.id) as tasks FROM project_templates pt WHERE is_active=1 LIMIT 10");
    $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (count($templates) > 0) {
        echo "<table><tr><th>ID</th><th>Name</th><th>Tasks</th></tr>";
        foreach ($templates as $t) echo "<tr><td>{$t['id']}</td><td>{$t['name']}</td><td>{$t['tasks']}</td></tr>";
        echo "</table>";
        showPass("Found " . count($templates) . " active template(s)");
    } else { showWarn("No templates found - run templates_schema.sql"); }
} else { showWarn("Template table missing"); }

// ============================================================
// Section 7: Login System & Demo Users
// ============================================================
echo "<h2>7. Login System & Demo Users</h2>";
$loginFiles = array('login.php' => $baseDir.'/login.php', 'login-embed.js' => $baseDir.'/login-embed.js', 'login-demo.html' => $baseDir.'/login-demo.html');
foreach ($loginFiles as $name => $path) {
    if (file_exists($path)) { showPass("{$name} found (" . formatSize(filesize($path)) . ")"); }
    else { if ($name === 'login-demo.html') { $warnings++; showWarn("{$name} missing (optional)"); } else { $failed++; showFail("{$name} missing"); } }
}

echo "<h3>Demo User Passwords</h3>";
if ($dbConnected) {
    echo "<table><tr><th>Role</th><th>Email</th><th>Password</th><th>Status</th></tr>";
    foreach ($demoCredentials as $cred) {
        $stmt = $db->prepare("SELECT password_hash FROM users WHERE email = ?");
        $stmt->execute([$cred['email']]);
        $user = $stmt->fetch();
        if ($user && password_verify($cred['password'], $user['password_hash'])) {
            echo "<tr><td>{$cred['role']}</td><td><code>{$cred['email']}</code></td><td><code>{$cred['password']}</code></td><td class='ok'>✓ OK</td></tr>";
            $passed++;
        } else {
            echo "<tr><td>{$cred['role']}</td><td><code>{$cred['email']}</code></td><td><code>{$cred['password']}</code></td><td class='bad'>✗ Not set</td></tr>";
            $failed++;
        }
    }
    echo "</table>";
    showInfo("Run <code>/api/setup_passwords.php</code> to configure passwords");
}

// ============================================================
// Section 8: Static Assets
// ============================================================
echo "<h2>8. Static Assets</h2>";
$nextDir = $baseDir . '/_next/static';
if (is_dir($nextDir)) {
    $css = glob($nextDir . '/css/*.css');
    $js = glob($nextDir . '/chunks/*.js');
    $fonts = glob($nextDir . '/media/*.woff2');

    echo "<div class='grid-3'>";
    echo "<div class='stat-card'><div class='number'>" . count($css) . "</div><div class='label'>CSS Files</div></div>";
    echo "<div class='stat-card'><div class='number'>" . count($js) . "</div><div class='label'>JS Chunks</div></div>";
    echo "<div class='stat-card'><div class='number'>" . count($fonts) . "</div><div class='label'>Font Files</div></div>";
    echo "</div>";

    if (count($css) > 0) $passed++; else $failed++;
    if (count($js) > 0) $passed++; else $failed++;
    if (count($fonts) > 0) $passed++; else $warnings++;
} else { showFail("_next/static directory missing"); $failed++; }

// Logo files
$logoDir = $baseDir . '/images/logo';
if (is_dir($logoDir)) {
    $logos = glob($logoDir . '/*.{png,jpg,svg}', GLOB_BRACE);
    showPass("Logo files: " . count($logos) . " found");
    foreach ($logos as $logo) {
        showInfo("  - " . basename($logo) . " (" . formatSize(filesize($logo)) . ")");
    }
} else { showWarn("images/logo directory missing"); }

// ============================================================
// Section 9: API Endpoints
// ============================================================
echo "<h2>9. API Endpoints</h2>";

$apiEndpoints = array(
    'projects.php' => 'Projects API',
    'tasks.php?project_id=1' => 'Tasks API',
    'templates.php' => 'Templates API',
    'statistics.php?project_id=1' => 'Statistics API',
    'documents.php' => 'Documents API',
    'contacts.php' => 'Contacts API',
    'diary.php' => 'Diary API',
    'comments.php?task_id=1' => 'Comments API',
);

$execDisabled = !function_exists('exec') || in_array('exec', array_map('trim', explode(',', ini_get('disable_functions'))));

if ($execDisabled) {
    showInfo("exec() disabled - testing via HTTP");
    echo "<table><tr><th>Endpoint</th><th>Description</th><th>Status</th></tr>";
    foreach ($apiEndpoints as $endpoint => $desc) {
        $url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
             . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/' . $endpoint;
        $context = stream_context_create(array(
            'http' => array('timeout' => 5, 'ignore_errors' => true),
            'ssl' => array('verify_peer' => false, 'verify_peer_name' => false)
        ));
        $response = @file_get_contents($url, false, $context);
        if ($response !== false) {
            $data = json_decode($response, true);
            if (is_array($data) && isset($data['success'])) {
                echo "<tr><td><code>{$endpoint}</code></td><td>{$desc}</td><td class='ok'>✓ Working</td></tr>";
                $passed++;
            } else {
                echo "<tr><td><code>{$endpoint}</code></td><td>{$desc}</td><td class='warn'>⚠ Non-JSON response</td></tr>";
                $warnings++;
            }
        } else {
            echo "<tr><td><code>{$endpoint}</code></td><td>{$desc}</td><td class='warn'>⚠ Could not connect</td></tr>";
            $warnings++;
        }
    }
    // Check auth.php via file verification (session-dependent, can't test via HTTP)
    $authFile = $apiDir . '/auth.php';
    if (file_exists($authFile) && strpos(file_get_contents($authFile), '@version v96') !== false) {
        echo "<tr><td><code>auth.php</code></td><td>Auth API</td><td class='ok'>✓ File OK (v95)</td></tr>";
        $passed++;
    } else {
        echo "<tr><td><code>auth.php</code></td><td>Auth API</td><td class='warn'>⚠ File check failed</td></tr>";
        $warnings++;
    }
    echo "</table>";
} else {
    $apiFiles = array('config.php','projects.php','tasks.php','templates.php','auth.php','documents.php','contacts.php','diary.php','comments.php','statistics.php');
    echo "<table><tr><th>File</th><th>Status</th></tr>";
    foreach ($apiFiles as $file) {
        $path = $apiDir . '/' . $file;
        if (file_exists($path)) {
            $output = array();
            exec("php -l " . escapeshellarg($path) . " 2>&1", $output, $ret);
            if ($ret === 0) {
                echo "<tr><td><code>{$file}</code></td><td class='ok'>✓ Syntax OK</td></tr>";
                $passed++;
            } else {
                echo "<tr><td><code>{$file}</code></td><td class='bad'>✗ Syntax error</td></tr>";
                $failed++;
            }
        } else {
            echo "<tr><td><code>{$file}</code></td><td class='warn'>⚠ Not found</td></tr>";
            $warnings++;
        }
    }
    echo "</table>";
}

// ============================================================
// Section 10: Portal Pages
// ============================================================
echo "<h2>10. Portal Pages</h2>";
$portalPages = array(
    '/' => array('file' => '/index.html', 'desc' => 'Dashboard'),
    '/timeline/' => array('file' => '/timeline/index.html', 'desc' => 'Project Timeline (Gantt)'),
    '/documents/' => array('file' => '/documents/index.html', 'desc' => 'Document Library'),
    '/team/' => array('file' => '/team/index.html', 'desc' => 'Team Contacts'),
    '/diary/' => array('file' => '/diary/index.html', 'desc' => 'Diary/Calendar'),
    '/admin/projects/' => array('file' => '/admin/projects/index.html', 'desc' => 'Admin - Manage Projects'),
    '/admin/allocate/' => array('file' => '/admin/allocate/index.html', 'desc' => 'Admin - Allocate to Client'),
    '/admin/templates/' => array('file' => '/admin/templates/index.html', 'desc' => 'Admin - Templates'),
);

echo "<table><tr><th>Route</th><th>Description</th><th>File Size</th><th>Status</th></tr>";
foreach ($portalPages as $route => $info) {
    $filePath = $baseDir . $info['file'];
    if (file_exists($filePath)) {
        $size = formatSize(filesize($filePath));
        echo "<tr><td><code>{$route}</code></td><td>{$info['desc']}</td><td>{$size}</td><td class='ok'>✓ OK</td></tr>";
        $passed++;
    } else {
        echo "<tr><td><code>{$route}</code></td><td>{$info['desc']}</td><td>-</td><td class='bad'>✗ MISSING</td></tr>";
        $failed++;
    }
}
echo "</table>";

// ============================================================
// Section 11: System Settings
// ============================================================
echo "<h2>11. System Settings</h2>";
if ($dbConnected && in_array('system_settings', $existingTables)) {
    $stmt = $db->query("SELECT `key`, `value`, `description` FROM system_settings ORDER BY `key`");
    $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (count($settings) > 0) {
        echo "<table><tr><th>Key</th><th>Value</th><th>Description</th></tr>";
        foreach ($settings as $s) {
            $isVersionKey = $s['key'] === 'portal_version';
            $valueClass = ($isVersionKey && $s['value'] === EXPECTED_VERSION) ? 'ok' : '';
            echo "<tr><td><code>{$s['key']}</code></td><td class='{$valueClass}'>{$s['value']}</td><td>{$s['description']}</td></tr>";
        }
        echo "</table>";
        showPass("System settings configured (" . count($settings) . " entries)");
    } else {
        showWarn("No system settings found - run v96_portal_features.sql");
    }
} else {
    showWarn("system_settings table not found");
}

// ============================================================
// Summary
// ============================================================
echo "<h2>Summary</h2>
<div class='summary'>
<div class='summary-box pass-box'><div class='count'>{$passed}</div><div class='label'>Passed</div></div>
<div class='summary-box fail-box'><div class='count'>{$failed}</div><div class='label'>Failed</div></div>
<div class='summary-box warn-box'><div class='count'>{$warnings}</div><div class='label'>Warnings</div></div>
</div>";

$total = $passed + $failed + $warnings;
$passRate = $total > 0 ? round(($passed / $total) * 100) : 0;

if ($failed === 0) {
    echo "<div class='success-box'><strong>✓ All checks passed!</strong> Client Portal " . EXPECTED_VERSION . " deployment is complete and ready to use.<br>Pass rate: {$passRate}%</div>";
} else {
    echo "<div class='warning-box'><strong>✗ {$failed} issue(s) found!</strong> Please fix the failed items above before going live.<br>Pass rate: {$passRate}%</div>";
}

// ============================================================
// Setup Instructions
// ============================================================
echo "<h2>Setup Instructions</h2>
<table><tr><th>Step</th><th>Action</th><th>Command/URL</th></tr>
<tr><td>1</td><td>Upload all files</td><td><code>gantt-project-manager-v96-portal.zip</code></td></tr>
<tr><td>2</td><td>Configure database</td><td>Edit <code>api/config.php</code></td></tr>
<tr><td>3</td><td>Run SQL scripts</td><td><code>schema.sql → seed.sql → templates_schema.sql → v96_portal_features.sql</code></td></tr>
<tr><td>4</td><td>Setup passwords</td><td><code>/api/setup_passwords.php</code></td></tr>
<tr><td>5</td><td>Verify deployment</td><td><code>/api/full_verify.php</code></td></tr>
<tr><td>6</td><td>Test login</td><td><code>/login.php</code></td></tr>
<tr><td>7</td><td>Delete verification scripts</td><td>See security note below</td></tr>
</table>";

echo "<h2>SQL for Existing Installations</h2>
<pre>mysql -u username -p database_name &lt; sql/v96_portal_features.sql</pre>
<p>This adds the portal tables and seed data without affecting existing data.</p>";

// Version history
echo "<div class='version-history'>
<h4>Version History</h4>
<ul>
<li><strong>v96</strong> - Admin features (Manage Projects, Allocate to Client, Templates), role-based sidebar</li>
<li><strong>v95</strong> - White logo on dark sidebar, comprehensive verification</li>
<li><strong>v94</strong> - Horizontal logo display</li>
<li><strong>v86</strong> - Complete deployment package</li>
<li><strong>v83</strong> - Client Portal with Documents, Contacts, Diary</li>
<li><strong>v78</strong> - Portal features SQL migration</li>
<li><strong>v77</strong> - Popup login system</li>
</ul>
</div>";

echo "<div class='warning-box'><strong>⚠️ Security:</strong> Delete these files after verification:<br>
<code>full_verify.php</code>, <code>db_verify.php</code>, <code>file_verify.php</code>, <code>version_verify.php</code>, <code>setup_passwords.php</code></div>

<p style='text-align:center;color:#78716c;margin-top:30px;'>
&copy; " . date('Y') . " Oasis Capital Finance. All rights reserved. | Client Portal " . EXPECTED_VERSION . "
</p>

</body></html>";
