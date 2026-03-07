// Feed Page JavaScript - LinkedIn Style

// Use currentUser from app.js, don't redeclare it
let currentProfile = null;
let posts = [];
let likedPosts = new Set();

// Initialize feed - ONLY on the feed/home page (where feedPosts div exists)
document.addEventListener('DOMContentLoaded', async () => {
    // Guard: only run feed initialization on the actual feed page
    if (!document.getElementById('feedPosts')) {
        console.log('feed.js: Not on feed page, skipping feed initialization.');
        return;
    }

    if (!isAuthenticated()) {
        window.location.href = '/login';
        return;
    }
    
    try {
        // Get current user - try from localStorage first, then API
        let currentUser = window.currentUser || getCurrentUser();
        if (!currentUser) {
            currentUser = await apiRequest('/auth/me');
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        // Update global reference
        window.currentUser = currentUser;
        
        console.log('Current user:', currentUser);
        
        // Load profile and other data
        await loadProfile();
        await loadFeed();
        await loadNotifications();
        await loadConnections();
        await loadCeleNewsSidebar();
    } catch (error) {
        console.error('Error loading feed:', error);
        showNotification('Error loading feed. Please refresh.', 'error');
    }
});

async function loadNotifications() {
    try {
        const notifications = await apiRequest('/chat/notifications?unread_only=true');
        const unreadCount = notifications.filter(n => !n.is_read).length;
        if (unreadCount > 0) {
            const badge = document.getElementById('notifBadge');
            if (badge) {
                badge.textContent = unreadCount;
                badge.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function loadCeleNewsSidebar() {
    const list = document.getElementById('newsList');
    if (!list) return;
    try {
        const res = await apiRequest('/news/sidebar?limit=5');
        const items = (res && Array.isArray(res.articles)) ? res.articles : [];
        if (!items.length) {
            list.innerHTML = '<div class="news-item"><div class="news-title">No celebrity news available at the moment.</div></div>';
            return;
        }

        list.innerHTML = items.map(function (n) {
            const thumb = n.image_url ? '<img class="news-thumb" src="' + escapeHtml(n.image_url) + '" alt="news" onerror="this.style.display=\'none\'">' : '';
            const featured = n.is_featured ? ' • Featured' : '';
            const encodedUrl = encodeURIComponent(n.article_url || '');
            return '' +
                '<div class="news-item" onclick="window.open(decodeURIComponent(\'' + encodedUrl + '\'), \'_blank\', \'noopener\')">' +
                    thumb +
                    '<div class="news-title">' + escapeHtml(n.title || '') + '</div>' +
                    '<div class="news-meta">' + escapeHtml(n.source || 'Unknown') + ' | ' + escapeHtml(n.time_ago || 'Recently') + featured + '</div>' +
                    '<div class="news-desc">' + escapeHtml((n.description || '').slice(0, 180)) + '</div>' +
                    '<div class="news-readmore">Read More</div>' +
                '</div>';
        }).join('');
    } catch (err) {
        list.innerHTML = '<div class="news-item"><div class="news-title">Unable to load CeleNews</div><div class="news-meta">Please try again later</div></div>';
    }
}

async function loadConnections() {
    try {
        let followingList = [];
        let followersList = [];

        try {
            const following = await apiRequest('/connections/following');
            followingList = Array.isArray(following) ? following : [];
        } catch (e) {
            console.error('Error loading following:', e);
        }

        try {
            const followers = await apiRequest('/connections/followers');
            followersList = Array.isArray(followers) ? followers : [];
        } catch (e) {
            console.error('Error loading followers:', e);
        }

        const followersCountEl = document.getElementById('followersCount');
        const followingCountEl = document.getElementById('followingCount');

        if (followersCountEl) {
            followersCountEl.textContent = String(followersList.length);
        }
        if (followingCountEl) {
            followingCountEl.textContent = String(followingList.length);
        }

        const badge = document.getElementById('networkBadge');
        if (badge && followingList.length > 0) {
            badge.textContent = followingList.length;
            badge.style.display = 'block';
        }

        // Retry once if both look empty to avoid transient auth/network timing issues.
        if (followersList.length === 0 && followingList.length === 0) {
            setTimeout(() => {
                loadConnections().catch(() => {});
            }, 700);
        }
    } catch (error) {
        console.error('Error loading connections:', error);
    }
}

async function loadProfile() {
    try {
        const currentUser = window.currentUser || getCurrentUser();
        // Only try to load profile if user is an artist
        if (currentUser && currentUser.role === 'artist') {
            try {
                currentProfile = await apiRequest('/users/profiles/me');
            } catch (error) {
                console.log('Profile not found (user might not have created profile yet)');
                currentProfile = null;
            }
        } else {
            currentProfile = null;
        }
        
        // Update global reference
        window.currentProfile = currentProfile;
        
        updateProfileSidebar();
    } catch (error) {
        console.error('Error loading profile:', error);
        updateProfileSidebar();
    }
}

function updateProfileSidebar() {
    const currentUser = window.currentUser || getCurrentUser();
    if (!currentUser) {
        console.error('currentUser is not set');
        return;
    }

    // Update profile picture
    let initials = 'U';
    let displayName = 'User';
    let displayTitle = '';
    let displayLocation = '';
    
    if (currentProfile && currentProfile.name) {
        initials = currentProfile.name.charAt(0).toUpperCase();
        displayName = currentProfile.name;
        displayTitle = currentProfile.category || '';
        displayLocation = currentProfile.location || '';
    } else if (currentUser && currentUser.email) {
        initials = currentUser.email.charAt(0).toUpperCase();
        displayName = currentUser.email.split('@')[0];
        displayTitle = currentUser.role === 'artist' ? 'Complete your profile' : 
                      currentUser.role === 'organizer' ? 'Event Organizer' : 
                      currentUser.role === 'admin' ? 'Administrator' : 'User';
        displayLocation = '';
    }
    
    // Update all profile elements
    const profileInitialEl = document.getElementById('profileInitial');
    const profilePictureLargeEl = document.getElementById('profilePictureLarge');
    const userAvatarEl = document.getElementById('userAvatar');
    const profileNameEl = document.getElementById('profileName');
    const profileTitleEl = document.getElementById('profileTitle');
    const profileLocationEl = document.getElementById('profileLocation');
    
    if (profileInitialEl) profileInitialEl.textContent = initials;
    if (profilePictureLargeEl) {
        const span = profilePictureLargeEl.querySelector('span');
        if (span) span.textContent = initials;
    }
    if (userAvatarEl) userAvatarEl.textContent = initials;
    
    if (profileNameEl) profileNameEl.textContent = displayName;
    if (profileTitleEl) profileTitleEl.textContent = displayTitle;
    if (profileLocationEl) {
        profileLocationEl.textContent = displayLocation || (currentUser.role !== 'artist' ? '' : 'Location not set');
    }
    
    // Update modal user name if element exists
    const modalUserNameEl = document.getElementById('modalUserName');
    if (modalUserNameEl) modalUserNameEl.textContent = displayName;
}

function openNetworkTab(tab) {
    const safeTab = tab === 'followers' || tab === 'following' ? tab : 'following';
    window.location.href = '/connections?tab=' + encodeURIComponent(safeTab);
}

function focusPostInput() {
    document.getElementById('createPostModal').style.display = 'flex';
    document.getElementById('postContentInput').focus();
    // Reset media type when opening modal
    if (document.getElementById('postMediaType')) {
        document.getElementById('postMediaType').value = 'text';
    }
}

function setPostMediaType(type) {
    if (document.getElementById('postMediaType')) {
        document.getElementById('postMediaType').value = type;
    }
}

function filterPostsByType(mediaType) {
    // Delegate to the inline handler if available, or do it here
    if (typeof window._handleFilterClick === 'function') {
        window._handleFilterClick(mediaType);
    } else {
        loadFeed(mediaType);
    }
}

function openPostModalForType(type) {
    if (typeof window._openPostForType === 'function') {
        window._openPostForType(type);
    }
}

function closeCreatePostModal() {
    document.getElementById('createPostModal').style.display = 'none';
    document.getElementById('postContentInput').value = '';
    document.getElementById('postMediaPreview').innerHTML = '';
}

function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    const preview = document.getElementById('postMediaPreview');
    preview.innerHTML = '';
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

function handleVideoUpload(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('postMediaPreview');
    preview.innerHTML = '';
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const video = document.createElement('video');
            video.src = e.target.result;
            video.controls = true;
            preview.appendChild(video);
        };
        reader.readAsDataURL(file);
    }
}

let currentMediaFilter = null; // 'image', 'video', 'text', or null for all

async function loadFeed(mediaType = null) {
    const feedContainer = document.getElementById('feedPosts');
    if (!feedContainer) {
        console.log('loadFeed: feedPosts container not found, skipping.');
        return;
    }
    try {
        currentMediaFilter = mediaType;
        let url = '/posts?limit=20';
        if (mediaType) {
            url += `&media_type=${mediaType}`;
        }
        const feedPosts = await apiRequest(url);
        posts = feedPosts;
        displayPosts(feedPosts);
    } catch (error) {
        feedContainer.innerHTML = 
            '<div class="card"><p>Error loading feed. Please try again.</p></div>';
    }
}

function displayPosts(postsData) {
    const container = document.getElementById('feedPosts');
    if (!container) return;
    
    if (postsData.length === 0) {
        const filterLabels = { image: 'photos', video: 'videos', text: 'articles' };
        const filterIcons  = { image: '📷', video: '🎥', text: '📝' };
        const activeFilter = currentMediaFilter;
        
        if (activeFilter && filterLabels[activeFilter]) {
            container.innerHTML = `
                <div class="card">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">${filterIcons[activeFilter]}</div>
                        <h3>No ${filterLabels[activeFilter]} yet</h3>
                        <p style="color: var(--text-secondary);">Be the first to post a ${filterLabels[activeFilter].slice(0, -1)}!</p>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="card">
                    <div style="text-align: center; padding: 3rem;">
                        <h3>No posts yet</h3>
                        <p style="color: var(--text-secondary);">Start following people to see their posts in your feed!</p>
                    </div>
                </div>
            `;
        }
        return;
    }
    
    let html = '';
    for (const post of postsData) {
        html += createPostHTML(post);
    }
    
    container.innerHTML = html;
    
    // Attach event listeners
    postsData.forEach(post => {
        attachPostListeners(post.id);
    });
}

function createPostHTML(post) {
    let authorName = 'Unknown';
    let authorTitle = '';
    let authorEmail = '';
    
    if (post.author) {
        authorEmail = post.author.email || '';
        if (post.author.profile && post.author.profile.name) {
            authorName = post.author.profile.name;
            authorTitle = post.author.profile.category || '';
        } else if (post.author.first_name) {
            authorName = post.author.first_name + (post.author.last_name ? ' ' + post.author.last_name : '');
        } else if (authorEmail) {
            authorName = authorEmail.split('@')[0];
        }
    }
    
    const mediaUrls = post.media_urls ? JSON.parse(post.media_urls) : [];
    const timeAgo = getTimeAgo(post.created_at);
    const isLiked = likedPosts.has(post.id);
    
    // Check if the current user is the post author
    const currentUser = window.currentUser || getCurrentUser();
    const isOwner = currentUser && post.author_id === currentUser.id;

    let mediaHTML = '';
    if (mediaUrls.length > 0) {
        mediaUrls.forEach(url => {
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                if (isOwner) {
                    mediaHTML += `<img src="${url}" alt="Post media" class="post-media">`;
                } else {
                    mediaHTML += `<img src="${url}" alt="Post media" class="post-media no-download" oncontextmenu="return false;" draggable="false">`;
                }
            } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
                if (isOwner) {
                    mediaHTML += `<video src="${url}" class="post-media" controls></video>`;
                } else {
                    mediaHTML += `<video src="${url}" class="post-media no-download" controls controlsList="nodownload" oncontextmenu="return false;" draggable="false"></video>`;
                }
            }
        });
    }
    
    return `
        <div class="post-card" id="post-${post.id}">
            <div class="post-header">
                <div class="user-avatar-small">${authorName.charAt(0).toUpperCase()}</div>
                <div class="post-author-info">
                    <div class="post-author-name">${escapeHtml(authorName)}</div>
                    <div class="post-author-title">${escapeHtml(authorTitle)}</div>
                    <div class="post-time">${timeAgo}</div>
                </div>
                <button class="post-menu-btn" onclick="showPostMenu(${post.id})">⋯</button>
            </div>
            
            ${post.content ? `<div class="post-content">${escapeHtml(post.content)}</div>` : ''}
            
            ${mediaHTML ? `<div class="post-media-container">${mediaHTML}</div>` : ''}
            
            <div class="post-stats">
                ${post.likes_count > 0 ? `👍 ${post.likes_count}` : ''}
                ${post.comments_count > 0 ? ` • 💬 ${post.comments_count}` : ''}
            </div>
            
            <div class="post-actions">
                <button class="post-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                    <span>👍</span>
                    <span>Like</span>
                </button>
                <button class="post-action-btn" onclick="toggleComments(${post.id})">
                    <span>💬</span>
                    <span>Comment</span>
                </button>
                <button class="post-action-btn" onclick="sharePost(${post.id})">
                    <span>🔗</span>
                    <span>Share</span>
                </button>
            </div>
            
            <div class="post-comments" id="comments-${post.id}">
                <div id="comments-list-${post.id}"></div>
                <div class="add-comment">
                    <div class="user-avatar-small">${(currentProfile ? currentProfile.name : ((window.currentUser || getCurrentUser())?.email || 'U')).charAt(0).toUpperCase()}</div>
                    <input type="text" class="comment-input" id="comment-input-${post.id}" 
                           placeholder="Add a comment..." 
                           onkeypress="if(event.key==='Enter') addComment(${post.id})">
                </div>
            </div>
        </div>
    `;
}

async function createPost() {
    const content = document.getElementById('postContentInput').value.trim();
    const imageInput = document.getElementById('postImageInput');
    const videoInput = document.getElementById('postVideoInput');
    const mediaType = document.getElementById('postMediaType').value || 'text';
    
    if (!content && !imageInput.files.length && !videoInput.files.length) {
        showNotification('Please add some content to your post', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('content', content);
        
        let finalMediaType = mediaType;
        if (imageInput.files.length) {
            finalMediaType = 'image';
            Array.from(imageInput.files).forEach(file => {
                formData.append('files', file);
            });
        } else if (videoInput.files.length) {
            finalMediaType = 'video';
            formData.append('files', videoInput.files[0]);
        }
        
        formData.append('media_type', finalMediaType);
        
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to create post');
        }
        
        const newPost = await response.json();
        showNotification('Post created successfully!', 'success');
        
        // Close modal and clear inputs
        closeCreatePostModal();
        imageInput.value = '';
        videoInput.value = '';
        document.getElementById('postContentInput').value = '';
        document.getElementById('postMediaPreview').innerHTML = '';
        document.getElementById('postMediaType').value = 'text';
        
        // Reload feed with current filter
        await loadFeed(currentMediaFilter);
    } catch (error) {
        showNotification('Error creating post: ' + error.message, 'error');
    }
}

async function toggleLike(postId) {
    try {
        const response = await apiRequest(`/posts/${postId}/like`, {
            method: 'POST'
        });
        
        if (response.likes_count !== undefined) {
            const post = posts.find(p => p.id === postId);
            if (post) {
                post.likes_count = response.likes_count;
                if (likedPosts.has(postId)) {
                    likedPosts.delete(postId);
                } else {
                    likedPosts.add(postId);
                }
                await loadFeed(); // Refresh to update UI
            }
        }
    } catch (error) {
        showNotification('Error liking post', 'error');
    }
}

async function toggleComments(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    if (commentsDiv.classList.contains('show')) {
        commentsDiv.classList.remove('show');
    } else {
        commentsDiv.classList.add('show');
        await loadComments(postId);
    }
}

async function loadComments(postId) {
    try {
        const comments = await apiRequest(`/posts/${postId}/comments`);
        const container = document.getElementById(`comments-list-${postId}`);
        
        if (comments.length === 0) {
            container.innerHTML = '<p style="padding: 1rem; color: var(--text-secondary);">No comments yet</p>';
            return;
        }
        
        let html = '';
        for (const comment of comments) {
            html += `
                <div class="comment-item">
                    <div class="comment-avatar">${comment.author ? ((comment.author.profile && comment.author.profile.name) || comment.author.first_name || comment.author.email || 'U').charAt(0).toUpperCase() : 'U'}</div>
                    <div class="comment-content">
                        <span class="comment-author">${(comment.author && comment.author.profile && comment.author.profile.name) || (comment.author && comment.author.first_name ? (comment.author.first_name + (comment.author.last_name ? ' ' + comment.author.last_name : '')) : '') || (comment.author && comment.author.email) || 'User'}</span>
                        <span class="comment-text">${escapeHtml(comment.content)}</span>
                        <div class="comment-actions">
                            <span class="comment-action" onclick="likeComment(${comment.id})">Like</span>
                            <span class="comment-action">${getTimeAgo(comment.created_at)}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) return;
    
    // Disable input while sending
    input.disabled = true;
    input.placeholder = 'Posting...';
    
    try {
        await apiRequest(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        
        input.value = '';
        await loadComments(postId);
        
        // Update post comments count in local state and on screen
        const post = posts.find(p => p.id === postId);
        if (post) {
            post.comments_count = (post.comments_count || 0) + 1;
            const statsEl = document.querySelector(`#post-${postId} .post-stats, [data-post-id="${postId}"] .post-stats`);
            if (statsEl) {
                let statsText = '';
                if (post.likes_count > 0) statsText += `👍 ${post.likes_count}`;
                if (post.comments_count > 0) statsText += `${statsText ? ' • ' : ''}💬 ${post.comments_count}`;
                statsEl.innerHTML = statsText;
            }
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        showNotification('Error adding comment', 'error');
    } finally {
        input.disabled = false;
        input.placeholder = 'Add a comment...';
        input.focus();
    }
}

async function followUser(userId) {
    try {
        await apiRequest(`/connections/${userId}/follow`, {
            method: 'POST'
        });
        showNotification('User followed successfully!', 'success');
        await loadSuggestions();
    } catch (error) {
        showNotification(error.message || 'Error following user', 'error');
    }
}

function sharePost(postId) {
    const url = `${window.location.origin}/feed#post-${postId}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Post link copied to clipboard!', 'success');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Post link copied!', 'success');
    }
}

function showPostMenu(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    // Check if user owns the post
    const currentUser = window.currentUser || getCurrentUser();
    if (currentUser && post.author_id === currentUser.id) {
        if (confirm('Do you want to delete this post?')) {
            deletePost(postId);
        }
    } else {
        // Show options for other users' posts
        alert('Post options: Report, Hide post');
    }
}

async function deletePost(postId) {
    try {
        await apiRequest(`/posts/${postId}`, {
            method: 'DELETE'
        });
        showNotification('Post deleted successfully', 'success');
        await loadFeed();
    } catch (error) {
        showNotification('Error deleting post', 'error');
    }
}

function attachPostListeners(postId) {
    // Additional listeners can be attached here
}

function getTimeAgo(dateString) {
    if (!dateString) return '';

    // Force UTC interpretation: append 'Z' if the server timestamp lacks timezone info
    var raw = String(dateString).trim();
    var utcString = raw.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(raw)
        ? raw
        : raw + 'Z';
    var date = new Date(utcString);

    // Debug: uncomment to verify in browser console
    console.log('getTimeAgo →', 'Original:', raw, '| UTC string:', utcString, '| Parsed:', date.toISOString(), '| Now:', new Date().toISOString());

    if (isNaN(date.getTime())) return '';

    var diff = Date.now() - date.getTime();
    if (diff < 0) return 'Just now';

    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return minutes + ' min ago';
    if (hours === 1) return '1 hr ago';
    if (hours < 24) return hours + ' hr ago';
    if (days === 1) return '1 day ago';
    if (days < 7) return days + ' days ago';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.createPost = createPost;
window.toggleLike = toggleLike;
window.toggleComments = toggleComments;
window.addComment = addComment;
window.sharePost = sharePost;
window.focusPostInput = focusPostInput;
window.closeCreatePostModal = closeCreatePostModal;
window.handleImageUpload = handleImageUpload;
window.handleVideoUpload = handleVideoUpload;
window.showPostMenu = showPostMenu;
window.filterPostsByType = filterPostsByType;
window.setPostMediaType = setPostMediaType;
window.openPostModalForType = openPostModalForType;
window.loadFeed = loadFeed;
window.openNetworkTab = openNetworkTab;

