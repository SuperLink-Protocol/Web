// Platform categories and their platforms
const PLATFORM_CATEGORIES = {
  'Messaging & Social': [
    'whatsapp', 'telegram', 'discord', 'twitter', 'snapchat'
  ],
  'Productivity (Google Workspace)': [
    'docs', 'sheets', 'slides', 'drive', 'calendar', 'meet'
  ],
  'Cloud Storage': [
    'dropbox', 'onedrive'
  ],
  'Note Taking & Organization': [
    'notion', 'evernote', 'trello', 'asana'
  ],
  'Email & Communication': [
    'gmail', 'outlook'
  ],
  'Video Conferencing': [
    'zoom', 'teams'
  ],
  'Development & Code': [
    'github', 'gitlab', 'bitbucket'
  ],
  'Social Networks': [
    'facebook', 'instagram', 'reddit', 'pinterest',
    'tumblr', 'vk', 'odnoklassniki', 'meetup'
  ],
  'Professional Networks': [
    'stack-overflow', 'medium', 'dev-to', 'behance',
    'dribbble', 'producthunt'
  ],
  'Video Platforms': [
    'youtube', 'vimeo', 'twitch', 'tiktok', 'dailymotion'
  ],
  'Photo Sharing': [
    'flickr', '500px', 'imgur', 'deviantart'
  ],
  'Blogging & Content': [
    'wordpress', 'blogger', 'substack', 'ghost'
  ],
  'Business & Professional': [
    'xing', 'angellist', 'crunchbase', 'glassdoor'
  ],
  'Dating & Social': [
    'tinder', 'bumble', 'okcupid', 'grindr'
  ],
  'Music & Audio': [
    'spotify', 'soundcloud', 'bandcamp', 'lastfm'
  ],
  'Gaming': [
    'steam', 'epic-games', 'battlenet', 'origin', 'gog'
  ],
  'Education & Learning': [
    'coursera', 'udemy', 'edx', 'khan-academy'
  ],
  'Other': [
    'quora', 'goodreads', 'letterboxd', 'duolingo', 'strava'
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  // Initialize platform list
  initializePlatformList();
  
  // Add search functionality
  const searchInput = document.getElementById('platformSearch');
  searchInput.addEventListener('input', (e) => {
    filterPlatforms(e.target.value.toLowerCase());
  });

  // Add tab switching functionality
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // Load and display message history
  loadMessageHistory();

  // Set up periodic refresh of message history
  setInterval(loadMessageHistory, 5000);

  // Check and display login status for each platform
  chrome.storage.local.get(['platformStatus'], (result) => {
    const status = result.platformStatus || {};
    updateStatusDisplay(status);
  });
});

function initializePlatformList() {
  const platformList = document.getElementById('platformList');
  platformList.innerHTML = '';

  // Create platform buttons for each category
  Object.entries(PLATFORM_CATEGORIES).forEach(([category, platforms]) => {
    const categoryDiv = document.createElement('div');
    categoryDiv.innerHTML = `
      <div class="platform-category">${category}</div>
      ${platforms.map(platform => `
        <button class="platform-button" data-platform="${platform}">
          ${formatPlatformName(platform)}
        </button>
      `).join('')}
    `;
    platformList.appendChild(categoryDiv);
  });

  // Add click handlers to all platform buttons
  document.querySelectorAll('.platform-button').forEach(button => {
    button.addEventListener('click', () => {
      const platform = button.dataset.platform;
      chrome.runtime.sendMessage({
        type: 'OPEN_MINI_BROWSER',
        platform: platform
      });
    });
  });
}

function filterPlatforms(searchTerm) {
  const platformList = document.getElementById('platformList');
  const buttons = platformList.querySelectorAll('.platform-button');
  const categories = platformList.querySelectorAll('.platform-category');
  
  // Hide all categories initially
  categories.forEach(category => {
    category.style.display = 'none';
  });

  // Show/hide buttons based on search term
  buttons.forEach(button => {
    const platformName = formatPlatformName(button.dataset.platform).toLowerCase();
    const shouldShow = platformName.includes(searchTerm);
    button.style.display = shouldShow ? 'block' : 'none';
    
    // Show category if any of its buttons are visible
    if (shouldShow) {
      const category = button.previousElementSibling;
      if (category && category.classList.contains('platform-category')) {
        category.style.display = 'block';
      }
    }
  });
}

function formatPlatformName(platform) {
  return platform
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function loadMessageHistory() {
  chrome.storage.local.get(['messageHistory'], (result) => {
    const history = result.messageHistory || [];
    const historyContainer = document.getElementById('messageHistory');
    
    // Sort messages by timestamp (newest first)
    history.sort((a, b) => b.timestamp - a.timestamp);
    
    // Display messages
    historyContainer.innerHTML = history.map(msg => `
      <div class="message-item">
        <span class="message-platform">${msg.fromPlatform} → ${msg.targetPlatform}:</span>
        <div>${msg.message}</div>
        <div class="message-time">${new Date(msg.timestamp).toLocaleString()}</div>
      </div>
    `).join('');
  });
}

function updateStatusDisplay(status) {
  document.querySelectorAll('.platform-button').forEach(button => {
    const platform = button.dataset.platform;
    if (status[platform]) {
      button.style.backgroundColor = '#45a049';
      button.textContent += ' ✓';
    }
  });
} 