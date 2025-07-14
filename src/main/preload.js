const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getScripts: () => ipcRenderer.invoke('get-scripts'),
    
    addScript: (scriptConfig) => ipcRenderer.invoke('add-script', scriptConfig),
    
    startScript: (scriptId) => ipcRenderer.invoke('start-script', scriptId),
    
    stopScript: (scriptId) => ipcRenderer.invoke('stop-script', scriptId),
    
    restartScript: (scriptId) => ipcRenderer.invoke('restart-script', scriptId),
    
    removeScript: (scriptId) => ipcRenderer.invoke('remove-script', scriptId),
    
    getLogs: (scriptId, lastN = 100) => ipcRenderer.invoke('get-logs', scriptId, lastN),
    
    selectFile: () => ipcRenderer.invoke('select-file'),
    
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    
    getSystemResources: () => ipcRenderer.invoke('get-system-resources'),
    
    onScriptAdded: (callback) => {
        ipcRenderer.on('script-added', (event, script) => callback(script));
    },
    
    onScriptStarted: (callback) => {
        ipcRenderer.on('script-started', (event, script) => callback(script));
    },
    
    onScriptStopped: (callback) => {
        ipcRenderer.on('script-stopped', (event, script) => callback(script));
    },
    
    onScriptError: (callback) => {
        ipcRenderer.on('script-error', (event, data) => callback(data));
    },
    
    onLogAdded: (callback) => {
        ipcRenderer.on('log-added', (event, data) => callback(data));
    },

    onScriptFileChanged: (callback) => {
        ipcRenderer.on('script-file-changed', (event, data) => callback(data));
    },

    onScriptFileDeleted: (callback) => {
        ipcRenderer.on('script-file-deleted', (event, data) => callback(data));
    },

    onOpenEmailSettings: (callback) => {
        ipcRenderer.on('open-email-settings', (event) => callback());
    },

    onLanguageChanged: (callback) => {
        ipcRenderer.on('language-changed', (event, language) => callback(language));
    },
    
    getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
    
    setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),

    updateScriptSettings: (scriptId, settings) => ipcRenderer.invoke('update-script-settings', scriptId, settings),
    
    sendTestEmail: (email, emailSettings) => ipcRenderer.invoke('send-test-email', email, emailSettings),
    
    getGlobalEmailSettings: () => ipcRenderer.invoke('get-global-email-settings'),
    saveGlobalEmailSettings: (settings) => ipcRenderer.invoke('save-global-email-settings', settings),
    testGlobalEmail: (testEmail) => ipcRenderer.invoke('test-global-email', testEmail),
    
    openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
    
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),
    
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    },
    
    removeListener: (channel, callback) => {
        ipcRenderer.removeListener(channel, callback);
    }
});

console.log('Preload script loaded successfully'); 