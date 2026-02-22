-- ============================================================
-- Gantt Project Manager - Portal Features Migration
-- Version: v109
-- Build: 2026-02-22
--
-- This script updates the portal to v109
-- v109 adds Admin Team Members management page
--
-- SAFE TO RUN: Uses IF NOT EXISTS and doesn't modify existing tables
--
-- Usage:
-- mysql -u username -p database_name < v109_portal_features.sql
-- ============================================================

-- Use the correct database
USE `gantt_project_manager`;

-- ============================================================
-- UPDATE VERSION TRACKING
-- ============================================================

-- Update portal version to v109
UPDATE `system_settings` SET `value` = 'v109', `updated_at` = NOW() WHERE `key` = 'portal_version';
UPDATE `system_settings` SET `value` = '2026-02-22', `updated_at` = NOW() WHERE `key` = 'portal_build_date';
UPDATE `system_settings` SET `value` = 'documents,contacts,diary,dashboard,timeline,admin,team-admin', `updated_at` = NOW() WHERE `key` = 'portal_features';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

SELECT '=== Portal v109 Update Summary ===' AS status;

SELECT `key`, `value` FROM `system_settings` WHERE `key` IN ('portal_version', 'portal_build_date', 'portal_features');

SELECT '=== Update Complete ===' AS status;
SELECT 'Portal v109 features installed successfully!' AS message;
SELECT 'New feature: Admin Team Members management page (/admin/team/)' AS new_feature;

-- ============================================================
-- v109 CHANGELOG
-- ============================================================
-- v109 Changes:
-- - Added Admin Team Members management page (/admin/team/)
-- - Add/Edit team member form with all contact fields
-- - Image upload for team member photos and company logos
-- - Primary contact checkbox support
-- - Team Contacts page displays uploaded images instead of initials
-- - Updated all file version tags to v109
-- ============================================================

-- ============================================================
-- END OF MIGRATION SCRIPT
-- ============================================================
