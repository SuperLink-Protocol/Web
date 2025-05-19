// Handle protocol registration
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage for message history
  chrome.storage.local.set({
    messageHistory: [],
    platformStatus: {}
  });

  // Register protocol handler using the Web API
  if ('registerProtocolHandler' in navigator) {
    try {
      navigator.registerProtocolHandler(
        'superlink.',
        chrome.runtime.getURL('handler.html?platform=%s'),
        'SuperLink Handler'
      );
    } catch (error) {
      console.error('Failed to register protocol handler:', error);
    }
  }
});

// Track open windows and their states
const openWindows = new Map();
const windowStates = new Map();
const lastOpenTimes = new Map();
const TELEGRAM_COOLDOWN = 5000; // 5 seconds cooldown for Telegram

// Comprehensive list of social media platforms
const PLATFORMS = {
  // Messaging Platforms
  'whatsapp': 'https://web.whatsapp.com',
  'telegram': 'https://web.telegram.org',
  'signal': 'https://signal.org',
  'viber': 'https://web.viber.com',
  'wechat': 'https://web.wechat.com',
  'line': 'https://line.me',
  'kakao': 'https://web.kakao.com',
  'discord': 'https://discord.com/app',
  'slack': 'https://slack.com',
  'microsoft-teams': 'https://teams.microsoft.com',
  
  // Social Networks
  'facebook': 'https://www.facebook.com',
  'instagram': 'https://www.instagram.com',
  'twitter': 'https://twitter.com',
  'linkedin': 'https://www.linkedin.com',
  'reddit': 'https://www.reddit.com',
  'pinterest': 'https://www.pinterest.com',
  'tumblr': 'https://www.tumblr.com',
  'vk': 'https://vk.com',
  'odnoklassniki': 'https://ok.ru',
  'meetup': 'https://www.meetup.com',
  
  // Professional Networks
  'github': 'https://github.com',
  'gitlab': 'https://gitlab.com',
  'stack-overflow': 'https://stackoverflow.com',
  'medium': 'https://medium.com',
  'dev-to': 'https://dev.to',
  'behance': 'https://www.behance.net',
  'dribbble': 'https://dribbble.com',
  'producthunt': 'https://www.producthunt.com',
  
  // Video Platforms
  'youtube': 'https://www.youtube.com',
  'vimeo': 'https://vimeo.com',
  'twitch': 'https://www.twitch.tv',
  'tiktok': 'https://www.tiktok.com',
  'dailymotion': 'https://www.dailymotion.com',
  
  // Photo Sharing
  'flickr': 'https://www.flickr.com',
  '500px': 'https://500px.com',
  'imgur': 'https://imgur.com',
  'deviantart': 'https://www.deviantart.com',
  
  // Blogging & Content
  'wordpress': 'https://wordpress.com',
  'blogger': 'https://www.blogger.com',
  'medium': 'https://medium.com',
  'substack': 'https://substack.com',
  'ghost': 'https://ghost.org',
  
  // Business & Professional
  'xing': 'https://www.xing.com',
  'angellist': 'https://angel.co',
  'crunchbase': 'https://www.crunchbase.com',
  'glassdoor': 'https://www.glassdoor.com',
  
  // Dating & Social
  'tinder': 'https://tinder.com',
  'bumble': 'https://bumble.com',
  'okcupid': 'https://www.okcupid.com',
  'grindr': 'https://web.grindr.com',
  
  // Music & Audio
  'spotify': 'https://open.spotify.com',
  'soundcloud': 'https://soundcloud.com',
  'bandcamp': 'https://bandcamp.com',
  'lastfm': 'https://www.last.fm',
  
  // Gaming
  'steam': 'https://store.steampowered.com',
  'epic-games': 'https://store.epicgames.com',
  'battlenet': 'https://battle.net',
  'origin': 'https://www.origin.com',
  'gog': 'https://www.gog.com',
  
  // Education & Learning
  'coursera': 'https://www.coursera.org',
  'udemy': 'https://www.udemy.com',
  'edx': 'https://www.edx.org',
  'khan-academy': 'https://www.khanacademy.org',
  
  // Other
  'quora': 'https://www.quora.com',
  'goodreads': 'https://www.goodreads.com',
  'letterboxd': 'https://letterboxd.com',
  'duolingo': 'https://www.duolingo.com',
  'strava': 'https://www.strava.com',
  
  // Productivity Suite (Google Workspace)
  'docs': 'https://docs.google.com',
  'sheets': 'https://sheets.google.com',
  'slides': 'https://slides.google.com',
  'drive': 'https://drive.google.com',
  'calendar': 'https://calendar.google.com',
  'meet': 'https://meet.google.com',
  
  // Cloud Storage
  'dropbox': 'https://www.dropbox.com',
  'onedrive': 'https://onedrive.live.com',
  
  // Note Taking & Organization
  'notion': 'https://www.notion.so',
  'evernote': 'https://www.evernote.com',
  'trello': 'https://trello.com',
  'asana': 'https://asana.com',
  
  // Email & Communication
  'gmail': 'https://mail.google.com',
  'outlook': 'https://outlook.live.com',
  
  // Video Conferencing
  'zoom': 'https://zoom.us',
  'teams': 'https://teams.microsoft.com',
  
  // Project Management & Development
  'bitbucket': 'https://bitbucket.org'
};

// Function to validate and get platform URL
function getPlatformUrl(platformName) {
  // Convert to lowercase and replace spaces with hyphens
  const normalizedName = platformName.toLowerCase().replace(/\s+/g, '-');
  
  // Check if the platform exists
  if (PLATFORMS[normalizedName]) {
    return PLATFORMS[normalizedName];
  }
  
  // If not found, return error URL
  return 'https://superlink.app/error?platform=' + encodeURIComponent(platformName);
}

// Function to open mini browser window
async function openMiniBrowser(platform, behavior, forceNew = false) {
  // Special handling for Telegram
  if (platform === 'telegram') {
    const now = Date.now();
    const lastOpenTime = lastOpenTimes.get('telegram') || 0;
    
    // Only apply cooldown for auto-opening (when forceNew is false)
    if (!forceNew && now - lastOpenTime < TELEGRAM_COOLDOWN) {
      console.log('Telegram cooldown active, skipping auto-open');
      return;
    }
    
    // Update last open time
    lastOpenTimes.set('telegram', now);
  }

  // Get the URL for the platform
  const url = getPlatformUrl(platform);
  if (!url) {
    console.error('Unknown platform:', platform);
    return;
  }

  // Check if we already have a window for this platform
  const existingWindow = openWindows.get(platform);
  if (existingWindow && !forceNew) {
    try {
      // Try to focus the existing window
      await chrome.windows.update(existingWindow.id, { focused: true });
      return;
    } catch (error) {
      // If window doesn't exist anymore, remove it from tracking
      openWindows.delete(platform);
      windowStates.delete(platform);
    }
  }

  // Create new window
  const window = await chrome.windows.create({
    url: url,
    type: 'popup',
    width: 800,
    height: 600,
    left: Math.floor(Math.random() * 100),
    top: Math.floor(Math.random() * 100)
  });

  // Track the window
  openWindows.set(platform, window);
  windowStates.set(platform, {
    isOpen: true,
    lastFocusTime: Date.now()
  });

  // Listen for window close
  chrome.windows.onRemoved.addListener(function onWindowClose(windowId) {
    if (windowId === window.id) {
      openWindows.delete(platform);
      windowStates.delete(platform);
      chrome.windows.onRemoved.removeListener(onWindowClose);
    }
  });

  // Listen for window focus changes
  chrome.windows.onFocusChanged.addListener(function onFocusChange(windowId) {
    if (windowId === window.id) {
      const state = windowStates.get(platform);
      if (state) {
        state.lastFocusTime = Date.now();
      }
    }
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_MINI_BROWSER') {
    // Special handling for Telegram
    if (message.platform === 'telegram') {
      const now = Date.now();
      const lastOpenTime = lastOpenTimes.get('telegram') || 0;
      
      // Only apply cooldown for auto-opening (when forceNew is false)
      if (!message.forceNew && now - lastOpenTime < TELEGRAM_COOLDOWN) {
        console.log('Telegram cooldown active, skipping auto-open');
        return;
      }
      
      // Update last open time
      lastOpenTimes.set('telegram', now);
    }
    
    // Always open with forceNew for protocol activation
    openMiniBrowser(message.platform, message.behavior, true);
  } else if (message.type === 'FORWARD_MESSAGE') {
    handleMessageForwarding(message);
  } else if (message.type === 'SHOW_NOTIFICATION') {
    showNotification(message.title, message.message);
  }
});

// Handle message forwarding between platforms
async function handleMessageForwarding(request) {
  const { message, fromPlatform, targetPlatform } = request;
  
  // Store message in history
  chrome.storage.local.get(['messageHistory'], (result) => {
    const history = result.messageHistory || [];
    history.push({
      message,
      fromPlatform,
      targetPlatform,
      timestamp: Date.now()
    });
    chrome.storage.local.set({ messageHistory: history });
  });

  // Find the target platform window
  const windows = await chrome.windows.getAll({ populate: true });
  const targetWindow = windows.find(window => {
    const tab = window.tabs.find(tab => 
      tab.url.includes(targetPlatform === 'whatsapp' ? 'web.whatsapp.com' : 'web.telegram.org')
    );
    return tab !== undefined;
  });

  if (targetWindow) {
    // Send message to the target platform
    const targetTab = targetWindow.tabs.find(tab => 
      tab.url.includes(targetPlatform === 'whatsapp' ? 'web.whatsapp.com' : 'web.telegram.org')
    );
    
    if (targetTab) {
      chrome.tabs.sendMessage(targetTab.id, {
        type: 'FORWARD_MESSAGE',
        message: message,
        fromPlatform: fromPlatform
      });
    }
  } else {
    // If target platform window is not open, open it
    openMiniBrowser(targetPlatform);
    // Wait for the window to load and then send the message
    setTimeout(() => {
      chrome.windows.getAll({ populate: true }, (windows) => {
        const newWindow = windows.find(window => {
          const tab = window.tabs.find(tab => 
            tab.url.includes(targetPlatform === 'whatsapp' ? 'web.whatsapp.com' : 'web.telegram.org')
          );
          return tab !== undefined;
        });
        
        if (newWindow) {
          const targetTab = newWindow.tabs.find(tab => 
            tab.url.includes(targetPlatform === 'whatsapp' ? 'web.whatsapp.com' : 'web.telegram.org')
          );
          
          if (targetTab) {
            chrome.tabs.sendMessage(targetTab.id, {
              type: 'FORWARD_MESSAGE',
              message: message,
              fromPlatform: fromPlatform
            });
          }
        }
      });
    }, 5000); // Wait 5 seconds for the window to load
  }
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message
  });
}

// Handle protocol activation through URL
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.url.startsWith('superlink.')) {
    // Get the platform name from the URL (between the dots)
    const platform = details.url.replace('superlink.', '').split('.')[0];
    // Always force new window for protocol activation
    openMiniBrowser(platform, null, true);
  }
}); 