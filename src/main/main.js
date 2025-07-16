const { app, BrowserWindow, ipcMain, Menu, shell, dialog, Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const ProcessManager = require('../../processManager');
const chokidar = require('chokidar');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

class ScriptManagerApp {
    constructor() {
        this.mainWindow = null;
        this.tray = null;
        this.trayNotificationShown = false;
        this.processManager = new ProcessManager();
        this.fileWatcher = null;
        this.globalEmailSettings = null;
        this.encryptionKey = this.getOrCreateEncryptionKey();
        this.currentLanguage = 'en';
        this.setupEventListeners();
        this.setupIPC();
        this.setupFileWatcher();
        this.loadGlobalEmailSettings();
        this.loadLanguageSetting();
        
        this.testEncryption();
    }

    createWindow() {
        const iconPath = path.join(__dirname, '../../assets/stm.ico');
        let appIcon;
        
        if (fs.existsSync(iconPath)) {
            try {
                const iconBuffer = fs.readFileSync(iconPath);
                appIcon = nativeImage.createFromBuffer(iconBuffer);
                
                if (appIcon.isEmpty()) {
                    appIcon = nativeImage.createFromPath(iconPath);
                }
            } catch (error) {
                appIcon = nativeImage.createFromPath(iconPath);
            }
        } else {
            appIcon = nativeImage.createEmpty();
        }
        
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
                partition: 'persist:scriptmanager'
            },
            icon: appIcon,
            title: 'Script Manager',
            show: false,
            autoHideMenuBar: false
        });

        this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            if (process.platform === 'win32' && !appIcon.isEmpty()) {
                this.mainWindow.setIcon(appIcon);
                this.mainWindow.setSkipTaskbar(false);
            }
        });

        this.mainWindow.setIcon(appIcon);
        
        if (process.platform === 'win32' && !appIcon.isEmpty()) {
            setTimeout(() => {
                const freshIconBuffer = fs.readFileSync(iconPath);
                const freshIcon = nativeImage.createFromBuffer(freshIconBuffer);
                if (!freshIcon.isEmpty()) {
                    this.mainWindow.setIcon(freshIcon);
                    
                    if (this.tray) {
                        this.tray.setImage(freshIcon);
                    }
                }
            }, 1000);
        }
        
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.webContents.openDevTools();
        }

        this.mainWindow.on('close', (event) => {
            if (!app.isQuiting) {
                event.preventDefault();
                this.mainWindow.hide();
                
                if (!this.trayNotificationShown) {
                    this.tray.displayBalloon({
                        title: 'Script Manager',
                        content: 'Uygulama sistem tepsisinde çalışmaya devam ediyor.'
                    });
                    this.trayNotificationShown = true;
                }
            }
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        this.setupMenu();
        this.setupTray();
    }

    getMenuTranslations() {
        const translations = {
            en: {
                settings: 'Settings',
                addScript: 'Add Script',
                language: 'Language',
                emailSettings: 'Email Settings',
                autoStart: 'Auto Start',
                exit: 'Exit',
                view: 'View',
                refresh: 'Refresh',
                developerTools: 'Developer Tools',
                openScriptManager: 'Open Script Manager',
                runningScripts: 'Running Scripts'
            },
            tr: {
                settings: 'Ayarlar',
                addScript: 'Script Ekle',
                language: 'Dil',
                emailSettings: 'Email Ayarları',
                autoStart: 'Otomatik Başlatma',
                exit: 'Çıkış',
                view: 'Görünüm',
                refresh: 'Yenile',
                developerTools: 'Geliştirici Araçları',
                openScriptManager: 'Script Manager\'ı Aç',
                runningScripts: 'Çalışan Scriptler'
            }
        };
        return translations[this.currentLanguage] || translations.en;
    }

    setupMenu() {
        const t = this.getMenuTranslations();
        const template = [
            {
                label: t.settings,
                submenu: [
                    {
                        label: t.addScript,
                        accelerator: 'CmdOrCtrl+O',
                        click: () => this.addScript()
                    },
                    { type: 'separator' },
                    {
                        label: t.language,
                        submenu: [
                            {
                                label: 'English',
                                type: 'radio',
                                checked: this.getCurrentLanguage() === 'en',
                                click: () => this.changeLanguage('en')
                            },
                            {
                                label: 'Türkçe',
                                type: 'radio',
                                checked: this.getCurrentLanguage() === 'tr',
                                click: () => this.changeLanguage('tr')
                            }
                        ]
                    },
                    { type: 'separator' },
                    {
                        label: t.emailSettings,
                        accelerator: 'CmdOrCtrl+E',
                        click: () => this.openEmailSettings()
                    },
                    { type: 'separator' },
                    {
                        label: t.autoStart,
                        type: 'checkbox',
                        checked: this.getAutoStartEnabled(),
                        click: (menuItem) => this.setAutoStartEnabled(menuItem.checked)
                    },
                    { type: 'separator' },
                    {
                        label: t.exit,
                        accelerator: 'CmdOrCtrl+Q',
                        click: () => app.quit()
                    }
                ]
            },
            {
                label: t.view,
                submenu: [
                    {
                        label: t.refresh,
                        accelerator: 'CmdOrCtrl+R',
                        click: () => this.mainWindow.webContents.reload()
                    },
                    {
                        label: t.developerTools,
                        accelerator: 'F12',
                        click: () => this.mainWindow.webContents.toggleDevTools()
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    setupTray() {
        const icon = nativeImage.createFromPath(path.join(__dirname, '../../assets/stm.ico'));
        
        this.tray = new Tray(icon);
        this.tray.setToolTip('Script Manager');
        
        this.updateTrayMenu();
        
        this.tray.on('double-click', () => {
            this.mainWindow.show();
            this.mainWindow.focus();
        });
    }

    updateTrayMenu() {
        if (!this.tray) return;
        
        const t = this.getMenuTranslations();
        const runningCount = this.processManager.getRunningScripts().length;
        const contextMenu = Menu.buildFromTemplate([
            {
                label: t.openScriptManager,
                click: () => {
                    this.mainWindow.show();
                    this.mainWindow.focus();
                }
            },
            {
                label: `${t.runningScripts}: ${runningCount}`,
                enabled: false
            },
            { type: 'separator' },
            {
                label: t.exit,
                click: () => {
                    app.quit();
                }
            }
        ]);
        
        this.tray.setContextMenu(contextMenu);
    }

    setupFileWatcher() {
        this.updateFileWatcher();
        
        this.processManager.on('scriptAdded', () => {
            this.updateFileWatcher();
        });

        this.processManager.on('scriptRemoved', () => {
            this.updateFileWatcher();
        });
    }

    updateFileWatcher() {
        if (this.fileWatcher) {
            this.fileWatcher.close();
        }

        const scripts = this.processManager.getAllScripts();
        const filePaths = scripts.map(script => script.path).filter(path => fs.existsSync(path));

        if (filePaths.length > 0) {
            this.fileWatcher = chokidar.watch(filePaths, {
                ignored: /^\./,
                persistent: true,
                ignoreInitial: true
            });

            this.fileWatcher.on('change', (filePath) => {
                const script = scripts.find(s => s.path === filePath);
                if (script) {
                    this.handleScriptFileChange(script);
                }
            });

            this.fileWatcher.on('unlink', (filePath) => {
                const script = scripts.find(s => s.path === filePath);
                if (script) {
                    this.handleScriptFileDeleted(script);
                }
            });
        }
    }

    handleScriptFileChange(script) {
        if (script.status === 'running') {
            this.processManager.restartScript(script.id);
            this.sendToRenderer('script-file-changed', {
                scriptId: script.id,
                message: 'Script dosyası değişti ve yeniden başlatıldı'
            });
        } else {
            this.sendToRenderer('script-file-changed', {
                scriptId: script.id,
                message: 'Script dosyası değişti'
            });
        }
    }

    handleScriptFileDeleted(script) {
        if (script.status === 'running') {
            this.processManager.stopScript(script.id);
        }
        
        this.sendToRenderer('script-file-deleted', {
            scriptId: script.id,
            message: 'Script dosyası silindi'
        });
    }

    setupEventListeners() {
        this.processManager.on('scriptAdded', (script) => {
            this.sendToRenderer('script-added', script);
        });

        this.processManager.on('scriptStarted', (script) => {
            this.sendToRenderer('script-started', script);
            this.updateTrayMenu();
        });

        this.processManager.on('scriptStopped', (script) => {
            this.sendToRenderer('script-stopped', script);
            this.updateTrayMenu();
        });

        this.processManager.on('scriptError', (script, error) => {
            this.sendToRenderer('script-error', { script, error: error.message });
            this.updateTrayMenu();
        });

        this.processManager.on('logAdded', (scriptId, logEntry) => {
            this.sendToRenderer('log-added', { scriptId, logEntry });
        });

        this.processManager.on('sendErrorEmail', (scriptName, errorMessage, emailAddress) => {
            this.sendErrorNotification(scriptName, errorMessage, emailAddress);
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin' && !this.tray) {
                this.processManager.cleanup();
                app.quit();
            }
        });

        app.on('before-quit', () => {
            app.isQuiting = true;
            this.processManager.cleanup();
            if (this.fileWatcher) {
                this.fileWatcher.close();
            }
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });
    }

    setupIPC() {
        ipcMain.handle('get-scripts', () => {
            return this.processManager.getAllScripts();
        });

        ipcMain.handle('add-script', async (event, scriptConfig) => {
            try {
                const scriptId = this.processManager.addScript(scriptConfig);
                return { success: true, scriptId };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('start-script', async (event, scriptId) => {
            try {
                const pid = await this.processManager.startScript(scriptId);
                return { success: true, pid };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('stop-script', async (event, scriptId) => {
            try {
                await this.processManager.stopScript(scriptId);
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('restart-script', async (event, scriptId) => {
            try {
                const pid = await this.processManager.restartScript(scriptId);
                return { success: true, pid };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('remove-script', async (event, scriptId) => {
            try {
                this.processManager.removeScript(scriptId);
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('get-logs', async (event, scriptId, lastN = 100) => {
            return this.processManager.getLogs(scriptId, lastN);
        });

        ipcMain.handle('get-log-directory', async () => {
            return this.processManager.logsDir;
        });

        ipcMain.handle('open-log-directory', async () => {
            try {
                const { shell } = require('electron');
                await shell.openPath(this.processManager.logsDir);
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('get-portable-status', async () => {
            return {
                isPortable: this.processManager.isPortable,
                dataDir: path.dirname(this.processManager.dataFile),
                logsDir: this.processManager.logsDir
            };
        });

        ipcMain.handle('select-file', async () => {
            return await this.selectFile();
        });

        ipcMain.handle('select-folder', async () => {
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openDirectory']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                return result.filePaths[0];
            }
            return null;
        });

        ipcMain.handle('get-system-info', () => {
            return {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                electronVersion: process.versions.electron
            };
        });

        ipcMain.handle('get-system-resources', () => {
            const usage = process.cpuUsage();
            const memUsage = process.memoryUsage();
            
            return {
                cpu: {
                    user: usage.user,
                    system: usage.system
                },
                memory: {
                    rss: Math.round(memUsage.rss / 1024 / 1024),
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                    external: Math.round(memUsage.external / 1024 / 1024)
                },
                uptime: Math.round(process.uptime()),
                            scriptCount: this.processManager.getAllScripts().length,
            runningCount: this.processManager.getRunningScripts().length
        };
    });

            ipcMain.handle('get-auto-start', () => {
            return this.getAutoStartEnabled();
        });

        ipcMain.handle('set-auto-start', (event, enabled) => {
            return this.setAutoStartEnabled(enabled);
        });

        ipcMain.handle('update-script-settings', async (event, scriptId, settings) => {
            try {
                this.processManager.updateScriptSettings(scriptId, settings);
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('get-script-settings', async (event, scriptId) => {
            const script = this.processManager.scripts.get(scriptId);
            return script ? script.settings : {};
        });

        ipcMain.handle('send-test-email', async (event, email, emailSettings) => {
            try {
                const testMessage = this.getTestEmailMessage();
                const result = await this.sendErrorNotification('Test Script', testMessage, email, emailSettings);
                return { success: result };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('get-global-email-settings', () => {
            return this.globalEmailSettings || {};
        });

        ipcMain.handle('save-global-email-settings', (event, settings) => {
            try {
                const result = this.saveGlobalEmailSettings(settings);
                return { success: result };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('test-global-email', async (event, testEmail) => {
            try {
                if (!this.globalEmailSettings) {
                    return { success: false, error: 'Global email ayarları yapılandırılmamış' };
                }
                
                const testMessage = this.getTestEmailMessage();
                const result = await this.sendErrorNotification('Test Script', testMessage, testEmail, this.globalEmailSettings);
                return { success: result };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('open-file', async (event, filePath) => {
            try {
                if (!fs.existsSync(filePath)) {
                    return { success: false, error: 'Dosya bulunamadı' };
                }
                
                shell.showItemInFolder(filePath);
                
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('show-save-dialog', async (event, options) => {
            const result = await dialog.showSaveDialog(this.mainWindow, options || {});
            return result;
        });

        ipcMain.handle('save-file', async (event, filePath, content) => {
            try {
                fs.writeFileSync(filePath, content, 'utf8');
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('get-current-language', () => {
            return this.getCurrentLanguage();
        });
    }

    sendToRenderer(channel, data) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(channel, data);
        }
    }

    async addScript() {
        const filePath = await this.selectFile();
        if (filePath) {
            const scriptConfig = {
                name: path.basename(filePath),
                path: filePath,
                autoRestart: false
            };

            try {
                const scriptId = this.processManager.addScript(scriptConfig);
                this.sendToRenderer('script-added', this.processManager.scripts.get(scriptId));
            } catch (error) {
                dialog.showErrorBox('Hata', `Script eklenirken hata: ${error.message}`);
            }
        }
    }

    async selectFile() {
        const result = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Script Dosyaları', extensions: ['js', 'py', 'bat', 'cmd', 'ps1', 'exe'] },
                { name: 'JavaScript Dosyaları', extensions: ['js'] },
                { name: 'Python Dosyaları', extensions: ['py'] },
                { name: 'Batch Dosyaları', extensions: ['bat', 'cmd'] },
                { name: 'PowerShell Scriptleri', extensions: ['ps1'] },
                { name: 'Çalıştırılabilir Dosyalar', extensions: ['exe'] },
                { name: 'Tüm Dosyalar', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    }

    getAutoStartEnabled() {
        return app.getLoginItemSettings().openAtLogin;
    }

    setAutoStartEnabled(enabled) {
        app.setLoginItemSettings({
            openAtLogin: enabled,
            name: 'Script Manager',
            path: process.execPath,
            args: ['--hidden'],
            executableName: 'Script Manager.exe'
        });
        return true;
    }

    async sendErrorNotification(scriptName, errorMessage, emailAddress, emailSettings = null, retryCount = 0) {
        const maxRetries = 3;
        const retryDelay = 1000;
        
        try {
            const settings = emailSettings || this.globalEmailSettings;
            
            if (!settings || !settings.username || !settings.password) {
                console.error('Email ayarları bulunamadı veya eksik');
                return false;
            }

            let transporterConfig;
            
            if (settings.service === 'custom') {
                transporterConfig = {
                    host: settings.host,
                    port: settings.port,
                    secure: settings.secure,
                    auth: {
                        user: settings.username,
                        pass: settings.password
                    },
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                    socketTimeout: 10000
                };
            } else {
                transporterConfig = {
                    service: settings.service,
                    auth: {
                        user: settings.username,
                        pass: settings.password
                    },
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                    socketTimeout: 10000
                };
            }

            const transporter = nodemailer.createTransport(transporterConfig);

            const emailContent = this.getEmailContent(scriptName, errorMessage);

            const mailOptions = {
                from: settings.username,
                to: emailAddress,
                subject: emailContent.subject,
                html: emailContent.html
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Email gönderildi:', info.messageId);
            return true;
            
        } catch (error) {
            console.error(`Email gönderme hatası (deneme ${retryCount + 1}/${maxRetries + 1}):`, error.message);
            
            const retryableErrors = [
                'ENOTFOUND',
                'ECONNRESET',
                'ETIMEDOUT',
                'ECONNREFUSED',
                'EHOSTUNREACH',
                'ENETUNREACH',
                'socket hang up'
            ];
            
            const isRetryable = retryableErrors.some(errCode => 
                error.code === errCode || error.message.includes(errCode)
            );
            
            if (isRetryable && retryCount < maxRetries) {
                console.log(`${retryDelay * (retryCount + 1)}ms sonra tekrar denenecek...`);
                
                await new Promise(resolve => 
                    setTimeout(resolve, retryDelay * (retryCount + 1))
                );
                
                return this.sendErrorNotification(scriptName, errorMessage, emailAddress, emailSettings, retryCount + 1);
            }
            
            console.error('Email gönderimi başarısız oldu. Tüm denemeler tükendi.');
            
            this.reportEmailError(error, retryCount, emailAddress);
            
            return false;
        }
    }

    reportEmailError(error, retryCount, emailAddress) {
        const errorReport = {
            type: 'email_send_failure',
            error: error.message,
            code: error.code,
            retryCount: retryCount,
            emailAddress: emailAddress,
            timestamp: new Date().toISOString()
        };
        
        console.group('📧 Email Error Report');
        console.error('Error Details:', errorReport);
        console.groupEnd();
        
    }

    getTestEmailMessage() {
        if (this.currentLanguage === 'tr') {
            return 'Bu bir test email mesajıdır. Global email ayarlarınız doğru çalışıyor!';
        } else {
            return 'This is a test email message. Your global email settings are working correctly!';
        }
    }

    getEmailContent(scriptName, errorMessage) {
        const isTestMessage = errorMessage.includes('test email') || errorMessage.includes('test mesajı');
        
        if (this.currentLanguage === 'tr') {
            return {
                subject: isTestMessage ? 
                    'Script Manager - Test Email' : 
                    `Script Manager - Hata Bildirimi: ${scriptName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: ${isTestMessage ? '#28a745' : '#dc3545'};">
                            ${isTestMessage ? 'Test Email Başarılı' : 'Script Hata Bildirimi'}
                        </h2>
                        <p><strong>Script:</strong> ${scriptName}</p>
                        <p><strong>${isTestMessage ? 'Test Zamanı' : 'Hata Zamanı'}:</strong> ${new Date().toLocaleString('tr-TR')}</p>
                        <p><strong>${isTestMessage ? 'Test Mesajı' : 'Hata Mesajı'}:</strong></p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid ${isTestMessage ? '#28a745' : '#dc3545'}; margin: 10px 0;">
                            <pre style="margin: 0; font-size: 14px; color: ${isTestMessage ? '#28a745' : '#dc3545'};">${errorMessage}</pre>
                        </div>
                        ${isTestMessage ? 
                            '<p style="color: #28a745; font-weight: bold;">✅ Email ayarlarınız doğru çalışıyor!</p>' : 
                            '<p style="color: #dc3545; font-weight: bold;">⚠️ Script çalışmasında hata oluştu.</p>'
                        }
                        <p style="color: #666; font-size: 12px; margin-top: 20px;">
                            Bu mail Script Manager tarafından otomatik olarak gönderilmiştir.
                        </p>
                    </div>
                `
            };
        } else {
            return {
                subject: isTestMessage ? 
                    'Script Manager - Test Email' : 
                    `Script Manager - Error Notification: ${scriptName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: ${isTestMessage ? '#28a745' : '#dc3545'};">
                            ${isTestMessage ? 'Test Email Successful' : 'Script Error Notification'}
                        </h2>
                        <p><strong>Script:</strong> ${scriptName}</p>
                        <p><strong>${isTestMessage ? 'Test Time' : 'Error Time'}:</strong> ${new Date().toLocaleString('en-US')}</p>
                        <p><strong>${isTestMessage ? 'Test Message' : 'Error Message'}:</strong></p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid ${isTestMessage ? '#28a745' : '#dc3545'}; margin: 10px 0;">
                            <pre style="margin: 0; font-size: 14px; color: ${isTestMessage ? '#28a745' : '#dc3545'};">${errorMessage}</pre>
                        </div>
                        ${isTestMessage ? 
                            '<p style="color: #28a745; font-weight: bold;">✅ Your email settings are working correctly!</p>' : 
                            '<p style="color: #dc3545; font-weight: bold;">⚠️ An error occurred during script execution.</p>'
                        }
                        <p style="color: #666; font-size: 12px; margin-top: 20px;">
                            This email was sent automatically by Script Manager.
                        </p>
                    </div>
                `
            };
        }
    }

    getOrCreateEncryptionKey() {
        const os = require('os');
        const userDataDir = path.join(os.homedir(), '.scriptmanager');
        const keyPath = path.join(userDataDir, 'encryption.key');
        
        try {
            if (fs.existsSync(keyPath)) {
                return fs.readFileSync(keyPath, 'utf8');
            } else {
                const key = crypto.randomBytes(32).toString('hex');
                
                if (!fs.existsSync(userDataDir)) {
                    fs.mkdirSync(userDataDir, { recursive: true });
                }
                
                fs.writeFileSync(keyPath, key, 'utf8');
                return key;
            }
        } catch (error) {
            console.error('Şifreleme anahtarı hatası:', error);
            return crypto.randomBytes(32).toString('hex');
        }
    }

    encryptData(text) {
        try {
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(algorithm, key, iv);
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            return iv.toString('hex') + ':' + encrypted;
        } catch (error) {
            console.error('Şifreleme hatası:', error);
            return Buffer.from(text).toString('base64');
        }
    }

    decryptData(encryptedText) {
        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 2) {
                try {
                    return Buffer.from(encryptedText, 'base64').toString('utf8');
                } catch {
                    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
                    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
                    decrypted += decipher.final('utf8');
                    return decrypted;
                }
            }
            
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            console.error('Çözme hatası:', error);
            throw new Error('Veri çözme başarısız');
        }
    }

    testEncryption() {
        try {
            const testData = 'test-password-123';
            const encrypted = this.encryptData(testData);
            const decrypted = this.decryptData(encrypted);
            
            if (testData === decrypted) {
                console.log('✅ Şifreleme sistemi çalışıyor');
                return true;
            } else {
                console.error('❌ Şifreleme sistemi hatası');
                return false;
            }
        } catch (error) {
            console.error('❌ Şifreleme test hatası:', error);
            return false;
        }
    }

    loadGlobalEmailSettings() {
        const os = require('os');
        const userDataDir = path.join(os.homedir(), '.scriptmanager');
        const settingsPath = path.join(userDataDir, 'email-settings.json');
        
        try {
            if (fs.existsSync(settingsPath)) {
                const data = fs.readFileSync(settingsPath, 'utf8');
                const settings = JSON.parse(data);
                
                if (settings.password) {
                    settings.password = this.decryptData(settings.password);
                }
                
                this.globalEmailSettings = settings;
            }
        } catch (error) {
            console.error('Email ayarları yüklenemedi:', error);
        }
    }

    saveGlobalEmailSettings(settings) {
        const os = require('os');
        const userDataDir = path.join(os.homedir(), '.scriptmanager');
        const settingsPath = path.join(userDataDir, 'email-settings.json');
        
        try {
            if (!fs.existsSync(userDataDir)) {
                fs.mkdirSync(userDataDir, { recursive: true });
            }
            
            const settingsToSave = { ...settings };
            if (settingsToSave.password) {
                settingsToSave.password = this.encryptData(settingsToSave.password);
            }
            
            fs.writeFileSync(settingsPath, JSON.stringify(settingsToSave, null, 2), 'utf8');
            this.globalEmailSettings = settings;
            return true;
        } catch (error) {
            console.error('Email ayarları kaydedilemedi:', error);
            return false;
        }
    }

    openEmailSettings() {
        if (this.mainWindow) {
            this.sendToRenderer('open-email-settings');
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    changeLanguage(language) {
        this.currentLanguage = language;
        this.saveLanguageSetting(language);
        
        if (this.mainWindow) {
            this.mainWindow.webContents.send('language-changed', language);
        }
        
        this.setupMenu();
        this.updateTrayMenu();
    }

    loadLanguageSetting() {
        try {
            // Her zaman İngilizce ile başla (hem development hem production)
            this.currentLanguage = 'en';
            
            // Config dosyasını da temizle (isteğe bağlı)
            // const configPath = path.join(app.getPath('userData'), 'language-config.json');
            // if (fs.existsSync(configPath)) {
            //     fs.unlinkSync(configPath);
            //     console.log('Previous language config removed');
            // }
            
        } catch (error) {
            console.error('Error loading language setting:', error);
            this.currentLanguage = 'en';
        }
    }

    saveLanguageSetting(language) {
        try {
            const configPath = path.join(app.getPath('userData'), 'language-config.json');
            const config = { language: language };
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Error saving language setting:', error);
        }
    }

    async init() {
        await app.whenReady();
        
        app.setName('Script Manager');
        
        if (process.platform === 'win32') {
            app.clearRecentDocuments();
        }
        
        const defaultIconPath = path.join(__dirname, '../../assets/stm.ico');
        
        if (fs.existsSync(defaultIconPath)) {
            const defaultIcon = nativeImage.createFromPath(defaultIconPath);
            
            if (!defaultIcon.isEmpty()) {
                app.setAppUserModelId('com.scriptmanager.app');
                
                if (process.platform === 'win32') {
                    if (app.setIcon) {
                        app.setIcon(defaultIcon);
                    }
                    
                    process.title = 'Script Manager';
                }
            }
        }
        
        if (process.argv.includes('--hidden')) {
            this.setupTray();
        } else {
            this.createWindow();
        }
    }
}

const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

process.stdout.write = function(chunk, encoding, callback) {
    const message = chunk.toString();
    if (message.includes('GPU') || 
        message.includes('GLES') || 
        message.includes('ContextResult') ||
        message.includes('gpu_channel_manager') ||
        message.includes('Failed to create') ||
        message.includes('cache_util_win') ||
        message.includes('ERROR:')) {
        return true;
    }
    return originalStdout.call(process.stdout, chunk, encoding, callback);
};

process.stderr.write = function(chunk, encoding, callback) {
    const message = chunk.toString();
    if (message.includes('GPU') || 
        message.includes('GLES') || 
        message.includes('ContextResult') ||
        message.includes('gpu_channel_manager') ||
        message.includes('Failed to create') ||
        message.includes('cache_util_win') ||
        message.includes('ERROR:')) {
        return true;
    }
    return originalStderr.call(process.stderr, chunk, encoding, callback);
};

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('GPU') || 
        message.includes('GLES') || 
        message.includes('ContextResult') ||
        message.includes('gpu_channel_manager') ||
        message.includes('Failed to create') ||
        message.includes('cache_util_win')) {
        return;
    }
    originalConsoleError.apply(console, args);
};

console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('GPU') || 
        message.includes('GLES') || 
        message.includes('ContextResult') ||
        message.includes('gpu_channel_manager') ||
        message.includes('Failed to create') ||
        message.includes('cache_util_win')) {
        return;
    }
    originalConsoleWarn.apply(console, args);
};

const scriptManagerApp = new ScriptManagerApp();
scriptManagerApp.init();

module.exports = ScriptManagerApp; 