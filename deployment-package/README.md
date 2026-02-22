# Oasis Capital Finance - Client Portal v95

## Deployment Package

**Version:** v95
**Build Date:** 2026-02-21
**Features:** Full Client Portal with Dashboard, Timeline, Documents, Team Contacts, and Diary

---

## What's Included

### Frontend Pages (Next.js Static Export)
- `/` - Dashboard with project overview
- `/timeline/` - Gantt chart project timeline
- `/documents/` - Document library
- `/team/` - Deal team contacts
- `/diary/` - Calendar and events

### Backend APIs (10 endpoints)
- `api/projects.php` - Projects API
- `api/tasks.php` - Tasks API
- `api/templates.php` - Project templates API
- `api/documents.php` - Documents API
- `api/contacts.php` - Team contacts API
- `api/diary.php` - Calendar events API
- `api/auth.php` - Authentication API
- `api/comments.php` - Task comments API
- `api/statistics.php` - Statistics API
- `api/config.php` - Database configuration

### SQL Scripts
- `sql/schema.sql` - Core database tables
- `sql/seed.sql` - Sample data
- `sql/templates_schema.sql` - Template tables
- `sql/v95_portal_features.sql` - Portal features (documents, contacts, diary)

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
mysql -u username -p database_name < sql/v95_portal_features.sql
```

**For existing installation (just add portal features):**
```bash
mysql -u username -p database_name < sql/v95_portal_features.sql
```

### 4. Setup Demo Passwords
Visit in browser: `https://your-domain.com/api/setup_passwords.php`

### 5. Verify Deployment
Visit: `https://your-domain.com/api/full_verify.php`

### 6. Test Login
Visit: `https://your-domain.com/login.php`

### 7. Clean Up (Important!)
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
│   └── full_verify.php     # Verification
│
├── sql/
│   ├── schema.sql
│   ├── seed.sql
│   ├── templates_schema.sql
│   └── v95_portal_features.sql
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
- Run `sql/v95_portal_features.sql`
- Check that tables were created with `/api/full_verify.php`

---

## Version History

- **v95** - White logo on dark sidebar, comprehensive verification, all files tagged v95
- v94 - Horizontal logo display
- v86 - All files tagged v86, complete verification
- v84 - System settings table, enhanced verification
- v83 - Client Portal with Documents, Contacts, Diary
- v78 - Portal features SQL migration
- v77 - Popup login system

---

## Support

Contact: admin@oasiscapitalfinance.com

---

© 2026 Oasis Capital Finance. All rights reserved.
