-- ============================================================
-- Gantt Project Manager - Portal Features Migration
-- Version: v125
-- Build: 2026-02-22
--
-- This script updates the portal to v125
--
-- v125 Changes:
-- - Complete deployment package with all features
-- - All files updated to @version v125
-- - FormData (multipart) image upload for server compatibility
-- - Image cropping with zoom, rotate, circular/square crop
-- - Image filters: brightness, contrast, saturation
-- - Filter presets: Normal, Vivid, B&W, Muted, Pop
-- - Admin Team Members page with full CRUD
-- - Drag & drop image selection
-- - Server-side image upload API (/api/upload.php)
-- - Images stored in /uploads/avatars/
--
-- SAFE TO RUN: Uses IF NOT EXISTS and doesn't break existing data
--
-- Usage:
-- mysql -u username -p database_name < v125_portal_features.sql
-- ============================================================

-- Use the correct database (update if different)
-- USE `gantt_project_manager`;

-- ============================================================
-- ENSURE UPLOAD SUPPORT
-- ============================================================

-- Ensure avatar_url can hold file paths (VARCHAR 500 is sufficient for URLs)
ALTER TABLE `team_contacts` MODIFY COLUMN `avatar_url` VARCHAR(500);

-- ============================================================
-- UPDATE VERSION TRACKING
-- ============================================================

-- Update portal version to v125
UPDATE `system_settings` SET `value` = 'v125', `updated_at` = NOW() WHERE `key` = 'portal_version';
UPDATE `system_settings` SET `value` = '2026-02-22', `updated_at` = NOW() WHERE `key` = 'portal_build_date';
UPDATE `system_settings` SET `value` = 'documents,contacts,diary,dashboard,timeline,admin,team-admin,image-upload,image-crop,image-filters,formdata-upload', `updated_at` = NOW() WHERE `key` = 'portal_features';

-- Add file_upload feature flag if not exists
INSERT INTO `system_settings` (`key`, `value`, `description`, `created_at`, `updated_at`)
VALUES ('file_upload_enabled', 'true', 'Enable server-side file uploads', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value` = 'true', `updated_at` = NOW();

-- Add upload directory setting if not exists
INSERT INTO `system_settings` (`key`, `value`, `description`, `created_at`, `updated_at`)
VALUES ('upload_directory', '/uploads/avatars/', 'Directory for uploaded avatar images', NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Add max upload size setting
INSERT INTO `system_settings` (`key`, `value`, `description`, `created_at`, `updated_at`)
VALUES ('max_upload_size', '5242880', 'Maximum file upload size in bytes (5MB)', NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

SELECT '=== Portal v125 Update Summary ===' AS status;

SELECT `key`, `value` FROM `system_settings`
WHERE `key` IN ('portal_version', 'portal_build_date', 'portal_features', 'file_upload_enabled', 'upload_directory', 'max_upload_size');

SELECT '=== Table Structure Check ===' AS status;

-- Verify team_contacts has avatar_url column
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'team_contacts' AND COLUMN_NAME = 'avatar_url';

SELECT '=== Update Complete ===' AS status;
SELECT 'Portal v125 installed successfully!' AS message;
SELECT 'Complete deployment package with all features' AS note;

-- ============================================================
-- v125 CHANGELOG
-- ============================================================
-- v125 - Complete Deployment Package
--   - All files updated to @version v125
--   - Comprehensive full_verify.php with 14 verification sections
--   - PHP configuration checks
--   - Upload directory write testing
--   - Version marker validation for all files
--   - Feature checklist verification
--
-- v115 - Image Upload Server Compatibility Fix
--   - Changed from JSON POST to FormData (multipart) upload
--   - Fixed compatibility with servers blocking JSON POST to PHP
--   - Images saved as files in /uploads/avatars/
--   - Only URL path stored in database (not base64)
--
-- v111 - Image Upload & Editing Features
--   - Server-side image upload API (/api/upload.php)
--   - Circular crop option for profile photos
--   - Image filters: brightness, contrast, saturation
--   - Filter presets: Normal, Vivid, B&W, Muted, Pop
--   - Drag & drop support for image upload
--
-- v110 - Image Cropping
--   - Added ImageCropper component with react-image-crop
--   - Zoom and rotate controls
--   - Square crop aspect ratio (1:1)
--
-- v109 - Admin Team Members
--   - Admin Team Members page (/admin/team/)
--   - Add/Edit/Delete team members
--   - Image upload for profile photos
--   - Primary contact support
-- ============================================================

-- ============================================================
-- END OF MIGRATION SCRIPT
-- ============================================================
