-- ============================================================
-- Gantt Project Manager - Portal Features Migration
-- Version: v97
-- Build: 2026-02-21
--
-- This script adds tables for:
-- 1. Document Library
-- 2. Team/Deal Contacts
-- 3. Diary/Calendar Events
--
-- SAFE TO RUN: Uses IF NOT EXISTS and doesn't modify existing tables
-- Run this AFTER the base schema (schema.sql, seed.sql, templates_schema.sql)
--
-- Usage:
-- mysql -u username -p database_name < v97_portal_features.sql
-- ============================================================

-- Use the correct database
USE `gantt_project_manager`;

-- ============================================================
-- 1. DOCUMENT LIBRARY TABLES
-- ============================================================

-- Document categories/folders
CREATE TABLE IF NOT EXISTS `document_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `icon` VARCHAR(50) DEFAULT 'file',
    `color` VARCHAR(20) DEFAULT '#6b7280',
    `sort_order` INT DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documents table
CREATE TABLE IF NOT EXISTS `documents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_id` INT NULL,
    `category_id` INT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_type` VARCHAR(50) NOT NULL,
    `file_size` BIGINT DEFAULT 0,
    `mime_type` VARCHAR(100),
    `version` VARCHAR(20) DEFAULT '1.0',
    `is_latest_version` TINYINT(1) DEFAULT 1,
    `parent_document_id` INT NULL COMMENT 'For version history - links to original document',
    `uploaded_by` INT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `is_confidential` TINYINT(1) DEFAULT 0,
    `download_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_project` (`project_id`),
    INDEX `idx_category` (`category_id`),
    INDEX `idx_uploaded_by` (`uploaded_by`),
    INDEX `idx_file_type` (`file_type`),
    CONSTRAINT `fk_doc_project` FOREIGN KEY (`project_id`)
        REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_doc_category` FOREIGN KEY (`category_id`)
        REFERENCES `document_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_doc_uploader` FOREIGN KEY (`uploaded_by`)
        REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_doc_parent` FOREIGN KEY (`parent_document_id`)
        REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document access log (for tracking downloads/views)
CREATE TABLE IF NOT EXISTS `document_access_log` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `document_id` INT NOT NULL,
    `user_id` INT NULL,
    `action` ENUM('view', 'download', 'share') NOT NULL DEFAULT 'view',
    `ip_address` VARCHAR(45),
    `user_agent` VARCHAR(500),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_document` (`document_id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_action` (`action`),
    CONSTRAINT `fk_doclog_document` FOREIGN KEY (`document_id`)
        REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_doclog_user` FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. TEAM/DEAL CONTACTS TABLES
-- ============================================================

-- Contact categories (OCF Team, Legal, Advisors, Client, etc.)
CREATE TABLE IF NOT EXISTS `contact_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `color` VARCHAR(20) DEFAULT '#14b8a6',
    `sort_order` INT DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team contacts (can be linked to projects or global)
CREATE TABLE IF NOT EXISTS `team_contacts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_id` INT NULL COMMENT 'NULL = global contact, available to all projects',
    `category_id` INT NULL,
    `user_id` INT NULL COMMENT 'Link to existing user if applicable',
    `name` VARCHAR(255) NOT NULL,
    `role` VARCHAR(255),
    `company` VARCHAR(255),
    `email` VARCHAR(255),
    `phone` VARCHAR(50),
    `mobile` VARCHAR(50),
    `location` VARCHAR(255),
    `linkedin_url` VARCHAR(500),
    `avatar_url` VARCHAR(500),
    `notes` TEXT,
    `is_primary` TINYINT(1) DEFAULT 0 COMMENT 'Primary contact for the category',
    `is_active` TINYINT(1) DEFAULT 1,
    `sort_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_project` (`project_id`),
    INDEX `idx_category` (`category_id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_company` (`company`),
    CONSTRAINT `fk_contact_project` FOREIGN KEY (`project_id`)
        REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_contact_category` FOREIGN KEY (`category_id`)
        REFERENCES `contact_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_contact_user` FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. DIARY/CALENDAR EVENTS TABLES
-- ============================================================

-- Event types
CREATE TABLE IF NOT EXISTS `event_types` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `color` VARCHAR(20) DEFAULT '#14b8a6',
    `icon` VARCHAR(50) DEFAULT 'calendar',
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Calendar events
CREATE TABLE IF NOT EXISTS `diary_events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_id` INT NULL,
    `event_type_id` INT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `event_date` DATE NOT NULL,
    `start_time` TIME NULL,
    `end_time` TIME NULL,
    `is_all_day` TINYINT(1) DEFAULT 0,
    `location` VARCHAR(500),
    `meeting_url` VARCHAR(500) COMMENT 'Zoom/Teams link',
    `is_recurring` TINYINT(1) DEFAULT 0,
    `recurrence_rule` VARCHAR(255) COMMENT 'RRULE format for recurring events',
    `reminder_minutes` INT DEFAULT 15 COMMENT 'Minutes before to send reminder',
    `created_by` INT NULL,
    `is_private` TINYINT(1) DEFAULT 0 COMMENT 'Only visible to creator',
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_project` (`project_id`),
    INDEX `idx_event_type` (`event_type_id`),
    INDEX `idx_event_date` (`event_date`),
    INDEX `idx_created_by` (`created_by`),
    CONSTRAINT `fk_event_project` FOREIGN KEY (`project_id`)
        REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_event_type` FOREIGN KEY (`event_type_id`)
        REFERENCES `event_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_event_creator` FOREIGN KEY (`created_by`)
        REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event attendees
CREATE TABLE IF NOT EXISTS `event_attendees` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `event_id` INT NOT NULL,
    `user_id` INT NULL COMMENT 'Link to user if internal',
    `contact_id` INT NULL COMMENT 'Link to team_contact if external',
    `name` VARCHAR(255) COMMENT 'Name if not linked to user/contact',
    `email` VARCHAR(255),
    `status` ENUM('pending', 'accepted', 'declined', 'tentative') DEFAULT 'pending',
    `responded_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_event` (`event_id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_contact` (`contact_id`),
    CONSTRAINT `fk_attendee_event` FOREIGN KEY (`event_id`)
        REFERENCES `diary_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_attendee_user` FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_attendee_contact` FOREIGN KEY (`contact_id`)
        REFERENCES `team_contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. SEED DATA - DOCUMENT CATEGORIES
-- ============================================================

INSERT INTO `document_categories` (`name`, `slug`, `description`, `icon`, `color`, `sort_order`) VALUES
('Legal', 'legal', 'Legal documents, contracts, and agreements', 'file-text', '#ef4444', 1),
('Financial', 'financial', 'Financial statements, reports, and projections', 'file-spreadsheet', '#22c55e', 2),
('Due Diligence', 'due-diligence', 'Due diligence documentation and checklists', 'file-check', '#3b82f6', 3),
('Marketing', 'marketing', 'Presentations, pitch decks, and marketing materials', 'presentation', '#f59e0b', 4),
('Contracts', 'contracts', 'Signed contracts and agreements', 'file-signature', '#8b5cf6', 5),
('Compliance', 'compliance', 'Regulatory and compliance documents', 'shield', '#06b6d4', 6),
('Reports', 'reports', 'Analysis reports and research documents', 'file-bar-chart', '#ec4899', 7),
('Correspondence', 'correspondence', 'Emails, letters, and communications', 'mail', '#6b7280', 8)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);

-- ============================================================
-- 5. SEED DATA - CONTACT CATEGORIES
-- ============================================================

INSERT INTO `contact_categories` (`name`, `slug`, `description`, `color`, `sort_order`) VALUES
('OCF Team', 'ocf', 'Oasis Capital Finance internal team members', '#14b8a6', 1),
('Legal', 'legal', 'Legal counsel and advisors', '#3b82f6', 2),
('Advisors', 'advisors', 'External advisors and consultants', '#8b5cf6', 3),
('Client Team', 'client', 'Client company representatives', '#f59e0b', 4),
('Investors', 'investors', 'Potential and confirmed investors', '#22c55e', 5),
('Regulators', 'regulators', 'Regulatory body contacts', '#ef4444', 6)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);

-- ============================================================
-- 6. SEED DATA - EVENT TYPES
-- ============================================================

INSERT INTO `event_types` (`name`, `slug`, `color`, `icon`) VALUES
('Meeting', 'meeting', '#14b8a6', 'users'),
('Call', 'call', '#3b82f6', 'phone'),
('Deadline', 'deadline', '#ef4444', 'clock'),
('Reminder', 'reminder', '#f59e0b', 'bell'),
('Milestone', 'milestone', '#8b5cf6', 'flag'),
('Presentation', 'presentation', '#ec4899', 'presentation'),
('Review', 'review', '#06b6d4', 'eye'),
('Travel', 'travel', '#6b7280', 'plane')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `color` = VALUES(`color`);

-- ============================================================
-- 7. SAMPLE DOCUMENTS (for demo)
-- ============================================================

INSERT INTO `documents` (`project_id`, `category_id`, `name`, `description`, `file_name`, `file_path`, `file_type`, `file_size`, `mime_type`, `version`, `uploaded_by`) VALUES
(1, 1, 'Bond Prospectus Draft v2.3', 'Draft prospectus for the Nordic bond issuance', 'bond-prospectus-v2.3.pdf', '/documents/legal/bond-prospectus-v2.3.pdf', 'pdf', 2516582, 'application/pdf', '2.3', 2),
(1, 2, 'Financial Statements Q4 2025', 'Audited financial statements for Q4 2025', 'financial-statements-q4-2025.xlsx', '/documents/financial/financial-statements-q4-2025.xlsx', 'xlsx', 1887436, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '1.0', 3),
(1, 3, 'Due Diligence Checklist', 'Comprehensive due diligence checklist and tracker', 'due-diligence-checklist.pdf', '/documents/due-diligence/due-diligence-checklist.pdf', 'pdf', 466944, 'application/pdf', '3.1', 1),
(1, 4, 'Investor Presentation', 'Presentation deck for investor roadshow', 'investor-presentation.pptx', '/documents/marketing/investor-presentation.pptx', 'pptx', 8598323, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '1.2', 2),
(1, 5, 'Term Sheet - Final', 'Final agreed term sheet', 'term-sheet-final.pdf', '/documents/contracts/term-sheet-final.pdf', 'pdf', 911360, 'application/pdf', '1.0', 1),
(1, 2, 'Credit Rating Application', 'Application documentation for credit rating', 'credit-rating-application.pdf', '/documents/financial/credit-rating-application.pdf', 'pdf', 3250585, 'application/pdf', '1.0', 3),
(1, 1, 'Legal Opinion Letter', 'Legal opinion from counsel', 'legal-opinion-letter.docx', '/documents/legal/legal-opinion-letter.docx', 'docx', 250880, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '1.0', 2),
(1, 3, 'KYC Documentation Pack', 'Know Your Customer documentation package', 'kyc-documentation-pack.pdf', '/documents/due-diligence/kyc-documentation-pack.pdf', 'pdf', 5872025, 'application/pdf', '2.0', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================================
-- 8. SAMPLE TEAM CONTACTS (for demo)
-- ============================================================

INSERT INTO `team_contacts` (`project_id`, `category_id`, `name`, `role`, `company`, `email`, `phone`, `mobile`, `location`, `linkedin_url`, `is_primary`, `sort_order`) VALUES
-- OCF Team
(NULL, 1, 'Sarah Johnson', 'Deal Manager', 'Oasis Capital Finance', 'sarah@oasiscapitalfinance.com', '+44 20 7123 4567', '+44 7700 900123', 'London, UK', 'linkedin.com/in/sarahjohnson', 1, 1),
(NULL, 1, 'Michael Chen', 'Senior Analyst', 'Oasis Capital Finance', 'michael@oasiscapitalfinance.com', '+44 20 7123 4568', '+44 7700 900124', 'London, UK', 'linkedin.com/in/michaelchen', 0, 2),
(NULL, 1, 'Emma Williams', 'Associate', 'Oasis Capital Finance', 'emma@oasiscapitalfinance.com', '+44 20 7123 4569', NULL, 'London, UK', NULL, 0, 3),
-- Legal
(NULL, 2, 'James Morrison', 'Partner - Capital Markets', 'Linklaters LLP', 'j.morrison@linklaters.com', '+44 20 7456 7890', NULL, 'London, UK', 'linkedin.com/in/jamesmorrison', 1, 1),
(NULL, 2, 'Anna Schmidt', 'Senior Associate', 'Linklaters LLP', 'a.schmidt@linklaters.com', '+44 20 7456 7891', NULL, 'London, UK', NULL, 0, 2),
-- Advisors
(NULL, 3, 'Robert Anderson', 'Credit Rating Analyst', 'Moody''s Investors Service', 'r.anderson@moodys.com', '+44 20 7789 0123', NULL, 'London, UK', NULL, 1, 1),
(NULL, 3, 'Lisa Tanaka', 'Tax Advisor', 'PricewaterhouseCoopers', 'l.tanaka@pwc.com', '+44 20 7890 1234', NULL, 'London, UK', NULL, 0, 2),
-- Client Team
(1, 4, 'Henrik Larsson', 'CFO', 'Acme Corporation', 'h.larsson@acmecorp.com', '+46 8 123 4567', NULL, 'Stockholm, Sweden', NULL, 1, 1),
(1, 4, 'Maria Svensson', 'Treasury Manager', 'Acme Corporation', 'm.svensson@acmecorp.com', '+46 8 123 4568', NULL, 'Stockholm, Sweden', NULL, 0, 2)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================================
-- 9. SAMPLE DIARY EVENTS (for demo)
-- ============================================================

INSERT INTO `diary_events` (`project_id`, `event_type_id`, `title`, `description`, `event_date`, `start_time`, `end_time`, `location`, `created_by`) VALUES
(1, 1, 'Deal Team Weekly Sync', 'Weekly sync with the full deal team to review progress', '2026-02-21', '10:00:00', '11:00:00', 'Zoom', 2),
(1, 2, 'Credit Rating Call', 'Call with Moody''s regarding credit rating application', '2026-02-21', '14:00:00', '15:00:00', NULL, 2),
(1, 1, 'Legal Documentation Review', 'Review session for legal documentation with counsel', '2026-02-22', '09:00:00', '12:00:00', 'Linklaters Office, London', 2),
(1, 3, 'Term Sheet Deadline', 'Final term sheet to be completed', '2026-02-24', '17:00:00', NULL, NULL, 1),
(1, 1, 'Investor Presentation Review', 'Internal review of investor presentation materials', '2026-02-25', '11:00:00', '12:30:00', 'OCF Conference Room', 2),
(1, 5, 'Roadshow Kickoff', 'Start of global investor roadshow', '2026-03-01', '09:00:00', NULL, NULL, 1),
(1, 2, 'Board Update Call', 'Update call with client board members', '2026-02-27', '15:00:00', '16:00:00', NULL, 2),
(1, 4, 'Due Diligence Reminder', 'Follow up on outstanding due diligence items', '2026-02-23', '09:00:00', NULL, NULL, 1),
(1, 6, 'Investor Presentation - London', 'Presentation to London-based investors', '2026-03-02', '10:00:00', '16:00:00', 'The Shard, London', 2),
(1, 6, 'Investor Presentation - Frankfurt', 'Presentation to German investors', '2026-03-03', '09:00:00', '17:00:00', 'Deutsche Bank HQ, Frankfurt', 2)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- ============================================================
-- 10. SAMPLE EVENT ATTENDEES
-- ============================================================

INSERT INTO `event_attendees` (`event_id`, `user_id`, `name`, `email`, `status`)
SELECT e.id, 2, 'Sarah Johnson', 'sarah@oasiscapitalfinance.com', 'accepted'
FROM `diary_events` e WHERE e.title = 'Deal Team Weekly Sync' LIMIT 1
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

INSERT INTO `event_attendees` (`event_id`, `user_id`, `name`, `email`, `status`)
SELECT e.id, 3, 'Michael Chen', 'michael@oasiscapitalfinance.com', 'accepted'
FROM `diary_events` e WHERE e.title = 'Deal Team Weekly Sync' LIMIT 1
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- ============================================================
-- 11. UPDATE VERSION TRACKING
-- ============================================================

-- Add portal_version to track which portal features are installed
CREATE TABLE IF NOT EXISTS `system_settings` (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` TEXT,
    `description` VARCHAR(255),
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `system_settings` (`key`, `value`, `description`) VALUES
('portal_version', 'v97', 'Client Portal version'),
('portal_features', 'documents,contacts,diary,dashboard,timeline,admin', 'Enabled portal features'),
('portal_installed_at', NOW(), 'Portal features installation date'),
('portal_build_date', '2026-02-21', 'Portal build date')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW();

-- Force update portal_version to v97
UPDATE `system_settings` SET `value` = 'v97', `updated_at` = NOW() WHERE `key` = 'portal_version';
UPDATE `system_settings` SET `value` = '2026-02-21', `updated_at` = NOW() WHERE `key` = 'portal_build_date';
UPDATE `system_settings` SET `value` = 'documents,contacts,diary,dashboard,timeline,admin', `updated_at` = NOW() WHERE `key` = 'portal_features';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

SELECT '=== Portal Features Installation Summary ===' AS status;

SELECT 'Document Categories' AS feature, COUNT(*) AS count FROM `document_categories`
UNION ALL
SELECT 'Documents', COUNT(*) FROM `documents`
UNION ALL
SELECT 'Contact Categories', COUNT(*) FROM `contact_categories`
UNION ALL
SELECT 'Team Contacts', COUNT(*) FROM `team_contacts`
UNION ALL
SELECT 'Event Types', COUNT(*) FROM `event_types`
UNION ALL
SELECT 'Diary Events', COUNT(*) FROM `diary_events`;

SELECT '=== Installation Complete ===' AS status;
SELECT 'Portal v97 features installed successfully!' AS message;
SELECT 'Tables created: document_categories, documents, document_access_log,' AS tables_1;
SELECT 'contact_categories, team_contacts, event_types, diary_events, event_attendees' AS tables_2;

-- ============================================================
-- v97 CHANGELOG
-- ============================================================
-- v97 Changes:
-- - Fixed Allocate to Client page error (empty value in Select component)
-- - Updated all file version tags to v97
-- - Updated system_settings portal_version to v97
-- - Added 'admin' to portal_features list
-- ============================================================

-- ============================================================
-- END OF MIGRATION SCRIPT
-- ============================================================
