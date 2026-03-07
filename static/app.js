// API Configuration
const API_BASE = '/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Theme Management
function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
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
    initTheme();
    updateNavigation();
    
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

