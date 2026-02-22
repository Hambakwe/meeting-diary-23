-- Gantt Project Manager v36 Migration
-- Run this script to upgrade from previous versions to v36
-- Compatible with MySQL 5.7+ / MariaDB 10.2+

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

USE `gantt_project_manager`;

-- --------------------------------------------------------
-- 1. Add 'notes' field to tasks table
-- --------------------------------------------------------

ALTER TABLE `tasks`
ADD COLUMN IF NOT EXISTS `notes` TEXT DEFAULT NULL
AFTER `description`;

-- --------------------------------------------------------
-- 2. Add client allocation to projects table
-- --------------------------------------------------------

ALTER TABLE `projects`
ADD COLUMN IF NOT EXISTS `client_id` INT(11) DEFAULT NULL
AFTER `owner_id`;

ALTER TABLE `projects`
ADD COLUMN IF NOT EXISTS `client_name` VARCHAR(100) DEFAULT NULL
AFTER `client_id`;

-- Add foreign key for client_id (references users table)
-- Note: Only run if the constraint doesn't already exist
ALTER TABLE `projects`
ADD CONSTRAINT `projects_client_fk`
FOREIGN KEY (`client_id`) REFERENCES `users` (`id`)
ON DELETE SET NULL;

-- --------------------------------------------------------
-- 3. Update users table role enum to include 'client'
-- --------------------------------------------------------

ALTER TABLE `users`
MODIFY COLUMN `role` ENUM('admin','manager','member','viewer','client') NOT NULL DEFAULT 'member';

-- --------------------------------------------------------
-- 4. Add user_name field to task_comments for denormalization
-- --------------------------------------------------------

ALTER TABLE `task_comments`
ADD COLUMN IF NOT EXISTS `user_name` VARCHAR(100) DEFAULT NULL
AFTER `user_id`;

-- --------------------------------------------------------
-- 5. Add indexes for better query performance
-- --------------------------------------------------------

-- Index for client projects lookup
ALTER TABLE `projects`
ADD INDEX IF NOT EXISTS `idx_client_id` (`client_id`);

-- Index for task notes search
ALTER TABLE `tasks`
ADD FULLTEXT INDEX IF NOT EXISTS `idx_task_notes` (`notes`);

-- --------------------------------------------------------
-- 6. Insert demo client users (if not exists)
-- --------------------------------------------------------

INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`)
VALUES
(101, 'acme_corp', 'contact@acmecorp.com', '$2y$10$placeholder_hash', 'Acme Corporation', 'client', 1),
(102, 'global_invest', 'info@globalinvest.com', '$2y$10$placeholder_hash', 'Global Investments Ltd', 'client', 1),
(103, 'tech_ventures', 'hello@techventures.com', '$2y$10$placeholder_hash', 'Tech Ventures Inc', 'client', 1);

-- --------------------------------------------------------
-- 7. Update activity_log for new action types
-- --------------------------------------------------------

-- Add comment_id column for comment-related activities
ALTER TABLE `activity_log`
ADD COLUMN IF NOT EXISTS `comment_id` INT(11) DEFAULT NULL
AFTER `task_id`;

COMMIT;

-- --------------------------------------------------------
-- Verification queries (optional - run manually to verify)
-- --------------------------------------------------------
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tasks' AND COLUMN_NAME = 'notes';
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'projects' AND COLUMN_NAME = 'client_id';
-- SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'role';
