-- ============================================================
-- Gantt Project Manager - Update Users to Match Frontend
-- Version: v77
-- Build: 2026-02-20
-- Run this to sync database users with frontend DEMO_USERS
-- Compatible with MySQL 5.7+ / MariaDB 10.2+
-- ============================================================

USE `oasiscapfin_gantt_project_manager`;

-- Update existing users (IDs 1, 2, 3)
UPDATE `users` SET
    `username` = 'admin',
    `email` = 'admin@oasiscapitalfinance.com',
    `full_name` = 'Admin User',
    `role` = 'admin'
WHERE `id` = 1;

UPDATE `users` SET
    `username` = 'sarah.johnson',
    `email` = 'sarah@oasiscapitalfinance.com',
    `full_name` = 'Sarah Johnson',
    `role` = 'manager'
WHERE `id` = 2;

UPDATE `users` SET
    `username` = 'michael.chen',
    `email` = 'michael@oasiscapitalfinance.com',
    `full_name` = 'Michael Chen',
    `role` = 'manager'
WHERE `id` = 3;

-- Ensure client users exist (IDs 101, 102, 103)
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`)
VALUES
(101, 'acme_corp', 'contact@acmecorp.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Acme Corporation', 'client', 1),
(102, 'global_invest', 'info@globalinvest.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Global Investments Ltd', 'client', 1),
(103, 'tech_ventures', 'hello@techventures.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Tech Ventures Inc', 'client', 1)
ON DUPLICATE KEY UPDATE
    `username` = VALUES(`username`),
    `email` = VALUES(`email`),
    `full_name` = VALUES(`full_name`),
    `role` = VALUES(`role`);

-- Verify the changes
SELECT `id`, `username`, `email`, `full_name`, `role` FROM `users` ORDER BY `id`;
