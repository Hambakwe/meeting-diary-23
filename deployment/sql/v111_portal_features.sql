-- ============================================================
-- Gantt Project Manager - Portal Features Migration
-- Version: v111
-- Build: 2026-02-22
--
-- This script updates the portal to v111
-- v111 adds:
-- - Server-side image upload API
-- - Circular crop option
-- - Image filters (brightness, contrast, saturation)
-- - Drag & drop support for images
--
-- SAFE TO RUN: Uses IF NOT EXISTS and doesn't modify existing tables
--
-- Usage:
-- mysql -u username -p database_name < v111_portal_features.sql
-- ============================================================

-- Use the correct database
USE `gantt_project_manager`;

-- ============================================================
-- UPDATE VERSION TRACKING
-- ============================================================

-- Update portal version to v111
UPDATE `system_settings` SET `value` = 'v111', `updated_at` = NOW() WHERE `key` = 'portal_version';
UPDATE `system_settings` SET `value` = '2026-02-22', `updated_at` = NOW() WHERE `key` = 'portal_build_date';
UPDATE `system_settings` SET `value` = 'documents,contacts,diary,dashboard,timeline,admin,team-admin,image-crop,image-upload,image-filters', `updated_at` = NOW() WHERE `key` = 'portal_features';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

SELECT '=== Portal v111 Update Summary ===' AS status;

SELECT `key`, `value` FROM `system_settings` WHERE `key` IN ('portal_version', 'portal_build_date', 'portal_features');

SELECT '=== Update Complete ===' AS status;
SELECT 'Portal v111 features installed successfully!' AS message;

-- ============================================================
-- v111 CHANGELOG
-- ============================================================
-- v111 Changes:
-- - Server-side image upload API (/api/upload.php)
-- - Circular crop option for profile photos
-- - Image filters: brightness, contrast, saturation
-- - Filter presets: Normal, Vivid, B&W, Muted, Pop
-- - Drag & drop support for image upload
-- - Images stored as files in /uploads/avatars/ (when server available)
-- - Fallback to base64 when server upload unavailable
-- ============================================================

-- ============================================================
-- END OF MIGRATION SCRIPT
-- ============================================================
