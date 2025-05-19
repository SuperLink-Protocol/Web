![alt text](https://raw.githubusercontent.com/TnsaAi/images-urls/refs/heads/main/TV%20-%208.png)
# SuperLink Web Extension

A Chrome Web Extension that allows you to open various web applications in a mini browser using a custom protocol.

## Features

- Detects `superlink://` protocol in chat boxes and input fields across various platforms
- Opens applications in a mini browser window
- Supports multiple categories of applications:
  - Messaging & Social Media (WhatsApp, Telegram, Discord, Twitter, Snapchat)
  - Productivity Tools (Google Workspace: Docs, Sheets, Slides, Drive, Calendar, Meet)
  - Cloud Storage (Dropbox, OneDrive)
  - Note Taking & Organization (Notion, Evernote, Trello, Asana)
  - Email & Communication (Gmail, Outlook)
  - Video Conferencing (Zoom, Microsoft Teams)
  - Development & Code (GitHub, GitLab, Bitbucket)
- Easy-to-use popup interface with categorized platform list
- Automatic protocol detection in chat inputs and search bars
- Platform-specific behaviors (messaging, document sharing, etc.)

## Installation

1. Clone this repository or download the files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The SuperLink extension should now be installed and visible in your Chrome toolbar

## Usage

### Method 1: Using the Protocol
1. In any chat box or input field, type `superlink://platform`
   - Replace `platform` with one of the supported platforms (e.g., `superlink://docs`, `superlink://notion`)
2. The extension will detect the protocol and open the corresponding platform in a mini browser

### Method 2: Using the Extension Popup
1. Click the SuperLink extension icon in your Chrome toolbar
2. Browse through the categorized list of platforms
3. Click on any platform button to open it in a mini browser

## Supported Platforms

### Messaging & Social
- WhatsApp Web
- Telegram Web
- Discord
- Twitter
- Snapchat Web

### Productivity (Google Workspace)
- Google Docs
- Google Sheets
- Google Slides
- Google Drive
- Google Calendar
- Google Meet

### Cloud Storage
- Dropbox
- OneDrive

### Note Taking & Organization
- Notion
- Evernote
- Trello
- Asana

### Email & Communication
- Gmail
- Outlook

### Video Conferencing
- Zoom
- Microsoft Teams

### Development & Code
- GitHub
- GitLab
- Bitbucket

## Development

The extension consists of the following main components:

- `manifest.json`: Extension configuration and permissions
- `background.js`: Protocol handler and mini browser management
- `content.js`: Input monitoring and protocol detection
- `popup.html/js`: Extension popup interface with categorized platform list
- `messageHandler.js`: Handles platform-specific behaviors

## Security

- The extension only requests necessary permissions
- All communication is handled through Chrome's messaging system
- No data is stored except for login status
- Protocol handling is sandboxed within the extension
- Platform-specific behaviors are isolated and controlled

## License

MIT License 