MEETING DIARY - DEPLOYMENT INSTRUCTIONS
========================================

Upload the contents of this folder to your web root directory.

STRUCTURE:
- index.html     - Main app entry point
- _next/         - Static assets (JS, CSS, fonts)
- api/           - PHP backend files
- schema.sql     - Database schema
- .htaccess      - Apache rewrite rules

SETUP STEPS:
1. Upload all files to your web server
2. Create a MySQL/MariaDB database
3. Import schema.sql into your database
4. Edit api/config.php with your database credentials
5. Create pers-img folder in your web root with 755 permissions
6. Visit your site and login with: admin@meetings.com / Admin123!

REQUIREMENTS:
- PHP 7.3+
- MySQL 5.7+ or MariaDB 10.3+
- Apache with mod_rewrite enabled

PHOTO UPLOAD:
- Photos are stored in /pers-img/ directory
- Ensure this directory exists and has write permissions (755)

Generated: Feb 2026
