// Global flag to prevent multiple triggers
let isProcessingProtocol = false;
let extensionContextValid = true;
let lastProtocolText = '';

// Function to detect superlink:// protocol in text
function detectSuperLink(text) {
  // Only match if protocol is followed by platform name and a dot
  const regex = /superlink\.([a-zA-Z0-9-]+)\.(?=\W|$)/;
  const match = text.match(regex);
  
  // Only return match if the text is exactly the protocol (no extra characters)
  if (match && text.trim() === `superlink.${match[1]}.`) {
    return match[1];
  }
  return null;
}

// Function to get platform-specific behavior
function getPlatformBehavior(platform) {
  const behaviors = {
    // Messaging platforms that support message forwarding
    'whatsapp': { supportsMessaging: true },
    'telegram': { supportsMessaging: true },
    'discord': { supportsMessaging: true },
    
    // Productivity apps that support document sharing
    'docs': { supportsSharing: true },
    'sheets': { supportsSharing: true },
    'slides': { supportsSharing: true },
    'drive': { supportsSharing: true },
    
    // Note taking apps that support content sharing
    'notion': { supportsSharing: true },
    'evernote': { supportsSharing: true },
    
    // Project management apps that support task sharing
    'trello': { supportsSharing: true },
    'asana': { supportsSharing: true },
    
    // Default behavior for other platforms
    'default': { supportsMessaging: false, supportsSharing: false }
  };
  
  return behaviors[platform] || behaviors.default;
}

// Function to check if we're on WhatsApp
function isWhatsApp() {
  return window.location.hostname.includes('whatsapp');
}

// Function to clear WhatsApp input specifically
function clearWhatsAppInput(element) {
  try {
    // WhatsApp specific clearing
    if (isWhatsApp()) {
      // Clear the contenteditable div
      element.innerHTML = '';
      element.textContent = '';
      
      // Remove any spans or other elements
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      
      // Force WhatsApp's internal state to update
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'deleteContentBackward',
        data: null
      });
      element.dispatchEvent(inputEvent);
      
      // Also dispatch a keydown event to trigger WhatsApp's internal handlers
      const keydownEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Backspace',
        keyCode: 8
      });
      element.dispatchEvent(keydownEvent);
      
      // Remove focus and selection
      element.blur();
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
      
      // Force WhatsApp to update its internal state
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } catch (error) {
    console.error('Error clearing WhatsApp input:', error);
  }
}

// Function to handle protocol detection and triggering
function handleProtocolDetection(text, inputElement) {
  // Prevent multiple simultaneous triggers
  if (isProcessingProtocol) {
    return false;
  }

  // Skip if we're still typing the protocol
  if (text.includes('superlink.') && !text.match(/superlink\.[a-zA-Z0-9-]+\.$/)) {
    return true;
  }

  const platform = detectSuperLink(text);
  if (platform) {
    // Set processing flag
    isProcessingProtocol = true;
    
    // Check if this platform is already being opened
    if (inputElement.dataset.superlinkOpening === platform) {
      isProcessingProtocol = false;
      return false;
    }
    
    const behavior = getPlatformBehavior(platform);
    
    // Mark this platform as being opened
    inputElement.dataset.superlinkOpening = platform;
    
    // Clear the input based on platform
    if (isWhatsApp()) {
      clearWhatsAppInput(inputElement);
    } else {
      // For other platforms
      if (inputElement.tagName === 'INPUT' || inputElement.tagName === 'TEXTAREA') {
        inputElement.value = '';
      } else if (inputElement.isContentEditable) {
        inputElement.textContent = '';
      }
      inputElement.blur();
    }
    
    // Trigger the platform opening
    try {
      chrome.runtime.sendMessage({
        type: 'OPEN_MINI_BROWSER',
        platform: platform,
        behavior: behavior,
        timestamp: Date.now(),
        forceNew: true
      }, response => {
        if (chrome.runtime.lastError) {
          console.error('Extension context error:', chrome.runtime.lastError);
          isProcessingProtocol = false;
          delete inputElement.dataset.superlinkOpening;
          return;
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      isProcessingProtocol = false;
      delete inputElement.dataset.superlinkOpening;
      return;
    }
    
    // Show a visual feedback
    showProtocolFeedback(inputElement);
    
    // Reset flags after a delay
    setTimeout(() => {
      delete inputElement.dataset.superlinkOpening;
      isProcessingProtocol = false;
      // Final clear attempt for WhatsApp
      if (isWhatsApp()) {
        clearWhatsAppInput(inputElement);
      }
    }, 1000);
    
    // Prevent any default behavior
    return false;
  }
  
  isProcessingProtocol = false;
  return true;
}

// Function to show visual feedback when protocol is detected
function showProtocolFeedback(element) {
  const originalBackground = element.style.backgroundColor;
  const originalTransition = element.style.transition;
  
  // Add visual feedback
  element.style.transition = 'background-color 0.3s ease';
  element.style.backgroundColor = '#e8f5e9';
  
  // Reset after animation
  setTimeout(() => {
    element.style.backgroundColor = originalBackground;
    element.style.transition = originalTransition;
  }, 500);
}

// Function to observe all possible input elements
function observeInputs() {
  // Selectors for all possible input elements
  const inputSelectors = [
    'input[type="text"]',
    'input[type="search"]',
    'input[type="email"]',
    'input[type="url"]',
    'input[type="tel"]',
    'input[type="number"]',
    'textarea',
    '[contenteditable="true"]',
    '[role="textbox"]',
    '[role="searchbox"]',
    '[role="combobox"]',
    '.editable',
    '.input',
    '.text-input',
    '.search-input',
    '.chat-input',
    '.message-input',
    '.comment-input'
  ].join(', ');

  // Function to setup input handler
  function setupInputHandler(element) {
    if (element.dataset.superlinkObserved) return;
    
    element.dataset.superlinkObserved = 'true';
    
    // Track the last protocol detection time
    let lastDetectionTime = 0;
    const COOLDOWN_PERIOD = 1000; // 1 second cooldown
    
    // Function to handle input events
    const handleInput = (e) => {
      // Skip if already processing or extension context is invalid
      if (isProcessingProtocol || !extensionContextValid) {
        return;
      }
      
      const now = Date.now();
      if (now - lastDetectionTime < COOLDOWN_PERIOD) {
        return;
      }
      
      try {
        const text = e.target.value || e.target.textContent || e.target.innerHTML || '';
        
        // Skip if we're still typing the protocol
        if (text.includes('superlink.') && !text.match(/superlink\.[a-zA-Z0-9-]+\.$/)) {
          return;
        }
        
        if (!handleProtocolDetection(text, e.target)) {
          lastDetectionTime = now;
          e.preventDefault();
          e.stopPropagation();
          
          // Additional clear for WhatsApp
          if (isWhatsApp()) {
            clearWhatsAppInput(e.target);
          }
        }
      } catch (error) {
        console.error('Error handling input:', error);
        isProcessingProtocol = false;
      }
    };
    
    // Handle different types of input events
    const events = ['input', 'change', 'keyup', 'keydown'];
    events.forEach(eventType => {
      element.addEventListener(eventType, handleInput, true);
    });
    
    // Handle paste events separately
    element.addEventListener('paste', (e) => {
      if (isProcessingProtocol || !extensionContextValid) {
        return;
      }
      
      const now = Date.now();
      if (now - lastDetectionTime < COOLDOWN_PERIOD) {
        return;
      }
      
      try {
        // Small delay to allow paste to complete
        setTimeout(() => {
          const text = e.target.value || e.target.textContent || e.target.innerHTML || '';
          
          // Skip if we're still typing the protocol
          if (text.includes('superlink.') && !text.match(/superlink\.[a-zA-Z0-9-]+\.$/)) {
            return;
          }
          
          if (!handleProtocolDetection(text, e.target)) {
            lastDetectionTime = now;
            e.preventDefault();
            e.stopPropagation();
            
            // Additional clear for WhatsApp
            if (isWhatsApp()) {
              clearWhatsAppInput(e.target);
            }
          }
        }, 100);
      } catch (error) {
        console.error('Error handling paste:', error);
        isProcessingProtocol = false;
      }
    }, true);
  }

  // Initial setup for existing elements
  document.querySelectorAll(inputSelectors).forEach(setupInputHandler);

  // Observer for dynamically added elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check the added node itself
            if (node.matches && node.matches(inputSelectors)) {
              setupInputHandler(node);
            }
            
            // Check children of the added node
            node.querySelectorAll(inputSelectors).forEach(setupInputHandler);
          }
        });
      }
    });
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Additional observer for attribute changes (for contenteditable elements)
  const attributeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'contenteditable' || 
           mutation.attributeName === 'role')) {
        const element = mutation.target;
        if (element.matches && element.matches(inputSelectors)) {
          setupInputHandler(element);
        }
      }
    });
  });

  // Observe all elements for attribute changes
  attributeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['contenteditable', 'role'],
    subtree: true
  });
}

// Listen for extension context changes
chrome.runtime.onConnect.addListener(function(port) {
  extensionContextValid = true;
  port.onDisconnect.addListener(function() {
    extensionContextValid = false;
    // Reset all flags when extension context is lost
    isProcessingProtocol = false;
    document.querySelectorAll('[data-superlink-opening]').forEach(el => {
      delete el.dataset.superlinkOpening;
    });
  });
});

// Initialize connection
const port = chrome.runtime.connect({ name: 'content-script' });

// Initialize the observers when the content script loads
observeInputs();

// Re-initialize observers when the page content changes (for single-page applications)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // Small delay to allow new content to load
    setTimeout(observeInputs, 1000);
  }
}).observe(document, { subtree: true, childList: true }); 