<?php
/**
 * Gantt Project Manager - Password Setup Script
 *
 * @version v95
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * Run this script ONCE after database setup to configure demo user passwords.
 *
 * Demo Credentials after running this script:
 * - Admin:   admin@oasiscapitalfinance.com / admin123
 * - Manager: sarah@oasiscapitalfinance.com / manager123
 * - Manager: michael@oasiscapitalfinance.com / manager123
 * - Client:  contact@acmecorp.com / client123
 * - Client:  info@globalinvest.com / client123
 * - Client:  hello@techventures.com / client123
 *
 * DELETE THIS FILE AFTER RUNNING IN PRODUCTION!
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/config.php';

// Define demo passwords
$demoPasswords = [
    'admin' => [
        'password' => 'admin123',
        'emails' => ['admin@oasiscapitalfinance.com']
    ],
    'manager' => [
        'password' => 'manager123',
        'emails' => ['sarah@oasiscapitalfinance.com', 'michael@oasiscapitalfinance.com']
    ],
    'client' => [
        'password' => 'client123',
        'emails' => ['contact@acmecorp.com', 'info@globalinvest.com', 'hello@techventures.com']
    ]
];

$results = [];

echo "<!DOCTYPE html>
<html>
<head>
    <title>Password Setup - Gantt Project Manager</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background: #f5f5f4; }
        h1 { color: #1c1917; border-bottom: 3px solid #14b8a6; padding-bottom: 10px; }
        .pass { background: #dcfce7; color: #166534; padding: 10px 15px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #22c55e; }
        .fail { background: #fee2e2; color: #991b1b; padding: 10px 15px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #ef4444; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
        th, td { padding: 12px 15px; text-align: left; border: 1px solid #e7e5e4; }
        th { background: #f5f5f4; }
        code { background: #e7e5e4; padding: 2px 8px; border-radius: 4px; font-size: 13px; }
        .warning-box { background: #fee2e2; border: 2px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .success-box { background: #dcfce7; border: 2px solid #22c55e; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Password Setup</h1>
    <p>Gantt Project Manager | " . date('Y-m-d H:i:s') . "</p>
";

try {
    $db = Database::getInstance();

    echo "<h2>Setting Demo Passwords</h2>";

    foreach ($demoPasswords as $role => $config) {
        $password = $config['password'];
        $hash = password_hash($password, PASSWORD_DEFAULT);

        foreach ($config['emails'] as $email) {
            // Check if user exists
            $stmt = $db->prepare("SELECT id, username, full_name FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user) {
                // Update password
                $updateStmt = $db->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
                $updateStmt->execute([$hash, $email]);

                echo "<div class='pass'>✓ Updated password for: <strong>{$user['full_name']}</strong> ({$email}) - Role: {$role}</div>";
                $results[] = [
                    'email' => $email,
                    'name' => $user['full_name'],
                    'role' => $role,
                    'password' => $password,
                    'status' => 'Updated'
                ];
            } else {
                echo "<div class='fail'>✗ User not found: {$email}</div>";
                $results[] = [
                    'email' => $email,
                    'name' => 'N/A',
                    'role' => $role,
                    'password' => $password,
                    'status' => 'Not Found'
                ];
            }
        }
    }

    echo "<h2>Demo Credentials</h2>";
    echo "<table>
        <tr><th>Role</th><th>Email</th><th>Password</th><th>Status</th></tr>";

    foreach ($results as $result) {
        $statusClass = $result['status'] === 'Updated' ? 'color: green;' : 'color: red;';
        echo "<tr>
            <td><strong>" . ucfirst($result['role']) . "</strong></td>
            <td><code>{$result['email']}</code></td>
            <td><code>{$result['password']}</code></td>
            <td style='{$statusClass}'>{$result['status']}</td>
        </tr>";
    }

    echo "</table>";

    // Test login
    echo "<h2>Verification Test</h2>";

    $testEmail = 'admin@oasiscapitalfinance.com';
    $testPassword = 'admin123';

    $stmt = $db->prepare("SELECT password_hash FROM users WHERE email = ?");
    $stmt->execute([$testEmail]);
    $user = $stmt->fetch();

    if ($user && password_verify($testPassword, $user['password_hash'])) {
        echo "<div class='pass'>✓ Password verification test PASSED for {$testEmail}</div>";
    } else {
        echo "<div class='fail'>✗ Password verification test FAILED for {$testEmail}</div>";
    }

    echo "<div class='success-box'>
        <strong>✓ Password setup complete!</strong><br>
        You can now use the demo credentials to log in at: <a href='/login.php'>/login.php</a>
    </div>";

} catch (Exception $e) {
    echo "<div class='fail'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</div>";
}

echo "<div class='warning-box'>
    <strong>⚠️ Security Notice:</strong> Delete this file (<code>setup_passwords.php</code>) after running!<br>
    In production, ensure you change all demo passwords to secure values.
</div>

<h2>Next Steps</h2>
<ol>
    <li>Test login at <a href='/login.php'>/login.php</a></li>
    <li>Delete this file: <code>api/setup_passwords.php</code></li>
    <li>In production, change all demo passwords</li>
</ol>

</body></html>";
