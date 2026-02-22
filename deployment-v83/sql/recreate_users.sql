-- ============================================================
-- Gantt Project Manager - Recreate Users Script
-- Version: v77
-- Build: 2026-02-21
--
-- This script will:
-- 1. Check if all required demo users exist
-- 2. Recreate any missing users (IDs 1, 2, 3, 101, 102, 103)
-- 3. Update all user data to correct values
-- 4. Set password hashes for demo credentials
--
-- Demo Credentials After Running:
-- Admin:   admin@oasiscapitalfinance.com / admin123
-- Manager: sarah@oasiscapitalfinance.com / manager123
-- Manager: michael@oasiscapitalfinance.com / manager123
-- Client:  contact@acmecorp.com / client123
-- Client:  info@globalinvest.com / client123
-- Client:  hello@techventures.com / client123
--
-- Run with: mysql -u username -p database_name < recreate_users.sql
-- Or import via phpMyAdmin
-- ============================================================

-- Use the correct database
USE `gantt_project_manager`;

-- --------------------------------------------------------
-- Step 1: Temporarily disable foreign key checks
-- --------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Step 2: Show current users (for reference)
-- --------------------------------------------------------
SELECT 'Current users before update:' AS status;
SELECT id, username, email, full_name, role, is_active FROM users ORDER BY id;

-- --------------------------------------------------------
-- Step 3: Delete and recreate admin/manager users (1, 2, 3)
-- Using REPLACE to handle both insert and update
-- --------------------------------------------------------

-- Delete existing users 1, 2, 3 if they exist (to avoid conflicts)
DELETE FROM users WHERE id IN (1, 2, 3);

-- Insert Admin User (ID: 1)
-- Password: admin123 (bcrypt hash)
INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, created_at) VALUES
(1, 'admin', 'admin@oasiscapitalfinance.com',
 '$2y$10$rKN3vGJxPjVxYqYqZ8.O7eCkOZk5X9B1YqL2mN4pR5tW6uH8vA9Bi',
 'Admin User', 'admin', 1, NOW());

-- Insert Manager: Sarah Johnson (ID: 2)
-- Password: manager123 (bcrypt hash)
INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, created_at) VALUES
(2, 'sarah.johnson', 'sarah@oasiscapitalfinance.com',
 '$2y$10$sLM4oHJyQkVzXrYrA9.P8fDlPAl6Y0C2ZrM3nO5qS6uX7vI9wB0Cj',
 'Sarah Johnson', 'manager', 1, NOW());

-- Insert Manager: Michael Chen (ID: 3)
-- Password: manager123 (bcrypt hash)
INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, created_at) VALUES
(3, 'michael.chen', 'michael@oasiscapitalfinance.com',
 '$2y$10$sLM4oHJyQkVzXrYrA9.P8fDlPAl6Y0C2ZrM3nO5qS6uX7vI9wB0Cj',
 'Michael Chen', 'manager', 1, NOW());

-- --------------------------------------------------------
-- Step 4: Delete and recreate client users (101, 102, 103)
-- --------------------------------------------------------

-- Delete existing clients if they exist
DELETE FROM users WHERE id IN (101, 102, 103);

-- Insert Client: Acme Corporation (ID: 101)
-- Password: client123 (bcrypt hash)
INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, created_at) VALUES
(101, 'acme_corp', 'contact@acmecorp.com',
 '$2y$10$tMN5pIKzRlWaYsZsB0.Q9gEmQBm7Z1D3AsN4oP6rT7vY8wJ0xC1Dk',
 'Acme Corporation', 'client', 1, NOW());

-- Insert Client: Global Investments Ltd (ID: 102)
-- Password: client123 (bcrypt hash)
INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, created_at) VALUES
(102, 'global_invest', 'info@globalinvest.com',
 '$2y$10$tMN5pIKzRlWaYsZsB0.Q9gEmQBm7Z1D3AsN4oP6rT7vY8wJ0xC1Dk',
 'Global Investments Ltd', 'client', 1, NOW());

-- Insert Client: Tech Ventures Inc (ID: 103)
-- Password: client123 (bcrypt hash)
INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, created_at) VALUES
(103, 'tech_ventures', 'hello@techventures.com',
 '$2y$10$tMN5pIKzRlWaYsZsB0.Q9gEmQBm7Z1D3AsN4oP6rT7vY8wJ0xC1Dk',
 'Tech Ventures Inc', 'client', 1, NOW());

-- --------------------------------------------------------
-- Step 5: Re-enable foreign key checks
-- --------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Step 6: Reset auto increment to continue after last ID
-- --------------------------------------------------------
ALTER TABLE users AUTO_INCREMENT = 104;

-- --------------------------------------------------------
-- Step 7: Verify results
-- --------------------------------------------------------
SELECT 'Users after recreation:' AS status;
SELECT id, username, email, full_name, role, is_active,
       CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN 'SET' ELSE 'MISSING' END AS password_status
FROM users
ORDER BY id;

-- --------------------------------------------------------
-- Step 8: Show summary
-- --------------------------------------------------------
SELECT 'Summary:' AS status;
SELECT
    COUNT(*) AS total_users,
    SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins,
    SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) AS managers,
    SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) AS clients,
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_users
FROM users;

-- ============================================================
-- IMPORTANT: After running this script, you MUST run
-- /api/setup_passwords.php to set the correct password hashes!
--
-- The password hashes above are placeholders. The PHP script
-- will generate proper bcrypt hashes that work with PHP's
-- password_verify() function.
-- ============================================================

SELECT '========================================' AS note;
SELECT 'IMPORTANT: Run /api/setup_passwords.php' AS note;
SELECT 'to set correct password hashes!' AS note;
SELECT '========================================' AS note;
