// Message handling between platforms
class MessageHandler {
  constructor() {
    this.platform = this.detectPlatform();
    this.messageQueue = [];
    this.setupMessageListeners();
    this.setupMessageObservers();
  }

  detectPlatform() {
    if (window.location.hostname.includes('telegram')) {
      return 'telegram';
    } else if (window.location.hostname.includes('whatsapp')) {
      return 'whatsapp';
    }
    return null;
  }

  setupMessageListeners() {
    // Listen for messages from other platforms
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'FORWARD_MESSAGE') {
        this.handleIncomingMessage(request.message, request.fromPlatform);
      }
    });
  }

  setupMessageObservers() {
    if (this.platform === 'telegram') {
      this.setupTelegramObserver();
    } else if (this.platform === 'whatsapp') {
      this.setupWhatsAppObserver();
    }
  }

  setupTelegramObserver() {
    // Observe Telegram chat container
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Look for new messages
              const messages = node.querySelectorAll('.message');
              messages.forEach(message => {
                if (message.dataset.processed) return;
                message.dataset.processed = 'true';
                
                const text = message.querySelector('.text-content')?.textContent;
                if (text) {
                  this.forwardMessage(text, 'telegram');
                }
              });
            }
          });
        }
      });
    });

    // Start observing when chat container is available
    const checkChatContainer = setInterval(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        observer.observe(chatContainer, { childList: true, subtree: true });
        clearInterval(checkChatContainer);
      }
    }, 1000);
  }

  setupWhatsAppObserver() {
    // Observe WhatsApp chat container
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Look for new messages
              const messages = node.querySelectorAll('.message-in, .message-out');
              messages.forEach(message => {
                if (message.dataset.processed) return;
                message.dataset.processed = 'true';
                
                const text = message.querySelector('.selectable-text')?.textContent;
                if (text) {
                  this.forwardMessage(text, 'whatsapp');
                }
              });
            }
          });
        }
      });
    });

    // Start observing when chat container is available
    const checkChatContainer = setInterval(() => {
      const chatContainer = document.querySelector('#main .copyable-area');
      if (chatContainer) {
        observer.observe(chatContainer, { childList: true, subtree: true });
        clearInterval(checkChatContainer);
      }
    }, 1000);
  }

  forwardMessage(text, fromPlatform) {
    // Store message in queue
    this.messageQueue.push({
      text,
      fromPlatform,
      timestamp: Date.now()
    });

    // Forward to other platform
    const targetPlatform = fromPlatform === 'telegram' ? 'whatsapp' : 'telegram';
    
    chrome.runtime.sendMessage({
      type: 'FORWARD_MESSAGE',
      message: text,
      fromPlatform: fromPlatform,
      targetPlatform: targetPlatform
    });

    // Show notification
    chrome.runtime.sendMessage({
      type: 'SHOW_NOTIFICATION',
      title: `New message from ${fromPlatform}`,
      message: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    });
  }

  handleIncomingMessage(message, fromPlatform) {
    if (this.platform === 'telegram') {
      this.insertTelegramMessage(message);
    } else if (this.platform === 'whatsapp') {
      this.insertWhatsAppMessage(message);
    }
  }

  insertTelegramMessage(message) {
    const input = document.querySelector('.input-message-input');
    if (input) {
      input.textContent = message;
      // Trigger input event to enable send button
      input.dispatchEvent(new Event('input', { bubbles: true }));
      // Find and click send button
      const sendButton = document.querySelector('.btn-send');
      if (sendButton) {
        sendButton.click();
      }
    }
  }

  insertWhatsAppMessage(message) {
    const input = document.querySelector('div[contenteditable="true"]');
    if (input) {
      input.textContent = message;
      // Trigger input event to enable send button
      input.dispatchEvent(new Event('input', { bubbles: true }));
      // Find and click send button
      const sendButton = document.querySelector('span[data-icon="send"]');
      if (sendButton) {
        sendButton.click();
      }
    }
  }
}

// Initialize message handler
const messageHandler = new MessageHandler(); 