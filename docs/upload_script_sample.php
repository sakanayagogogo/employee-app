<?php
// --- 設定 ---
// ★重要★ アプリ側と合わせる「合言葉（APIキー）」を決めてください
$secret_api_key = "union-connect-secret-key-12345"; 

// ★変更点：ファイルの種類が混ざるため、フォルダ名を 'images/' から 'uploads/' 等に変更しても良いかもしれません。
// （運用中の画像リンクが切れないように、とりあえず 'images/' のままにしてあります）
$upload_dir = 'images/'; 
$base_url = "https://t-union.jp/"; // あなたのドメイン(末尾にスラッシュ)

// アプリのURL (CORS許可設定)
// ※本番運用時は "https://union-connect-app-xxxxx.web.app" のように書き換えてください
$allowed_origin = "*"; 
// ----------------

ini_set('display_errors', 0);
ini_set('log_errors', 1);

// CORSヘッダー
header("Access-Control-Allow-Origin: " . $allowed_origin);
header("Access-Control-Allow-Headers: Content-Type, X-API-KEY");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit;
}

// 1. APIキーチェック
$headers = getallheaders();
// キー名が小文字になることがある対策
$client_key = '';
foreach ($headers as $name => $value) {
    if (strtolower($name) === 'x-api-key') {
        $client_key = $value;
        break;
    }
}

if ($client_key !== $secret_api_key) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Forbidden: Invalid API Key"]);
    exit;
}

// 2. ファイルチェック
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No file uploaded"]);
    exit;
}

if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

$file = $_FILES['image'];
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);

// ★変更点：許可する拡張子のリストを大幅に追加しました
$allowed_ext = [
    // 画像
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    // ドキュメント（PDF、テキスト）
    'pdf', 'txt', 'csv',
    // Microsoft Office (Word, Excel, PowerPoint)
    'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    // 圧縮ファイル（必要に応じて）
    'zip'
];

if (!in_array(strtolower($ext), $allowed_ext)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid file type"]);
    exit;
}

// ファイル名生成 (日付 + ランダム)
$filename = date("YmdHis") . "_" . uniqid() . "." . $ext;
$filepath = $upload_dir . $filename;

if (move_uploaded_file($file['tmp_name'], $filepath)) {
    $file_url = $base_url . $upload_dir . $filename;
    echo json_encode(["status" => "success", "url" => $file_url]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Upload failed"]);
}
?>
