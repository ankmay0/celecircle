// Shared LinkedIn-style header component
function createLinkedInHeader() {
    return `
        <header class="main-header">
            <div class="header-container">
                <div class="header-left">
                    <a href="/feed" class="logo-header">
                        <img src="/static/celecircle-logo.png" alt="CeleCircle" class="brand-logo-circle">
                    </a>
                    <div class="mobile-search-profile-row">
                        <div class="search-box header-search" id="searchBox">
                            <span class="search-icon">🔍</span>
                            <input type="text" placeholder="Search events, venues, planners..." class="search-input" id="searchInput" autocomplete="off">
                            <div id="searchResults" class="search-results"></div>
                        </div>
                        <button type="button" class="mobile-profile-trigger nav-profile" id="mobileProfileTrigger" aria-label="Open profile menu" onclick="toggleMeDropdown(event)">
                            <span class="nav-icon-header nav-me-avatar" aria-hidden="true">👤</span>
                        </button>
                    </div>
                </div>
                <nav class="header-nav">
                    <a href="/feed" class="nav-item-header" id="nav-home">
                        <span class="nav-icon-header">🏠</span>
                        <span class="nav-label">Home</span>
                    </a>
                    <a href="/connections" class="nav-item-header" id="nav-network">
                        <span class="nav-icon-header">👥</span>
                        <span class="nav-label">My Network</span>
                        <span class="nav-badge" id="networkBadge" style="display: none;">0</span>
                    </a>
                    <a href="/browse-gigs" class="nav-item-header" id="nav-gigs">
                        <span class="nav-icon-header">💼</span>
                        <span class="nav-label">Gigs</span>
                    </a>
                    <a href="/bookings" class="nav-item-header" id="nav-bookings">
                        <span class="nav-icon-header">📅</span>
                        <span class="nav-label">Bookings</span>
                    </a>
                    <a href="/chat" class="nav-item-header" id="nav-messaging">
                        <span class="nav-icon-header">💬</span>
                        <span class="nav-label">Messaging</span>
                        <span class="nav-badge" id="msgBadge" style="display:none;">0</span>
                    </a>
                    <div class="nav-item-header nav-notifications-dropdown" id="nav-notifications" onclick="toggleNotificationsDropdown(event)" style="cursor: pointer; user-select: none;">
                        <span class="nav-icon-header">🔔</span>
                        <span class="nav-label">Notifications</span>
                        <span class="nav-badge" id="notifBadge" style="display: none;">0</span>
                    </div>
                    <div class="nav-item-header nav-me-dropdown nav-profile" id="nav-me" onclick="toggleMeDropdown(event)">
                        <span class="nav-icon-header nav-me-avatar">👤</span>
                        <span class="nav-label nav-me-label"><span class="nav-me-text">Me</span><span class="dropdown-arrow">▼</span></span>
                    </div>
                </nav>
            </div>
        </header>
    `;
}

function createMobileBottomNav() {
    return `
        <nav class="mobile-nav" id="mobileNav">
            <a href="/feed" id="mobile-nav-home" aria-label="Home"><i class="nav-icon-header" aria-hidden="true">🏠</i><span class="nav-label">Home</span></a>
            <a href="/chat" id="mobile-nav-messaging" aria-label="Messages"><i class="nav-icon-header" aria-hidden="true">💬</i><span class="nav-label">Messages</span></a>
            <a href="/notifications" id="mobile-nav-notifications" aria-label="Notifications"><i class="nav-icon-header" aria-hidden="true">🔔</i><span class="nav-label">Notifications</span></a>
            <a href="/profile" id="mobile-nav-profile" aria-label="Profile"><i class="nav-icon-header" aria-hidden="true">👤</i><span class="nav-label">Profile</span></a>
            <button type="button" id="mobileQuickMenuToggle" class="mobile-quick-toggle" aria-label="Open quick menu" aria-expanded="false">
                <span class="menu-line"></span>
                <span class="menu-line"></span>
                <span class="menu-line"></span>
            </button>
            <div id="mobileQuickMenuPanel" class="mobile-quick-panel" aria-hidden="true">
                <a href="/connections" id="mobile-nav-network" aria-label="My Network"><i class="nav-icon-header" aria-hidden="true">👥</i><span class="nav-label">My Network</span></a>
                <a href="/bookings" id="mobile-nav-bookings" aria-label="My Bookings"><i class="nav-icon-header" aria-hidden="true">📅</i><span class="nav-label">My Bookings</span></a>
                <a href="/browse-gigs" id="mobile-nav-gigs" aria-label="Gigs"><i class="nav-icon-header" aria-hidden="true">💼</i><span class="nav-label">Gigs</span></a>
                <a href="#" id="mobile-nav-theme" aria-label="Toggle theme"><i class="nav-icon-header" aria-hidden="true">☀️</i><span class="nav-label">Theme</span></a>
            </div>
        </nav>
    `;
}

function setActiveNavItem(pageId) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item-header').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current page
    const activeItem = document.getElementById(`nav-${pageId}`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    document.querySelectorAll('#mobileNav a').forEach(item => {
        item.classList.remove('active');
    });
    const mobileItem = document.getElementById(`mobile-nav-${pageId}`);
    if (mobileItem) {
        mobileItem.classList.add('active');
    }
}

function initHeader() {
    const header = document.querySelector('header.main-header');
    if (!header) {
        const body = document.body;
        const headerHTML = createLinkedInHeader();
        body.insertAdjacentHTML('afterbegin', headerHTML);
        
        // After header is created, ensure notifications icon is clickable
        setTimeout(() => {
            attachNotificationListeners();
        }, 50);
    } else {
        // Header already exists, ensure listeners are attached
        attachNotificationListeners();
    }

    const existingMobileNav = document.getElementById('mobileNav');
    if (existingMobileNav) {
        existingMobileNav.outerHTML = createMobileBottomNav();
    } else {
        document.body.insertAdjacentHTML('beforeend', createMobileBottomNav());
    }
    bindMobileThemeToggle();
    bindMobileQuickMenu();
}

function bindMobileThemeToggle() {
    const themeLink = document.getElementById('mobile-nav-theme');
    if (!themeLink || themeLink.dataset.bound === 'true') return;

    const updateThemeIcon = () => {
        const icon = themeLink.querySelector('.nav-icon-header');
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (icon) icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    };

    themeLink.addEventListener('click', (event) => {
        event.preventDefault();
        if (typeof window.toggleTheme === 'function') {
            window.toggleTheme();
            updateThemeIcon();
        }
    });

    themeLink.dataset.bound = 'true';
    updateThemeIcon();
}

function bindMobileQuickMenu() {
    const menu = document.getElementById('mobileNav');
    const toggleBtn = document.getElementById('mobileQuickMenuToggle');
    const panel = document.getElementById('mobileQuickMenuPanel');
    if (!menu || !toggleBtn || !panel || toggleBtn.dataset.bound === 'true') return;

    const closeMenu = () => {
        panel.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
    };

    toggleBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = !panel.classList.contains('open');
        if (willOpen) {
            panel.classList.add('open');
            toggleBtn.setAttribute('aria-expanded', 'true');
            panel.setAttribute('aria-hidden', 'false');
        } else {
            closeMenu();
        }
    });

    document.addEventListener('click', (event) => {
        if (!menu.contains(event.target)) {
            closeMenu();
        }
    });

    panel.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            if (link.id !== 'mobile-nav-theme') {
                closeMenu();
            }
        });
    });

    toggleBtn.dataset.bound = 'true';
}

// Initialize header when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
} else {
    initHeader();
}

// Attach event listeners after header is created
function attachNotificationListeners() {
    const notifIcon = document.getElementById('nav-notifications');
    if (notifIcon && !notifIcon.hasAttribute('data-listener-attached')) {
        // Remove onclick attribute if present (from HTML)
        notifIcon.removeAttribute('onclick');
        
        // Ensure cursor and styles
        notifIcon.style.cursor = 'pointer';
        notifIcon.style.userSelect = 'none';
        notifIcon.style.webkitUserSelect = 'none';
        notifIcon.style.mozUserSelect = 'none';
        notifIcon.style.msUserSelect = 'none';
        notifIcon.style.pointerEvents = 'auto';
        notifIcon.style.position = 'relative';
        notifIcon.style.zIndex = '10';
        
        // Prevent text selection on child elements
        const children = notifIcon.querySelectorAll('*');
        children.forEach(child => {
            child.style.pointerEvents = 'none';
            child.style.userSelect = 'none';
        });
        
        // Add click handler with capture phase
        const clickHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('Notifications icon clicked (from linkedin-header.js)');
            if (typeof toggleNotificationsDropdown === 'function') {
                toggleNotificationsDropdown(e);
            } else if (typeof window.toggleNotificationsDropdown === 'function') {
                window.toggleNotificationsDropdown(e);
            }
            return false;
        };
        
        notifIcon.addEventListener('click', clickHandler, true); // Capture phase
        notifIcon.addEventListener('click', clickHandler, false); // Bubble phase (backup)
        
        notifIcon.setAttribute('data-listener-attached', 'true');
        console.log('Notifications icon listeners attached');
    }
}

// Try to attach listeners after a short delay
setTimeout(attachNotificationListeners, 200);
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(attachNotificationListeners, 100);
});

// Me dropdown functionality
function toggleMeDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('meDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    } else {
        createMeDropdown();
    }
}

function createMeDropdown() {
    // Remove existing dropdown if any
    const existing = document.getElementById('meDropdown');
    if (existing) existing.remove();

    const dropdown = document.createElement('div');
    dropdown.id = 'meDropdown';
    dropdown.className = 'me-dropdown';
    
    // Get user data - try to get from feed.js if available
    let currentUser, currentProfile;
    if (typeof window.getCurrentUser === 'function') {
        currentUser = window.getCurrentUser();
    } else if (typeof getCurrentUser === 'function') {
        currentUser = getCurrentUser();
    }
    
    // Try to get profile from feed.js if available
    if (typeof window.currentProfile !== 'undefined') {
        currentProfile = window.currentProfile;
    }
    
    const userEmail = currentUser ? currentUser.email : '';
    let userName = userEmail.split('@')[0];
    let userInitial = userName.charAt(0).toUpperCase();
    const userRole = currentUser ? currentUser.role : 'user';
    
    // Use profile data if available
    if (currentProfile && currentProfile.name) {
        userName = currentProfile.name;
        userInitial = currentProfile.name.charAt(0).toUpperCase();
    }
    
    // Role-based title
    let roleTitle = '';
    if (currentProfile && currentProfile.category) {
        roleTitle = currentProfile.category;
    } else if (userRole === 'artist') {
        roleTitle = 'Artist / Celebrity';
    } else if (userRole === 'organizer') {
        roleTitle = 'Event Organizer';
    } else if (userRole === 'admin') {
        roleTitle = 'Administrator';
    }
    
    let adminLinks = '';
    if (userRole === 'admin') {
        adminLinks = `
        <div class="dropdown-section">
            <div class="dropdown-section-title">Admin Panel</div>
            <a href="/admin" class="dropdown-item">
                <span class="dropdown-icon">📊</span>
                <span>Dashboard</span>
            </a>
            <a href="/admin/finance" class="dropdown-item">
                <span class="dropdown-icon">💹</span>
                <span>Finance</span>
            </a>
            <a href="/admin/analytics" class="dropdown-item">
                <span class="dropdown-icon">📈</span>
                <span>Analytics</span>
            </a>
            <a href="/admin/disputes" class="dropdown-item">
                <span class="dropdown-icon">⚖️</span>
                <span>Disputes</span>
            </a>
            <a href="/admin/settings" class="dropdown-item">
                <span class="dropdown-icon">💰</span>
                <span>Pricing & Settings</span>
            </a>
            <a href="/admin/reports" class="dropdown-item">
                <span class="dropdown-icon">📥</span>
                <span>Reports & Exports</span>
            </a>
            <a href="/admin/audit-logs" class="dropdown-item">
                <span class="dropdown-icon">📋</span>
                <span>Audit Logs</span>
            </a>
        </div>
        `;
    }

    let artistLinks = '';
    if (userRole === 'artist') {
        artistLinks = `
        <div class="dropdown-section">
            <div class="dropdown-section-title">Insights</div>
            <a href="/dashboard" class="dropdown-item">
                <span class="dropdown-icon">📈</span>
                <span>My Analytics</span>
            </a>
            <a href="/bookings" class="dropdown-item">
                <span class="dropdown-icon">📅</span>
                <span>My Bookings</span>
            </a>
        </div>
        `;
    }

    let organizerLinks = '';
    if (userRole === 'organizer') {
        organizerLinks = `
        <div class="dropdown-section">
            <div class="dropdown-section-title">Insights</div>
            <a href="/payment-history" class="dropdown-item">
                <span class="dropdown-icon">📊</span>
                <span>Payment History</span>
            </a>
            <a href="/bookings" class="dropdown-item">
                <span class="dropdown-icon">📅</span>
                <span>My Bookings</span>
            </a>
        </div>
        `;
    }

    const isAdmin = userRole === 'admin';

    dropdown.innerHTML = `
        <div class="dropdown-profile-section">
            <div class="dropdown-profile-pic">${userInitial}</div>
            <div class="dropdown-profile-info">
                <div class="dropdown-profile-name">${userName} ${currentUser && currentUser.is_verified ? '<span class="verified-badge">✓</span>' : ''}</div>
                <div class="dropdown-profile-title">${roleTitle}</div>
            </div>
            ${!isAdmin ? '<a href="/profile" class="btn-view-profile">View profile</a>' : ''}
        </div>
        
        ${adminLinks}
        ${artistLinks}
        ${organizerLinks}

        ${!isAdmin ? `
        <div class="dropdown-section">
            <div class="dropdown-section-title">Account</div>
            <a href="/premium" class="dropdown-item premium-item">
                <span class="dropdown-icon premium-icon">⭐</span>
                <span>Try Premium for free</span>
            </a>
            <a href="/settings" class="dropdown-item">
                <span class="dropdown-icon">⚙️</span>
                <span>Settings & Privacy</span>
            </a>
            <a href="/help" class="dropdown-item">
                <span class="dropdown-icon">❓</span>
                <span>Help</span>
            </a>
            <a href="/language" class="dropdown-item">
                <span class="dropdown-icon">🌐</span>
                <span>Language</span>
            </a>
        </div>
        
        <div class="dropdown-section">
            <div class="dropdown-section-title">Manage</div>
            <a href="/posts-activity" class="dropdown-item">
                <span class="dropdown-icon">📝</span>
                <span>Posts & Activity</span>
            </a>
            ${userRole === 'organizer' ? `
            <a href="/post-gig" class="dropdown-item">
                <span class="dropdown-icon">💼</span>
                <span>Job Posting Account</span>
            </a>
            ` : ''}
        </div>
        ` : ''}
        
        <div class="dropdown-divider"></div>
        <a href="#" class="dropdown-item signout-item" id="signoutLink">
            <span>Sign out</span>
        </a>
    `;
    
    document.body.appendChild(dropdown);
    positionMeDropdown();
    
    // Add logout event listener
    const signoutLink = dropdown.querySelector('#signoutLink');
    if (signoutLink) {
        signoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // Close dropdown first
            dropdown.style.display = 'none';
            
            // Try multiple ways to call logout
            if (typeof window.logout === 'function') {
                window.logout();
            } else if (typeof logout === 'function') {
                logout();
            } else {
                // Fallback logout - clear auth and redirect
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.href = '/';
            }
        });
    }
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && !e.target.closest('#nav-me') && !e.target.closest('#mobileProfileTrigger')) {
                dropdown.style.display = 'none';
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

function positionMeDropdown() {
    const dropdown = document.getElementById('meDropdown');
    const desktopTrigger = document.getElementById('nav-me');
    const mobileTrigger = document.getElementById('mobileProfileTrigger');
    const useMobileTrigger = window.innerWidth <= 768 && mobileTrigger;
    const navItem = useMobileTrigger ? mobileTrigger : desktopTrigger;
    if (dropdown && navItem) {
        const rect = navItem.getBoundingClientRect();
        
        dropdown.style.top = (rect.bottom + 5) + 'px';
        dropdown.style.bottom = 'auto';
        dropdown.style.right = Math.max(10, window.innerWidth - rect.right) + 'px';
        dropdown.style.left = 'auto';
        dropdown.style.display = 'block';
        
        setTimeout(() => {
            const dropdownRect = dropdown.getBoundingClientRect();
            if (dropdownRect.bottom > window.innerHeight - 10) {
                dropdown.style.maxHeight = (window.innerHeight - rect.bottom - 20) + 'px';
            }
        }, 0);
    }
}

// Update dropdown when user data changes
function updateMeDropdown() {
    const dropdown = document.getElementById('meDropdown');
    if (dropdown && dropdown.style.display === 'block') {
        createMeDropdown();
    }
}

// Close dropdown on window resize
window.addEventListener('resize', () => {
    const dropdown = document.getElementById('meDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    const notifDropdown = document.getElementById('notificationsDropdown');
    if (notifDropdown) {
        notifDropdown.style.display = 'none';
    }
});

// Notifications dropdown functionality
function toggleNotificationsDropdown(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const dropdown = document.getElementById('notificationsDropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            loadNotificationsDropdown();
        }
    } else {
        createNotificationsDropdown();
    }
    return false;
}

function createNotificationsDropdown() {
    // Remove existing dropdown if any
    const existing = document.getElementById('notificationsDropdown');
    if (existing) existing.remove();

    const dropdown = document.createElement('div');
    dropdown.id = 'notificationsDropdown';
    dropdown.className = 'notifications-dropdown';
    
    dropdown.innerHTML = `
        <div class="notifications-dropdown-header">
            <h3>Notifications</h3>
            <a href="/notifications" class="view-all-link">View all</a>
        </div>
        <div class="notifications-dropdown-content" id="notificationsDropdownContent">
            <div class="loading" style="padding: 2rem; text-align: center;">Loading notifications...</div>
        </div>
    `;
    
    document.body.appendChild(dropdown);
    positionNotificationsDropdown();
    
    // Load notifications
    loadNotificationsDropdown();
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && !e.target.closest('#nav-notifications')) {
                dropdown.style.display = 'none';
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

function positionNotificationsDropdown() {
    const dropdown = document.getElementById('notificationsDropdown');
    const navItem = document.getElementById('nav-notifications');
    if (dropdown && navItem) {
        const rect = navItem.getBoundingClientRect();
        
        // Position below the nav item
        dropdown.style.top = (rect.bottom + 5) + 'px';
        dropdown.style.right = Math.max(10, window.innerWidth - rect.right) + 'px';
        dropdown.style.left = 'auto';
        dropdown.style.display = 'block';
        
        // Ensure dropdown doesn't go off-screen
        setTimeout(() => {
            const dropdownRect = dropdown.getBoundingClientRect();
            if (dropdownRect.bottom > window.innerHeight - 10) {
                dropdown.style.top = (rect.top - dropdownRect.height - 5) + 'px';
            }
            if (dropdownRect.right > window.innerWidth - 10) {
                dropdown.style.right = '10px';
            }
        }, 0);
    }
}

async function loadNotificationsDropdown() {
    const container = document.getElementById('notificationsDropdownContent');
    if (!container) return;
    
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Please log in to see notifications</div>';
        return;
    }
    
    try {
        // Use apiRequest if available, otherwise use fetch
        let notifications;
        const apiRequestFn = window.apiRequest || (typeof apiRequest !== 'undefined' ? apiRequest : null);
        if (apiRequestFn) {
            notifications = await apiRequestFn('/chat/notifications?unread_only=false&limit=10');
        } else {
            const response = await fetch('/api/chat/notifications?unread_only=false&limit=10', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (!response.ok) throw new Error('Failed to load notifications');
            notifications = await response.json();
        }
        
        if (notifications.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">No notifications</div>';
            return;
        }
        
        let html = '';
        for (const notif of notifications) {
            const timeAgo = getNotificationTimeAgo(notif.created_at);
            const icon = getNotificationIcon(notif.type);
            const isUnread = !notif.is_read;
            
            html += `
                <div class="notification-dropdown-item ${isUnread ? 'unread' : ''}" onclick="handleNotificationClick(${notif.id}, '${notif.link || ''}')">
                    <div class="notification-item-icon">${icon}</div>
                    <div class="notification-item-content">
                        <div class="notification-item-title">${escapeHtml(notif.title)}</div>
                        <div class="notification-item-message">${escapeHtml(notif.message)}</div>
                        <div class="notification-item-time">${timeAgo}</div>
                    </div>
                    ${isUnread ? '<div class="notification-unread-dot"></div>' : ''}
                </div>
            `;
        }
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Error loading notifications</div>';
    }
}

function getNotificationTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

function getNotificationIcon(type) {
    const icons = {
        'message': '💬',
        'application': '📝',
        'payment': '💰',
        'review': '⭐',
        'gig': '💼',
        'connection': '👥',
        'default': '🔔'
    };
    return icons[type] || icons.default;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function handleNotificationClick(notificationId, link) {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return;
        
        // Mark as read
        const apiRequestFn = window.apiRequest || (typeof apiRequest !== 'undefined' ? apiRequest : null);
        if (apiRequestFn) {
            await apiRequestFn(`/chat/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
        } else {
            await fetch(`/api/chat/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }
        
        // Close dropdown
        const dropdown = document.getElementById('notificationsDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        
        // Navigate to link if provided
        if (link) {
            window.location.href = link;
        } else {
            // Reload notifications
            loadNotificationsDropdown();
            // Also update badge
            if (typeof loadNotifications === 'function') {
                loadNotifications();
            } else if (typeof window.loadNotifications === 'function') {
                window.loadNotifications();
            }
        }
    } catch (error) {
        console.error('Error handling notification:', error);
        if (link) {
            window.location.href = link;
        }
    }
}

// Make functions available globally
window.toggleNotificationsDropdown = toggleNotificationsDropdown;
window.handleNotificationClick = handleNotificationClick;

// Search functionality
let searchTimeout = null;
let currentSearchResults = [];

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput) {
        console.log('Search input not found, retrying...');
        setTimeout(initSearch, 500);
        return;
    }
    
    if (!searchResults) {
        console.error('Search results container not found');
        return;
    }
    
    console.log('Initializing search...');
    
    // Remove existing listeners to avoid duplicates
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);
    
    newInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            console.log('Performing search for:', query);
            performSearch(query);
        }, 300);
    });
    
    newInput.addEventListener('focus', function(e) {
        if (currentSearchResults.length > 0) {
            searchResults.style.display = 'block';
        }
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#searchBox')) {
            searchResults.style.display = 'none';
        }
    });
}

async function performSearch(query) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) {
        console.error('Search results container not found');
        return;
    }
    
    console.log('Starting search for:', query);
    searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
    searchResults.style.display = 'block';
    
    try {
        // Use apiRequest from app.js
        const apiRequestFn = window.apiRequest;
        if (!apiRequestFn) {
            console.error('apiRequest function not available');
            searchResults.innerHTML = '<div class="search-no-results">Search not initialized. Please refresh the page.</div>';
            return;
        }
        
        console.log('Calling API:', `/users/search?q=${encodeURIComponent(query)}&limit=10`);
        const results = await apiRequestFn(`/users/search?q=${encodeURIComponent(query)}&limit=10`);
        console.log('Search results:', results);
        currentSearchResults = results;
        await displaySearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = `<div class="search-no-results">Error: ${error.message || 'Please try again'}</div>`;
    }
}

async function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
        return;
    }
    
    // Check following status for all results
    const followingStatus = {};
    try {
        const apiRequestFn = window.apiRequest || apiRequest;
        if (apiRequestFn) {
            const following = await apiRequestFn('/connections/following');
            followingCache = following;
            followingCacheTime = Date.now();
            for (const user of following) {
                followingStatus[user.user_id] = true;
            }
        }
    } catch (error) {
        console.error('Error checking following status:', error);
    }
    
    let html = '';
    for (const result of results) {
        const initial = result.name.charAt(0).toUpperCase();
        const isFollowing = followingStatus[result.user_id] || false;
        
        html += `
            <div class="search-result-item" onclick="viewUserProfile(${result.user_id})">
                <div class="search-result-avatar">${initial}</div>
                <div class="search-result-info">
                    <div class="search-result-name">
                        ${escapeHtml(result.name)} ${result.is_verified ? '<span style="color: #0077b5;">✓</span>' : ''}
                    </div>
                    <div class="search-result-details">
                        ${escapeHtml(result.category || result.email.split('@')[0])}${result.location ? ' • ' + escapeHtml(result.location) : ''}
                    </div>
                </div>
                <div class="search-result-action" style="display: flex; gap: 4px;">
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="event.stopPropagation(); messageFromSearch(${result.user_id}, '${escapeHtml(result.name).replace(/'/g, "\\'")}', '${escapeHtml(result.category || '').replace(/'/g, "\\'")}')">💬</button>
                    ${isFollowing 
                        ? `<button class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;" onclick="event.stopPropagation(); unfollowFromSearch(${result.user_id})">Unfollow</button>`
                        : `<button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;" onclick="event.stopPropagation(); followFromSearch(${result.user_id})">Follow</button>`
                    }
                </div>
            </div>
        `;
    }
    
    searchResults.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function checkIfFollowing(userId) {
    try {
        const apiRequestFn = window.apiRequest || apiRequest;
        if (!apiRequestFn) return false;
        
        // Use cache if available and fresh
        const now = Date.now();
        if (!followingCache || (now - followingCacheTime) > CACHE_DURATION) {
            followingCache = await apiRequestFn('/connections/following');
            followingCacheTime = now;
        }
        return followingCache.some(u => u.user_id === userId);
    } catch (error) {
        return false;
    }
}

async function followFromSearch(userId) {
    try {
        const apiRequestFn = window.apiRequest || apiRequest;
        if (!apiRequestFn) {
            throw new Error('API function not available');
        }
        
        await apiRequestFn(`/connections/${userId}/follow`, {
            method: 'POST'
        });
        // Clear cache
        followingCache = null;
        
        const showNotif = window.showNotification || showNotification;
        if (showNotif) {
            showNotif('User followed successfully!', 'success');
        }
        
        // Refresh search results to update button
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value.trim().length >= 2) {
            performSearch(searchInput.value.trim());
        }
    } catch (error) {
        console.error('Follow error:', error);
        const showNotif = window.showNotification || showNotification;
        if (showNotif) {
            showNotif(error.message || 'Error following user', 'error');
        } else {
            alert(error.message || 'Error following user');
        }
    }
}

async function unfollowFromSearch(userId) {
    try {
        const apiRequestFn = window.apiRequest || apiRequest;
        if (!apiRequestFn) {
            throw new Error('API function not available');
        }
        
        await apiRequestFn(`/connections/${userId}/unfollow`, {
            method: 'DELETE'
        });
        // Clear cache
        followingCache = null;
        
        const showNotif = window.showNotification || showNotification;
        if (showNotif) {
            showNotif('User unfollowed successfully!', 'success');
        }
        
        // Refresh search results to update button
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value.trim().length >= 2) {
            performSearch(searchInput.value.trim());
        }
    } catch (error) {
        console.error('Unfollow error:', error);
        const showNotif = window.showNotification || showNotification;
        if (showNotif) {
            showNotif(error.message || 'Error unfollowing user', 'error');
        } else {
            alert(error.message || 'Error unfollowing user');
        }
    }
}

function viewUserProfile(userId) {
    window.location.href = '/view-profile?user_id=' + userId;
}

function messageFromSearch(userId, name, category) {
    window.location.href = '/chat?open_user=' + userId +
        '&name=' + encodeURIComponent(name || 'User') +
        '&category=' + encodeURIComponent(category || '');
}

// Make functions available globally
window.followFromSearch = followFromSearch;
window.unfollowFromSearch = unfollowFromSearch;
window.viewUserProfile = viewUserProfile;
window.messageFromSearch = messageFromSearch;

// Initialize search when header is created
function initHeaderWithSearch() {
    const header = document.querySelector('header.main-header');
    if (!header) {
        const body = document.body;
        const headerHTML = createLinkedInHeader();
        body.insertAdjacentHTML('afterbegin', headerHTML);
    }
    // Initialize search after header is created
    setTimeout(() => {
        initSearch();
    }, 100);
}

// Override initHeader to include search initialization
const originalInitHeader = initHeader;
initHeader = function() {
    originalInitHeader();
    setTimeout(() => {
        initSearch();
    }, 200);
};

// Initialize search when DOM is ready
function initializeSearchOnReady() {
    if (document.getElementById('searchInput') && document.getElementById('searchResults')) {
        initSearch();
    } else {
        setTimeout(initializeSearchOnReady, 100);
    }
}

// Also initialize search on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeSearchOnReady, 500);
    });
} else {
    setTimeout(initializeSearchOnReady, 500);
}

// ═══════════════════════════════════════════════════════
// MESSAGING BADGE — self-contained, no dependency on app.js
// Fetches unread count from /api/chat/conversations
// and updates the #msgBadge element in the navbar.
// ═══════════════════════════════════════════════════════
(function initMsgBadge() {
    function getToken() {
        return localStorage.getItem('authToken');
    }

    async function fetchUnreadMsgCount() {
        var token = getToken();
        if (!token) return;

        var badge = document.getElementById('msgBadge');
        if (!badge) return; // header not injected yet

        try {
            var resp = await fetch('/api/chat/conversations', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!resp.ok) return;
            var conversations = await resp.json();

            var total = 0;
            if (Array.isArray(conversations)) {
                for (var i = 0; i < conversations.length; i++) {
                    total += (conversations[i].unread_count || 0);
                }
            }

            if (total > 0) {
                badge.textContent = total > 9 ? '9+' : total;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        } catch (e) {
            // silently ignore network errors
        }
    }

    // Wait for the header to be in the DOM, then fetch + start polling
    function startBadgePolling() {
        if (!document.getElementById('msgBadge')) {
            setTimeout(startBadgePolling, 200);
            return;
        }
        // Initial fetch
        fetchUnreadMsgCount();
        // Poll every 30 seconds
        setInterval(fetchUnreadMsgCount, 30000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(startBadgePolling, 300);
        });
    } else {
        setTimeout(startBadgePolling, 300);
    }

    // Expose globally so chat page can refresh the badge
    window.refreshMsgBadge = fetchUnreadMsgCount;
})();

