<?php
/**
 * Meeting Diary - Admin Password Reset Script
 *
 * Upload this file to your server and run it once to set the admin password.
 * DELETE THIS FILE AFTER USE for security!
 */

// Database Configuration
$dbHost = 'localhost';
$dbName = 'oasiscapi_meetings';
$dbUser = 'oasiscapi_oasistravel';
$dbPass = 'C1nd3r3ll4!$';

// Admin credentials to set
$adminEmail = 'admin@meetings.com';
$adminPassword = 'Admin123!';
$adminName = 'Administrator';

echo "<h1>Meeting Diary - Admin Password Reset</h1>";

try {
    // Connect to database
    $pdo = new PDO(
        "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "<p style='color:green'>✓ Database connection successful</p>";

    // Check if users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() == 0) {
        // Create users table
        echo "<p>Creating users table...</p>";
        $pdo->exec("
            CREATE TABLE users (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) DEFAULT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_users_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        echo "<p style='color:green'>✓ Users table created</p>";
    } else {
        // Check if required columns exist
        $columns = [];
        $stmt = $pdo->query("DESCRIBE users");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $columns[] = $row['Field'];
        }
        echo "<p>Existing columns: " . implode(', ', $columns) . "</p>";

        // Add missing columns
        if (!in_array('name', $columns)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'User'");
            echo "<p style='color:green'>✓ Added 'name' column</p>";
        }
        if (!in_array('password_hash', $columns)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL");
            echo "<p style='color:green'>✓ Added 'password_hash' column</p>";
        }
        if (!in_array('role', $columns)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN role ENUM('admin', 'user') DEFAULT 'user'");
            echo "<p style='color:green'>✓ Added 'role' column</p>";
        }
        if (!in_array('email', $columns)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT ''");
            $pdo->exec("ALTER TABLE users ADD UNIQUE INDEX idx_users_email (email)");
            echo "<p style='color:green'>✓ Added 'email' column</p>";
        }
    }

    // Generate password hash
    $passwordHash = password_hash($adminPassword, PASSWORD_DEFAULT);
    echo "<p>Generated password hash for '$adminPassword'</p>";

    // Check if admin user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$adminEmail]);
    $existingUser = $stmt->fetch();

    if ($existingUser) {
        // Update existing user
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, name = ?, role = 'admin' WHERE email = ?");
        $stmt->execute([$passwordHash, $adminName, $adminEmail]);
        echo "<p style='color:green'>✓ Admin user password updated!</p>";
    } else {
        // Create new admin user
        $id = uniqid() . '-' . bin2hex(random_bytes(4));
        $stmt = $pdo->prepare("
            INSERT INTO users (id, name, email, password_hash, role)
            VALUES (?, ?, ?, ?, 'admin')
        ");
        $stmt->execute([$id, $adminName, $adminEmail, $passwordHash]);
        echo "<p style='color:green'>✓ Admin user created!</p>";
    }

    echo "<hr>";
    echo "<h2>Login Credentials</h2>";
    echo "<p><strong>Email:</strong> $adminEmail</p>";
    echo "<p><strong>Password:</strong> $adminPassword</p>";
    echo "<hr>";
    echo "<p style='color:red; font-weight:bold'>⚠️ DELETE THIS FILE NOW for security!</p>";
    echo "<p>Delete: reset_admin_password.php</p>";

} catch (PDOException $e) {
    echo "<p style='color:red'>✗ Database Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Please check your database credentials in this file.</p>";
}
?>
