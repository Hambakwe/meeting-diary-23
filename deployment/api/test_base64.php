<?php
/**
 * Base64 Upload Debug Test
 * DELETE THIS FILE AFTER TESTING!
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check PHP limits
$limits = [
    'post_max_size' => ini_get('post_max_size'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'memory_limit' => ini_get('memory_limit'),
    'max_input_vars' => ini_get('max_input_vars'),
];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'info' => 'POST a JSON body with {"image": "data:image/...base64..."} to test',
        'php_limits' => $limits,
        'content_length_limit' => $limits['post_max_size'],
    ], JSON_PRETTY_PRINT);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get raw input
$rawInput = file_get_contents('php://input');
$inputLength = strlen($rawInput);

// Try to decode JSON
$jsonError = null;
$data = json_decode($rawInput, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    $jsonError = json_last_error_msg();
}

// Check for image data
$hasImage = isset($data['image']);
$imageLength = $hasImage ? strlen($data['image']) : 0;

// Try to process the image
$result = [
    'debug' => true,
    'php_limits' => $limits,
    'raw_input_length' => $inputLength,
    'raw_input_preview' => substr($rawInput, 0, 100) . '...',
    'json_decode_error' => $jsonError,
    'has_image_field' => $hasImage,
    'image_data_length' => $imageLength,
];

if ($hasImage && !$jsonError) {
    $imageData = $data['image'];

    // Check if it's a data URL
    if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
        $result['image_format'] = $matches[1];
        $result['is_data_url'] = true;

        // Extract base64 part
        $base64Data = substr($imageData, strpos($imageData, ',') + 1);
        $result['base64_length'] = strlen($base64Data);

        // Try to decode
        $decoded = base64_decode($base64Data);
        if ($decoded === false) {
            $result['decode_error'] = 'Failed to decode base64';
        } else {
            $result['decoded_size'] = strlen($decoded);
            $result['decoded_size_mb'] = round(strlen($decoded) / 1024 / 1024, 2) . ' MB';

            // Check MIME type
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->buffer($decoded);
            $result['detected_mime'] = $mimeType;

            // Try to save
            $uploadDir = dirname(__DIR__) . '/uploads/avatars/';
            $filename = 'test_' . time() . '.jpg';
            $filepath = $uploadDir . $filename;

            if (file_put_contents($filepath, $decoded) !== false) {
                $result['save_success'] = true;
                $result['saved_to'] = $filepath;
                $result['url'] = '/uploads/avatars/' . $filename;
            } else {
                $result['save_error'] = 'Failed to write file';
            }
        }
    } else {
        $result['is_data_url'] = false;
        $result['image_preview'] = substr($imageData, 0, 50);
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);
