<?php
// Hardened example only. Configure secrets outside the web root/environment.
$secret_api_key = getenv('UPLOAD_API_KEY');
$allowed_origin = getenv('APP_ORIGIN');
$upload_dir = __DIR__ . '/images/';
$base_url = rtrim(getenv('UPLOAD_BASE_URL'), '/') . '/images/';
$max_bytes = 10 * 1024 * 1024;

if (!$secret_api_key || !$allowed_origin || !$base_url) {
    http_response_code(503);
    exit;
}

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && hash_equals($allowed_origin, $origin)) {
    header('Access-Control-Allow-Origin: ' . $allowed_origin);
    header('Vary: Origin');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed']);
    exit;
}

$headers = array_change_key_case(getallheaders(), CASE_LOWER);
$client_key = $headers['x-api-key'] ?? '';
if (!hash_equals($secret_api_key, $client_key)) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded']);
    exit;
}

$file = $_FILES['image'];
if ($file['size'] <= 0 || $file['size'] > $max_bytes) {
    http_response_code(413);
    echo json_encode(['status' => 'error', 'message' => 'File is too large']);
    exit;
}

$allowed_types = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
    'application/pdf' => 'pdf',
];
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
if (!isset($allowed_types[$mime])) {
    http_response_code(415);
    echo json_encode(['status' => 'error', 'message' => 'Unsupported file type']);
    exit;
}

if (!is_dir($upload_dir) && !mkdir($upload_dir, 0755, true)) {
    http_response_code(500);
    exit;
}

$filename = bin2hex(random_bytes(16)) . '.' . $allowed_types[$mime];
if (!move_uploaded_file($file['tmp_name'], $upload_dir . $filename)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Upload failed']);
    exit;
}

echo json_encode(['status' => 'success', 'url' => $base_url . $filename]);
