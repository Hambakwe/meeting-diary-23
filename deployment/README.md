# Oasis Capital Finance - Client Portal v125

## Deployment Package

**Version:** v125
**Build Date:** 2026-02-22
**Features:** Full Client Portal with Dashboard, Timeline, Documents, Team Contacts, Diary, Admin Pages, and Image Upload

---

## What's New in v125

- **Complete Deployment Package**
  - All PHP API files updated to @version v125
  - All SQL scripts updated to v125
  - Comprehensive verification script (14 sections)
  - Full feature checklist validation

- **Image Upload Server Compatibility**
  - FormData (multipart/form-data) upload method
  - Works with all server configurations
  - No JSON POST to PHP required
  - Images saved as files in `/uploads/avatars/`

- **Image Cropping & Editing**
  - Zoom and rotate controls
  - Circular or square crop options
  - Image filters: brightness, contrast, saturation
  - Quick presets: Normal, Vivid, B&W, Muted, Pop
  - Drag & drop support

- **Admin Team Members Page** (`/admin/team/`)
  - Add, edit, delete team members
  - Upload profile photos with cropping
  - Assign to categories
  - Mark primary contacts

---

## What's Included

### Frontend Pages (Next.js Static Export)
- `/` - Dashboard with project overview
- `/timeline/` - Gantt chart project timeline
- `/documents/` - Document library
- `/team/` - Deal team contacts
- `/diary/` - Calendar and events
- `/admin/projects/` - Manage Projects (Admin/Manager)
- `/admin/allocate/` - Allocate to Client (Admin)
- `/admin/templates/` - Project Templates (Admin/Manager)
- `/admin/team/` - Team Members (Admin/Manager) **NEW**

### Backend APIs (12 endpoints)
- `api/projects.php` - Projects API
- `api/tasks.php` - Tasks API
- `api/templates.php` - Project templates API
- `api/documents.php` - Documents API
- `api/contacts.php` - Team contacts API
- `api/diary.php` - Calendar events API
- `api/auth.php` - Authentication API
- `api/comments.php` - Task comments API
- `api/statistics.php` - Statistics API
- `api/version.php` - Version info API (file & database versions)
- `api/upload.php` - Image upload API **NEW**
- `api/config.php` - Database configuration

### SQL Scripts
- `sql/schema.sql` - Core database tables
- `sql/seed.sql` - Sample data
- `sql/templates_schema.sql` - Template tables
- `sql/v111_portal_features.sql` - Latest portal features

### Verification Scripts
- `api/full_verify.php` - Complete system verification
- `api/db_verify.php` - Database verification
- `api/file_verify.php` - File verification
- `api/version_verify.php` - Version verification
- `api/setup_passwords.php` - Password setup

---

## Installation Steps

### 1. Upload Files
Upload all files from this package to your web server root.

### 2. Configure Database
Edit `api/config.php` with your database credentials:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 3. Run SQL Scripts

**For fresh install (run in order):**
```bash
mysql -u username -p database_name < sql/schema.sql
mysql -u username -p database_name < sql/seed.sql
mysql -u username -p database_name < sql/templates_schema.sql
mysql -u username -p database_name < sql/v111_portal_features.sql
```

**For existing installation (just update):**
```bash
mysql -u username -p database_name < sql/v111_portal_features.sql
```

### 4. Setup Demo Passwords
Visit in browser: `https://your-domain.com/api/setup_passwords.php`

### 5. Set Upload Directory Permissions
Ensure the uploads directory is writable:
```bash
chmod 755 uploads/
chmod 755 uploads/avatars/
```

### 6. Verify Deployment
Visit: `https://your-domain.com/api/full_verify.php`

### 7. Test Login
Visit: `https://your-domain.com/login.php`

### 8. Clean Up (Important!)
Delete verification scripts after confirming everything works:
- `api/full_verify.php`
- `api/db_verify.php`
- `api/file_verify.php`
- `api/version_verify.php`
- `api/setup_passwords.php`

---

## Demo Credentials

| Role    | Email                           | Password    |
|---------|---------------------------------|-------------|
| Admin   | admin@oasiscapitalfinance.com   | admin123    |
| Manager | sarah@oasiscapitalfinance.com   | manager123  |
| Client  | contact@acmecorp.com            | client123   |

---

## Database Tables

### Core Tables (8)
- `users` - User accounts
- `projects` - Projects
- `tasks` - Project tasks
- `task_dependencies` - Task dependencies
- `task_comments` - Task comments
- `project_templates` - Project templates
- `task_templates` - Task templates
- `task_template_dependencies` - Template dependencies

### Portal Tables (9)
- `document_categories` - Document categories
- `documents` - Document records
- `document_access_log` - Download tracking
- `contact_categories` - Contact categories
- `team_contacts` - Team contacts
- `event_types` - Calendar event types
- `diary_events` - Calendar events
- `event_attendees` - Event attendees
- `system_settings` - System configuration

---

## File Structure

```
/
├── index.html              # Dashboard
├── timeline/index.html     # Gantt Chart
├── documents/index.html    # Document Library
├── team/index.html         # Team Contacts
├── diary/index.html        # Diary/Calendar
├── admin/                  # Admin Pages
│   ├── projects/           # Manage Projects
│   ├── allocate/           # Allocate to Client
│   ├── templates/          # Project Templates
│   └── team/               # Team Members (NEW)
├── login.php               # Login page
├── login-embed.js          # Embed script
├── .htaccess               # Apache config
│
├── api/
│   ├── config.php          # Database config
│   ├── projects.php        # Projects API
│   ├── tasks.php           # Tasks API
│   ├── templates.php       # Templates API
│   ├── documents.php       # Documents API
│   ├── contacts.php        # Contacts API
│   ├── diary.php           # Diary API
│   ├── auth.php            # Auth API
│   ├── comments.php        # Comments API
│   ├── statistics.php      # Statistics API
│   ├── upload.php          # Image Upload API (NEW)
│   └── full_verify.php     # Verification
│
├── sql/
│   ├── schema.sql
│   ├── seed.sql
│   ├── templates_schema.sql
│   └── v111_portal_features.sql
│
├── uploads/
│   └── avatars/            # Uploaded images
│
├── images/logo/
│   └── *.png
│
└── _next/static/           # JS/CSS assets
```

---

## Troubleshooting

### API returns 404
- Ensure `.htaccess` is uploaded
- Enable Apache `mod_rewrite`
- Check file permissions (755 for folders, 644 for files)

### Login not working
- Run `/api/setup_passwords.php`
- Check database connection in `api/config.php`

### Portal features not loading
- Run `sql/v111_portal_features.sql`
- Check that tables were created with `/api/full_verify.php`

### Image upload not working
- Ensure `/uploads/avatars/` directory exists and is writable (chmod 755)
- Check PHP upload_max_filesize setting (should be >= 5M)

---

## Version History

- **v125** - Complete deployment package, FormData upload, comprehensive verification
- **v115** - Image upload server compatibility fix, FormData upload
- **v111** - Image upload API, circular crop, image filters, drag & drop
- **v110** - Image cropping/resizing with react-image-crop
- **v109** - Admin Team Members page with image upload
- v108 - Fixed logo display, CSS invert for theme support
- v106 - Fixed admin pages flashing/redirect
- v105 - Fixed admin navigation routing, version display
- v102 - Version API, version display on Dashboard and Login
- v100 - Major milestone release
- v97 - Fixed Allocate to Client page error
- v96 - Admin features
- v83 - Client Portal with Documents, Contacts, Diary
- v77 - Popup login system

---

## Support

Contact: admin@oasiscapitalfinance.com

---

© 2026 Oasis Capital Finance. All rights reserved.
