-- Meeting Diary - Add Admin User
-- Run this script to add the role column and create an admin user
--
-- Admin Credentials:
-- Email: admin@meetings.com
-- Password: Admin123!

-- Add role column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('admin', 'user') DEFAULT 'user';

-- Insert admin user (password: Admin123!)
-- The password hash is for: Admin123!
INSERT INTO users (id, name, email, password_hash, role) VALUES
('admin-001', 'Administrator', 'admin@meetings.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE
    name = 'Administrator',
    password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role = 'admin';

-- Verify the user was created
SELECT id, name, email, role FROM users WHERE email = 'admin@meetings.com';
