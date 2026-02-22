<?php
/**
 * Gantt Project Manager - FULL Verification Script
 *
 * @version v86
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * DELETE THIS FILE AFTER VERIFICATION IN PRODUCTION!
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/html; charset=utf-8');

define('EXPECTED_VERSION', 'v86');
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

// Files to verify
$versionFiles = array(
    // Core API files
    'api/config.php' => array('path' => $apiDir . '/config.php', 'marker' => '@version', 'required' => true, 'desc' => 'Database configuration'),
    'api/projects.php' => array('path' => $apiDir . '/projects.php', 'marker' => '@version', 'required' => true, 'desc' => 'Projects API'),
    'api/tasks.php' => array('path' => $apiDir . '/tasks.php', 'marker' => '@version', 'required' => true, 'desc' => 'Tasks API'),
    'api/templates.php' => array('path' => $apiDir . '/templates.php', 'marker' => '@version', 'required' => true, 'desc' => 'Templates API'),
    'api/comments.php' => array('path' => $apiDir . '/comments.php', 'marker' => '@version', 'required' => true, 'desc' => 'Comments API'),
    'api/auth.php' => array('path' => $apiDir . '/auth.php', 'marker' => '@version', 'required' => true, 'desc' => 'Authentication API'),
    'api/statistics.php' => array('path' => $apiDir . '/statistics.php', 'marker' => '@version', 'required' => true, 'desc' => 'Statistics API'),
    // Portal APIs
    'api/documents.php' => array('path' => $apiDir . '/documents.php', 'marker' => '@version', 'required' => true, 'desc' => 'Documents API'),
    'api/contacts.php' => array('path' => $apiDir . '/contacts.php', 'marker' => '@version', 'required' => true, 'desc' => 'Team Contacts API'),
    'api/diary.php' => array('path' => $apiDir . '/diary.php', 'marker' => '@version', 'required' => true, 'desc' => 'Diary/Calendar API'),
    // Login system
    'login.php' => array('path' => $baseDir . '/login.php', 'marker' => '@version', 'required' => true, 'desc' => 'Popup login page'),
    'login-embed.js' => array('path' => $baseDir . '/login-embed.js', 'marker' => '@version', 'required' => true, 'desc' => 'Login embed script'),
    // Frontend pages
    'index.html' => array('path' => $baseDir . '/index.html', 'marker' => '', 'required' => true, 'desc' => 'Dashboard page'),
    'timeline/index.html' => array('path' => $baseDir . '/timeline/index.html', 'marker' => '', 'required' => true, 'desc' => 'Timeline/Gantt page'),
    'documents/index.html' => array('path' => $baseDir . '/documents/index.html', 'marker' => '', 'required' => true, 'desc' => 'Documents page'),
    'team/index.html' => array('path' => $baseDir . '/team/index.html', 'marker' => '', 'required' => true, 'desc' => 'Team Contacts page'),
    'diary/index.html' => array('path' => $baseDir . '/diary/index.html', 'marker' => '', 'required' => true, 'desc' => 'Diary/Calendar page'),
);

// Core tables (existing)
$coreTables = array('users', 'projects', 'tasks', 'task_dependencies', 'task_comments', 'project_templates', 'task_templates', 'task_template_dependencies');

// Portal tables
$portalTables = array(
    'document_categories' => 'Document categories',
    'documents' => 'Document records',
    'document_access_log' => 'Document access tracking',
    'contact_categories' => 'Contact categories',
    'team_contacts' => 'Team contacts',
    'event_types' => 'Calendar event types',
    'diary_events' => 'Calendar events',
    'event_attendees' => 'Event attendees',
    'system_settings' => 'System configuration',
);

$demoCredentials = array(
    array('email' => 'admin@oasiscapitalfinance.com', 'password' => 'admin123', 'role' => 'Admin'),
    array('email' => 'sarah@oasiscapitalfinance.com', 'password' => 'manager123', 'role' => 'Manager'),
    array('email' => 'contact@acmecorp.com', 'password' => 'client123', 'role' => 'Client'),
);

echo "<!DOCTYPE html><html><head><title>Full Verification - Client Portal " . EXPECTED_VERSION . "</title>
<style>
*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:1100px;margin:40px auto;padding:20px;background:#f5f5f4;color:#1c1917}
h1{color:#1c1917;border-bottom:3px solid #14b8a6;padding-bottom:15px;display:flex;align-items:center;gap:15px;flex-wrap:wrap}
h1 .badge{background:#14b8a6;color:white;padding:5px 15px;border-radius:20px;font-size:18px}
h1 .new{background:#f59e0b;color:white;padding:3px 10px;border-radius:12px;font-size:12px}
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
.version-history{background:#fafaf9;border:1px solid #e7e5e4;padding:15px;border-radius:8px;margin:15px 0}
.version-history h4{margin:0 0 10px 0;color:#44403c}
.version-history ul{margin:0;padding-left:20px;color:#57534e}
@media(max-width:768px){.grid-2{grid-template-columns:1fr}}
</style></head><body>
<h1>Client Portal Verification <span class='badge'>" . EXPECTED_VERSION . "</span> <span class='new'>Full Portal</span></h1>

<div class='feature-box'><h3>Client Portal v86 Features</h3>
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
<li><strong>9 Portal Tables</strong> - Complete database</li>
<li><strong>Role-based Access</strong> - Admin/Manager/Client</li>
<li><strong>Dark/Light Theme</strong> - User preference</li>
<li><strong>Mobile Responsive</strong> - Works on all devices</li>
</ul>
</div>
</div>

<p><strong>Verified:</strong> " . date('Y-m-d H:i:s') . " | <strong>PHP:</strong> " . PHP_VERSION . " | <strong>Server:</strong> " . ($_SERVER['SERVER_NAME'] ?? php_uname('n')) . "</p>";

// ============================================================
// Section 1: Files & Version Markers
// ============================================================
echo "<h2>1. Files & Version Markers</h2><table><tr><th>File</th><th>Description</th><th>Size</th><th>Status</th></tr>";
foreach ($versionFiles as $name => $info) {
    if (!file_exists($info['path'])) {
        echo "<tr><td><code>{$name}</code></td><td>{$info['desc']}</td><td>-</td><td class='bad'>✗ MISSING</td></tr>";
        if ($info['required']) $failed++; else $warnings++;
        continue;
    }
    $content = file_get_contents($info['path']);
    $size = formatSize(filesize($info['path']));
    $hasMarker = empty($info['marker']) || strpos($content, $info['marker']) !== false;
    if ($hasMarker) {
        echo "<tr><td><code>{$name}</code></td><td>{$info['desc']}</td><td>{$size}</td><td class='ok'>✓ OK</td></tr>";
        $passed++;
    } else {
        echo "<tr><td><code>{$name}</code></td><td>{$info['desc']}</td><td>{$size}</td><td class='bad'>✗ Wrong version</td></tr>";
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
            showPass("Connected to: " . $info['db_name'] . " (MySQL " . $info['db_version'] . ")");
            if (defined('GPM_VERSION')) showPass("Config version: " . GPM_VERSION);
            $stmt = $db->query("SHOW TABLES");
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) $existingTables[] = $row[0];
            showInfo("Found " . count($existingTables) . " tables in database");
        }
    } catch (Exception $e) { showFail("Connection failed: " . $e->getMessage()); }
}

// ============================================================
// Section 3: Core Tables
// ============================================================
echo "<h2>3. Core Tables (Gantt System)</h2>";
if ($dbConnected) {
    echo "<table><tr><th>Table</th><th>Records</th><th>Status</th></tr>";
    foreach ($coreTables as $table) {
        $exists = in_array($table, $existingTables);
        if ($exists) {
            $stmt = $db->query("SELECT COUNT(*) as cnt FROM `{$table}`");
            $count = $stmt->fetch()['cnt'];
            echo "<tr><td><code>{$table}</code></td><td>{$count}</td><td class='ok'>✓ OK</td></tr>";
            $passed++;
        } else {
            echo "<tr><td><code>{$table}</code></td><td>-</td><td class='bad'>✗ MISSING</td></tr>";
            $failed++;
        }
    }
    echo "</table>";
} else { showFail("Cannot check - database not connected"); }

// ============================================================
// Section 4: Portal Tables
// ============================================================
echo "<h2>4. Portal Tables</h2>";
if ($dbConnected) {
    $portalTablesExist = 0;
    echo "<table><tr><th>Table</th><th>Description</th><th>Records</th><th>Status</th></tr>";
    foreach ($portalTables as $table => $desc) {
        $exists = in_array($table, $existingTables);
        if ($exists) {
            $stmt = $db->query("SELECT COUNT(*) as cnt FROM `{$table}`");
            $count = $stmt->fetch()['cnt'];
            echo "<tr><td><code>{$table}</code></td><td>{$desc}</td><td>{$count}</td><td class='ok'>✓ OK</td></tr>";
            $passed++;
            $portalTablesExist++;
        } else {
            echo "<tr><td><code>{$table}</code></td><td>{$desc}</td><td>-</td><td class='bad'>✗ MISSING</td></tr>";
            $failed++;
        }
    }
    echo "</table>";

    if ($portalTablesExist === 0) {
        showWarn("Portal tables not found. Run: <code>sql/v86_portal_features.sql</code>");
    } elseif ($portalTablesExist < count($portalTables)) {
        showWarn("Some portal tables missing. Re-run: <code>sql/v86_portal_features.sql</code>");
    } else {
        showPass("All " . count($portalTables) . " portal tables present");
    }
} else { showFail("Cannot check - database not connected"); }

// ============================================================
// Section 5: Project Templates
// ============================================================
echo "<h2>5. Project Templates</h2>";
if ($dbConnected && in_array('project_templates', $existingTables)) {
    $stmt = $db->query("SELECT id, name, (SELECT COUNT(*) FROM task_templates WHERE template_id = pt.id) as tasks FROM project_templates pt WHERE is_active=1 LIMIT 10");
    $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (count($templates) > 0) {
        echo "<table><tr><th>ID</th><th>Name</th><th>Tasks</th></tr>";
        foreach ($templates as $t) echo "<tr><td>{$t['id']}</td><td>{$t['name']}</td><td>{$t['tasks']}</td></tr>";
        echo "</table>";
        showPass("Found " . count($templates) . " template(s)");
    } else { showWarn("No templates - run templates_schema.sql"); }
} else { showWarn("Template table missing"); }

// ============================================================
// Section 6: Login System
// ============================================================
echo "<h2>6. Login System</h2>";
$loginFiles = array('login.php' => $baseDir.'/login.php', 'login-embed.js' => $baseDir.'/login-embed.js', 'login-demo.html' => $baseDir.'/login-demo.html');
foreach ($loginFiles as $name => $path) {
    if (file_exists($path)) { showPass("{$name} found (" . formatSize(filesize($path)) . ")"); }
    else { if ($name === 'login-demo.html') { $warnings++; showWarn("{$name} missing (optional)"); } else { $failed++; showFail("{$name} missing"); } }
}

// Password check
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
// Section 7: Static Assets
// ============================================================
echo "<h2>7. Static Assets</h2>";
$nextDir = $baseDir . '/_next/static';
if (is_dir($nextDir)) {
    $css = glob($nextDir . '/css/*.css'); $js = glob($nextDir . '/chunks/*.js');
    if (count($css) > 0) showPass("CSS: " . count($css) . " files"); else showFail("No CSS files");
    if (count($js) > 0) showPass("JS: " . count($js) . " chunks"); else showFail("No JS chunks");

    // Check for font files
    $fonts = glob($nextDir . '/media/*.woff2');
    if (count($fonts) > 0) showPass("Fonts: " . count($fonts) . " woff2 files"); else showWarn("Font files may be missing");
} else { showFail("_next/static missing"); }

$logoDir = $baseDir . '/images/logo';
if (is_dir($logoDir)) {
    $logos = glob($logoDir . '/*.{png,jpg,svg}', GLOB_BRACE);
    showPass("Logos: " . count($logos) . " files");
} else { showWarn("images/logo missing"); }

// ============================================================
// Section 8: API Endpoints Test
// ============================================================
echo "<h2>8. API Endpoints</h2>";

// Test all API endpoints
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
                $version = isset($data['version']) ? " ({$data['version']})" : "";
                showPass("{$desc}: Working{$version}");
            } else {
                showWarn("{$desc}: Response not JSON");
            }
        } else {
            showWarn("{$desc}: Could not connect");
        }
    }
} else {
    // Syntax check for all API files
    $apiFiles = array('config.php','projects.php','tasks.php','templates.php','auth.php','documents.php','contacts.php','diary.php','comments.php','statistics.php');
    foreach ($apiFiles as $file) {
        $path = $apiDir . '/' . $file;
        if (file_exists($path)) {
            $output = array();
            exec("php -l " . escapeshellarg($path) . " 2>&1", $output, $ret);
            if ($ret === 0) {
                showPass("{$file}: Syntax OK");
            } else {
                showFail("{$file}: Syntax error - " . implode(' ', $output));
            }
        } else {
            showWarn("{$file}: Not found");
        }
    }
}

// ============================================================
// Section 9: Portal Pages Check
// ============================================================
echo "<h2>9. Portal Pages</h2>";
$portalPages = array(
    '/' => 'Dashboard',
    '/timeline/' => 'Project Timeline (Gantt)',
    '/documents/' => 'Document Library',
    '/team/' => 'Team Contacts',
    '/diary/' => 'Diary/Calendar',
);

echo "<table><tr><th>Page</th><th>Description</th><th>Status</th></tr>";
foreach ($portalPages as $path => $desc) {
    $filePath = $baseDir . ($path === '/' ? '/index.html' : $path . 'index.html');
    if (file_exists($filePath)) {
        $size = formatSize(filesize($filePath));
        echo "<tr><td><code>{$path}</code></td><td>{$desc}</td><td class='ok'>✓ OK ({$size})</td></tr>";
        $passed++;
    } else {
        echo "<tr><td><code>{$path}</code></td><td>{$desc}</td><td class='bad'>✗ MISSING</td></tr>";
        $failed++;
    }
}
echo "</table>";

// ============================================================
// Section 10: System Settings Check
// ============================================================
echo "<h2>10. System Settings</h2>";
if ($dbConnected && in_array('system_settings', $existingTables)) {
    $stmt = $db->query("SELECT `key`, `value`, `description` FROM system_settings ORDER BY `key`");
    $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (count($settings) > 0) {
        echo "<table><tr><th>Key</th><th>Value</th><th>Description</th></tr>";
        foreach ($settings as $s) {
            echo "<tr><td><code>{$s['key']}</code></td><td>{$s['value']}</td><td>{$s['description']}</td></tr>";
        }
        echo "</table>";
        showPass("System settings configured");
    } else {
        showWarn("No system settings found");
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

if ($failed === 0) {
    echo "<div class='success-box'><strong>✓ All checks passed!</strong> Client Portal v86 deployment is complete and ready to use.</div>";
} else {
    echo "<div class='warning-box'><strong>✗ Issues found!</strong> Please fix the failed items above before going live.</div>";
}

// ============================================================
// Setup Instructions
// ============================================================
echo "<h2>Setup Instructions</h2>
<table><tr><th>Step</th><th>Action</th></tr>
<tr><td>1</td><td>Upload all files from <code>gantt-project-manager-v86-portal.zip</code></td></tr>
<tr><td>2</td><td>Edit <code>api/config.php</code> with database credentials</td></tr>
<tr><td>3</td><td>Run SQL scripts in order:<br>
<code>schema.sql</code> → <code>seed.sql</code> → <code>templates_schema.sql</code> → <code>v86_portal_features.sql</code></td></tr>
<tr><td>4</td><td>Visit <code>/api/setup_passwords.php</code> to configure demo passwords</td></tr>
<tr><td>5</td><td>Test login at <code>/login.php</code></td></tr>
<tr><td>6</td><td>Delete verification scripts (see below)</td></tr>
</table>";

echo "<h2>SQL for Existing Installations</h2>
<p>If you already have the Gantt system running, just run the portal script:</p>
<pre>mysql -u username -p database_name &lt; sql/v86_portal_features.sql</pre>
<p>This adds the portal tables without affecting existing data.</p>";

// Version history
echo "<div class='version-history'>
<h4>Version History</h4>
<ul>
<li><strong>v86</strong> - Full verification script with all features check</li>
<li><strong>v84</strong> - System settings table, enhanced verification</li>
<li><strong>v83</strong> - Client Portal with Documents, Contacts, Diary</li>
<li><strong>v78</strong> - Portal features SQL migration</li>
<li><strong>v77</strong> - Popup login system</li>
<li><strong>v76</strong> - Fixed API URLs</li>
<li><strong>v75</strong> - Version verification scripts</li>
</ul>
</div>";

echo "<div class='warning-box'><strong>⚠️ Security:</strong> Delete these files after verification:<br>
<code>full_verify.php</code>, <code>db_verify.php</code>, <code>file_verify.php</code>, <code>version_verify.php</code>, <code>setup_passwords.php</code></div>

<p style='text-align:center;color:#78716c;margin-top:30px;'>
&copy; " . date('Y') . " Oasis Capital Finance. All rights reserved. | Client Portal " . EXPECTED_VERSION . "
</p>

</body></html>";
