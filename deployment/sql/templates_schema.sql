-- ============================================================
-- Gantt Project Manager - Templates Schema
-- Version: v108
-- Build: 2026-02-20
-- Compatible with MySQL 5.7+ / MariaDB 10.2+
-- Creates tables for project and task templates
-- ============================================================

USE `oasiscapfin_gantt_project_manager`;

-- --------------------------------------------------------
-- Table structure for table `project_templates`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `project_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `project_type` varchar(50) NOT NULL COMMENT 'Type category: e.g., bond_issuance, equity_raise, merger',
  `color` varchar(7) NOT NULL DEFAULT '#14b8a6',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_type` (`project_type`),
  KEY `is_active` (`is_active`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `project_templates_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `task_templates`
-- Stores days_from_start instead of actual dates
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `task_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) NOT NULL COMMENT 'Reference to project_templates',
  `parent_template_task_id` int(11) DEFAULT NULL COMMENT 'For subtasks within template',
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `days_from_start` int(11) NOT NULL DEFAULT 0 COMMENT 'Days from project start date',
  `duration_days` int(11) NOT NULL DEFAULT 1 COMMENT 'Task duration in days',
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `is_milestone` tinyint(1) NOT NULL DEFAULT 0,
  `task_order` int(11) NOT NULL DEFAULT 0,
  `color` varchar(7) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  KEY `parent_template_task_id` (`parent_template_task_id`),
  KEY `task_order` (`task_order`),
  CONSTRAINT `task_templates_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `project_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_templates_ibfk_2` FOREIGN KEY (`parent_template_task_id`) REFERENCES `task_templates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `task_template_dependencies`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `task_template_dependencies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_template_id` int(11) NOT NULL,
  `depends_on_template_task_id` int(11) NOT NULL,
  `dependency_type` enum('finish-to-start','start-to-start','finish-to-finish','start-to-finish') NOT NULL DEFAULT 'finish-to-start',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_template_dependency` (`task_template_id`, `depends_on_template_task_id`),
  KEY `task_template_id` (`task_template_id`),
  KEY `depends_on_template_task_id` (`depends_on_template_task_id`),
  CONSTRAINT `task_template_deps_ibfk_1` FOREIGN KEY (`task_template_id`) REFERENCES `task_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_template_deps_ibfk_2` FOREIGN KEY (`depends_on_template_task_id`) REFERENCES `task_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Insert default Bond Issuance template (based on existing project 1 tasks)
-- --------------------------------------------------------

INSERT INTO `project_templates` (`id`, `name`, `description`, `project_type`, `color`, `is_active`) VALUES
(1, 'Bond Issuance', 'Standard bond issuance process with all required phases', 'bond_issuance', '#14b8a6', 1),
(2, 'Equity Raise', 'Standard equity fundraising process', 'equity_raise', '#f97316', 1),
(3, 'Merger & Acquisition', 'M&A due diligence and integration process', 'merger_acquisition', '#8b5cf6', 1);

-- Bond Issuance template tasks (29 tasks based on existing template)
-- Using days_from_start and duration_days for relative positioning

INSERT INTO `task_templates` (`id`, `template_id`, `name`, `description`, `days_from_start`, `duration_days`, `priority`, `is_milestone`, `task_order`) VALUES
-- Phase 1: Pre-Issuance (Days 0-30)
(1, 1, 'Project Kickoff Meeting', 'Initial meeting to define scope and timeline', 0, 1, 'high', 1, 1),
(2, 1, 'Due Diligence Documentation', 'Gather all required documentation', 1, 14, 'high', 0, 2),
(3, 1, 'Financial Statements Review', 'Review and audit financial statements', 1, 10, 'high', 0, 3),
(4, 1, 'Legal Structure Analysis', 'Analyze corporate legal structure', 3, 7, 'medium', 0, 4),
(5, 1, 'Credit Rating Application', 'Submit application to rating agencies', 8, 5, 'high', 0, 5),
(6, 1, 'Market Analysis', 'Analyze current market conditions', 5, 10, 'medium', 0, 6),
(7, 1, 'Pre-Issuance Review Complete', 'All pre-issuance work completed', 30, 1, 'high', 1, 7),

-- Phase 2: Documentation (Days 31-60)
(8, 1, 'Draft Prospectus', 'Create initial prospectus draft', 31, 14, 'high', 0, 8),
(9, 1, 'Legal Documentation', 'Prepare all legal documents', 31, 21, 'high', 0, 9),
(10, 1, 'Trust Deed Preparation', 'Draft trust deed agreement', 35, 10, 'high', 0, 10),
(11, 1, 'Regulatory Filing Preparation', 'Prepare documents for regulatory filing', 40, 10, 'high', 0, 11),
(12, 1, 'Internal Review', 'Internal review of all documentation', 50, 7, 'medium', 0, 12),
(13, 1, 'Documentation Complete', 'All documentation finalized', 60, 1, 'high', 1, 13),

-- Phase 3: Regulatory Approval (Days 61-90)
(14, 1, 'Submit to Regulatory Authority', 'Submit filing to regulatory body', 61, 1, 'critical', 0, 14),
(15, 1, 'Regulatory Review Period', 'Wait for regulatory review', 62, 21, 'medium', 0, 15),
(16, 1, 'Address Regulatory Comments', 'Respond to any regulatory queries', 75, 10, 'high', 0, 16),
(17, 1, 'Regulatory Approval', 'Receive regulatory approval', 90, 1, 'critical', 1, 17),

-- Phase 4: Marketing (Days 91-110)
(18, 1, 'Investor Presentation Prep', 'Prepare investor presentation materials', 91, 7, 'high', 0, 18),
(19, 1, 'Roadshow Planning', 'Plan investor roadshow schedule', 91, 5, 'medium', 0, 19),
(20, 1, 'Investor Roadshow', 'Conduct investor roadshow', 98, 10, 'high', 0, 20),
(21, 1, 'Book Building', 'Collect investor interest', 100, 7, 'high', 0, 21),
(22, 1, 'Marketing Complete', 'Marketing phase finalized', 110, 1, 'high', 1, 22),

-- Phase 5: Pricing & Settlement (Days 111-120)
(23, 1, 'Final Pricing', 'Determine final bond pricing', 111, 1, 'critical', 0, 23),
(24, 1, 'Allocation', 'Allocate bonds to investors', 112, 2, 'high', 0, 24),
(25, 1, 'Settlement Preparation', 'Prepare for settlement', 114, 3, 'high', 0, 25),
(26, 1, 'Settlement Date', 'Complete bond settlement', 117, 1, 'critical', 1, 26),

-- Phase 6: Post-Issuance (Days 118-130)
(27, 1, 'Listing Application', 'Apply for exchange listing', 118, 5, 'medium', 0, 27),
(28, 1, 'Post-Issuance Reporting', 'Complete post-issuance reports', 120, 7, 'medium', 0, 28),
(29, 1, 'Project Close', 'Final project closure', 130, 1, 'high', 1, 29);

-- Equity Raise template tasks (simplified)
INSERT INTO `task_templates` (`id`, `template_id`, `name`, `description`, `days_from_start`, `duration_days`, `priority`, `is_milestone`, `task_order`) VALUES
(30, 2, 'Project Kickoff', 'Initial kickoff meeting', 0, 1, 'high', 1, 1),
(31, 2, 'Investor Identification', 'Identify potential investors', 1, 14, 'high', 0, 2),
(32, 2, 'Pitch Deck Creation', 'Create investor pitch deck', 1, 10, 'high', 0, 3),
(33, 2, 'Due Diligence Prep', 'Prepare due diligence materials', 5, 14, 'high', 0, 4),
(34, 2, 'Investor Meetings', 'Conduct investor meetings', 15, 21, 'high', 0, 5),
(35, 2, 'Term Sheet Negotiation', 'Negotiate term sheets', 30, 14, 'high', 0, 6),
(36, 2, 'Legal Documentation', 'Finalize legal documents', 40, 14, 'high', 0, 7),
(37, 2, 'Closing', 'Close the fundraising round', 55, 5, 'critical', 1, 8);

-- M&A template tasks (simplified)
INSERT INTO `task_templates` (`id`, `template_id`, `name`, `description`, `days_from_start`, `duration_days`, `priority`, `is_milestone`, `task_order`) VALUES
(38, 3, 'LOI Signed', 'Letter of Intent signed', 0, 1, 'critical', 1, 1),
(39, 3, 'Due Diligence Planning', 'Plan due diligence process', 1, 5, 'high', 0, 2),
(40, 3, 'Financial Due Diligence', 'Review financial records', 6, 21, 'high', 0, 3),
(41, 3, 'Legal Due Diligence', 'Review legal matters', 6, 21, 'high', 0, 4),
(42, 3, 'Operational Due Diligence', 'Review operations', 10, 14, 'medium', 0, 5),
(43, 3, 'Valuation Analysis', 'Determine final valuation', 25, 7, 'high', 0, 6),
(44, 3, 'Purchase Agreement Draft', 'Draft purchase agreement', 30, 14, 'high', 0, 7),
(45, 3, 'Regulatory Approvals', 'Obtain required approvals', 40, 30, 'high', 0, 8),
(46, 3, 'Closing', 'Complete transaction closing', 70, 1, 'critical', 1, 9),
(47, 3, 'Integration Planning', 'Plan post-merger integration', 71, 14, 'high', 0, 10);

-- Add dependencies for Bond Issuance template
INSERT INTO `task_template_dependencies` (`task_template_id`, `depends_on_template_task_id`, `dependency_type`) VALUES
(7, 2, 'finish-to-start'),
(7, 3, 'finish-to-start'),
(7, 5, 'finish-to-start'),
(7, 6, 'finish-to-start'),
(8, 7, 'finish-to-start'),
(9, 7, 'finish-to-start'),
(13, 8, 'finish-to-start'),
(13, 9, 'finish-to-start'),
(13, 12, 'finish-to-start'),
(14, 13, 'finish-to-start'),
(17, 14, 'finish-to-start'),
(17, 16, 'finish-to-start'),
(18, 17, 'finish-to-start'),
(22, 20, 'finish-to-start'),
(22, 21, 'finish-to-start'),
(23, 22, 'finish-to-start'),
(26, 23, 'finish-to-start'),
(26, 24, 'finish-to-start'),
(26, 25, 'finish-to-start'),
(29, 26, 'finish-to-start'),
(29, 28, 'finish-to-start');
