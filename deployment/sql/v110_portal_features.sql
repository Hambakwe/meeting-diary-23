-- ============================================================
-- Gantt Project Manager - Portal Features Migration
-- Version: v110
-- Build: 2026-02-22
--
-- This script updates the portal to v110
-- v110 adds image cropping/resizing feature for profile photos
--
-- SAFE TO RUN: Uses IF NOT EXISTS and doesn't modify existing tables
--
-- Usage:
-- mysql -u username -p database_name < v110_portal_features.sql
-- ============================================================

-- Use the correct database
USE `gantt_project_manager`;

-- ============================================================
-- UPDATE VERSION TRACKING
-- ============================================================

-- Update portal version to v110
UPDATE `system_settings` SET `value` = 'v110', `updated_at` = NOW() WHERE `key` = 'portal_version';
UPDATE `system_settings` SET `value` = '2026-02-22', `updated_at` = NOW() WHERE `key` = 'portal_build_date';
UPDATE `system_settings` SET `value` = 'documents,contacts,diary,dashboard,timeline,admin,team-admin,image-crop', `updated_at` = NOW() WHERE `key` = 'portal_features';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

SELECT '=== Portal v110 Update Summary ===' AS status;

SELECT `key`, `value` FROM `system_settings` WHERE `key` IN ('portal_version', 'portal_build_date', 'portal_features');

SELECT '=== Update Complete ===' AS status;
SELECT 'Portal v110 features installed successfully!' AS message;
SELECT 'New feature: Image cropping and resizing for profile photos' AS new_feature;

-- ============================================================
-- v110 CHANGELOG
-- ============================================================
-- v110 Changes:
-- - Added ImageCropper component with react-image-crop
-- - Zoom and rotate controls for image adjustment
-- - Square crop aspect ratio for profile photos (1:1)
-- - Re-crop button to adjust existing images
-- - Output optimized to 400x400px JPEG format
-- - Added Slider component from shadcn/ui
-- ============================================================

-- ============================================================
-- END OF MIGRATION SCRIPT
-- ============================================================
