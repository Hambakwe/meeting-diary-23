-- ============================================================
-- Gantt Project Manager Seed Data
-- Version: v77
-- Build: 2026-02-20
-- Run this after schema.sql
-- ============================================================

USE `gantt_project_manager`;

-- --------------------------------------------------------
-- Insert demo users (matching frontend DEMO_USERS)
-- Password: password123 (hashed with password_hash)
-- --------------------------------------------------------

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`) VALUES
-- Admin
(1, 'admin', 'admin@oasiscapitalfinance.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin', 1),
-- Managers
(2, 'sarah.johnson', 'sarah@oasiscapitalfinance.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah Johnson', 'manager', 1),
(3, 'michael.chen', 'michael@oasiscapitalfinance.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Michael Chen', 'manager', 1),
-- Clients
(101, 'acme_corp', 'contact@acmecorp.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Acme Corporation', 'client', 1),
(102, 'global_invest', 'info@globalinvest.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Global Investments Ltd', 'client', 1),
(103, 'tech_ventures', 'hello@techventures.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Tech Ventures Inc', 'client', 1);

-- --------------------------------------------------------
-- Insert default project
-- --------------------------------------------------------

INSERT INTO `projects` (`id`, `name`, `description`, `color`, `owner_id`, `client_id`, `client_name`, `is_active`) VALUES
(1, 'OCF Bond Issuance Project', 'Project Timeline & Task Management', '#14b8a6', 1, NULL, NULL, 1);

-- --------------------------------------------------------
-- Insert tasks
-- --------------------------------------------------------

INSERT INTO `tasks` (`id`, `project_id`, `name`, `start_date`, `end_date`, `progress`, `status`, `priority`, `is_milestone`, `task_order`) VALUES
(1, 1, 'Initial Client Meeting', '2026-01-20', '2026-01-20', 100, 'complete', 'high', 0, 1),
(2, 1, 'OCF Client KYC', '2026-01-24', '2026-01-28', 100, 'complete', 'high', 0, 2),
(3, 1, 'Agree & Finalise Mandate', '2026-01-27', '2026-02-03', 100, 'complete', 'high', 0, 3),
(4, 1, 'Project Documents', '2026-02-02', '2026-02-17', 60, 'in-progress', 'high', 0, 4),
(5, 1, 'Team Assembly', '2026-02-03', '2026-02-17', 60, 'in-progress', 'high', 0, 5),
(6, 1, 'Negotiate Outline Terms', '2026-02-10', '2026-02-20', 40, 'in-progress', 'high', 0, 6),
(7, 1, 'Enhanced Due Diligence Pack', '2026-02-12', '2026-03-10', 30, 'in-progress', 'medium', 0, 7),
(8, 1, 'Prepare Information Package', '2026-02-14', '2026-03-15', 25, 'in-progress', 'medium', 0, 8),
(9, 1, 'Company Presentation', '2026-02-16', '2026-03-15', 20, 'in-progress', 'medium', 0, 9),
(10, 1, 'Offering Document', '2026-02-18', '2026-03-18', 15, 'in-progress', 'high', 0, 10),
(11, 1, 'Credit Research Rating Presentation', '2026-02-18', '2026-03-12', 20, 'in-progress', 'medium', 0, 11),
(12, 1, 'Draft Indicative Term Sheet', '2026-02-25', '2026-03-15', 10, 'in-progress', 'high', 0, 12),
(13, 1, 'Potential pre-soundings of terms with key investors', '2026-03-05', '2026-03-18', 5, 'in-progress', 'medium', 0, 13),
(14, 1, 'Possible adjustment on feedback from key investors', '2026-03-08', '2026-03-18', 5, 'in-progress', 'medium', 0, 14),
(15, 1, 'Project Term Sheet', '2026-03-10', '2026-03-18', 5, 'in-progress', 'high', 1, 15),
(16, 1, 'Deal announcement/press release', '2026-03-18', '2026-03-20', 5, 'in-progress', 'high', 0, 16),
(17, 1, 'Deal Bookbuilding', '2026-03-20', '2026-03-25', 5, 'in-progress', 'high', 0, 17),
(18, 1, 'Global Roadshow', '2026-03-20', '2026-03-28', 5, 'in-progress', 'high', 0, 18),
(19, 1, 'Issuer presents the pitch', '2026-03-22', '2026-03-28', 5, 'in-progress', 'medium', 0, 19),
(20, 1, 'OCF organises and participates', '2026-03-22', '2026-03-28', 5, 'in-progress', 'medium', 0, 20),
(21, 1, 'Pricing and allocations are agreed', '2026-03-28', '2026-03-30', 0, 'not-started', 'critical', 1, 21),
(22, 1, 'Bonds start to trade', '2026-03-30', '2026-04-01', 0, 'not-started', 'high', 0, 22),
(23, 1, 'Bonds are issued', '2026-04-01', '2026-04-03', 0, 'not-started', 'critical', 1, 23),
(24, 1, 'Interest starts to accrue', '2026-04-03', '2026-04-05', 0, 'not-started', 'medium', 0, 24),
(25, 1, 'Bond agreement completed before settlement', '2026-04-05', '2026-04-08', 0, 'not-started', 'high', 0, 25),
(26, 1, 'Conditions precedent to be satisfied before settlement', '2026-04-05', '2026-04-10', 0, 'not-started', 'high', 0, 26),
(27, 1, 'Bring down due diligence call', '2026-04-08', '2026-04-10', 0, 'not-started', 'medium', 0, 27),
(28, 1, 'All Conditions precedent satisfied', '2026-04-10', '2026-04-12', 0, 'not-started', 'high', 1, 28),
(29, 1, 'Issuer receives the funds', '2026-04-12', '2026-04-14', 0, 'not-started', 'critical', 1, 29);

-- --------------------------------------------------------
-- Insert task dependencies
-- --------------------------------------------------------

INSERT INTO `task_dependencies` (`task_id`, `depends_on_task_id`, `dependency_type`) VALUES
(2, 1, 'finish-to-start'),
(3, 2, 'finish-to-start'),
(4, 3, 'finish-to-start'),
(5, 3, 'finish-to-start'),
(6, 4, 'finish-to-start'),
(6, 5, 'finish-to-start'),
(7, 4, 'finish-to-start'),
(8, 4, 'finish-to-start'),
(9, 8, 'finish-to-start'),
(10, 8, 'finish-to-start'),
(11, 7, 'finish-to-start'),
(12, 6, 'finish-to-start'),
(13, 12, 'finish-to-start'),
(14, 13, 'finish-to-start'),
(15, 14, 'finish-to-start'),
(16, 15, 'finish-to-start'),
(17, 16, 'finish-to-start'),
(18, 16, 'finish-to-start'),
(19, 18, 'finish-to-start'),
(20, 18, 'finish-to-start'),
(21, 17, 'finish-to-start'),
(21, 19, 'finish-to-start'),
(21, 20, 'finish-to-start'),
(22, 21, 'finish-to-start'),
(23, 22, 'finish-to-start'),
(24, 23, 'finish-to-start'),
(25, 24, 'finish-to-start'),
(26, 24, 'finish-to-start'),
(27, 25, 'finish-to-start'),
(27, 26, 'finish-to-start'),
(28, 27, 'finish-to-start'),
(29, 28, 'finish-to-start');

-- --------------------------------------------------------
-- Sample comments for demonstration
-- --------------------------------------------------------

INSERT INTO `task_comments` (`task_id`, `user_id`, `user_name`, `comment`) VALUES
(1, 1, 'Admin User', 'Initial meeting completed successfully. Client requirements documented.'),
(2, 2, 'Sarah Johnson', 'KYC documentation received and verified.'),
(3, 1, 'Admin User', 'Mandate terms agreed. Moving forward with project setup.');

-- --------------------------------------------------------
-- Reset auto increment to continue from last ID
-- --------------------------------------------------------

ALTER TABLE `users` AUTO_INCREMENT = 104;
ALTER TABLE `projects` AUTO_INCREMENT = 2;
ALTER TABLE `tasks` AUTO_INCREMENT = 30;
ALTER TABLE `task_comments` AUTO_INCREMENT = 4;
