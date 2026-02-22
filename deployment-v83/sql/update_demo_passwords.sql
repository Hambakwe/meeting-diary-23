-- ============================================================
-- Gantt Project Manager - Update Demo User Passwords
-- Version: v77
-- Build: 2026-02-21
--
-- Run this script to set up demo user passwords for testing.
-- These password hashes were generated using PHP's password_hash()
-- ============================================================

USE `gantt_project_manager`;

-- --------------------------------------------------------
-- Update password hashes for demo users
--
-- Demo Credentials:
-- Admin:   admin@oasiscapitalfinance.com / admin123
-- Manager: sarah@oasiscapitalfinance.com / manager123
-- Manager: michael@oasiscapitalfinance.com / manager123
-- Client:  contact@acmecorp.com / client123
-- Client:  info@globalinvest.com / client123
-- Client:  hello@techventures.com / client123
-- --------------------------------------------------------

-- Admin password: admin123
UPDATE `users`
SET `password_hash` = '$2y$10$Ij7fXFjXmVVHJMF5jqjlQOxe5wXWBo8vRmHzQTWt.KPYCXxZB6K2q'
WHERE `email` = 'admin@oasiscapitalfinance.com';

-- Manager passwords: manager123
UPDATE `users`
SET `password_hash` = '$2y$10$8qvyHKmKJmPJzqYF3rCwXeXYZPvRfHJL7mGvGTDpxKLZcw7FCmOPy'
WHERE `email` IN ('sarah@oasiscapitalfinance.com', 'michael@oasiscapitalfinance.com');

-- Client passwords: client123
UPDATE `users`
SET `password_hash` = '$2y$10$4wPTdX5KQpRjxMvZ3rN4NeJrV6vQLzHmUvTKZXYNpLJ8vB9qFRw7.'
WHERE `email` IN ('contact@acmecorp.com', 'info@globalinvest.com', 'hello@techventures.com');

-- Verify updates
SELECT id, username, email, full_name, role,
       CASE WHEN password_hash IS NOT NULL THEN 'SET' ELSE 'MISSING' END as password_status
FROM `users`
ORDER BY id;

-- ============================================================
-- IMPORTANT: In production, change all passwords immediately!
-- Use the admin panel or run custom UPDATE statements with
-- password_hash() generated hashes.
-- ============================================================
