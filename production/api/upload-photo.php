<?php
/**
 * Meeting Diary - Photo Upload API
 * Handles uploading person photos to pers-img directory
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse(405, 'Method not allowed');
}

// Define upload directory (relative to API folder)
$uploadDir = __DIR__ . '/../pers-img/';

// Create directory if it doesn't exist
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        sendErrorResponse(500, 'Failed to create upload directory');
    }
}

// Check if file was uploaded
if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE => 'File exceeds server upload limit',
        UPLOAD_ERR_FORM_SIZE => 'File exceeds form upload limit',
        UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION => 'Upload blocked by extension',
    ];

    $errorCode = $_FILES['photo']['error'] ?? UPLOAD_ERR_NO_FILE;
    $message = $errorMessages[$errorCode] ?? 'Unknown upload error';
    sendErrorResponse(400, $message);
}

$file = $_FILES['photo'];

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    sendErrorResponse(400, 'Invalid file type. Allowed: JPG, PNG, GIF, WebP');
}

// Validate file size (max 5MB)
$maxSize = 5 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    sendErrorResponse(400, 'File too large. Maximum size is 5MB');
}

// Generate unique filename
$extension = match($mimeType) {
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
    default => 'jpg'
};

$personId = $_POST['personId'] ?? null;
$filename = ($personId ? $personId : uniqid('person_', true)) . '_' . time() . '.' . $extension;
$targetPath = $uploadDir . $filename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    sendErrorResponse(500, 'Failed to save uploaded file');
}

// Resize image if needed (max 400x400)
try {
    resizeImage($targetPath, 400, 400);
} catch (Exception $e) {
    // If resize fails, keep original
    error_log('Image resize failed: ' . $e->getMessage());
}

// Return the relative path to the image
$photoPath = '/pers-img/' . $filename;

sendResponse([
    'success' => true,
    'photo' => $photoPath,
    'filename' => $filename
]);

/**
 * Resize image to fit within max dimensions while maintaining aspect ratio
 */
function resizeImage($path, $maxWidth, $maxHeight) {
    $imageInfo = getimagesize($path);
    if (!$imageInfo) return;

    list($width, $height, $type) = $imageInfo;

    // Check if resize is needed
    if ($width <= $maxWidth && $height <= $maxHeight) {
        return;
    }

    // Calculate new dimensions
    $ratio = min($maxWidth / $width, $maxHeight / $height);
    $newWidth = (int)($width * $ratio);
    $newHeight = (int)($height * $ratio);

    // Create image resource based on type
    switch ($type) {
        case IMAGETYPE_JPEG:
            $source = imagecreatefromjpeg($path);
            break;
        case IMAGETYPE_PNG:
            $source = imagecreatefrompng($path);
            break;
        case IMAGETYPE_GIF:
            $source = imagecreatefromgif($path);
            break;
        case IMAGETYPE_WEBP:
            $source = imagecreatefromwebp($path);
            break;
        default:
            return;
    }

    if (!$source) return;

    // Create new image
    $dest = imagecreatetruecolor($newWidth, $newHeight);

    // Preserve transparency for PNG and GIF
    if ($type === IMAGETYPE_PNG || $type === IMAGETYPE_GIF) {
        imagecolortransparent($dest, imagecolorallocatealpha($dest, 0, 0, 0, 127));
        imagealphablending($dest, false);
        imagesavealpha($dest, true);
    }

    // Resize
    imagecopyresampled($dest, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    // Save based on type
    switch ($type) {
        case IMAGETYPE_JPEG:
            imagejpeg($dest, $path, 85);
            break;
        case IMAGETYPE_PNG:
            imagepng($dest, $path, 8);
            break;
        case IMAGETYPE_GIF:
            imagegif($dest, $path);
            break;
        case IMAGETYPE_WEBP:
            imagewebp($dest, $path, 85);
            break;
    }

    // Cleanup
    imagedestroy($source);
    imagedestroy($dest);
}
