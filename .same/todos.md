# Gantt Project Manager - Development Todos

## Current Version: v125

## Current Status

**IMPORTANT:** The v125 deployment zip file IS correct and contains v125 content.
The live server at `clientadmin.oasiscapitalfinance.com` still has v106 deployed.

### To Deploy v125:
1. Download `gantt-project-manager-v125-DEPLOY.zip` from this project
2. Upload and extract to your web server (replacing all existing files)
3. Run the SQL update: `mysql -u username -p database < sql/v125_portal_features.sql`
4. Verify at `/api/full_verify.php`

## Completed Tasks

### v125 Release (2026-02-22)
- [x] Updated all PHP API files to @version v125
- [x] Created comprehensive full_verify.php with 14 verification sections
- [x] Added PHP configuration checks
- [x] Added upload directory write testing
- [x] Added version marker validation for all files
- [x] Added feature checklist verification
- [x] Created v125_portal_features.sql
- [x] Updated deployment README.md to v125
- [x] Created v125 deployment zip package
- [x] Verified zip contains correct v125 content

### v115 Release (2026-02-22)
- [x] Fixed image upload to use FormData (multipart) instead of JSON POST
- [x] Server compatibility fix for hosts blocking JSON POST to PHP files

### v111 Release (2026-02-22)
- [x] Server-side image upload API (/api/upload.php)
- [x] Circular crop option for profile photos
- [x] Image filters: brightness, contrast, saturation
- [x] Filter presets: Normal, Vivid, B&W, Muted, Pop
- [x] Drag & drop support for image upload
- [x] Images stored as files when server available

### v110 Release (2026-02-22)
- [x] Added ImageCropper component with react-image-crop
- [x] Zoom and rotate controls for image adjustment
- [x] Square crop aspect ratio for profile photos (1:1)
- [x] Re-crop button to adjust existing images
- [x] Output optimized to 400x400px JPEG format
- [x] Added Slider component from shadcn/ui

### v109 Release (2026-02-22)
- [x] Added Admin Team Members management page (/admin/team/)
- [x] Add/Edit team member form with all contact fields
- [x] Image upload for team member photos and company logos
- [x] Primary contact checkbox support
- [x] Team Contacts page displays uploaded images instead of initials
- [x] Built new Next.js static export with admin/team page

## v125 Deployment Package Contents

**File:** `gantt-project-manager-v125-DEPLOY.zip`
**Total Files:** 140 files
**Size:** ~2.4 MB

### Included:
- **API Endpoints:** 12 PHP files (all @version v125)
- **SQL Scripts:** 12 files (including v125_portal_features.sql)
- **Admin Pages:** 4 (projects, allocate, templates, team)
- **Portal Pages:** 5 (dashboard, timeline, documents, team, diary)
- **Static Assets:** _next/static (CSS, JS chunks, fonts)
- **Images:** Logo files
- **Upload Directory:** /uploads/avatars/

## Pending Deployment

- [ ] User needs to upload v125 zip to server
- [ ] User needs to run v125_portal_features.sql on database
- [ ] User needs to verify at /api/full_verify.php

## Next Steps (Future)

- [ ] Add image preview gallery for team members
- [ ] Batch image operations
- [ ] Add document upload with preview
- [ ] Calendar event reminders
- [ ] Email notifications

## v125 Features Summary

### Complete Deployment Package
- All 12 PHP API files at @version v125
- Full verification script with 14 sections
- PHP configuration validation
- File version marker checking
- Upload functionality testing
- Feature checklist validation

### Image Upload & Editing
- **Server-side Upload API** (`/api/upload.php`)
  - POST with FormData (file upload)
  - POST with base64 via ?base64=1 parameter
  - Images stored in `/uploads/avatars/`
  - Supports JPG, PNG, GIF, WebP (max 5MB)
  - Generates unique filenames

- **ImageCropper Component**
  - Drag & drop support for image selection
  - Zoom control (50% - 300%)
  - Rotate control (-180° to +180°)
  - Circular or square crop option
  - Image filters tab:
    - Brightness (50% - 150%)
    - Contrast (50% - 150%)
    - Saturation (0% - 200%)
  - Quick presets: Normal, Vivid, B&W, Muted, Pop
  - Output: 400x400px max, JPEG format at 90% quality

## Database Update Required

Run this SQL to update portal version:
```sql
UPDATE system_settings SET value = 'v125' WHERE `key` = 'portal_version';
```

Or run the full migration:
```bash
mysql -u username -p database_name < sql/v125_portal_features.sql
```

## Previous Versions
- [x] v108 - Fixed logo display, CSS invert for theme support
- [x] v106 - Fixed admin pages flashing/redirect, improved auth state management
- [x] v105 - Fixed admin navigation routing, trailing slashes, version display features
- [x] v102 - Version API, version display on Dashboard and Login pages
- [x] v100 - Major milestone release, complete portal deployment package
- [x] v97 - Fixed Allocate to Client page error (Select component)
- [x] v96 - Admin features (Manage Projects, Allocate to Client, Templates)
- [x] v95 - White logo on dark sidebar
- [x] v83 - Client Portal with Documents, Contacts, Diary
- [x] v77 - Popup login system
