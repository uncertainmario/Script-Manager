# Translation Guide / Çeviri Rehberi

This guide will help you add new language support to Script Manager application.

## How to Add a New Language

### 1. Create Language File
Create a new JSON file in the `src/renderer/locales/` directory:
- File name format: `{language_code}.json`
- Example: `fr.json` for French, `de.json` for German

### 2. Copy Base Structure
Copy the structure from `src/renderer/locales/en.json` and translate all values:

```json
{
  "app": {
    "title": "Script Manager",
    "loading": "Loading...",
    "refresh": "Refresh",
    // ... translate all values
  },
  "sidebar": {
    "status": "Status",
    // ... translate all values
  },
  // ... continue for all sections
}
```

### 3. Update Language List
Add your language to the available languages in two places:

**File: `src/renderer/js/i18n.js`**
```javascript
this.availableLanguages = {
    'en': 'English',
    'tr': 'Türkçe',
    'fr': 'Français',  // Add your language here
    'de': 'Deutsch'    // Example
};
```

**File: `src/renderer/index.html`**
```html
<select id="language-select" class="language-select">
    <option value="en">English</option>
    <option value="tr">Türkçe</option>
    <option value="fr">Français</option>  <!-- Add your language here -->
    <option value="de">Deutsch</option>   <!-- Example -->
</select>
```

### 4. Translation Keys Reference

#### Main Categories:
- `app.*` - General application texts (buttons, common words)
- `sidebar.*` - Left sidebar content
- `scripts.*` - Script-related texts
- `modal.*` - Modal dialogs content
- `logs.*` - Log viewer texts
- `menu.*` - Application menu items
- `notifications.*` - Success/error messages
- `logLevels.*` - Log level options
- `priorities.*` - Priority level options
- `emailServices.*` - Email service options

#### Important Notes:
- Keep HTML tags and placeholders intact
- Use `{{variable}}` format for dynamic content
- Maintain consistency in terminology
- Test the translation in the application

### 5. Testing Your Translation
1. Start the application
2. Change language from the sidebar
3. Check all UI elements are translated correctly
4. Test modal dialogs and notifications
5. Verify dynamic content updates properly

## Current Languages

- **English (en)** - Complete ✅
- **Turkish (tr)** - Complete ✅
- **Your Language** - Add here!

## Translation Template

Here's a template for easy translation:

```json
{
  "app": {
    "title": "Script Manager",
    "loading": "Loading...",
    "refresh": "Refresh",
    "add": "Add Script",
    "search": "Search scripts...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close",
    "settings": "Settings",
    "language": "Language",
    "browse": "Browse",
    "clear": "Clear",
    "export": "Export",
    "test": "Test"
  },
  "sidebar": {
    "status": "Status",
    "totalScripts": "Total Scripts",
    "runningScripts": "Running",
    "stoppedScripts": "Stopped",
    "systemResources": "System Resources",
    "cpu": "CPU:",
    "memory": "Memory:",
    "uptime": "Uptime:",
    "filters": "Filters",
    "all": "All",
    "running": "Running",
    "stopped": "Stopped",
    "error": "Error",
    "languageSettings": "Language Settings",
    "selectLanguage": "Select Language"
  },
  "scripts": {
    "title": "Scripts",
    "dragDropTitle": "Drag script files here",
    "dragDropSubtitle": "or click here for manual adding",
    "supportedFormats": "Supported formats: .exe, .bat, .cmd, .ps1",
    "start": "Start",
    "stop": "Stop",
    "restart": "Restart",
    "viewLogs": "View Logs",
    "remove": "Remove",
    "status": {
      "running": "Running",
      "stopped": "Stopped",
      "error": "Error",
      "starting": "Starting",
      "stopping": "Stopping"
    }
  },
  "modal": {
    "addScript": "Add Script",
    "editScript": "Edit Script",
    "scriptName": "Script Name:",
    "scriptPath": "Script Path:",
    "parameters": "Parameters (optional):",
    "workingDirectory": "Working Directory:",
    "autoRestart": "Auto restart",
    "restartDelay": "Restart delay (ms):",
    "scriptSettings": "Script Settings",
    "autoStartEnabled": "Enable auto restart",
    "autoStartTime": "Restart time:",
    "logLevel": "Log level:",
    "maxLogSize": "Max log size (MB):",
    "logRotation": "Log rotation",
    "priorityLevel": "Priority level:",
    "emailNotifications": "Email notifications",
    "notificationEmail": "Notification email:"
  },
  "logs": {
    "title": "Log Viewer",
    "empty": "Select a script or start a script to view logs",
    "exportLogs": "Export Logs",
    "clearLogs": "Clear Logs"
  },
  "menu": {
    "file": "File",
    "addScript": "Add Script",
    "emailSettings": "Email Settings",
    "autoStart": "Auto Start",
    "exit": "Exit",
    "view": "View",
    "refresh": "Refresh",
    "developerTools": "Developer Tools"
  },
  "notifications": {
    "scriptAdded": "Script added successfully",
    "scriptRemoved": "Script removed successfully",
    "scriptStarted": "Script started successfully",
    "scriptStopped": "Script stopped successfully",
    "scriptRestarted": "Script restarted successfully",
    "settingsSaved": "Settings saved successfully",
    "autoStartEnabled": "Auto start enabled",
    "autoStartDisabled": "Auto start disabled",
    "languageChanged": "Language changed successfully",
    "error": "An error occurred"
  },
  "logLevels": {
    "all": "All logs",
    "critical": "Critical logs only",
    "error": "Error logs only",
    "none": "No logging"
  },
  "priorities": {
    "low": "Low",
    "normal": "Normal",
    "high": "High",
    "realtime": "Real-time"
  },
  "emailServices": {
    "gmail": "Gmail",
    "outlook": "Outlook",
    "yahoo": "Yahoo",
    "custom": "Custom SMTP"
  }
}
```

## Contributing

1. Fork the repository
2. Create your translation file
3. Update the language lists
4. Test your translation
5. Submit a pull request

## Support

If you need help with translation or have questions, please open an issue on GitHub.

---

Thank you for helping make Script Manager available in more languages! 🌍 