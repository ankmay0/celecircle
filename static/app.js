// API Configuration
const API_BASE = '/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let themeMediaQuery = null;

// Theme Management
function ensureCeleCircleFavicon() {
    const iconHref = '/static/celecircle-logo.png';

    const upsertIcon = (relValue) => {
        let link = document.querySelector(`link[rel="${relValue}"]`);
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', relValue);
            document.head.appendChild(link);
        }
        link.setAttribute('type', 'image/png');
        link.setAttribute('href', iconHref);
    };

    upsertIcon('icon');
    upsertIcon('shortcut icon');
    upsertIcon('apple-touch-icon');
}

function initTheme() {
    const storedTheme = localStorage.getItem('theme');
    const themePreference = (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system')
        ? storedTheme
        : 'dark';
    setThemePreference(themePreference, false);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setThemePreference(newTheme);
}

function getResolvedTheme(themePreference) {
    if (themePreference === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themePreference === 'light' ? 'light' : 'dark';
}

function getThemePreference() {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
    return 'dark';
}

function isPaidVerified(userLike) {
    if (!userLike) return false;
    if (userLike.verification_payment_status && userLike.verification_payment_status !== 'approved') return false;
    if (!userLike.verification_type || !userLike.verification_expiry) return false;
    const expiry = new Date(userLike.verification_expiry);
    return !Number.isNaN(expiry.getTime()) && expiry.getTime() > Date.now();
}

function getVerificationBadgeClass(verificationType) {
    return verificationType === 'organizer_verified' ? 'celebadge-green' : 'celebadge-blue';
}

function getVerificationBadgeHTML(verificationType) {
    if (!verificationType) return '';
    const cls = getVerificationBadgeClass(verificationType);
    return `<span class="${cls}" title="Verified">✔</span>`;
}

function handleSystemThemeChange() {
    if (getThemePreference() === 'system') {
        const resolvedTheme = getResolvedTheme('system');
        document.documentElement.setAttribute('data-theme', resolvedTheme);
        if (typeof window.refreshThemeMenu === 'function') {
            window.refreshThemeMenu();
        }
    }
}

function bindSystemThemeListener() {
    if (themeMediaQuery) return;
    themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (typeof themeMediaQuery.addEventListener === 'function') {
        themeMediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (typeof themeMediaQuery.addListener === 'function') {
        themeMediaQuery.addListener(handleSystemThemeChange);
    }
}

function setThemePreference(themePreference, persist = true) {
    const safePreference = (themePreference === 'light' || themePreference === 'dark' || themePreference === 'system')
        ? themePreference
        : 'dark';
    const resolvedTheme = getResolvedTheme(safePreference);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    if (persist) {
        localStorage.setItem('theme', safePreference);
    }
    bindSystemThemeListener();
    if (typeof window.refreshThemeMenu === 'function') {
        window.refreshThemeMenu();
    }
}

function mountDesktopShell() {
    const path = window.location.pathname || '/';
    const skipShellExactPaths = ['/', '/index.html'];
    const skipShellPrefixes = ['/admin', '/eventnet'];
    if (skipShellExactPaths.includes(path)) return;
    if (skipShellPrefixes.some((prefix) => path.startsWith(prefix))) return;

    const main = document.querySelector('main.page-container');
    if (!main || main.classList.contains('cc-shell-mounted')) return;

    const shell = document.createElement('div');
    shell.className = 'cc-shell';

    const left = document.createElement('aside');
    left.className = 'cc-shell-left';
    left.innerHTML = `
        <div class="cc-nav-card">
            <div class="cc-nav-title">Navigation</div>
            <a href="/feed" class="cc-nav-link ${path === '/feed' ? 'active' : ''}">🏠 <span>Home</span></a>
            <a href="/connections" class="cc-nav-link ${path.startsWith('/connections') ? 'active' : ''}">👥 <span>My Network</span></a>
            <a href="/browse-gigs" class="cc-nav-link ${path.startsWith('/browse-gigs') || path.startsWith('/gig-detail') ? 'active' : ''}">💼 <span>Gigs</span></a>
            <a href="/chat" class="cc-nav-link ${path.startsWith('/chat') ? 'active' : ''}">💬 <span>Messages</span></a>
            <a href="/profile" class="cc-nav-link ${path.startsWith('/profile') || path.startsWith('/view-profile') ? 'active' : ''}">👤 <span>Profile</span></a>
        </div>
    `;

    const center = document.createElement('section');
    center.className = 'cc-shell-main';
    while (main.firstChild) {
        center.appendChild(main.firstChild);
    }

    const right = document.createElement('aside');
    const hideRightPanel = ['/chat', '/post-gig', '/secure-payments', '/terms', '/escrow', '/payout', '/help'].some((prefix) =>
        path.startsWith(prefix)
    );
    right.className = `cc-shell-right${hideRightPanel ? ' hidden' : ''}`;
    right.innerHTML = `
        <div class="cc-widget-card">
            <div class="cc-widget-title">Trending Topics</div>
            <ul class="cc-widget-list">
                <li>Ollywood industry updates</li>
                <li>Live event opportunities</li>
                <li>Creator collaborations</li>
            </ul>
        </div>
        <div class="cc-widget-card">
            <div class="cc-widget-title">People You May Know</div>
            <ul class="cc-widget-list">
                <li>Top event organizers</li>
                <li>Verified performers</li>
                <li>Production collaborators</li>
            </ul>
        </div>
    `;

    shell.appendChild(left);
    shell.appendChild(center);
    shell.appendChild(right);
    main.appendChild(shell);
    main.classList.add('cc-shell-page', 'cc-shell-mounted');
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, config);
        
        // Check content type before parsing JSON
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // If not JSON, read as text
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        if (!response.ok) {
            // Log full backend payload for debugging
            console.error('API Error payload:', data);

            let messages = [];

            // FastAPI / Pydantic: {"detail": [ {...}, {...} ]}
            if (data && Array.isArray(data.detail)) {
                messages = data.detail.map((d) => {
                    if (!d) return '';
                    if (typeof d === 'string') return d;

                    // Pydantic validation error format
                    if (d.msg) {
                        const loc = Array.isArray(d.loc) ? d.loc.join('.') : '';
                        return loc ? `${loc}: ${d.msg}` : d.msg;
                    }

                    if (d.detail) {
                        return typeof d.detail === 'string'
                            ? d.detail
                            : JSON.stringify(d.detail);
                    }

                    return JSON.stringify(d);
                }).filter(Boolean);
            }

            // Generic "errors" array: { errors: [...] }
            if ((!messages.length) && data && Array.isArray(data.errors)) {
                messages = data.errors.map((e) =>
                    typeof e === 'string' ? e : JSON.stringify(e)
                ).filter(Boolean);
            }

            // Single detail/message fields
            if (!messages.length && data && typeof data.detail === 'string') {
                messages.push(data.detail);
            }
            if (!messages.length && data && typeof data.message === 'string') {
                messages.push(data.message);
            }

            // Fallback to status line if we still have nothing
            if (!messages.length) {
                messages.push(`Request failed with status ${response.status}`);
            }

            const error = new Error(messages.join(' | '));
            error.status = response.status;
            error.payload = data;
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        // If it's already an Error object with status, re-throw it
        if (error.status) {
            throw error;
        }
        // If it's a network error or parsing error, wrap it
        if (error.message.includes('JSON') || error.message.includes('Unexpected token')) {
            throw new Error('Server returned an invalid response. Please check the server logs.');
        }
        throw error;
    }
}

// Auth Functions
async function login(email, password) {
    const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    authToken = response.access_token;
    localStorage.setItem('authToken', authToken);
    
    // Get current user
    currentUser = await apiRequest('/auth/me');
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    return response;
}

async function register(email, password, role, first_name, last_name, username) {
    await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, role, first_name, last_name, username })
    });
    // OTP request is now handled in the register.html page
}

async function verifyOTP(email, otp) {
    await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
    });
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/';
}

// Make logout available globally
window.logout = logout;

function isAuthenticated() {
    return !!authToken;
}

function getCurrentUser() {
    if (!currentUser) {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            currentUser = JSON.parse(stored);
        }
    }
    return currentUser;
}

async function syncCurrentUser() {
    if (!authToken) return null;
    try {
        const latest = await apiRequest('/auth/me');
        currentUser = latest;
        localStorage.setItem('currentUser', JSON.stringify(latest));
        window.currentUser = latest;
        if (typeof window.updateMeDropdown === 'function') {
            window.updateMeDropdown();
        }
        return latest;
    } catch (error) {
        return null;
    }
}

// Navigation
function updateNavigation() {
    // Navigation is now handled by LinkedIn-style header
    // This function is kept for backward compatibility
    const user = getCurrentUser();
    if (user) {
        // Update header badges if needed
        loadNotifications();
        loadConnections();
    }
}

async function loadNotifications() {
    if (!isAuthenticated()) return;
    try {
        const notifications = await apiRequest('/chat/notifications?unread_only=true');
        const unreadCount = notifications.filter(n => !n.is_read).length;
        const badge = document.getElementById('notifBadge');
        if (badge && unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'block';
        }
    } catch (error) {
        // Ignore errors
    }
}

async function loadConnections() {
    if (!isAuthenticated()) return;
    try {
        const following = await apiRequest('/connections/following');
        const badge = document.getElementById('networkBadge');
        if (badge && following.length > 0) {
            badge.textContent = following.length;
            badge.style.display = 'block';
        }
    } catch (error) {
        // Ignore errors
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'error' ? 'var(--danger-color)' : 'var(--success-color)'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: fadeIn 0.3s;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    ensureCeleCircleFavicon();
    initTheme();
    mountDesktopShell();
    updateNavigation();
    syncCurrentUser();
    setInterval(syncCurrentUser, 5000);
    
    // Close modals on outside click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
});

// Export for use in other scripts
window.apiRequest = apiRequest;
window.login = login;
window.register = register;
window.verifyOTP = verifyOTP;
window.logout = logout;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleTheme = toggleTheme;
window.setThemePreference = setThemePreference;
window.getThemePreference = getThemePreference;
window.isPaidVerified = isPaidVerified;
window.getVerificationBadgeClass = getVerificationBadgeClass;
window.getVerificationBadgeHTML = getVerificationBadgeHTML;
window.syncCurrentUser = syncCurrentUser;

