<?php
/**
 * Gantt Project Manager - Image Upload API
 * PHP 8.x Compatible
 *
 * @version v125
 * @package GanttProjectManager
 * @build 2026-02-22
 *
 * Endpoints:
 * POST   /api/upload.php              - Upload an image file
 * POST   /api/upload.php?base64=1     - Upload base64 encoded image
 * DELETE /api/upload.php?file=X       - Delete an uploaded file
 *
 * Upload directory: /uploads/avatars/
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

// Configuration
define('UPLOAD_DIR', dirname(__DIR__) . '/uploads/avatars/');
define('UPLOAD_URL', '/uploads/avatars/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

$method = $_SERVER['REQUEST_METHOD'];

try {
    // Ensure upload directory exists
    if (!is_dir(UPLOAD_DIR)) {
        if (!mkdir(UPLOAD_DIR, 0755, true)) {
            errorResponse('Failed to create upload directory', 500);
        }
    }

    switch ($method) {
        case 'POST':
            if (isset($_GET['base64']) && $_GET['base64'] == '1') {
                handleBase64Upload();
            } else {
                handleFileUpload();
            }
            break;

        case 'DELETE':
            handleDelete();
            break;

        case 'OPTIONS':
            // CORS preflight
            http_response_code(200);
            exit;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Upload API Error: ' . $e->getMessage());
    errorResponse('Server error: ' . $e->getMessage(), 500);
}

/**
 * Handle traditional file upload
 */
function handleFileUpload(): void {
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        $errorCode = $_FILES['image']['error'] ?? 'No file';
        errorResponse('File upload failed: ' . getUploadErrorMessage($errorCode), 400);
    }

    $file = $_FILES['image'];

    // Validate file size
    if ($file['size'] > MAX_FILE_SIZE) {
        errorResponse('File too large. Maximum size is 5MB.', 400);
    }

    // Validate MIME type
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);

    if (!in_array($mimeType, ALLOWED_TYPES)) {
        errorResponse('Invalid file type. Allowed: JPG, PNG, GIF, WebP', 400);
    }

    // Generate unique filename
    $extension = getExtensionFromMime($mimeType);
    $filename = generateUniqueFilename($extension);
    $filepath = UPLOAD_DIR . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        errorResponse('Failed to save file', 500);
    }

    // Return success with URL
    successResponse([
        'filename' => $filename,
        'url' => UPLOAD_URL . $filename,
        'size' => $file['size'],
        'type' => $mimeType,
    ], 'File uploaded successfully');
}

/**
 * Handle base64 encoded image upload
 */
function handleBase64Upload(): void {
    $input = getJsonInput();

    if (empty($input['image'])) {
        errorResponse('No image data provided', 400);
    }

    $imageData = $input['image'];

    // Parse base64 data URL
    if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
        $extension = strtolower($matches[1]);
        if ($extension === 'jpeg') $extension = 'jpg';

        // Remove the data URL prefix
        $imageData = substr($imageData, strpos($imageData, ',') + 1);
    } else {
        // Assume it's raw base64, default to jpg
        $extension = 'jpg';
    }

    // Validate extension
    if (!in_array($extension, ALLOWED_EXTENSIONS)) {
        errorResponse('Invalid image format. Allowed: JPG, PNG, GIF, WebP', 400);
    }

    // Decode base64
    $decodedData = base64_decode($imageData);
    if ($decodedData === false) {
        errorResponse('Invalid base64 data', 400);
    }

    // Validate size
    $size = strlen($decodedData);
    if ($size > MAX_FILE_SIZE) {
        errorResponse('File too large. Maximum size is 5MB.', 400);
    }

    // Validate it's actually an image
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->buffer($decodedData);

    if (!in_array($mimeType, ALLOWED_TYPES)) {
        errorResponse('Invalid image data', 400);
    }

    // Generate unique filename
    $filename = generateUniqueFilename($extension);
    $filepath = UPLOAD_DIR . $filename;

    // Save file
    if (file_put_contents($filepath, $decodedData) === false) {
        errorResponse('Failed to save file', 500);
    }

    // Return success with URL
    successResponse([
        'filename' => $filename,
        'url' => UPLOAD_URL . $filename,
        'size' => $size,
        'type' => $mimeType,
    ], 'Image uploaded successfully');
}

/**
 * Handle file deletion
 */
function handleDelete(): void {
    $filename = $_GET['file'] ?? '';

    if (empty($filename)) {
        errorResponse('No filename provided', 400);
    }

    // Sanitize filename to prevent directory traversal
    $filename = basename($filename);
    $filepath = UPLOAD_DIR . $filename;

    // Check if file exists
    if (!file_exists($filepath)) {
        errorResponse('File not found', 404);
    }

    // Delete file
    if (!unlink($filepath)) {
        errorResponse('Failed to delete file', 500);
    }

    successResponse(null, 'File deleted successfully');
}

/**
 * Generate a unique filename
 */
function generateUniqueFilename(string $extension): string {
    $timestamp = time();
    $random = bin2hex(random_bytes(8));
    return "avatar_{$timestamp}_{$random}.{$extension}";
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMime(string $mimeType): string {
    $map = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
    ];
    return $map[$mimeType] ?? 'jpg';
}

/**
 * Get human-readable upload error message
 */
function getUploadErrorMessage($code): string {
    $errors = [
        UPLOAD_ERR_INI_SIZE => 'File exceeds server upload limit',
        UPLOAD_ERR_FORM_SIZE => 'File exceeds form upload limit',
        UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION => 'Upload stopped by extension',
    ];
    return $errors[$code] ?? 'Unknown upload error';
}
