<?php
/**
 * Gantt Project Manager - Database Verification Script
 *
 * @version v125
 * @package GanttProjectManager
 * @build 2026-02-22
 *
 * Tests all database tables, fields, and sample data are present.
 * Compatible with PHP 7.0+
 *
 * DELETE THIS FILE AFTER VERIFICATION IN PRODUCTION!
 */

// Show all errors for debugging
error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Content-Type: text/html; charset=utf-8');

// Start output
echo "<!DOCTYPE html>
<html>
<head>
    <title>Database Verification - Gantt Project Manager</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; background: #f5f5f4; }
        h1 { color: #1c1917; border-bottom: 3px solid #14b8a6; padding-bottom: 10px; }
        h2 { color: #44403c; margin-top: 30px; }
        .pass { background: #dcfce7; color: #166534; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #22c55e; }
        .fail { background: #fee2e2; color: #991b1b; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #ef4444; }
        .warn { background: #fef3c7; color: #92400e; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #f59e0b; }
        .info { background: #e0f2fe; color: #0369a1; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #0ea5e9; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; background: white; }
        th, td { padding: 10px; text-align: left; border: 1px solid #d6d3d1; }
        th { background: #f5f5f4; }
        .summary { display: flex; gap: 15px; margin: 20px 0; }
        .summary div { padding: 15px 25px; border-radius: 8px; text-align: center; }
        .summary .pass-box { background: #dcfce7; }
        .summary .fail-box { background: #fee2e2; }
        .summary .warn-box { background: #fef3c7; }
        .count { font-size: 28px; font-weight: bold; }
        pre { background: #1c1917; color: #fafaf9; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .warning-box { background: #fee2e2; border: 2px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Database Verification</h1>
    <p>Gantt Project Manager | PHP " . PHP_VERSION . " | Tested: " . date('Y-m-d H:i:s') . "</p>
";

$passed = 0;
$failed = 0;
$warnings = 0;

function showPass($msg) {
    global $passed;
    $passed++;
    echo "<div class='pass'>✓ PASS: {$msg}</div>\n";
}

function showFail($msg) {
    global $failed;
    $failed++;
    echo "<div class='fail'>✗ FAIL: {$msg}</div>\n";
}

function showWarn($msg) {
    global $warnings;
    $warnings++;
    echo "<div class='warn'>⚠ WARN: {$msg}</div>\n";
}

function showInfo($msg) {
    echo "<div class='info'>ℹ INFO: {$msg}</div>\n";
}

// ============================================================
// Test 1: Check config.php exists
// ============================================================
echo "<h2>1. Configuration</h2>";

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    showFail("config.php not found at: {$configFile}");
    echo "<p>Create config.php with your database credentials.</p>";
    echo "</body></html>";
    exit;
}

showPass("config.php found");

// Try to include config
try {
    require_once $configFile;
    showPass("config.php loaded successfully");
} catch (Exception $e) {
    showFail("Error loading config.php: " . $e->getMessage());
    echo "</body></html>";
    exit;
}

// Check if Database class exists
if (!class_exists('Database')) {
    showFail("Database class not found in config.php");
    echo "</body></html>";
    exit;
}

showPass("Database class exists");

// ============================================================
// Test 2: Database Connection
// ============================================================
echo "<h2>2. Database Connection</h2>";

try {
    $db = Database::getInstance();
    showPass("Database connection successful");
} catch (Exception $e) {
    showFail("Database connection failed: " . $e->getMessage());
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
    echo "</body></html>";
    exit;
}

// Get database info
try {
    $stmt = $db->query("SELECT DATABASE() as db_name, VERSION() as db_version");
    $info = $stmt->fetch(PDO::FETCH_ASSOC);
    showPass("Connected to database: " . $info['db_name']);
    showInfo("MySQL/MariaDB version: " . $info['db_version']);
} catch (Exception $e) {
    showWarn("Could not get database info: " . $e->getMessage());
}

// ============================================================
// Test 3: Check Tables Exist
// ============================================================
echo "<h2>3. Required Tables</h2>";

$requiredTables = array(
    'users' => 'User accounts',
    'projects' => 'Projects',
    'tasks' => 'Project tasks',
    'task_dependencies' => 'Task dependencies',
    'task_comments' => 'Task comments',
    'project_templates' => 'Project templates',
    'task_templates' => 'Template tasks',
    'task_template_dependencies' => 'Template task dependencies'
);

$existingTables = array();

try {
    $stmt = $db->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $existingTables[] = $row[0];
    }
} catch (Exception $e) {
    showFail("Could not list tables: " . $e->getMessage());
}

echo "<table><tr><th>Table</th><th>Description</th><th>Status</th></tr>";
foreach ($requiredTables as $table => $desc) {
    $exists = in_array($table, $existingTables);
    $status = $exists ? "<span style='color:green'>✓ EXISTS</span>" : "<span style='color:red'>✗ MISSING</span>";
    echo "<tr><td>{$table}</td><td>{$desc}</td><td>{$status}</td></tr>";
    if ($exists) {
        $passed++;
    } else {
        $failed++;
    }
}
echo "</table>";

// ============================================================
// Test 4: Check Record Counts
// ============================================================
echo "<h2>4. Data Records</h2>";

echo "<table><tr><th>Table</th><th>Record Count</th><th>Status</th></tr>";

foreach ($requiredTables as $table => $desc) {
    if (!in_array($table, $existingTables)) {
        echo "<tr><td>{$table}</td><td>-</td><td><span style='color:red'>Table missing</span></td></tr>";
        continue;
    }

    try {
        $stmt = $db->query("SELECT COUNT(*) as cnt FROM `{$table}`");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $count = $row['cnt'];

        if ($count > 0) {
            echo "<tr><td>{$table}</td><td>{$count}</td><td><span style='color:green'>✓ Has data</span></td></tr>";
            $passed++;
        } else {
            echo "<tr><td>{$table}</td><td>0</td><td><span style='color:orange'>⚠ Empty</span></td></tr>";
            $warnings++;
        }
    } catch (Exception $e) {
        echo "<tr><td>{$table}</td><td>Error</td><td><span style='color:red'>" . htmlspecialchars($e->getMessage()) . "</span></td></tr>";
        $failed++;
    }
}
echo "</table>";

// ============================================================
// Test 5: Check Users
// ============================================================
echo "<h2>5. Users</h2>";

if (in_array('users', $existingTables)) {
    try {
        $stmt = $db->query("SELECT id, username, full_name, role, is_active FROM users ORDER BY id LIMIT 20");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($users) > 0) {
            echo "<table><tr><th>ID</th><th>Username</th><th>Full Name</th><th>Role</th><th>Active</th></tr>";
            foreach ($users as $user) {
                $active = $user['is_active'] ? 'Yes' : 'No';
                echo "<tr><td>{$user['id']}</td><td>{$user['username']}</td><td>{$user['full_name']}</td><td>{$user['role']}</td><td>{$active}</td></tr>";
            }
            echo "</table>";
            showPass("Found " . count($users) . " user(s)");
        } else {
            showWarn("No users found - run seed.sql");
        }
    } catch (Exception $e) {
        showFail("Error querying users: " . $e->getMessage());
    }
} else {
    showFail("Users table does not exist");
}

// ============================================================
// Test 6: Check Projects
// ============================================================
echo "<h2>6. Projects</h2>";

if (in_array('projects', $existingTables)) {
    try {
        $stmt = $db->query("
            SELECT p.id, p.name, p.is_active,
                   (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
            FROM projects p
            ORDER BY p.id
            LIMIT 20
        ");
        $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($projects) > 0) {
            echo "<table><tr><th>ID</th><th>Name</th><th>Tasks</th><th>Active</th></tr>";
            foreach ($projects as $proj) {
                $active = $proj['is_active'] ? 'Yes' : 'No';
                echo "<tr><td>{$proj['id']}</td><td>{$proj['name']}</td><td>{$proj['task_count']}</td><td>{$active}</td></tr>";
            }
            echo "</table>";
            showPass("Found " . count($projects) . " project(s)");
        } else {
            showWarn("No projects found - run seed.sql");
        }
    } catch (Exception $e) {
        showFail("Error querying projects: " . $e->getMessage());
    }
} else {
    showFail("Projects table does not exist");
}

// ============================================================
// Test 7: Check Project Templates
// ============================================================
echo "<h2>7. Project Templates</h2>";

if (in_array('project_templates', $existingTables)) {
    try {
        $stmt = $db->query("
            SELECT pt.id, pt.name, pt.project_type, pt.is_active,
                   (SELECT COUNT(*) FROM task_templates WHERE template_id = pt.id) as task_count
            FROM project_templates pt
            ORDER BY pt.id
            LIMIT 20
        ");
        $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($templates) > 0) {
            echo "<table><tr><th>ID</th><th>Name</th><th>Type</th><th>Tasks</th><th>Active</th></tr>";
            foreach ($templates as $tpl) {
                $active = $tpl['is_active'] ? 'Yes' : 'No';
                echo "<tr><td>{$tpl['id']}</td><td>{$tpl['name']}</td><td>{$tpl['project_type']}</td><td>{$tpl['task_count']}</td><td>{$active}</td></tr>";
            }
            echo "</table>";
            showPass("Found " . count($templates) . " template(s)");

            // Check for OCF Nordic Bond Issue
            $hasOcf = false;
            foreach ($templates as $tpl) {
                if (stripos($tpl['name'], 'OCF') !== false || stripos($tpl['name'], 'Nordic') !== false || stripos($tpl['name'], 'Bond') !== false) {
                    $hasOcf = true;
                    break;
                }
            }
            if ($hasOcf) {
                showPass("OCF/Bond template found");
            } else {
                showWarn("OCF Nordic Bond Issue template not found - run migrate_project1_to_template.sql");
            }
        } else {
            showWarn("No templates found - run templates_schema.sql and migrate_project1_to_template.sql");
        }
    } catch (Exception $e) {
        showFail("Error querying templates: " . $e->getMessage());
    }
} else {
    showFail("project_templates table does not exist - run templates_schema.sql");
}

// ============================================================
// Test 8: Check API Files
// ============================================================
echo "<h2>8. API Files</h2>";

$apiFiles = array(
    'config.php' => 'Database configuration',
    'projects.php' => 'Projects API',
    'tasks.php' => 'Tasks API',
    'templates.php' => 'Templates API',
    'comments.php' => 'Comments API',
    'auth.php' => 'Authentication API'
);

echo "<table><tr><th>File</th><th>Description</th><th>Status</th></tr>";
foreach ($apiFiles as $file => $desc) {
    $path = __DIR__ . '/' . $file;
    $exists = file_exists($path);
    $status = $exists ? "<span style='color:green'>✓ EXISTS</span>" : "<span style='color:red'>✗ MISSING</span>";
    echo "<tr><td>{$file}</td><td>{$desc}</td><td>{$status}</td></tr>";
    if ($exists) {
        $passed++;
    } else {
        $failed++;
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

if ($failed > 0) {
    echo "<div class='warning-box'>
        <strong>⚠️ Some tests failed!</strong><br>
        Run the SQL scripts below to fix the issues.
    </div>";
}

echo "<h2>SQL Scripts Reference</h2>";
echo "<table>
    <tr><th>Script</th><th>Purpose</th><th>When to Run</th></tr>
    <tr><td>schema.sql</td><td>Create core tables (users, projects, tasks)</td><td>Fresh install</td></tr>
    <tr><td>seed.sql</td><td>Add sample users and project data</td><td>Fresh install</td></tr>
    <tr><td>templates_schema.sql</td><td>Create template tables</td><td>If template tables missing</td></tr>
    <tr><td>migrate_project1_to_template.sql</td><td>Create OCF Nordic Bond Issue template</td><td>After templates_schema.sql</td></tr>
    <tr><td>update_users.sql</td><td>Sync user IDs with frontend</td><td>If login issues</td></tr>
</table>";

echo "<div class='warning-box' style='margin-top: 30px;'>
    <strong>⚠️ Security Notice:</strong> Delete this file (db_verify.php) after verification!
</div>";

echo "</body></html>";
