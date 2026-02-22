<?php
/**
 * Gantt Project Manager - Popup Login Page
 *
 * @version v95
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * This page can be opened as a popup window from any external website.
 * On successful login, it redirects to the main Gantt application.
 *
 * Usage:
 * 1. Direct link: <a href="https://your-domain.com/login.php" target="_blank">Login</a>
 * 2. Popup: window.open('https://your-domain.com/login.php', 'GanttLogin', 'width=450,height=600')
 * 3. Embed script: <script src="https://your-domain.com/login-embed.js"></script>
 */

// Get return URL if provided
$returnUrl = isset($_GET['return']) ? htmlspecialchars($_GET['return']) : '';
$isPopup = isset($_GET['popup']) && $_GET['popup'] === '1';
$theme = isset($_GET['theme']) && $_GET['theme'] === 'light' ? 'light' : 'dark';

// API base URL (same domain)
$apiUrl = '/api';
?>
<!DOCTYPE html>
<html lang="en" class="<?php echo $theme; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Oasis Capital Finance</title>
    <link rel="icon" type="image/png" href="/images/logo/ocf-logo.png">

    <style>
        :root {
            --primary: #14b8a6;
            --primary-hover: #0d9488;
            --primary-light: #99f6e4;
            --danger: #ef4444;
            --warning: #f59e0b;

            /* Light theme */
            --bg: #fafaf9;
            --bg-card: #ffffff;
            --bg-input: #ffffff;
            --text: #1c1917;
            --text-muted: #78716c;
            --text-light: #a8a29e;
            --border: #e7e5e4;
            --border-focus: #14b8a6;
            --shadow: rgba(0, 0, 0, 0.1);
        }

        .dark {
            --bg: #1c1917;
            --bg-card: #292524;
            --bg-input: #1c1917;
            --text: #fafaf9;
            --text-muted: #a8a29e;
            --text-light: #78716c;
            --border: #44403c;
            --border-focus: #14b8a6;
            --shadow: rgba(0, 0, 0, 0.3);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .login-container {
            width: 100%;
            max-width: 400px;
        }

        .login-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 10px 40px var(--shadow);
        }

        .logo-container {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo {
            height: 60px;
            width: auto;
            margin-bottom: 15px;
        }

        .logo-fallback {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            background: var(--primary);
            border-radius: 12px;
            color: white;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
        }

        .company-name {
            font-size: 18px;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 5px;
        }

        .app-name {
            font-size: 14px;
            color: var(--text-muted);
        }

        h1 {
            font-size: 24px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 8px;
            color: var(--text);
        }

        .subtitle {
            text-align: center;
            color: var(--text-muted);
            font-size: 14px;
            margin-bottom: 30px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: var(--text);
            margin-bottom: 8px;
        }

        input[type="text"],
        input[type="email"],
        input[type="password"] {
            width: 100%;
            padding: 12px 16px;
            font-size: 15px;
            border: 2px solid var(--border);
            border-radius: 10px;
            background: var(--bg-input);
            color: var(--text);
            transition: border-color 0.2s, box-shadow 0.2s;
            outline: none;
        }

        input:focus {
            border-color: var(--border-focus);
            box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
        }

        input::placeholder {
            color: var(--text-light);
        }

        .password-container {
            position: relative;
        }

        .toggle-password {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 4px;
        }

        .toggle-password:hover {
            color: var(--text);
        }

        .remember-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 25px;
        }

        .remember-me {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: var(--text-muted);
            cursor: pointer;
        }

        .remember-me input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: var(--primary);
        }

        .forgot-link {
            font-size: 14px;
            color: var(--primary);
            text-decoration: none;
        }

        .forgot-link:hover {
            text-decoration: underline;
        }

        .btn-login {
            width: 100%;
            padding: 14px 24px;
            font-size: 16px;
            font-weight: 600;
            color: white;
            background: var(--primary);
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.1s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .btn-login:hover {
            background: var(--primary-hover);
        }

        .btn-login:active {
            transform: scale(0.98);
        }

        .btn-login:disabled {
            background: var(--text-light);
            cursor: not-allowed;
            transform: none;
        }

        .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid var(--danger);
            color: var(--danger);
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 14px;
            margin-bottom: 20px;
            display: none;
        }

        .error-message.show {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .success-message {
            background: rgba(20, 184, 166, 0.1);
            border: 1px solid var(--primary);
            color: var(--primary);
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 14px;
            margin-bottom: 20px;
            display: none;
        }

        .success-message.show {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .divider {
            display: flex;
            align-items: center;
            margin: 25px 0;
            color: var(--text-light);
            font-size: 13px;
        }

        .divider::before,
        .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border);
        }

        .divider span {
            padding: 0 15px;
        }

        .demo-users {
            margin-top: 10px;
        }

        .demo-users h3 {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }

        .demo-user-btn {
            width: 100%;
            padding: 12px 16px;
            margin-bottom: 8px;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: border-color 0.2s, background-color 0.2s;
        }

        .demo-user-btn:hover {
            border-color: var(--primary);
            background: rgba(20, 184, 166, 0.05);
        }

        .demo-user-btn .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
        }

        .demo-user-btn.admin .avatar {
            background: rgba(239, 68, 68, 0.15);
            color: #dc2626;
        }

        .demo-user-btn.manager .avatar {
            background: rgba(20, 184, 166, 0.15);
            color: #0d9488;
        }

        .demo-user-btn.client .avatar {
            background: rgba(245, 158, 11, 0.15);
            color: #d97706;
        }

        .demo-user-btn .info {
            flex: 1;
            text-align: left;
        }

        .demo-user-btn .name {
            font-weight: 500;
            color: var(--text);
            font-size: 14px;
        }

        .demo-user-btn .role {
            font-size: 12px;
            color: var(--text-muted);
        }

        .demo-user-btn .arrow {
            color: var(--text-light);
        }

        footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: var(--text-light);
        }

        footer a {
            color: var(--primary);
            text-decoration: none;
        }

        footer a:hover {
            text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 480px) {
            .login-card {
                padding: 30px 20px;
            }

            .logo {
                height: 50px;
            }
        }

        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .login-card {
            animation: fadeIn 0.3s ease-out;
        }

        /* Icon SVGs */
        .icon {
            width: 20px;
            height: 20px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <!-- Logo -->
            <div class="logo-container">
                <img
                    src="/images/logo/OCFLogoSTrans.png"
                    alt="Oasis Capital Finance"
                    class="logo"
                    onerror="this.style.display='none'; document.getElementById('logo-fallback').style.display='inline-flex';"
                >
                <div id="logo-fallback" class="logo-fallback" style="display: none;">OCF</div>
                <div class="company-name">Oasis Capital Finance</div>
                <div class="app-name">Project Manager</div>
            </div>

            <!-- Title -->
            <h1>Welcome Back</h1>
            <p class="subtitle">Sign in to access your projects</p>

            <!-- Error/Success Messages -->
            <div id="error-message" class="error-message">
                <svg class="icon" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span id="error-text"></span>
            </div>

            <div id="success-message" class="success-message">
                <svg class="icon" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span id="success-text"></span>
            </div>

            <!-- Login Form -->
            <form id="login-form">
                <div class="form-group">
                    <label for="login">Email or Username</label>
                    <input
                        type="text"
                        id="login"
                        name="login"
                        placeholder="Enter your email or username"
                        autocomplete="username"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <div class="password-container">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            autocomplete="current-password"
                            required
                        >
                        <button type="button" class="toggle-password" onclick="togglePassword()">
                            <svg id="eye-icon" class="icon" viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="remember-row">
                    <label class="remember-me">
                        <input type="checkbox" id="remember" name="remember">
                        Remember me
                    </label>
                    <a href="#" class="forgot-link" onclick="showForgotPassword(); return false;">Forgot password?</a>
                </div>

                <button type="submit" class="btn-login" id="login-btn">
                    <span id="btn-text">Sign In</span>
                    <div id="btn-spinner" class="spinner" style="display: none;"></div>
                </button>
            </form>

            <!-- Demo Users Section -->
            <div class="divider"><span>or continue with demo account</span></div>

            <div class="demo-users">
                <button type="button" class="demo-user-btn admin" onclick="demoLogin('admin@oasiscapitalfinance.com', 'admin123')">
                    <div class="avatar">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </div>
                    <div class="info">
                        <div class="name">Admin User</div>
                        <div class="role">Full access to all features</div>
                    </div>
                    <div class="arrow">
                        <svg class="icon" viewBox="0 0 24 24">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </div>
                </button>

                <button type="button" class="demo-user-btn manager" onclick="demoLogin('sarah@oasiscapitalfinance.com', 'manager123')">
                    <div class="avatar">
                        <svg class="icon" viewBox="0 0 24 24">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        </svg>
                    </div>
                    <div class="info">
                        <div class="name">Sarah Johnson</div>
                        <div class="role">Manager - Create & manage projects</div>
                    </div>
                    <div class="arrow">
                        <svg class="icon" viewBox="0 0 24 24">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </div>
                </button>

                <button type="button" class="demo-user-btn client" onclick="demoLogin('contact@acmecorp.com', 'client123')">
                    <div class="avatar">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M3 21h18"/>
                            <path d="M9 8h1"/>
                            <path d="M9 12h1"/>
                            <path d="M9 16h1"/>
                            <path d="M14 8h1"/>
                            <path d="M14 12h1"/>
                            <path d="M14 16h1"/>
                            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
                        </svg>
                    </div>
                    <div class="info">
                        <div class="name">Acme Corporation</div>
                        <div class="role">Client - View allocated projects</div>
                    </div>
                    <div class="arrow">
                        <svg class="icon" viewBox="0 0 24 24">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </div>
                </button>
            </div>
        </div>

        <footer>
            <p>&copy; <?php echo date('Y'); ?> Oasis Capital Finance. All rights reserved.</p>
            <p style="margin-top: 5px;">
                <a href="/">Back to Dashboard</a>
            </p>
        </footer>
    </div>

    <script>
        const API_URL = '<?php echo $apiUrl; ?>';
        const RETURN_URL = '<?php echo $returnUrl; ?>' || '/';
        const IS_POPUP = <?php echo $isPopup ? 'true' : 'false'; ?>;

        // Form elements
        const form = document.getElementById('login-form');
        const loginInput = document.getElementById('login');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.getElementById('login-btn');
        const btnText = document.getElementById('btn-text');
        const btnSpinner = document.getElementById('btn-spinner');
        const errorMessage = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        const successMessage = document.getElementById('success-message');
        const successText = document.getElementById('success-text');

        // Toggle password visibility
        function togglePassword() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;

            const eyeIcon = document.getElementById('eye-icon');
            if (type === 'text') {
                eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
            } else {
                eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
            }
        }

        // Show error
        function showError(message) {
            errorText.textContent = message;
            errorMessage.classList.add('show');
            successMessage.classList.remove('show');
        }

        // Show success
        function showSuccess(message) {
            successText.textContent = message;
            successMessage.classList.add('show');
            errorMessage.classList.remove('show');
        }

        // Hide messages
        function hideMessages() {
            errorMessage.classList.remove('show');
            successMessage.classList.remove('show');
        }

        // Set loading state
        function setLoading(loading) {
            loginBtn.disabled = loading;
            btnText.style.display = loading ? 'none' : 'inline';
            btnSpinner.style.display = loading ? 'block' : 'none';
        }

        // Perform login
        async function doLogin(login, password) {
            hideMessages();
            setLoading(true);

            try {
                const response = await fetch(`${API_URL}/auth.php?action=login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ login, password })
                });

                const data = await response.json();

                if (data.success) {
                    showSuccess('Login successful! Redirecting...');

                    // Store user info in localStorage for the frontend app
                    const user = data.data;
                    localStorage.setItem('gantt-auth-user', String(user.id));
                    localStorage.setItem('gantt-user-data', JSON.stringify({
                        id: String(user.id),
                        name: user.full_name || user.username,
                        email: user.email,
                        role: user.role
                    }));

                    // Handle popup vs regular window
                    setTimeout(() => {
                        if (IS_POPUP && window.opener) {
                            // Notify parent window and close popup
                            window.opener.postMessage({
                                type: 'GANTT_LOGIN_SUCCESS',
                                user: user
                            }, '*');
                            window.close();
                        } else {
                            // Regular redirect
                            window.location.href = RETURN_URL;
                        }
                    }, 1000);
                } else {
                    showError(data.error || data.message || 'Login failed. Please check your credentials.');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Connection error. Please try again.');
                setLoading(false);
            }
        }

        // Form submit handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await doLogin(loginInput.value, passwordInput.value);
        });

        // Demo login
        function demoLogin(email, password) {
            loginInput.value = email;
            passwordInput.value = password;
            doLogin(email, password);
        }

        // Forgot password placeholder
        function showForgotPassword() {
            alert('Please contact your administrator to reset your password.\n\nEmail: admin@oasiscapitalfinance.com');
        }

        // Auto-focus email input
        loginInput.focus();

        // Check if already logged in
        async function checkExistingSession() {
            try {
                const response = await fetch(`${API_URL}/auth.php?action=me`, {
                    credentials: 'include'
                });
                const data = await response.json();

                if (data.success && data.data) {
                    // Already logged in, redirect
                    showSuccess('Already logged in. Redirecting...');
                    setTimeout(() => {
                        if (IS_POPUP && window.opener) {
                            window.opener.postMessage({
                                type: 'GANTT_LOGIN_SUCCESS',
                                user: data.data
                            }, '*');
                            window.close();
                        } else {
                            window.location.href = RETURN_URL;
                        }
                    }, 500);
                }
            } catch (error) {
                // Not logged in, show form
            }
        }

        // Check session on load
        // checkExistingSession();
    </script>
</body>
</html>
