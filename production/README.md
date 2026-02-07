# Meeting Diary - Server Deployment Guide

## Quick Start (5 Steps)

### Step 1: Create Database
```sql
CREATE DATABASE meeting_diary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'meeting_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON meeting_diary.* TO 'meeting_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Import Database Schema
```bash
mysql -u meeting_user -p meeting_diary < database/schema.sql
```

### Step 3: Configure Database Connection
Edit `api/config.php` and update these lines:
```php
define('DB_HOST', 'localhost');           // Your database host
define('DB_NAME', 'meeting_diary');       // Your database name
define('DB_USER', 'meeting_user');        // Your database username
define('DB_PASS', 'your_secure_password'); // Your database password
```

### Step 4: Upload Files
Upload the entire `production` folder contents to your web root:
```
/var/www/html/          (or your web root)
├── .htaccess
├── api/
│   ├── config.php
│   ├── persons.php
│   ├── hotels.php
│   ├── meetings.php
│   ├── users.php
│   └── index.php
├── database/
│   └── schema.sql
└── public/
    ├── index.html
    ├── _next/
    └── ...
```

### Step 5: Set Permissions
```bash
chmod 755 /var/www/html
chmod 644 /var/www/html/api/config.php
chmod -R 755 /var/www/html/public
chmod -R 755 /var/www/html/api
```

---

## Detailed Instructions

### Requirements
- Apache 2.4+ with mod_rewrite enabled
- PHP 7.4+ with PDO MySQL extension
- MariaDB 10.3+ or MySQL 5.7+

### Enable mod_rewrite (if not enabled)
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Apache Virtual Host Configuration
Add to your Apache config (e.g., `/etc/apache2/sites-available/meeting-diary.conf`):

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html

    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/meeting-diary-error.log
    CustomLog ${APACHE_LOG_DIR}/meeting-diary-access.log combined
</VirtualHost>
```

Then enable and restart:
```bash
sudo a2ensite meeting-diary.conf
sudo systemctl reload apache2
```

### For HTTPS (Recommended)
```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com
```

---

## File Structure

```
production/
├── .htaccess           # Main routing configuration
├── api/                # PHP API backend
│   ├── .htaccess       # API-specific routing
│   ├── config.php      # Database configuration (EDIT THIS!)
│   ├── index.php       # API info endpoint
│   ├── persons.php     # Persons CRUD API
│   ├── hotels.php      # Hotels CRUD API
│   ├── meetings.php    # Meetings CRUD API
│   └── users.php       # Users CRUD API
├── database/
│   └── schema.sql      # Database creation script
└── public/             # Frontend static files
    ├── index.html      # Main application
    ├── _next/          # Next.js assets
    └── ...
```

---

## Testing the Installation

### 1. Test API Connection
Visit: `https://your-domain.com/api/`

You should see:
```json
{
  "name": "Meeting Diary API",
  "version": "1.0.0",
  "status": "active",
  "database": "connected"
}
```

### 2. Test Frontend
Visit: `https://your-domain.com/`

You should see the Meeting Diary dashboard.

---

## Troubleshooting

### "Database connection failed"
- Check credentials in `api/config.php`
- Verify MySQL/MariaDB is running: `sudo systemctl status mysql`
- Test connection: `mysql -u meeting_user -p meeting_diary`

### "404 Not Found" errors
- Enable mod_rewrite: `sudo a2enmod rewrite`
- Check `AllowOverride All` in Apache config
- Verify .htaccess files are in place

### "500 Internal Server Error"
- Check PHP error logs: `tail -f /var/log/apache2/error.log`
- Verify PHP version: `php -v` (need 7.4+)
- Check file permissions

### CORS Errors
Edit `api/config.php` and change:
```php
define('CORS_ORIGIN', 'https://your-domain.com');
```

---

## Database Schema

The `database/schema.sql` file creates these tables:

| Table | Description |
|-------|-------------|
| `users` | Application users |
| `persons` | Contacts/people for meetings |
| `hotels` | Hotels with location data |
| `meetings` | Meeting records |

---

## Security Recommendations

1. **Use HTTPS** - Install SSL certificate
2. **Restrict CORS** - Update `CORS_ORIGIN` in config.php
3. **Secure config.php** - Set permissions to 644
4. **Regular backups** - Backup database regularly
5. **Keep updated** - Update PHP and Apache regularly

---

## Support

For issues, check:
1. Apache error logs: `/var/log/apache2/error.log`
2. PHP logs: Check your php.ini for error_log location
3. Database: `mysql -u meeting_user -p -e "SHOW TABLES" meeting_diary`
