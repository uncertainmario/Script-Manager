class ScriptManagerUI {
    constructor() {
        this.scripts = new Map();
        this.currentFilter = 'all';
        this.currentLogScript = null;
        this.currentSettingsScript = null;
        this.logUpdateInterval = null;
        this.resourceMonitorInterval = null;
        this.logUpdatePending = false;
        this.logBuffer = [];
        this.maxVisibleLogs = 500;
        
        this.virtualScrolling = {
            itemHeight: 120,
            visibleItems: 10,
            scrollTop: 0,
            totalItems: 0,
            startIndex: 0,
            endIndex: 0,
            buffer: 3
        };
        
        // DOM hazır olduğunda init'i çağır
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // DOM zaten hazır
            this.init();
        }
        
        window.addEventListener('beforeunload', () => this.cleanup());
        this.setupGlobalErrorHandling();
    }

    async init() {
        try {
            // DOM elementlerini initialize et
            this.initializeElements();
            
            // Event listener'ları kur
            this.setupEventListeners();
            
            // Drag & Drop kur
            this.setupDragDrop();
            
            // IPC listener'ları kur
            this.setupIpcListeners();
            
            // Resource monitoring başlat
            this.startResourceMonitoring();
            
            // Main process'ten dil bilgisini al ve i18n'i başlat
            let currentLanguage = 'en';
            try {
                currentLanguage = await window.electronAPI.getCurrentLanguage();
            } catch (error) {
                console.error('Error getting language from main process:', error);
            }
            
            // i18n sistemini başlat
            await this.initializeI18n();
            
            // Diğer async işlemleri yap
            await this.loadScripts();
            
            await this.loadSettings();
            
            await this.checkPortableStatus();
            
            // Stats'ı başlat
            this.startStatsUpdate();
            
            // Portable build bilgisi göster
            const portableStatus = await window.electronAPI.getPortableStatus();
            if (portableStatus.isPortable) {
                this.showNotification('Portable build aktif - Loglar: ' + portableStatus.logsDir, 'info', 5000);
            }
            
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global Error:', event.error);
            this.showNotification(
                `Beklenmeyen hata: ${event.error.message}`,
                'error'
            );
            
            this.reportError(event.error, 'javascript');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            this.showNotification(
                `İşlem hatası: ${event.reason}`,
                'error'
            );
            
            this.reportError(event.reason, 'promise');
            event.preventDefault();
        });

        window.electronAPI.onError?.((error) => {
            console.error('IPC Error:', error);
            this.showNotification(
                `Sistem hatası: ${error.message}`,
                'error'
            );
        });
    }

    reportError(error, type) {
        const errorReport = {
            message: error.message || error,
            stack: error.stack,
            type: type,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.group('🔥 Error Report');
        console.error('Error:', errorReport);
        console.groupEnd();
    }

    cleanup() {
        if (this.logUpdateInterval) {
            clearInterval(this.logUpdateInterval);
        }
        if (this.resourceInterval) {
            clearInterval(this.resourceInterval);
        }
        
        this.virtualScrollPending = false;
        this.scripts.clear();
        this.logBuffer = [];
        
        if (this.elements.logViewer.classList.contains('active')) {
            this.hideLogViewer();
        }
    }

    initializeElements() {
        this.elements = {
            addScriptBtn: document.getElementById('add-script-btn'),
            refreshBtn: document.getElementById('refresh-btn'),
            scriptList: document.getElementById('script-list'),
            searchInput: document.getElementById('search-input'),
            dragDropZone: document.getElementById('drag-drop-zone'),
            totalScripts: document.getElementById('total-scripts'),
            runningScripts: document.getElementById('running-scripts'),
            stoppedScripts: document.getElementById('stopped-scripts'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            modal: document.getElementById('script-modal'),
            modalClose: document.getElementById('modal-close'),
            modalCancel: document.getElementById('modal-cancel'),
            scriptForm: document.getElementById('script-form'),
            scriptName: document.getElementById('script-name'),
            scriptPath: document.getElementById('script-path'),
            scriptArgs: document.getElementById('script-args'),
            workingDir: document.getElementById('working-dir'),
            autoRestart: document.getElementById('auto-restart'),
            restartDelay: document.getElementById('restart-delay'),
            restartDelayGroup: document.getElementById('restart-delay-group'),
            browseScript: document.getElementById('browse-script'),
            browseWorkdir: document.getElementById('browse-workdir'),
            parametersInfo: document.getElementById('parameters-info'),
            logViewer: document.getElementById('log-viewer'),
            logTitle: document.getElementById('log-title'),
            logContent: document.getElementById('log-content'),
            clearLogsBtn: document.getElementById('clear-logs-btn'),
            exportLogsBtn: document.getElementById('export-logs-btn'),
            closeLogsBtn: document.getElementById('close-logs-btn'),
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),
            cpuUsage: document.getElementById('cpu-usage'),
            memoryUsage: document.getElementById('memory-usage'),
            uptime: document.getElementById('uptime'),
            settingsModal: document.getElementById('script-settings-modal'),
            settingsModalClose: document.getElementById('settings-modal-close'),
            settingsModalCancel: document.getElementById('settings-modal-cancel'),
            settingsForm: document.getElementById('script-settings-form'),
            settingsScriptName: document.getElementById('script-settings-name'),
            autoStartEnabled: document.getElementById('auto-start-enabled'),
            autoStartTime: document.getElementById('auto-start-time'),
            autoStartTimeGroup: document.getElementById('auto-start-time-group'),
            logLevel: document.getElementById('log-level'),
            enableFileLogging: document.getElementById('enable-file-logging'),
            maxLogSize: document.getElementById('max-log-size'),
            logRotation: document.getElementById('log-rotation'),
            priorityLevel: document.getElementById('priority-level'),
            emailNotifications: document.getElementById('email-notifications'),
            emailGroup: document.getElementById('email-group'),
            notificationEmail: document.getElementById('notification-email'),
            globalEmailModal: document.getElementById('global-email-modal'),
            globalEmailClose: document.getElementById('global-email-close'),
            globalEmailCancel: document.getElementById('global-email-cancel'),
            globalEmailForm: document.getElementById('global-email-form'),
            globalEmailService: document.getElementById('global-email-service'),
            globalEmailUsername: document.getElementById('global-email-username'),
            globalEmailPassword: document.getElementById('global-email-password'),
            globalCustomSmtpGroup: document.getElementById('global-custom-smtp-group'),
            globalSmtpHost: document.getElementById('global-smtp-host'),
            globalSmtpPort: document.getElementById('global-smtp-port'),
            globalSmtpSecure: document.getElementById('global-smtp-secure'),
            autoRestartApp: document.getElementById('auto-restart-app'),
            globalTestEmailBtn: document.getElementById('global-test-email-btn')
        };
        
        // Null element kontrolü
        const missingElements = [];
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) {
                missingElements.push(key);
            }
        }
        
        if (missingElements.length > 0) {
            console.error('Missing DOM elements:', missingElements);
        }
        
        // Log viewer controls
        this.elements.exportLogs = document.getElementById('export-logs');
        this.elements.clearLogs = document.getElementById('clear-logs');
        this.elements.openLogDirectory = document.getElementById('open-log-directory');
        this.elements.closeLogs = document.getElementById('close-logs');
        
        // Bu elementler için de event listener'lar kur (null kontrolü ile)
        if (this.elements.exportLogs) {
            this.elements.exportLogs.addEventListener('click', () => this.exportLogs());
        }
        if (this.elements.clearLogs) {
            this.elements.clearLogs.addEventListener('click', () => this.clearLogs());
        }
        if (this.elements.openLogDirectory) {
            this.elements.openLogDirectory.addEventListener('click', () => this.openLogDirectory());
        }
        if (this.elements.closeLogs) {
            this.elements.closeLogs.addEventListener('click', () => this.closeLogs());
        }
    }

    setupEventListeners() {
        // Null kontrolü ile event listener'lar
        if (this.elements.addScriptBtn) {
            this.elements.addScriptBtn.addEventListener('click', () => this.showAddScriptModal());
        }
        
        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.addEventListener('click', () => this.loadScripts());
        }
        
        // Event delegation for script buttons (backup solution)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.script-actions button')) {
                const button = e.target.closest('.script-actions button');
                const scriptId = button.closest('.script-item').dataset.scriptId;
                
                // Only handle if onclick failed
                if (button.onclick) return;
                
                if (button.textContent.includes('Start') || button.textContent.includes('Başlat')) {
                    e.preventDefault();
                    this.startScript(scriptId);
                } else if (button.textContent.includes('Stop') || button.textContent.includes('Durdur')) {
                    e.preventDefault();
                    this.stopScript(scriptId);
                } else if (button.textContent.includes('Restart') || button.textContent.includes('Yeniden')) {
                    e.preventDefault();
                    this.restartScript(scriptId);
                } else if (button.textContent.includes('Logs') || button.textContent.includes('Loglar')) {
                    e.preventDefault();
                    this.showLogs(scriptId);
                } else if (button.textContent.includes('Settings') || button.textContent.includes('Ayarlar')) {
                    e.preventDefault();
                    this.showScriptSettings(scriptId);
                } else if (button.textContent.includes('Remove') || button.textContent.includes('Kaldır')) {
                    e.preventDefault();
                    this.removeScript(scriptId);
                } else if (button.textContent.includes('Open') || button.textContent.includes('Aç')) {
                    e.preventDefault();
                    this.openScriptFile(scriptId);
                }
            }
        });
        
        // Modal event listeners
        if (this.elements.modalClose) {
            this.elements.modalClose.addEventListener('click', () => this.hideModal());
        }
        
        if (this.elements.modalCancel) {
            this.elements.modalCancel.addEventListener('click', () => this.hideModal());
        }
        
        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', (e) => {
                if (e.target === this.elements.modal) {
                    this.hideModal();
                }
            });
        }
        
        // Form event listeners
        if (this.elements.scriptForm) {
            this.elements.scriptForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        if (this.elements.browseScript) {
            this.elements.browseScript.addEventListener('click', () => this.browseScriptFile());
        }
        
        if (this.elements.browseWorkdir) {
            this.elements.browseWorkdir.addEventListener('click', () => this.browseWorkingDirectory());
        }
        
        if (this.elements.autoRestart) {
            this.elements.autoRestart.addEventListener('change', (e) => {
                if (this.elements.restartDelayGroup) {
                    this.elements.restartDelayGroup.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }
        
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => this.filterScripts(e.target.value));
        }
        
        // Filter buttons
        if (this.elements.filterBtns) {
            this.elements.filterBtns.forEach(btn => {
                btn.addEventListener('click', () => this.setFilter(btn.dataset.filter));
            });
        }
        
        // Log viewer buttons
        if (this.elements.closeLogsBtn) {
            this.elements.closeLogsBtn.addEventListener('click', () => this.hideLogViewer());
        }
        
        if (this.elements.clearLogsBtn) {
            this.elements.clearLogsBtn.addEventListener('click', () => this.clearLogs());
        }
        
        if (this.elements.exportLogsBtn) {
            this.elements.exportLogsBtn.addEventListener('click', () => this.exportLogs());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Settings modal listeners
        if (this.elements.settingsModalClose) {
            this.elements.settingsModalClose.addEventListener('click', () => this.hideSettingsModal());
        }
        
        if (this.elements.settingsModalCancel) {
            this.elements.settingsModalCancel.addEventListener('click', () => this.hideSettingsModal());
        }
        
        if (this.elements.settingsModal) {
            this.elements.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.elements.settingsModal) {
                    this.hideSettingsModal();
                }
            });
        }
        
        if (this.elements.settingsForm) {
            this.elements.settingsForm.addEventListener('submit', (e) => this.handleSettingsSubmit(e));
        }
        
        if (this.elements.autoStartEnabled) {
            this.elements.autoStartEnabled.addEventListener('change', (e) => {
                if (this.elements.autoStartTimeGroup) {
                    this.elements.autoStartTimeGroup.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }
        
        if (this.elements.emailNotifications) {
            this.elements.emailNotifications.addEventListener('change', (e) => {
                if (this.elements.emailGroup) {
                    this.elements.emailGroup.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }
        
        // Global email modal listeners
        if (this.elements.globalEmailClose) {
            this.elements.globalEmailClose.addEventListener('click', () => this.hideGlobalEmailModal());
        }
        
        if (this.elements.globalEmailCancel) {
            this.elements.globalEmailCancel.addEventListener('click', () => this.hideGlobalEmailModal());
        }
        
        if (this.elements.globalEmailModal) {
            this.elements.globalEmailModal.addEventListener('click', (e) => {
                if (e.target === this.elements.globalEmailModal) {
                    this.hideGlobalEmailModal();
                }
            });
        }
        
        if (this.elements.globalEmailForm) {
            this.elements.globalEmailForm.addEventListener('submit', (e) => this.handleGlobalEmailSubmit(e));
        }
        
        if (this.elements.globalEmailService) {
            this.elements.globalEmailService.addEventListener('change', (e) => {
                if (this.elements.globalCustomSmtpGroup) {
                    this.elements.globalCustomSmtpGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
                }
            });
        }
        
        if (this.elements.globalTestEmailBtn) {
            this.elements.globalTestEmailBtn.addEventListener('click', () => this.sendGlobalTestEmail());
        }
        
        if (this.elements.parametersInfo) {
            this.elements.parametersInfo.addEventListener('click', (e) => this.showParametersTooltip(e));
            this.elements.parametersInfo.addEventListener('mouseenter', (e) => this.showParametersTooltip(e));
            this.elements.parametersInfo.addEventListener('mouseleave', () => this.hideParametersTooltip());
        }
    }

    setupDragDrop() {
        const dropZone = this.elements.dragDropZone;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.highlight(dropZone), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.unhighlight(dropZone), false);
        });
        
        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
        
        dropZone.addEventListener('click', () => {
            this.showAddScriptModal();
        });
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    highlight(dropZone) {
        dropZone.classList.add('drag-over');
    }
    
    unhighlight(dropZone) {
        dropZone.classList.remove('drag-over');
    }
    
    async handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length === 0) return;
        
        for (let i = 0; i < files.length; i++) {
            await this.processDroppedFile(files[i]);
        }
    }
    
    async processDroppedFile(file) {
        const filePath = file.path;
        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();
        
        const supportedExts = ['exe', 'bat', 'cmd', 'ps1', 'js', 'py'];
        if (!supportedExts.includes(fileExt)) {
            this.showNotification(`Unsupported file type: ${fileExt}. Supported: ${supportedExts.join(', ')}`, 'error');
            return;
        }
        
        const scriptConfig = {
            name: fileName.replace(/\.[^/.]+$/, ""),
            path: filePath,
            args: [],
            workingDir: filePath.substring(0, filePath.lastIndexOf('\\')),
            autoRestart: false,
            restartDelay: 5000
        };
        
        this.showLoading(`"${fileName}" adding...`);
        
        try {
            const result = await window.electronAPI.addScript(scriptConfig);
            
            if (result.success) {
                this.showNotification(`"${fileName}" added successfully`, 'success');
                
                // Manual refresh in portable build
                setTimeout(() => {
                    this.loadScripts();
                }, 500);
            } else {
                this.showNotification(`"${fileName}" could not be added: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Drag & drop script add error:', error);
            this.showNotification(`"${fileName}" encountered an error during addition`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    setupIpcListeners() {
        window.electronAPI.onScriptAdded((script) => {
            this.scripts.set(script.id, script);
            this.renderScripts();
            this.updateStats();
            
            // Extra refresh in portable build
            setTimeout(() => {
                this.loadScripts();
            }, 100);
        });
        
        window.electronAPI.onScriptStarted((script) => {
            this.scripts.set(script.id, script);
            this.renderScripts();
            this.updateStats();
        });
        
        window.electronAPI.onScriptStopped((script) => {
            this.scripts.set(script.id, script);
            this.renderScripts();
            this.updateStats();
        });
        
        window.electronAPI.onScriptError((data) => {
            this.scripts.set(data.script.id, data.script);
            this.renderScripts();
            this.updateStats();
            this.showNotification(`Script Error: ${data.error}`, 'error');
        });
        
        window.electronAPI.onLogAdded((data) => {
            if (this.currentLogScript === data.scriptId) {
                this.appendLogEntry(data.logEntry);
            }
        });

        window.electronAPI.onScriptFileChanged((data) => {
            this.showNotification(`File Changed: ${data.message}`, 'info');
            const scriptCard = document.querySelector(`[data-script-id="${data.scriptId}"]`);
            if (scriptCard) {
                const statusElement = scriptCard.querySelector('.script-status');
                if (statusElement) {
                    statusElement.textContent = 'Restarted';
                    statusElement.className = 'script-status status-warning';
                }
            }
        });

        window.electronAPI.onScriptFileDeleted((data) => {
            this.showNotification(`File Deleted: ${data.message}`, 'warning');
            const scriptCard = document.querySelector(`[data-script-id="${data.scriptId}"]`);
            if (scriptCard) {
                const statusElement = scriptCard.querySelector('.script-status');
                if (statusElement) {
                    statusElement.textContent = 'File Deleted';
                    statusElement.className = 'script-status status-error';
                }
            }
        });

        window.electronAPI.onOpenEmailSettings(() => {
            this.showGlobalEmailModal();
        });

        window.electronAPI.onLanguageChanged((language) => {
            this.handleLanguageChangeFromMenu(language);
        });
    }

    async loadScripts() {
        this.showLoading(this.t('loading.loadingScripts'));
        
        try {
            const scripts = await window.electronAPI.getScripts();
            this.scripts.clear();
            
            scripts.forEach(script => {
                this.scripts.set(script.id, script);
                
                if (script.settings?.autoStartEnabled && script.settings?.autoStartTime) {
                    this.scheduleScript(script.id, script.settings.autoStartTime);
                }
            });
            
            this.renderScripts();
            this.updateStats();
        } catch (error) {
            console.error('Scripts loading error:', error);
            this.showNotification(this.t('notifications.error'), 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderScripts() {
        const container = this.elements.scriptList;
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        
        if (this.scripts.size === 0) {
            this.elements.dragDropZone.classList.remove('hidden');
        } else {
            this.elements.dragDropZone.classList.add('hidden');
        }
        
        const filteredScripts = Array.from(this.scripts.values()).filter(script => {
            if (searchTerm && !script.name.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            if (this.currentFilter === 'running' && script.status !== 'running') {
                return false;
            }
            if (this.currentFilter === 'stopped' && script.status !== 'stopped') {
                return false;
            }
            if (this.currentFilter === 'error' && script.status !== 'error') {
                return false;
            }
            
            return true;
        });
        
        if (filteredScripts.length === 0 && this.scripts.size > 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>${this.t('scripts.noScriptsFound')}</h3>
                    <p>${this.t('scripts.tryDifferentFilter')}</p>
                </div>
            `;
            return;
        }
        
        if (filteredScripts.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        if (filteredScripts.length > 50) {
            this.renderScriptsVirtual(filteredScripts);
        } else {
            container.innerHTML = filteredScripts.map(script => this.renderScriptItem(script)).join('');
        }
    }

    renderScriptsVirtual(filteredScripts) {
        const container = this.elements.scriptList;
        const vs = this.virtualScrolling;
        
        vs.totalItems = filteredScripts.length;
        
        if (!container.querySelector('.virtual-scroll-container')) {
            this.setupVirtualScrollContainer(container);
        }
        
        const viewport = container.querySelector('.virtual-scroll-viewport');
        const content = container.querySelector('.virtual-scroll-content');
        
        content.style.height = `${vs.totalItems * vs.itemHeight}px`;
        
        const containerHeight = viewport.clientHeight;
        vs.visibleItems = Math.ceil(containerHeight / vs.itemHeight);
        vs.startIndex = Math.floor(vs.scrollTop / vs.itemHeight);
        vs.endIndex = Math.min(
            vs.startIndex + vs.visibleItems + vs.buffer * 2,
            vs.totalItems
        );
        vs.startIndex = Math.max(0, vs.startIndex - vs.buffer);
        
        const visibleScripts = filteredScripts.slice(vs.startIndex, vs.endIndex);
        const itemsHtml = visibleScripts.map((script, index) => {
            const actualIndex = vs.startIndex + index;
            return `
                <div class="virtual-item" style="
                    position: absolute;
                    top: ${actualIndex * vs.itemHeight}px;
                    width: 100%;
                    height: ${vs.itemHeight}px;
                ">
                    ${this.renderScriptItem(script)}
                </div>
            `;
        }).join('');
        
        content.innerHTML = itemsHtml;
    }

    setupVirtualScrollContainer(container) {
        container.innerHTML = `
            <div class="virtual-scroll-container" style="height: 100%; overflow: hidden;">
                <div class="virtual-scroll-viewport" style="
                    height: 100%;
                    overflow-y: auto;
                    position: relative;
                ">
                    <div class="virtual-scroll-content" style="
                        position: relative;
                        width: 100%;
                    "></div>
                </div>
            </div>
        `;
        
        const viewport = container.querySelector('.virtual-scroll-viewport');
        viewport.addEventListener('scroll', () => {
            this.virtualScrolling.scrollTop = viewport.scrollTop;
            if (!this.virtualScrollPending) {
                this.virtualScrollPending = true;
                requestAnimationFrame(() => {
                    this.renderScripts();
                    this.virtualScrollPending = false;
                });
            }
        });
    }

    renderScriptItem(script) {
        const statusClass = script.status === 'running' ? 'running' : 
                           script.status === 'error' ? 'error' : 'stopped';
        
        const statusIcon = script.status === 'running' ? '▶️' : 
                          script.status === 'error' ? '❌' : '⏹️';
        
        const lastStarted = script.lastStarted ? 
            new Date(script.lastStarted).toLocaleString() : this.t('scripts.neverStarted');
        
        const statusText = this.t(`scripts.status.${script.status}`);
        
        return `
            <div class="script-item" data-script-id="${script.id}">
                <div class="script-header">
                    <div class="script-info">
                        <h3>${script.name}</h3>
                        <p>${this.t('scripts.lastStarted')} ${lastStarted}</p>
                    </div>
                    <div class="script-status ${statusClass}">
                        ${statusIcon} ${statusText}
                    </div>
                </div>
                
                <div class="script-details">
                    <p><strong>${this.t('scripts.path')}</strong> ${script.path}</p>
                    <p><strong>${this.t('scripts.fileType')}</strong> ${this.getFileTypeDescription(script.path)}</p>
                    <p><strong>${this.t('scripts.pid')}</strong> ${script.pid || this.t('scripts.pidNone')}</p>
                    <p><strong>${this.t('scripts.restartCount')}</strong> ${script.restartCount}</p>
                    ${script.autoRestart ? `<p><strong>${this.t('scripts.autoRestart')}</strong> ${this.t('scripts.autoRestartActive')}</p>` : ''}
                    ${script.settings?.autoStartEnabled ? `<p><strong>${this.t('scripts.autoStartTime')}</strong> ${script.settings.autoStartTime}</p>` : ''}
                </div>
                
                <div class="script-actions">
                    ${script.status === 'running' ? 
                        `<button class="btn btn-warning btn-small" onclick="window.scriptManager.stopScript('${script.id}')">
                            <span data-i18n="scripts.stop">${this.t('scripts.stop')}</span>
                        </button>
                        <button class="btn btn-warning btn-small" onclick="window.scriptManager.restartScript('${script.id}')">
                            <span data-i18n="scripts.restart">${this.t('scripts.restart')}</span>
                        </button>` :
                        `<button class="btn btn-primary btn-small" onclick="window.scriptManager.startScript('${script.id}')">
                            <span data-i18n="scripts.start">${this.t('scripts.start')}</span>
                        </button>`
                    }
                    <button class="btn btn-secondary btn-small" onclick="window.scriptManager.showLogs('${script.id}')">
                        <span data-i18n="scripts.viewLogs">${this.t('scripts.viewLogs')}</span>
                    </button>
                    <button class="btn btn-success btn-small" onclick="window.scriptManager.openScriptFile('${script.id}')">
                        <span data-i18n="scripts.openFile">${this.t('scripts.openFile')}</span>
                    </button>
                    <button class="btn btn-info btn-small" onclick="window.scriptManager.showScriptSettings('${script.id}')">
                        <span data-i18n="app.settings">${this.t('app.settings')}</span>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="window.scriptManager.removeScript('${script.id}')">
                        <span data-i18n="scripts.remove">${this.t('scripts.remove')}</span>
                    </button>
                </div>
            </div>
        `;
    }

    updateStats() {
        const total = this.scripts.size;
        const running = Array.from(this.scripts.values()).filter(s => s.status === 'running').length;
        const stopped = Array.from(this.scripts.values()).filter(s => s.status === 'stopped').length;
        
        this.elements.totalScripts.textContent = total;
        this.elements.runningScripts.textContent = running;
        this.elements.stoppedScripts.textContent = stopped;
    }

    async startScript(scriptId) {
        this.showLoading(this.t('loading.scriptStarting'));
        
        try {
            const result = await window.electronAPI.startScript(scriptId);
            
            if (result.success) {
                this.showNotification(this.t('notifications.scriptStarted'), 'success');
            } else {
                this.showNotification(`${this.t('notifications.error')}: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Script start error:', error);
            this.showNotification(this.t('notifications.error'), 'error');
        } finally {
            this.hideLoading();
        }
    }

    async stopScript(scriptId) {
        this.showLoading(this.t('loading.scriptStopping'));
        
        try {
            const result = await window.electronAPI.stopScript(scriptId);
            
            if (result.success) {
                this.showNotification(this.t('notifications.scriptStopped'), 'success');
            } else {
                this.showNotification(`${this.t('notifications.error')}: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Script stop error:', error);
            this.showNotification(this.t('notifications.error'), 'error');
        } finally {
            this.hideLoading();
        }
    }

    async restartScript(scriptId) {
        this.showLoading('Script restarting...');
        
        try {
            const result = await window.electronAPI.restartScript(scriptId);
            
            if (result.success) {
                this.showNotification('Script restarted', 'success');
            } else {
                this.showNotification(`Script could not be restarted: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Script restart error:', error);
            this.showNotification('Error restarting script', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async removeScript(scriptId) {
        const script = this.scripts.get(scriptId);
        if (!script) return;
        
        if (!confirm(`Are you sure you want to delete "${script.name}"?`)) {
            return;
        }
        
        this.showLoading(this.t('loading.scriptRemoving'));
        
        try {
            const result = await window.electronAPI.removeScript(scriptId);
            
            if (result.success) {
                this.scripts.delete(scriptId);
                this.renderScripts();
                this.updateStats();
                this.showNotification(this.t('notifications.scriptRemoved'), 'success');
            } else {
                this.showNotification(`${this.t('notifications.error')}: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Script remove error:', error);
            this.showNotification(this.t('notifications.error'), 'error');
        } finally {
            this.hideLoading();
        }
    }

    async openScriptFile(scriptId) {
        const script = this.scripts.get(scriptId);
        if (!script) return;
        
        try {
            const result = await window.electronAPI.openFile(script.path);
            
            if (result.success) {
                this.showNotification(this.t('notifications.fileOpened'), 'success');
            } else {
                this.showNotification(`${this.t('notifications.error')}: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('File open error:', error);
            this.showNotification(this.t('notifications.error'), 'error');
        }
    }

    showAddScriptModal() {
        this.elements.scriptForm.reset();
        this.elements.restartDelayGroup.style.display = 'none';
        this.elements.modal.classList.add('active');
        this.elements.scriptName.focus();
    }

    hideModal() {
        this.elements.modal.classList.remove('active');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.elements.scriptForm);
        const scriptConfig = {
            name: formData.get('script-name') || this.elements.scriptName.value,
            path: this.elements.scriptPath.value,
            args: this.elements.scriptArgs.value ? this.elements.scriptArgs.value.split(' ') : [],
            workingDir: this.elements.workingDir.value,
            autoRestart: this.elements.autoRestart.checked,
            restartDelay: parseInt(this.elements.restartDelay.value) || 5000
        };
        
        if (!scriptConfig.name || !scriptConfig.path) {
            this.showNotification(this.t('notifications.scriptNameAndPathRequired'), 'error');
            return;
        }
        
        this.showLoading(this.t('loading.scriptAdding'));
        
        try {
            const result = await window.electronAPI.addScript(scriptConfig);
            
            if (result.success) {
                this.hideModal();
                this.showNotification(this.t('notifications.scriptAdded'), 'success');
                
                // Manual refresh in portable build
                setTimeout(() => {
                    this.loadScripts();
                }, 500);
            } else {
                this.showNotification(`${this.t('notifications.error')}: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Script add error:', error);
            this.showNotification(this.t('notifications.error'), 'error');
        } finally {
            this.hideLoading();
        }
    }

    async browseScriptFile() {
        try {
            const filePath = await window.electronAPI.selectFile();
            if (filePath) {
                this.elements.scriptPath.value = filePath;
                
                if (!this.elements.scriptName.value) {
                    const fileName = filePath.split(/[\\\/]/).pop();
                    this.elements.scriptName.value = fileName;
                }
                
                if (!this.elements.workingDir.value) {
                    const dirPath = filePath.substring(0, filePath.lastIndexOf('\\'));
                    this.elements.workingDir.value = dirPath;
                }
            }
        } catch (error) {
            console.error('File selection error:', error);
            this.showNotification('Error selecting file', 'error');
        }
    }

    async browseWorkingDirectory() {
        try {
            const dirPath = await window.electronAPI.selectFolder();
            if (dirPath) {
                this.elements.workingDir.value = dirPath;
            }
        } catch (error) {
            console.error('Folder selection error:', error);
            this.showNotification('Error selecting folder', 'error');
        }
    }

    async showLogs(scriptId) {
        const script = this.scripts.get(scriptId);
        if (!script) return;
        
        this.currentLogScript = scriptId;
        this.elements.logTitle.textContent = `${script.name} - Logs`;
        this.elements.logViewer.classList.add('active');
        
        this.logBuffer = [];
        this.maxVisibleLogs = 500;
        this.logStartIndex = 0;
        
        await this.loadLogs(scriptId);
    }

    async loadLogs(scriptId) {
        try {
            const logs = await window.electronAPI.getLogs(scriptId);
            this.logBuffer = logs || [];
            this.renderLogsOptimized();
        } catch (error) {
            console.error('Log loading error:', error);
            this.showNotification('Error loading logs', 'error');
        }
    }

    renderLogsOptimized() {
        if (!this.logBuffer || this.logBuffer.length === 0) {
            this.elements.logContent.innerHTML = '<div class="log-empty"><p>No log entries yet</p></div>';
            return;
        }
        
        const startIndex = Math.max(0, this.logBuffer.length - this.maxVisibleLogs);
        const visibleLogs = this.logBuffer.slice(startIndex);
        
        const fragment = document.createDocumentFragment();
        visibleLogs.forEach(log => {
            const logElement = this.createLogElement(log);
            fragment.appendChild(logElement);
        });
        
        this.elements.logContent.innerHTML = '';
        this.elements.logContent.appendChild(fragment);
        this.elements.logContent.scrollTop = this.elements.logContent.scrollHeight;
    }

    createLogElement(log) {
        const logElement = document.createElement('div');
        logElement.className = `log-entry ${log.type}`;
        
        const timestamp = new Date(log.timestamp).toLocaleTimeString('tr-TR');
        logElement.innerHTML = `
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-message">${this.escapeHtml(log.message)}</span>
        `;
        
        return logElement;
    }

    renderLogEntry(log) {
        const timestamp = new Date(log.timestamp).toLocaleTimeString('tr-TR');
        return `
            <div class="log-entry ${log.type}">
                <span class="log-timestamp">${timestamp}</span>
                <span class="log-message">${this.escapeHtml(log.message)}</span>
            </div>
        `;
    }

    appendLogEntry(log) {
        this.logBuffer.push(log);
        
        if (this.logBuffer.length > this.maxVisibleLogs * 2) {
            this.logBuffer = this.logBuffer.slice(-this.maxVisibleLogs);
        }
        
        if (!this.logUpdatePending) {
            this.logUpdatePending = true;
            requestAnimationFrame(() => {
                const logElement = this.createLogElement(log);
                this.elements.logContent.appendChild(logElement);
                
                const logEntries = this.elements.logContent.querySelectorAll('.log-entry');
                if (logEntries.length > this.maxVisibleLogs) {
                    for (let i = 0; i < logEntries.length - this.maxVisibleLogs; i++) {
                        logEntries[i].remove();
                    }
                }
                
                this.elements.logContent.scrollTop = this.elements.logContent.scrollHeight;
                this.logUpdatePending = false;
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    hideLogViewer() {
        this.elements.logViewer.classList.remove('active');
        this.currentLogScript = null;
    }

    async openLogDirectory() {
        try {
            const result = await window.electronAPI.openLogDirectory();
            if (result.success) {
                this.showNotification('Log directory opened', 'success');
            } else {
                this.showNotification('Could not open log directory: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Log directory open error:', error);
            this.showNotification('Could not open log directory', 'error');
        }
    }

    async clearLogs() {
        if (!this.currentLogScript) {
            this.showNotification('Please open a script\'s logs first.', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to clear all logs?')) {
            try {
                // UI'daki logları temizle
                this.elements.logContent.innerHTML = '<div class="log-empty"><p>Logs cleared</p></div>';
                this.logBuffer = [];
                this.showNotification('Logs cleared', 'success');
            } catch (error) {
                console.error('Log clearing error:', error);
                this.showNotification('Error clearing logs', 'error');
            }
        }
    }

    closeLogs() {
        this.elements.logViewer.classList.remove('active');
        this.currentLogScript = null;
        this.logBuffer = [];
        this.elements.logContent.innerHTML = '';
    }

    async checkPortableStatus() {
        try {
            const status = await window.electronAPI.getPortableStatus();
            if (status.isPortable) {
                const logDir = await window.electronAPI.getLogDirectory();
                this.showNotification(
                    `Portable build active - Logs are stored here: ${logDir}`, 
                    'info', 
                    8000
                );
            }
        } catch (error) {
            console.error('Portable status check error:', error);
        }
    }

    async exportLogs() {
        if (!this.currentLogScript) {
            this.showNotification('Please open a script\'s logs first.', 'error');
            return;
        }
        try {
            const logs = await window.electronAPI.getLogs(this.currentLogScript);
            if (!logs || logs.length === 0) {
                this.showNotification('No logs to export.', 'warning');
                return;
            }
            const logText = logs.map(log => {
                const timestamp = new Date(log.timestamp).toLocaleString('tr-TR');
                return `[${timestamp}] [${log.type.toUpperCase()}] ${log.message}`;
            }).join('\n');

            const { filePath, canceled } = await window.electronAPI.showSaveDialog({
                title: 'Export Logs',
                defaultPath: 'script-logs.txt',
                filters: [
                    { name: 'Text Files', extensions: ['txt'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });
            if (canceled || !filePath) return;

            const result = await window.electronAPI.saveFile(filePath, logText);
            if (result.success) {
                this.showNotification('Logs exported successfully.', 'success');
            } else {
                this.showNotification('Error exporting logs.', 'error');
            }
        } catch (err) {
            console.error('Log export error:', err);
            this.showNotification('Error exporting logs.', 'error');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        this.elements.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderScripts();
    }

    filterScripts(searchTerm) {
        this.renderScripts();
    }

    showLoading(message = 'Loading...') {
        this.elements.loadingText.textContent = message;
        this.elements.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.remove('active');
    }

    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        if (type === 'error') {
            alert(message);
        }
    }

    startResourceMonitoring() {
        this.updateResources();
        
        this.resourceInterval = setInterval(() => {
            this.updateResources();
        }, 3000);
    }
    
    async updateResources() {
        try {
            const resources = await window.electronAPI.getSystemResources();
            
            const cpuPercent = Math.round((resources.cpu.user + resources.cpu.system) / 1000000);
            this.elements.cpuUsage.textContent = `${Math.min(cpuPercent, 100)}%`;
            
            this.elements.memoryUsage.textContent = `${resources.memory.rss} MB`;
            
            const hours = Math.floor(resources.uptime / 3600);
            const minutes = Math.floor((resources.uptime % 3600) / 60);
            this.elements.uptime.textContent = `${hours}s ${minutes}d`;
            
        } catch (error) {
            console.error('Resource update error:', error);
            this.elements.cpuUsage.textContent = 'N/A';
            this.elements.memoryUsage.textContent = 'N/A';
            this.elements.uptime.textContent = 'N/A';
        }
    }

    handleKeyboard(e) {
        if (e.ctrlKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    this.showAddScriptModal();
                    break;
                case 'r':
                    e.preventDefault();
                    this.loadScripts();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            if (this.elements.modal.classList.contains('active')) {
                this.hideModal();
            } else if (this.elements.logViewer.classList.contains('active')) {
                this.hideLogViewer();
            }
        }
    }

    showScriptSettings(scriptId) {
        const script = this.scripts.get(scriptId);
        if (!script) return;
        
        this.currentSettingsScript = scriptId;
        
        this.elements.settingsScriptName.value = script.name;
        this.elements.autoStartEnabled.checked = script.settings?.autoStartEnabled || false;
        this.elements.autoStartTime.value = script.settings?.autoStartTime || '09:00';
        this.elements.logLevel.value = script.settings?.logLevel || 'all';
        this.elements.enableFileLogging.checked = script.settings?.enableFileLogging || false;
        this.elements.maxLogSize.value = script.settings?.maxLogSize || 10;
        this.elements.logRotation.checked = script.settings?.logRotation || false;
        this.elements.priorityLevel.value = script.settings?.priorityLevel || 'normal';
        this.elements.emailNotifications.checked = script.settings?.emailNotifications || false;
        this.elements.notificationEmail.value = script.settings?.notificationEmail || '';
        

        
        this.elements.autoStartTimeGroup.style.display = 
            this.elements.autoStartEnabled.checked ? 'block' : 'none';
        this.elements.emailGroup.style.display = 
            this.elements.emailNotifications.checked ? 'block' : 'none';
        
        this.elements.settingsModal.classList.add('active');
    }

    hideSettingsModal() {
        this.elements.settingsModal.classList.remove('active');
        this.currentSettingsScript = null;
    }

    async handleSettingsSubmit(e) {
        e.preventDefault();
        
        if (!this.currentSettingsScript) return;
        
        const settings = {
            autoStartEnabled: this.elements.autoStartEnabled.checked,
            autoStartTime: this.elements.autoStartTime.value,
            logLevel: this.elements.logLevel.value,
            enableFileLogging: this.elements.enableFileLogging.checked,
            maxLogSize: parseInt(this.elements.maxLogSize.value),
            logRotation: this.elements.logRotation.checked,
            priorityLevel: this.elements.priorityLevel.value,
            emailNotifications: this.elements.emailNotifications.checked,
            notificationEmail: this.elements.notificationEmail.value
        };
        
        this.showLoading(this.t('loading.settingsSaving'));
        
        try {
            const result = await window.electronAPI.updateScriptSettings(this.currentSettingsScript, settings);
            
            if (result.success) {
                const script = this.scripts.get(this.currentSettingsScript);
                if (script) {
                    script.settings = settings;
                    this.scripts.set(this.currentSettingsScript, script);
                }
                
                this.hideSettingsModal();
                this.showNotification(this.t('notifications.settingsSaved'), 'success');
                
                if (settings.autoStartEnabled) {
                    this.scheduleScript(this.currentSettingsScript, settings.autoStartTime);
                }
            } else {
                this.showNotification(`Settings could not be saved: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Settings save error:', error);
            this.showNotification('Error saving settings', 'error');
        } finally {
            this.hideLoading();
        }
    }

    scheduleScript(scriptId, time) {
        const script = this.scripts.get(scriptId);
        if (!script) return;
        
        if (script.schedulerTimer) {
            clearTimeout(script.schedulerTimer);
        }
        
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const scheduledTime = new Date(now);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const delay = scheduledTime.getTime() - now.getTime();
        
        script.schedulerTimer = setTimeout(async () => {
            try {
                await this.restartScript(scriptId);
                this.showNotification(`${script.name} restarted automatically`, 'success');
                this.scheduleScript(scriptId, time);
            } catch (error) {
                console.error('Auto-restart error:', error);
                this.showNotification(`${script.name} could not be restarted automatically`, 'error');
            }
        }, delay);
        
        const timeString = scheduledTime.toLocaleString('tr-TR');
        this.showNotification(`${script.name} will be restarted automatically on ${timeString}`, 'info');
    }

    async showGlobalEmailModal() {
        try {
            const settings = await window.electronAPI.getGlobalEmailSettings();
            
            this.elements.globalEmailService.value = settings.service || 'gmail';
            this.elements.globalEmailUsername.value = settings.username || '';
            this.elements.globalEmailPassword.value = settings.password || '';
            this.elements.globalSmtpHost.value = settings.host || 'smtp.gmail.com';
            this.elements.globalSmtpPort.value = settings.port || '587';
            this.elements.globalSmtpSecure.checked = settings.secure || false;
            this.elements.autoRestartApp.checked = settings.autoRestartApp || false;
            
            this.elements.globalCustomSmtpGroup.style.display = 
                this.elements.globalEmailService.value === 'custom' ? 'block' : 'none';
            
            this.elements.globalEmailModal.classList.add('active');
        } catch (error) {
            console.error('Global email settings could not be loaded:', error);
            this.showNotification('Could not load email settings', 'error');
        }
    }

    hideGlobalEmailModal() {
        this.elements.globalEmailModal.classList.remove('active');
    }

    async handleGlobalEmailSubmit(e) {
        e.preventDefault();
        
        const settings = {
            service: this.elements.globalEmailService.value,
            username: this.elements.globalEmailUsername.value,
            password: this.elements.globalEmailPassword.value,
            host: this.elements.globalSmtpHost.value,
            port: parseInt(this.elements.globalSmtpPort.value) || 587,
            secure: this.elements.globalSmtpSecure.checked,
            autoRestartApp: this.elements.autoRestartApp.checked
        };
        
        this.showLoading(this.t('loading.emailSettingsSaving'));
        
        try {
            const result = await window.electronAPI.saveGlobalEmailSettings(settings);
            
            if (result.success) {
                this.hideGlobalEmailModal();
                this.showNotification('Email settings saved', 'success');
            } else {
                this.showNotification(`Email settings could not be saved: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Email settings save error:', error);
            this.showNotification('Error saving email settings', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async sendGlobalTestEmail() {
        const email = this.elements.globalEmailUsername.value;
        if (!email) {
            this.showNotification('Please enter an email address', 'error');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        this.showLoading(this.t('loading.emailSending'));
        
        try {
            const result = await window.electronAPI.testGlobalEmail(email);
            if (result.success) {
                this.showNotification('Test email sent successfully', 'success');
            } else {
                this.showNotification(`Could not send test email: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Test email error:', error);
            this.showNotification('Error sending test email', 'error');
        } finally {
            this.hideLoading();
        }
    }

    getLogLevelText(logLevel) {
        if (window.i18n) {
            const key = `logLevels.${logLevel}`;
            return window.i18n.t(key);
        }
        switch (logLevel) {
            case 'all': return 'All logs';
            case 'critical': return 'Critical logs only';
            case 'error': return 'Error logs only';
            case 'none': return 'No logging';
            default: return logLevel;
        }
    }

    getFileTypeDescription(filePath) {
        const ext = filePath.split('.').pop().toLowerCase();
        
        switch (ext) {
            case 'js': return 'JavaScript';
            case 'py': return 'Python';
            case 'bat': return 'Batch File';
            case 'cmd': return 'Command File';
            case 'ps1': return 'PowerShell Script';
            case 'exe': return 'Executable';
            default: return 'Unknown';
        }
    }

    // i18n çeviri metodu
    t(key, params = {}) {
        if (window.i18n) {
            return window.i18n.t(key, params);
        }
        return key; // Fallback
    }
    
    async loadLanguage(language = 'en') {
        try {
            if (window.i18n) {
                await window.i18n.changeLanguage(language);
                
                // UI elements update
                this.updateDynamicContent();
                this.updateLanguageRadios();
            }
        } catch (error) {
            console.error('Language loading error:', error);
        }
    }

    async initializeI18n() {
        try {
            if (window.i18n) {
                await window.i18n.init();
                this.updateDynamicContent();
                this.updateLanguageRadios();
            } else {
                console.error('i18n not available');
            }
        } catch (error) {
            console.error('Error initializing i18n:', error);
        }
    }
    
    updateLanguageRadios() {
        // Update language radios in the menu (send info to main process)
        
        // HTML does not have language selector, radios are managed by main process
        // This method's purpose is to update UI in the renderer
        
        // If HTML will have a language selector in the future, code can be added here
    }

    async handleLanguageChangeFromMenu(language) {
        try {
            if (window.i18n) {
                await window.i18n.changeLanguage(language);
                
                this.updateDynamicContent();
                
                this.updateLanguageRadios();
                
                this.showNotification(`Language changed to: ${language === 'en' ? 'English' : 'Turkish'}`, 'success');
            } else {
                console.error('i18n not available in handleLanguageChangeFromMenu');
            }
        } catch (error) {
            console.error('Error in handleLanguageChangeFromMenu:', error);
            this.showNotification('Error changing language', 'error');
        }
    }
    
    updateDynamicContent() {
        this.updateStats();
        
        this.renderScripts();
        
        this.updateButtonTexts();
        
        this.updateStaticTexts();
    }
    
    updateButtonTexts() {
        // Update text for static buttons
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key && window.i18n) {
                element.textContent = window.i18n.t(key);
            }
        });
    }
    
    updateStaticTexts() {
        // Update other static texts
        if (window.i18n) {
            // Update menu texts
            const menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(item => {
                const key = item.getAttribute('data-i18n');
                if (key) {
                    item.textContent = window.i18n.t(key);
                }
            });
            
            // Update placeholder texts
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.placeholder = window.i18n.t('scripts.searchPlaceholder');
            }
        }
    }
    
    showParametersTooltip(e) {
        this.hideParametersTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip show';
        tooltip.id = 'parameters-tooltip';
        
        tooltip.innerHTML = `
            <h4>${this.t('tooltip.parameters.title')}</h4>
            <p>${this.t('tooltip.parameters.description')}</p>
            
            <div class="example">
                <div class="example-title">${this.t('tooltip.parameters.batchTitle')}</div>
                <div class="example-code">${this.t('tooltip.parameters.batchExample')}</div>
            </div>
            
            <div class="example">
                <div class="example-title">${this.t('tooltip.parameters.pythonTitle')}</div>
                <div class="example-code">${this.t('tooltip.parameters.pythonExample')}</div>
            </div>
            
            <div class="example">
                <div class="example-title">${this.t('tooltip.parameters.powershellTitle')}</div>
                <div class="example-code">${this.t('tooltip.parameters.powershellExample')}</div>
            </div>
            
            <div class="example">
                <div class="example-title">${this.t('tooltip.parameters.nodeTitle')}</div>
                <div class="example-code">${this.t('tooltip.parameters.nodeExample')}</div>
            </div>
            
            <p style="margin-top: 8px; font-size: 11px; color: #bdc3c7;">
                ${this.t('tooltip.parameters.note')}
            </p>
        `;
        
        const rect = e.target.getBoundingClientRect();
        const tooltipTop = rect.top + window.scrollY + (rect.height / 2) - 120;
        const tooltipLeft = rect.right + window.scrollX + 15;
        
        tooltip.style.top = tooltipTop + 'px';
        tooltip.style.left = tooltipLeft + 'px';
        tooltip.classList.add('tooltip-right');
        
        document.body.appendChild(tooltip);
        
        setTimeout(() => {
            const tooltipRect = tooltip.getBoundingClientRect();
            
            if (tooltipRect.right > window.innerWidth - 10) {
                tooltip.style.left = (rect.left + window.scrollX - tooltipRect.width - 15) + 'px';
                tooltip.classList.remove('tooltip-right');
                tooltip.classList.add('tooltip-left');
            }
            
            if (tooltipRect.top < 10) {
                tooltip.style.top = (rect.bottom + window.scrollY + 8) + 'px';
                tooltip.classList.remove('tooltip-right', 'tooltip-left');
                tooltip.classList.add('tooltip-bottom');
            }
            
            if (tooltipRect.bottom > window.innerHeight - 10) {
                tooltip.style.top = (rect.top + window.scrollY - tooltipRect.height - 8) + 'px';
                tooltip.classList.remove('tooltip-right', 'tooltip-left');
                tooltip.classList.add('tooltip-top');
            }
        }, 10);
    }
    
    hideParametersTooltip() {
        const tooltip = document.getElementById('parameters-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
}

let scriptManager;

// Start ScriptManager
scriptManager = new ScriptManagerUI();
window.scriptManager = scriptManager;