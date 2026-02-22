/**
 * Gantt Project Manager - Login Embed Script
 *
 * @version v86
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * Add this script to any website to enable popup login to Gantt Project Manager.
 *
 * USAGE:
 * ======
 *
 * Option 1: Auto-generate login button
 * ------------------------------------
 * <div id="gantt-login-button"></div>
 * <script src="https://your-domain.com/login-embed.js" data-target="gantt-login-button"></script>
 *
 * Option 2: Use your own button/link
 * ----------------------------------
 * <a href="#" onclick="GanttLogin.open(); return false;">Login to Project Manager</a>
 * <script src="https://your-domain.com/login-embed.js"></script>
 *
 * Option 3: With custom options
 * -----------------------------
 * <script src="https://your-domain.com/login-embed.js"></script>
 * <script>
 *   GanttLogin.init({
 *     baseUrl: 'https://your-domain.com',
 *     theme: 'dark',
 *     onSuccess: function(user) {
 *       console.log('User logged in:', user);
 *       window.location.href = 'https://your-domain.com/';
 *     }
 *   });
 * </script>
 */

(function(window, document) {
    'use strict';

    // Configuration
    var config = {
        baseUrl: '',  // Auto-detected from script src
        theme: 'dark',
        popupWidth: 450,
        popupHeight: 650,
        buttonText: 'Login to Project Manager',
        buttonStyle: 'default', // 'default', 'minimal', 'custom'
        onSuccess: null,
        onError: null,
        onClose: null
    };

    // Detect base URL from script tag
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].src;
        if (src && src.indexOf('login-embed.js') !== -1) {
            // Extract base URL
            config.baseUrl = src.replace(/\/login-embed\.js.*$/, '');

            // Check for data attributes
            var dataTarget = scripts[i].getAttribute('data-target');
            var dataTheme = scripts[i].getAttribute('data-theme');
            var dataButtonText = scripts[i].getAttribute('data-button-text');
            var dataButtonStyle = scripts[i].getAttribute('data-button-style');

            if (dataTheme) config.theme = dataTheme;
            if (dataButtonText) config.buttonText = dataButtonText;
            if (dataButtonStyle) config.buttonStyle = dataButtonStyle;

            // Auto-render button if target specified
            if (dataTarget) {
                document.addEventListener('DOMContentLoaded', function() {
                    GanttLogin.renderButton(dataTarget);
                });
            }
            break;
        }
    }

    // Popup window reference
    var popupWindow = null;

    // GanttLogin object
    var GanttLogin = {
        /**
         * Initialize with custom options
         */
        init: function(options) {
            if (options) {
                for (var key in options) {
                    if (options.hasOwnProperty(key) && config.hasOwnProperty(key)) {
                        config[key] = options[key];
                    }
                }
            }

            // Set up message listener
            this._setupMessageListener();

            return this;
        },

        /**
         * Open login popup
         */
        open: function(customOptions) {
            var opts = customOptions || {};
            var theme = opts.theme || config.theme;
            var returnUrl = opts.returnUrl || config.baseUrl + '/';

            var url = config.baseUrl + '/login.php?popup=1&theme=' + theme;
            if (returnUrl) {
                url += '&return=' + encodeURIComponent(returnUrl);
            }

            // Calculate popup position (center of screen)
            var width = opts.width || config.popupWidth;
            var height = opts.height || config.popupHeight;
            var left = (window.screen.width - width) / 2;
            var top = (window.screen.height - height) / 2;

            // Open popup
            popupWindow = window.open(
                url,
                'GanttLogin',
                'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes'
            );

            if (popupWindow) {
                popupWindow.focus();

                // Set up close detection
                var checkClosed = setInterval(function() {
                    if (popupWindow && popupWindow.closed) {
                        clearInterval(checkClosed);
                        if (config.onClose) {
                            config.onClose();
                        }
                    }
                }, 500);
            } else {
                // Popup blocked, redirect instead
                window.location.href = url.replace('popup=1', 'popup=0');
            }

            return popupWindow;
        },

        /**
         * Close popup if open
         */
        close: function() {
            if (popupWindow && !popupWindow.closed) {
                popupWindow.close();
            }
        },

        /**
         * Render login button in target element
         */
        renderButton: function(targetId, options) {
            var target = document.getElementById(targetId);
            if (!target) {
                console.error('GanttLogin: Target element not found:', targetId);
                return;
            }

            var opts = options || {};
            var buttonText = opts.buttonText || config.buttonText;
            var buttonStyle = opts.buttonStyle || config.buttonStyle;

            // Create button
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'gantt-login-btn';
            button.innerHTML = this._getButtonHTML(buttonText);

            // Apply styles
            this._applyButtonStyles(button, buttonStyle);

            // Click handler
            var self = this;
            button.onclick = function() {
                self.open(opts);
            };

            // Clear and append
            target.innerHTML = '';
            target.appendChild(button);

            return button;
        },

        /**
         * Get button inner HTML
         */
        _getButtonHTML: function(text) {
            var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>';
            return svg + '<span>' + text + '</span>';
        },

        /**
         * Apply button styles
         */
        _applyButtonStyles: function(button, style) {
            // Base styles
            button.style.display = 'inline-flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.padding = '12px 24px';
            button.style.fontSize = '15px';
            button.style.fontWeight = '600';
            button.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            button.style.border = 'none';
            button.style.borderRadius = '8px';
            button.style.cursor = 'pointer';
            button.style.transition = 'all 0.2s ease';

            if (style === 'minimal') {
                button.style.background = 'transparent';
                button.style.color = '#14b8a6';
                button.style.padding = '8px 16px';
                button.style.border = '1px solid #14b8a6';
            } else {
                // Default style
                button.style.background = 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)';
                button.style.color = 'white';
                button.style.boxShadow = '0 4px 14px rgba(20, 184, 166, 0.3)';
            }

            // Hover effects
            button.onmouseover = function() {
                if (style === 'minimal') {
                    this.style.background = 'rgba(20, 184, 166, 0.1)';
                } else {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 6px 20px rgba(20, 184, 166, 0.4)';
                }
            };
            button.onmouseout = function() {
                if (style === 'minimal') {
                    this.style.background = 'transparent';
                } else {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 4px 14px rgba(20, 184, 166, 0.3)';
                }
            };
        },

        /**
         * Set up message listener for popup communication
         */
        _setupMessageListener: function() {
            var self = this;

            window.addEventListener('message', function(event) {
                // Verify origin
                if (config.baseUrl && event.origin !== config.baseUrl) {
                    return;
                }

                var data = event.data;

                if (data && data.type === 'GANTT_LOGIN_SUCCESS') {
                    // Login successful
                    if (config.onSuccess) {
                        config.onSuccess(data.user);
                    } else {
                        // Default behavior: redirect to Gantt app
                        window.location.href = config.baseUrl + '/';
                    }
                } else if (data && data.type === 'GANTT_LOGIN_ERROR') {
                    // Login failed
                    if (config.onError) {
                        config.onError(data.error);
                    }
                }
            }, false);
        },

        /**
         * Check if user is logged in
         */
        checkSession: function(callback) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', config.baseUrl + '/api/auth.php?action=me', true);
            xhr.withCredentials = true;
            xhr.setRequestHeader('Accept', 'application/json');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response.success && response.data) {
                            callback(true, response.data);
                        } else {
                            callback(false, null);
                        }
                    } catch (e) {
                        callback(false, null);
                    }
                }
            };

            xhr.send();
        },

        /**
         * Logout user
         */
        logout: function(callback) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', config.baseUrl + '/api/auth.php?action=logout', true);
            xhr.withCredentials = true;
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    // Clear local storage
                    try {
                        localStorage.removeItem('gantt-auth-user');
                        localStorage.removeItem('gantt-user-data');
                    } catch (e) {}

                    if (callback) {
                        callback();
                    }
                }
            };

            xhr.send();
        }
    };

    // Initialize message listener
    GanttLogin._setupMessageListener();

    // Expose to global scope
    window.GanttLogin = GanttLogin;

})(window, document);
