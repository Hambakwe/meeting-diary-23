#!/usr/bin/env node
/**
 * Meeting Diary - Production Build Preparation Script
 *
 * This script prepares a production-ready ZIP file containing:
 * 1. Static frontend build (HTML/CSS/JS)
 * 2. PHP API files
 * 3. Database SQL scripts
 * 4. Configuration templates
 * 5. Installation instructions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const PRODUCTION_DIR = path.join(ROOT_DIR, 'production');
const PRODUCTION_ZIP = path.join(ROOT_DIR, 'meeting-diary-production.zip');

console.log('🚀 Preparing Meeting Diary Production Build...\n');

// Create production directory
if (fs.existsSync(PRODUCTION_DIR)) {
  fs.rmSync(PRODUCTION_DIR, { recursive: true });
}
fs.mkdirSync(PRODUCTION_DIR, { recursive: true });

// Copy static build
console.log('📦 Copying static frontend build...');
if (fs.existsSync(OUT_DIR)) {
  copyDirectory(OUT_DIR, path.join(PRODUCTION_DIR, 'public'));
} else {
  console.error('❌ Static build not found. Run "bun run build:static" first.');
  process.exit(1);
}

// Copy API files
console.log('📦 Copying PHP API files...');
copyDirectory(path.join(ROOT_DIR, 'api'), path.join(PRODUCTION_DIR, 'api'));

// Copy database scripts
console.log('📦 Copying database scripts...');
copyDirectory(path.join(ROOT_DIR, 'database'), path.join(PRODUCTION_DIR, 'database'));

// Create production config template
console.log('📝 Creating configuration templates...');
const configTemplate = `<?php
/**
 * Meeting Diary - Production Database Configuration
 *
 * IMPORTANT: Update these values with your actual database credentials
 * Rename this file to config.php after configuration
 */

// Database Configuration
define('DB_HOST', 'localhost');       // Your database host
define('DB_NAME', 'meeting_diary');   // Your database name
define('DB_USER', 'your_db_user');    // Your database username
define('DB_PASS', 'your_db_password'); // Your database password
define('DB_CHARSET', 'utf8mb4');

// API Configuration
define('API_DEBUG', false); // Keep false in production
define('CORS_ORIGIN', 'https://your-domain.com'); // Your frontend domain

// Error reporting (keep disabled in production)
error_reporting(0);
ini_set('display_errors', 0);

/**
 * Get database connection
 * @return PDO
 */
function getDbConnection(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            sendErrorResponse(500, 'Database connection failed');
        }
    }

    return $pdo;
}

/**
 * Set CORS headers
 */
function setCorsHeaders(): void {
    header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Send JSON response
 */
function sendResponse($data, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Send error response
 */
function sendErrorResponse(int $statusCode, string $message): void {
    http_response_code($statusCode);
    echo json_encode(['error' => true, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Get JSON input from request body
 */
function getJsonInput(): array {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return $data ?? [];
}

/**
 * Generate unique ID
 */
function generateId(): string {
    return uniqid() . '-' . bin2hex(random_bytes(4));
}

/**
 * Validate required fields
 */
function validateRequired(array $data, array $required): bool {
    foreach ($required as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            return false;
        }
    }
    return true;
}
`;

fs.writeFileSync(path.join(PRODUCTION_DIR, 'api', 'config.production.php'), configTemplate);

// Create .htaccess for the main directory
const mainHtaccess = `# Meeting Diary - Apache Configuration
# Place this file in your document root

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Serve static files directly
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule ^ - [L]

    # Serve API requests
    RewriteRule ^api/(.*)$ api/$1 [L]

    # For all other requests, serve index.html (SPA fallback)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ public/index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>
`;

fs.writeFileSync(path.join(PRODUCTION_DIR, '.htaccess'), mainHtaccess);

// Create installation README
const readme = `# Meeting Diary - Production Installation Guide

## Requirements
- PHP 7.4+ with PDO MySQL extension
- MariaDB 10.3+ or MySQL 5.7+
- Apache with mod_rewrite enabled (or Nginx)
- HTTPS certificate (recommended)

## Installation Steps

### 1. Database Setup

1. Create a new database:
   \`\`\`sql
   CREATE DATABASE meeting_diary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   \`\`\`

2. Create a database user:
   \`\`\`sql
   CREATE USER 'meeting_diary_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON meeting_diary.* TO 'meeting_diary_user'@'localhost';
   FLUSH PRIVILEGES;
   \`\`\`

3. Run the schema script:
   \`\`\`bash
   mysql -u meeting_diary_user -p meeting_diary < database/schema.sql
   \`\`\`

### 2. File Deployment

1. Upload all files to your web server document root
2. Set correct permissions:
   \`\`\`bash
   chmod -R 755 public/
   chmod -R 755 api/
   chmod 644 api/config.php
   \`\`\`

### 3. API Configuration

1. Rename \`api/config.production.php\` to \`api/config.php\`
2. Edit \`api/config.php\` and update:
   - DB_HOST: Your database host
   - DB_NAME: Your database name
   - DB_USER: Your database username
   - DB_PASS: Your database password
   - CORS_ORIGIN: Your frontend domain (e.g., https://your-domain.com)

### 4. Apache Configuration

If using virtual host, add to your Apache config:
\`\`\`apache
<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /var/www/meeting-diary

    <Directory /var/www/meeting-diary>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Enable SSL
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
</VirtualHost>
\`\`\`

### 5. Nginx Configuration (Alternative)

\`\`\`nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    root /var/www/meeting-diary;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api {
        try_files $uri $uri/ /api/index.php?$query_string;
        location ~ \\.php$ {
            fastcgi_pass unix:/var/run/php/php-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }

    location / {
        root /var/www/meeting-diary/public;
        try_files $uri $uri/ /index.html;
    }
}
\`\`\`

### 6. Test the Installation

1. Visit https://your-domain.com/api/ - Should show API info
2. Visit https://your-domain.com/ - Should show the Meeting Diary app

## File Structure

\`\`\`
meeting-diary/
├── .htaccess           # Main Apache configuration
├── api/                # PHP API files
│   ├── .htaccess       # API routing
│   ├── config.php      # Database configuration (you create this)
│   ├── config.production.php  # Template (rename to config.php)
│   ├── index.php       # API info endpoint
│   ├── persons.php     # Persons CRUD
│   ├── hotels.php      # Hotels CRUD
│   ├── meetings.php    # Meetings CRUD
│   └── users.php       # Users CRUD
├── database/           # SQL scripts
│   └── schema.sql      # Database schema
└── public/             # Static frontend files
    ├── index.html      # Main app
    └── ...             # CSS, JS, assets
\`\`\`

## Troubleshooting

### API returns 500 error
- Check PHP error logs
- Verify database credentials in config.php
- Ensure PDO MySQL extension is installed

### CORS errors
- Update CORS_ORIGIN in config.php to match your frontend domain
- Ensure .htaccess is being read (AllowOverride All)

### Static files not loading
- Check file permissions
- Verify Apache/Nginx document root
- Check browser console for 404 errors

## Support

For issues or questions, contact your system administrator.
`;

fs.writeFileSync(path.join(PRODUCTION_DIR, 'README.md'), readme);

// Create ZIP file
console.log('📦 Creating production ZIP file...');
try {
  if (fs.existsSync(PRODUCTION_ZIP)) {
    fs.unlinkSync(PRODUCTION_ZIP);
  }
  execSync(`cd "${PRODUCTION_DIR}" && zip -r "${PRODUCTION_ZIP}" .`, { stdio: 'inherit' });
  console.log(`\n✅ Production build created: ${PRODUCTION_ZIP}`);
} catch (error) {
  console.log('\n⚠️  Could not create ZIP file. Please manually zip the "production" folder.');
}

console.log('\n📁 Production files are in: ' + PRODUCTION_DIR);
console.log('\n🎉 Done! Follow the README.md in the production folder for deployment instructions.\n');

// Helper function to copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
