# Oasis Capital Finance - Client Portal v83

## Deployment Package

**Version:** v83
**Build Date:** 2026-02-21
**New in v83:** Client Portal with Dashboard, Documents, Team Contacts, and Diary

---

## What's Included

### Frontend (Next.js Static Export)
- `/` - Dashboard with project overview
- `/timeline/` - Gantt chart project timeline
- `/documents/` - Document library
- `/team/` - Deal team contacts
- `/diary/` - Calendar and events

### Backend APIs
- `api/projects.php` - Projects API
- `api/tasks.php` - Tasks API
- `api/templates.php` - Project templates API
- `api/documents.php` - Documents API (NEW)
- `api/contacts.php` - Team contacts API (NEW)
- `api/diary.php` - Calendar events API (NEW)
- `api/auth.php` - Authentication API
- `api/comments.php` - Task comments API
- `api/statistics.php` - Statistics API

### SQL Scripts
- `sql/schema.sql` - Core database tables
- `sql/seed.sql` - Sample data
- `sql/templates_schema.sql` - Template tables
- `sql/v78_portal_features.sql` - **NEW: Portal features (documents, contacts, diary)**

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
mysql -u username -p database_name < sql/v78_portal_features.sql
```

**For existing installation (just add portal features):**
```bash
mysql -u username -p database_name < sql/v78_portal_features.sql
```

### 4. Setup Demo Passwords
Visit in browser: `https://your-domain.com/api/setup_passwords.php`

### 5. Test Login
Visit: `https://your-domain.com/login.php`

### 6. Verify Deployment
Visit: `https://your-domain.com/api/full_verify.php`

### 7. Clean Up (Important!)
Delete verification scripts after confirming everything works:
- `api/full_verify.php`
- `api/db_verify.php`
- `api/file_verify.php`
- `api/version_verify.php`
- `api/setup_passwords.php`

---

## Demo Credentials

| Role    | Email                              | Password    |
|---------|---------------------------------------|-------------|
| Admin   | admin@oasiscapitalfinance.com      | admin123    |
| Manager | sarah@oasiscapitalfinance.com      | manager123  |
| Client  | contact@acmecorp.com               | client123   |

---

## New Database Tables (v78_portal_features.sql)

| Table | Purpose |
|-------|---------|
| `document_categories` | Document category types |
| `documents` | Document metadata |
| `document_access_log` | Download tracking |
| `contact_categories` | Team contact categories |
| `team_contacts` | Contact information |
| `event_types` | Calendar event types |
| `diary_events` | Calendar events |
| `event_attendees` | Event attendees |
| `system_settings` | System settings |

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
│   └── ...
│
├── sql/
│   ├── schema.sql
│   ├── seed.sql
│   ├── templates_schema.sql
│   └── v78_portal_features.sql
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
- Run `sql/v78_portal_features.sql`
- Check that tables were created with `/api/full_verify.php`

---

## Support

Contact: admin@oasiscapitalfinance.com

---

## Version History

- **v83** - Client Portal with Documents, Contacts, Diary
- v77 - Popup login system
- v76 - Fixed API URLs
- v75 - Version verification scripts

---

&copy; 2026 Oasis Capital Finance. All rights reserved.
