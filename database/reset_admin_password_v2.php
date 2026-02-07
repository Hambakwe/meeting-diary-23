<?php
/**
 * Meeting Diary - Admin Password Reset (for existing users table)
 * DELETE THIS FILE AFTER USE!
 */

$dbHost = 'localhost';
$dbName = 'oasiscapi_meetings';
$dbUser = 'oasiscapi_oasistravel';
$dbPass = 'C1nd3r3ll4!$';

$adminEmail = 'admin@meetings.com';
$adminPassword = 'Admin123!';
$adminUsername = 'admin';

echo "<h1>Meeting Diary - Admin Setup</h1>";

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "<p style='color:green'>✓ Database connected</p>";

    // Show existing columns
    $columns = [];
    $stmt = $pdo->query("DESCRIBE users");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $columns[] = $row['Field'];
    }
    echo "<p>Columns: " . implode(', ', $columns) . "</p>";

    // Generate password hash
    $passwordHash = password_hash($adminPassword, PASSWORD_DEFAULT);
    echo "<p>Generated password hash</p>";

    // Check if admin user exists by email
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$adminEmail]);
    $existingUser = $stmt->fetch();

    if ($existingUser) {
        // Update existing user's password
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
        $stmt->execute([$passwordHash, $adminEmail]);
        echo "<p style='color:green'>✓ Admin password updated!</p>";

        // Update access_level if column exists
        if (in_array('access_level', $columns)) {
            $pdo->prepare("UPDATE users SET access_level = 'admin' WHERE email = ?")->execute([$adminEmail]);
            echo "<p style='color:green'>✓ Set access_level to admin</p>";
        }
    } else {
        // Insert new admin user - using existing table structure
        $id = uniqid() . '-' . substr(md5(random_bytes(8)), 0, 8);

        // Build insert based on existing columns
        $insertCols = ['id', 'email', 'password_hash'];
        $insertVals = [$id, $adminEmail, $passwordHash];
        $placeholders = ['?', '?', '?'];

        if (in_array('username', $columns)) {
            $insertCols[] = 'username';
            $insertVals[] = $adminUsername;
            $placeholders[] = '?';
        }
        if (in_array('name', $columns)) {
            $insertCols[] = 'name';
            $insertVals[] = 'Administrator';
            $placeholders[] = '?';
        }
        if (in_array('access_level', $columns)) {
            $insertCols[] = 'access_level';
            $insertVals[] = 'admin';
            $placeholders[] = '?';
        }
        if (in_array('role', $columns)) {
            $insertCols[] = 'role';
            $insertVals[] = 'admin';
            $placeholders[] = '?';
        }

        $sql = "INSERT INTO users (" . implode(', ', $insertCols) . ") VALUES (" . implode(', ', $placeholders) . ")";
        echo "<p>SQL: $sql</p>";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($insertVals);
        echo "<p style='color:green'>✓ Admin user created!</p>";
    }

    echo "<hr>";
    echo "<h2 style='color:green'>SUCCESS!</h2>";
    echo "<p><strong>Email:</strong> $adminEmail</p>";
    echo "<p><strong>Password:</strong> $adminPassword</p>";
    echo "<hr>";
    echo "<p style='color:red; font-weight:bold'>⚠️ DELETE THIS FILE NOW!</p>";

} catch (Exception $e) {
    echo "<p style='color:red'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
