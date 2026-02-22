<?php
/**
 * Image Upload Test Page
 * DELETE THIS FILE AFTER TESTING!
 *
 * @version v125
 */

require_once __DIR__ . '/config.php';
setCorsHeaders();

// Simple test for POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once __DIR__ . '/upload.php';
    exit;
}

// Show test form for GET
?>
<!DOCTYPE html>
<html>
<head>
    <title>Upload Test - v111</title>
    <style>
        body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #14b8a6; }
        .test-box { background: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success { background: #dcfce7; color: #166534; padding: 15px; border-radius: 8px; }
        .error { background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 8px; }
        .info { background: #e0f2fe; color: #0369a1; padding: 15px; border-radius: 8px; margin: 10px 0; }
        button { background: #14b8a6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0d9488; }
        pre { background: #1c1917; color: #fafaf9; padding: 15px; border-radius: 8px; overflow-x: auto; }
        input[type="file"] { margin: 10px 0; }
        #preview { max-width: 200px; max-height: 200px; margin: 10px 0; display: none; }
        #result { margin-top: 20px; }
    </style>
</head>
<body>
    <h1>🖼️ Image Upload Test</h1>

    <div class="test-box">
        <h3>1. Directory Check</h3>
        <?php
        $uploadDir = dirname(__DIR__) . '/uploads/avatars/';

        if (is_dir($uploadDir)) {
            echo "<div class='success'>✓ Upload directory exists: <code>$uploadDir</code></div>";

            if (is_writable($uploadDir)) {
                echo "<div class='success'>✓ Directory is writable</div>";
            } else {
                echo "<div class='error'>✗ Directory is NOT writable. Run: <code>chmod 755 $uploadDir</code></div>";
            }
        } else {
            echo "<div class='error'>✗ Upload directory does not exist: <code>$uploadDir</code></div>";
            echo "<div class='info'>Creating directory...</div>";
            if (mkdir($uploadDir, 0755, true)) {
                echo "<div class='success'>✓ Directory created successfully</div>";
            } else {
                echo "<div class='error'>✗ Failed to create directory. Check permissions.</div>";
            }
        }
        ?>
    </div>

    <div class="test-box">
        <h3>2. Upload Test (File)</h3>
        <form id="fileForm">
            <input type="file" id="fileInput" accept="image/*" />
            <img id="preview" />
            <br>
            <button type="submit">Upload File</button>
        </form>
        <div id="fileResult"></div>
    </div>

    <div class="test-box">
        <h3>3. Upload Test (Base64 - like the cropper uses)</h3>
        <form id="base64Form">
            <input type="file" id="base64Input" accept="image/*" />
            <img id="preview2" />
            <br>
            <button type="submit">Upload as Base64</button>
        </form>
        <div id="base64Result"></div>
    </div>

    <div class="test-box">
        <h3>4. Existing Uploads</h3>
        <?php
        $files = glob($uploadDir . '*.{jpg,jpeg,png,gif,webp}', GLOB_BRACE);
        if (count($files) > 0) {
            echo "<p>Found " . count($files) . " uploaded image(s):</p>";
            echo "<div style='display: flex; flex-wrap: wrap; gap: 10px;'>";
            foreach (array_slice($files, 0, 10) as $file) {
                $filename = basename($file);
                $url = '/uploads/avatars/' . $filename;
                echo "<div style='text-align: center;'>";
                echo "<img src='$url' style='width: 80px; height: 80px; object-fit: cover; border-radius: 8px;'><br>";
                echo "<small>$filename</small>";
                echo "</div>";
            }
            echo "</div>";
        } else {
            echo "<div class='info'>No uploaded images yet</div>";
        }
        ?>
    </div>

    <script>
        // Preview image
        document.getElementById('fileInput').onchange = function(e) {
            const preview = document.getElementById('preview');
            preview.src = URL.createObjectURL(e.target.files[0]);
            preview.style.display = 'block';
        };

        document.getElementById('base64Input').onchange = function(e) {
            const preview = document.getElementById('preview2');
            preview.src = URL.createObjectURL(e.target.files[0]);
            preview.style.display = 'block';
        };

        // File upload test
        document.getElementById('fileForm').onsubmit = async function(e) {
            e.preventDefault();
            const file = document.getElementById('fileInput').files[0];
            if (!file) { alert('Select a file first'); return; }

            const formData = new FormData();
            formData.append('image', file);

            document.getElementById('fileResult').innerHTML = '<div class="info">Uploading...</div>';

            try {
                const res = await fetch('/api/upload.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                document.getElementById('fileResult').innerHTML =
                    '<pre>' + JSON.stringify(data, null, 2) + '</pre>';

                if (data.success && data.data?.url) {
                    document.getElementById('fileResult').innerHTML +=
                        '<div class="success">✓ Upload successful!<br>URL: <a href="' + data.data.url + '" target="_blank">' + data.data.url + '</a></div>';
                }
            } catch (err) {
                document.getElementById('fileResult').innerHTML =
                    '<div class="error">Error: ' + err.message + '</div>';
            }
        };

        // Base64 upload test
        document.getElementById('base64Form').onsubmit = async function(e) {
            e.preventDefault();
            const file = document.getElementById('base64Input').files[0];
            if (!file) { alert('Select a file first'); return; }

            document.getElementById('base64Result').innerHTML = '<div class="info">Converting to base64...</div>';

            const reader = new FileReader();
            reader.onload = async function() {
                const base64 = reader.result;
                document.getElementById('base64Result').innerHTML = '<div class="info">Uploading base64...</div>';

                try {
                    const res = await fetch('/api/upload.php?base64=1', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: base64 })
                    });
                    const data = await res.json();
                    document.getElementById('base64Result').innerHTML =
                        '<pre>' + JSON.stringify(data, null, 2) + '</pre>';

                    if (data.success && data.data?.url) {
                        document.getElementById('base64Result').innerHTML +=
                            '<div class="success">✓ Base64 upload successful!<br>URL: <a href="' + data.data.url + '" target="_blank">' + data.data.url + '</a></div>';
                    }
                } catch (err) {
                    document.getElementById('base64Result').innerHTML =
                        '<div class="error">Error: ' + err.message + '</div>';
                }
            };
            reader.readAsDataURL(file);
        };
    </script>

    <div class="info" style="margin-top: 30px;">
        <strong>⚠️ Security:</strong> Delete this file after testing: <code>api/test_upload.php</code>
    </div>
</body>
</html>
