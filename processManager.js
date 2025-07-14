const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

class ProcessManager extends EventEmitter {
    constructor() {
        super();
        this.processes = new Map(); // PID -> Process bilgisi
        this.scripts = new Map(); // Script ID -> Script bilgisi
        this.logBuffers = new Map(); // Process ID -> Log buffer
        this.maxLogLines = 1000; // Maksimum log satırı
        
        // Proje kök dizinindeki logs klasörünü kullan
        const projectRoot = process.cwd();
        this.dataFile = path.join(projectRoot, 'data', 'scripts.json');
        this.logsDir = path.join(projectRoot, 'logs');
        
        this.ensureDataDirectory();
        this.ensureLogsDirectory();
        this.loadScriptsFromFile();
    }

    // Script tanımlama (security validation ile)
    addScript(scriptConfig) {
        // Security validation
        this.validateScriptPath(scriptConfig.path);
        this.validateScriptName(scriptConfig.name);
        this.validateWorkingDirectory(scriptConfig.workingDir);
        
        const scriptId = this.generateId();
        const script = {
            id: scriptId,
            name: scriptConfig.name,
            path: path.resolve(scriptConfig.path), // Absolute path'e çevir
            args: this.sanitizeArgs(scriptConfig.args || []),
            workingDir: scriptConfig.workingDir || path.dirname(scriptConfig.path),
            autoRestart: scriptConfig.autoRestart || false,
            restartDelay: scriptConfig.restartDelay || 5000,
            status: 'stopped',
            pid: null,
            createdAt: new Date(),
            lastStarted: null,
            restartCount: 0,
            settings: {
                logLevel: 'all', // Default log level
                enableFileLogging: false // Default file logging disabled
            }
        };

        this.scripts.set(scriptId, script);
        this.emit('scriptAdded', script);
        this.saveScriptsToFile(); // Otomatik kaydet
        return scriptId;
    }

    // Script path güvenlik validation
    validateScriptPath(scriptPath) {
        if (!scriptPath || typeof scriptPath !== 'string') {
            throw new Error('Script path gerekli ve string olmalıdır');
        }

        // Directory traversal saldırılarını engelle
        const normalizedPath = path.normalize(scriptPath);
        const resolvedPath = path.resolve(normalizedPath);
        
        // Path traversal kontrolleri
        if (normalizedPath.includes('..')) {
            throw new Error('Directory traversal karakterleri (..) kullanılamaz');
        }

        // Null byte injection koruması
        if (scriptPath.includes('\0')) {
            throw new Error('Null byte karakteri kullanılamaz');
        }

        // Güvenli dosya uzantıları kontrolü
        if (!this.isSupportedFileType(scriptPath)) {
            throw new Error('Desteklenmeyen dosya türü');
        }

        // Dosya varlık kontrolü
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Dosya bulunamadı: ${resolvedPath}`);
        }

        // Dosyanın executable olup olmadığını kontrol et (Windows hariç)
        if (process.platform !== 'win32') {
            try {
                fs.accessSync(resolvedPath, fs.constants.F_OK | fs.constants.R_OK);
            } catch (error) {
                throw new Error('Dosya okuma izni yok');
            }
        }

        return resolvedPath;
    }

    // Script name validation
    validateScriptName(scriptName) {
        if (!scriptName || typeof scriptName !== 'string') {
            throw new Error('Script adı gerekli ve string olmalıdır');
        }

        // Boş veya sadece boşluk kontrolü
        if (scriptName.trim().length === 0) {
            throw new Error('Script adı boş olamaz');
        }

        // Maksimum uzunluk kontrolü
        if (scriptName.length > 100) {
            throw new Error('Script adı 100 karakterden uzun olamaz');
        }

        // Güvenli karakter kontrolü
        const unsafeChars = /[<>:"/\\|?*\x00-\x1f]/;
        if (unsafeChars.test(scriptName)) {
            throw new Error('Script adında güvenli olmayan karakterler var');
        }

        return scriptName.trim();
    }

    // Working directory validation
    validateWorkingDirectory(workingDir) {
        if (!workingDir) return; // Opsiyonel

        if (typeof workingDir !== 'string') {
            throw new Error('Working directory string olmalıdır');
        }

        // Directory traversal koruması
        const normalizedPath = path.normalize(workingDir);
        if (normalizedPath.includes('..')) {
            throw new Error('Working directory\'de directory traversal karakterleri (..) kullanılamaz');
        }

        // Null byte injection koruması
        if (workingDir.includes('\0')) {
            throw new Error('Working directory\'de null byte karakteri kullanılamaz');
        }

        const resolvedPath = path.resolve(normalizedPath);
        
        // Dizin varlık kontrolü
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Working directory bulunamadı: ${resolvedPath}`);
        }

        // Dizin mi kontrolü
        const stats = fs.statSync(resolvedPath);
        if (!stats.isDirectory()) {
            throw new Error('Working directory bir dizin olmalıdır');
        }

        return resolvedPath;
    }

    // Arguments sanitization
    sanitizeArgs(args) {
        if (!Array.isArray(args)) {
            throw new Error('Arguments array olmalıdır');
        }

        return args.map(arg => {
            if (typeof arg !== 'string') {
                throw new Error('Tüm argumentlar string olmalıdır');
            }

            // Null byte injection koruması
            if (arg.includes('\0')) {
                throw new Error('Argumentlarda null byte karakteri kullanılamaz');
            }

            // Maksimum uzunluk kontrolü
            if (arg.length > 1000) {
                throw new Error('Argument 1000 karakterden uzun olamaz');
            }

            return arg.trim();
        });
    }

    // Script başlatma
    async startScript(scriptId) {
        const script = this.scripts.get(scriptId);
        if (!script) {
            throw new Error(`Script bulunamadı: ${scriptId}`);
        }

        if (script.status === 'running') {
            throw new Error(`Script zaten çalışıyor: ${script.name}`);
        }

        try {
            // Dosya varlığını kontrol et
            if (!fs.existsSync(script.path)) {
                throw new Error(`Script dosyası bulunamadı: ${script.path}`);
            }

            // Dosya türüne göre çalıştırıcı ve argumentları belirle
            const { command, args } = this.getExecutorForFile(script.path, script.args);

            const process = spawn(command, args, {
                cwd: script.workingDir,
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false
            });

            // Process bilgilerini kaydet
            script.pid = process.pid;
            script.status = 'running';
            script.lastStarted = new Date();
            
            this.processes.set(process.pid, {
                process: process,
                scriptId: scriptId,
                script: script
            });

            // Log buffer'ını başlat
            this.logBuffers.set(scriptId, []);

            // Stdout dinle
            process.stdout.on('data', (data) => {
                this.addLog(scriptId, 'stdout', data.toString());
            });

            // Stderr dinle
            process.stderr.on('data', (data) => {
                this.addLog(scriptId, 'stderr', data.toString());
            });

            // Process sonlandığında
            process.on('close', (code) => {
                this.handleProcessClose(scriptId, code);
            });

            // Process hata durumunda
            process.on('error', (error) => {
                this.addLog(scriptId, 'error', `Process hatası: ${error.message}`);
                this.handleProcessError(scriptId, error);
            });

            this.emit('scriptStarted', script);
            return process.pid;

        } catch (error) {
            script.status = 'error';
            this.emit('scriptError', script, error);
            throw error;
        }
    }

    // Script durdurma
    async stopScript(scriptId) {
        const script = this.scripts.get(scriptId);
        if (!script) {
            throw new Error(`Script bulunamadı: ${scriptId}`);
        }

        if (script.status !== 'running') {
            throw new Error(`Script zaten durmuş: ${script.name}`);
        }

        const processInfo = this.processes.get(script.pid);
        if (processInfo) {
            try {
                // Windows için taskkill kullan
                if (process.platform === 'win32') {
                    exec(`taskkill /PID ${script.pid} /F`, (error) => {
                        if (error) {
                            console.error(`Process sonlandırma hatası: ${error.message}`);
                        }
                    });
                } else {
                    processInfo.process.kill('SIGTERM');
                }

                // 5 saniye sonra zorla öldür
                setTimeout(() => {
                    if (this.processes.has(script.pid)) {
                        try {
                            processInfo.process.kill('SIGKILL');
                        } catch (e) {
                            // Process zaten ölmüş olabilir
                        }
                    }
                }, 5000);

            } catch (error) {
                console.error(`Process durdurma hatası: ${error.message}`);
            }
        }

        script.status = 'stopped';
        script.pid = null;
        this.emit('scriptStopped', script);
    }

    // Script yeniden başlatma
    async restartScript(scriptId) {
        const script = this.scripts.get(scriptId);
        if (!script) {
            throw new Error(`Script bulunamadı: ${scriptId}`);
        }

        if (script.status === 'running') {
            await this.stopScript(scriptId);
            // Biraz bekle
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        script.restartCount++;
        return await this.startScript(scriptId);
    }

    // Log ekleme
    addLog(scriptId, type, message) {
        const script = this.scripts.get(scriptId);
        if (!script) return;

        // Log level kontrolü - default olarak 'all'
        const logLevel = script.settings?.logLevel || 'all';

        // Buffer'a her zaman ekle (anlık görüntüleme için)
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            message: message.trim()
        };

        if (!this.logBuffers.has(scriptId)) {
            this.logBuffers.set(scriptId, []);
        }

        const buffer = this.logBuffers.get(scriptId);
        buffer.push(logEntry);

        // Buffer boyutunu sınırla
        if (buffer.length > this.maxLogLines) {
            buffer.shift();
        }

        // Eğer dosya kaydetme etkinse ve logLevel 'none' değilse dosyaya yaz
        const enableFileLogging = script.settings?.enableFileLogging || false;
        
        if (enableFileLogging && logLevel !== 'none') {
            // Log filtreleme sadece dosya için
            const shouldLogToFile = this.shouldLogEntry(type, logLevel);
            if (shouldLogToFile) {
                this.writeLogToFile(scriptId, logEntry);
            }
        }

        this.emit('logAdded', scriptId, logEntry);
    }

    // Log entry'nin kaydedilip kaydedilmeyeceğini kontrol et
    shouldLogEntry(type, logLevel) {
        switch (logLevel) {
            case 'all':
                return true;
            case 'critical':
                return type === 'error' || type === 'system';
            case 'error':
                return type === 'error';
            case 'none':
                return false;
            default:
                return true;
        }
    }

    // Log dosyasının yolunu al
    getLogFilePath(scriptId) {
        const script = this.scripts.get(scriptId);
        if (!script) {
            return path.join(this.logsDir, `${scriptId}.log`);
        }
        
        // Script adını dosya adı için güvenli hale getir
        const safeScriptName = script.name.replace(/[<>:"/\\|?*]/g, '_');
        
        // Tarih formatı: YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        
        // Format: ScriptAdi_2023-12-07.log
        const logFilePath = path.join(this.logsDir, `${safeScriptName}_${today}.log`);
        
        return logFilePath;
    }

    // Log'u dosyaya yaz
    writeLogToFile(scriptId, logEntry) {
        try {
            const script = this.scripts.get(scriptId);
            if (!script) return;

            const logFilePath = this.getLogFilePath(scriptId);
            const logLine = `${logEntry.timestamp} [${logEntry.type.toUpperCase()}] ${logEntry.message}\n`;
            
            // Dosyaya append
            fs.appendFileSync(logFilePath, logLine, 'utf8');
            
            // Log rotation kontrolü
            if (script.settings?.logRotation) {
                this.checkLogRotation(scriptId);
            }
        } catch (error) {
            console.error(`Log dosyası yazma hatası (${scriptId}):`, error.message);
        }
    }

    // Log rotation kontrolü
    checkLogRotation(scriptId) {
        try {
            const script = this.scripts.get(scriptId);
            if (!script) return;

            const logFilePath = this.getLogFilePath(scriptId);
            if (!fs.existsSync(logFilePath)) return;

            const stats = fs.statSync(logFilePath);
            const maxSizeMB = script.settings?.maxLogSize || 10;
            const maxSizeBytes = maxSizeMB * 1024 * 1024; // MB to bytes

            if (stats.size > maxSizeBytes) {
                this.rotateLogFile(scriptId);
            }
        } catch (error) {
            console.error(`Log rotation kontrolü hatası (${scriptId}):`, error.message);
        }
    }

    // Log dosyasını rotate et
    rotateLogFile(scriptId) {
        try {
            const script = this.scripts.get(scriptId);
            if (!script) return;
            
            const logFilePath = this.getLogFilePath(scriptId);
            const safeScriptName = script.name.replace(/[<>:"/\\|?*]/g, '_');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            // Format: ScriptAdi_2023-12-07_10-30-45.log
            const rotatedFilePath = path.join(this.logsDir, `${safeScriptName}_${timestamp}.log`);
            
            // Mevcut dosyayı yeniden adlandır
            fs.renameSync(logFilePath, rotatedFilePath);
            
            // Yeni log dosyası başlat
            const initialLog = `${new Date().toISOString()} [SYSTEM] Log rotated, previous log: ${path.basename(rotatedFilePath)}\n`;
            fs.writeFileSync(logFilePath, initialLog, 'utf8');
            
            console.log(`Log dosyası rotate edildi: ${script.name}`);
        } catch (error) {
            console.error(`Log rotation hatası (${scriptId}):`, error.message);
        }
    }

    // Process kapandığında
    handleProcessClose(scriptId, code) {
        const script = this.scripts.get(scriptId);
        if (!script) return;

        this.processes.delete(script.pid);
        script.status = 'stopped';
        script.pid = null;

        this.addLog(scriptId, 'system', `Process sonlandı (kod: ${code})`);
        
        // Eğer hata koduyla kapandıysa ve email bildirimi etkinse
        if (code !== 0 && script.settings?.emailNotifications && script.settings?.notificationEmail) {
            const errorMessage = `Script beklenmedik şekilde sonlandı (Çıkış kodu: ${code})`;
            this.emit('sendErrorEmail', script.name, errorMessage, script.settings.notificationEmail);
        }
        
        this.emit('scriptStopped', script);

        // Otomatik yeniden başlatma
        if (script.autoRestart && code !== 0) {
            this.addLog(scriptId, 'system', `${script.restartDelay}ms sonra yeniden başlatılacak...`);
            setTimeout(() => {
                this.restartScript(scriptId).catch(error => {
                    this.addLog(scriptId, 'error', `Yeniden başlatma hatası: ${error.message}`);
                });
            }, script.restartDelay);
        }
    }

    // Process hata durumunda
    handleProcessError(scriptId, error) {
        const script = this.scripts.get(scriptId);
        if (!script) return;

        script.status = 'error';
        if (script.pid) {
            this.processes.delete(script.pid);
        }
        script.pid = null;

        // Email bildirimi gönder (eğer etkinse)
        if (script.settings?.emailNotifications && script.settings?.notificationEmail) {
            this.emit('sendErrorEmail', script.name, error.message, script.settings.notificationEmail);
        }

        this.emit('scriptError', script, error);
    }

    // Log'ları al (hem RAM'den hem dosyadan)
    getLogs(scriptId, lastN = 100) {
        // Önce dosyadan logları oku
        const fileLogs = this.readLogsFromFile(scriptId);
        
        // RAM'deki logları al
        const bufferLogs = this.logBuffers.get(scriptId) || [];
        
        // İkisini birleştir ve timestamp'e göre sırala
        const allLogs = [...fileLogs, ...bufferLogs];
        allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Duplicate'ları temizle (aynı timestamp ve message'a sahip olanları)
        const uniqueLogs = allLogs.filter((log, index, arr) => {
            return index === arr.findIndex(l => l.timestamp === log.timestamp && l.message === log.message);
        });
        
        return uniqueLogs.slice(-lastN);
    }

    // Log dosyasından logları oku
    readLogsFromFile(scriptId) {
        try {
            const logFilePath = this.getLogFilePath(scriptId);
            if (!fs.existsSync(logFilePath)) return [];
            
            const logContent = fs.readFileSync(logFilePath, 'utf8');
            const lines = logContent.split('\n').filter(line => line.trim());
            
            return lines.map(line => {
                try {
                    // Log formatı: "2023-12-07T10:30:00.000Z [STDOUT] Message"
                    const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[([^\]]+)\] (.+)$/);
                    if (match) {
                        return {
                            timestamp: match[1],
                            type: match[2].toLowerCase(),
                            message: match[3]
                        };
                    }
                    return null;
                } catch (error) {
                    return null;
                }
            }).filter(log => log !== null);
        } catch (error) {
            console.error(`Log dosyası okuma hatası (${scriptId}):`, error.message);
            return [];
        }
    }

    // Tüm scriptleri al
    getAllScripts() {
        return Array.from(this.scripts.values());
    }

    // Çalışan scriptleri al
    getRunningScripts() {
        return Array.from(this.scripts.values()).filter(script => script.status === 'running');
    }

    // Script sil
    removeScript(scriptId) {
        const script = this.scripts.get(scriptId);
        if (!script) {
            throw new Error(`Script bulunamadı: ${scriptId}`);
        }

        if (script.status === 'running') {
            throw new Error(`Çalışan script silinemez: ${script.name}`);
        }

        this.scripts.delete(scriptId);
        this.logBuffers.delete(scriptId);
        
        // Log dosyasını sil
        this.removeLogFile(scriptId);
        
        this.emit('scriptRemoved', script);
        this.saveScriptsToFile(); // Otomatik kaydet
    }

    // Log dosyasını sil
    removeLogFile(scriptId) {
        try {
            const script = this.scripts.get(scriptId);
            if (!script) return;
            
            const safeScriptName = script.name.replace(/[<>:"/\\|?*]/g, '_');
            
            // Güncel log dosyasını sil
            const logFilePath = this.getLogFilePath(scriptId);
            if (fs.existsSync(logFilePath)) {
                fs.unlinkSync(logFilePath);
                console.log(`Log dosyası silindi: ${script.name}`);
            }
            
            // Bu script'e ait tüm log dosyalarını sil (güncel + rotate edilmiş)
            const files = fs.readdirSync(this.logsDir);
            const scriptLogFiles = files.filter(file => {
                // Format: ScriptAdi_2023-12-07.log veya ScriptAdi_2023-12-07_10-30-45.log
                return file.startsWith(`${safeScriptName}_`) && file.endsWith('.log');
            });
            
            scriptLogFiles.forEach(file => {
                const filePath = path.join(this.logsDir, file);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Script log dosyası silindi: ${file}`);
                }
            });
        } catch (error) {
            console.error(`Log dosyası silme hatası (${scriptId}):`, error.message);
        }
    }

    // Script güncelle
    updateScript(scriptId, updates) {
        const script = this.scripts.get(scriptId);
        if (!script) {
            throw new Error(`Script bulunamadı: ${scriptId}`);
        }

        if (script.status === 'running') {
            throw new Error(`Çalışan script güncellenemez: ${script.name}`);
        }

        Object.assign(script, updates);
        this.emit('scriptUpdated', script);
        this.saveScriptsToFile(); // Otomatik kaydet
    }

    // Script settings güncelle
    updateScriptSettings(scriptId, settings) {
        const script = this.scripts.get(scriptId);
        if (!script) {
            throw new Error(`Script bulunamadı: ${scriptId}`);
        }

        // Settings objesi yoksa oluştur
        if (!script.settings) {
            script.settings = {};
        }

        // Settings'i güncelle
        Object.assign(script.settings, settings);
        
        // Log level değişmişse, mevcut log buffer'ı temizle
        if (settings.logLevel && settings.logLevel !== 'all') {
            this.logBuffers.set(scriptId, []);
        }

        this.emit('scriptSettingsUpdated', script);
        this.saveScriptsToFile(); // Otomatik kaydet
    }

    // Dosya türüne göre çalıştırıcı belirle
    getExecutorForFile(filePath, args = []) {
        const ext = path.extname(filePath).toLowerCase();
        
        switch (ext) {
            case '.js':
                // JavaScript dosyaları için Node.js
                return {
                    command: 'node',
                    args: [filePath, ...args]
                };
            
            case '.py':
                // Python dosyaları için Python
                return {
                    command: 'python',
                    args: [filePath, ...args]
                };
            
            case '.bat':
            case '.cmd':
                // Windows batch dosyaları
                return {
                    command: filePath,
                    args: args
                };
            
            case '.ps1':
                // PowerShell dosyaları
                return {
                    command: 'powershell',
                    args: ['-ExecutionPolicy', 'Bypass', '-File', filePath, ...args]
                };
            
            case '.exe':
                // Executable dosyalar
                return {
                    command: filePath,
                    args: args
                };
            
            default:
                // Bilinmeyen dosya türleri için direkt çalıştırmayı dene
                return {
                    command: filePath,
                    args: args
                };
        }
    }

    // Desteklenen dosya türlerini kontrol et
    isSupportedFileType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const supportedExts = ['.js', '.py', '.bat', '.cmd', '.ps1', '.exe'];
        return supportedExts.includes(ext);
    }

    // Dosya türü için açıklama al
    getFileTypeDescription(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        switch (ext) {
            case '.js': return 'JavaScript';
            case '.py': return 'Python';
            case '.bat': return 'Batch File';
            case '.cmd': return 'Command File';
            case '.ps1': return 'PowerShell Script';
            case '.exe': return 'Executable';
            default: return 'Unknown';
        }
    }

    // Unique ID oluştur
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Data klasörünü oluştur
    ensureDataDirectory() {
        const dataDir = path.dirname(this.dataFile);
        if (!fs.existsSync(dataDir)) {
            try {
                fs.mkdirSync(dataDir, { recursive: true });
                console.log(`Data klasörü oluşturuldu: ${dataDir}`);
            } catch (error) {
                console.error('Data klasörü oluşturma hatası:', error.message);
            }
        }
    }

    // Logs klasörünü oluştur
    ensureLogsDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            try {
                fs.mkdirSync(this.logsDir, { recursive: true });
                console.log(`Logs klasörü oluşturuldu: ${this.logsDir}`);
            } catch (error) {
                console.error('Logs klasörü oluşturma hatası:', error.message);
            }
        }
    }

    // Script'leri dosyadan yükle
    loadScriptsFromFile() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = fs.readFileSync(this.dataFile, 'utf8');
                const scriptsData = JSON.parse(data);
                
                scriptsData.scripts.forEach(scriptData => {
                    // Çalışan durumları sıfırla (uygulama yeniden başladığı için)
                    scriptData.status = 'stopped';
                    scriptData.pid = null;
                    scriptData.lastStarted = scriptData.lastStarted ? new Date(scriptData.lastStarted) : null;
                    scriptData.createdAt = new Date(scriptData.createdAt);
                    
                    this.scripts.set(scriptData.id, scriptData);
                    this.logBuffers.set(scriptData.id, []);
                });

                console.log(`${scriptsData.scripts.length} script dosyadan yüklendi`);
            }
        } catch (error) {
            console.error('Script dosyası yüklenirken hata:', error.message);
        }
    }

    // Script'leri dosyaya kaydet
    saveScriptsToFile() {
        try {
            const scriptsData = {
                version: '1.0.0',
                lastSaved: new Date().toISOString(),
                scripts: Array.from(this.scripts.values()).map(script => ({
                    ...script,
                    // Çalışma durumunu kaydetme (her restart'ta sıfırlanacak)
                    status: 'stopped',
                    pid: null
                }))
            };

            fs.writeFileSync(this.dataFile, JSON.stringify(scriptsData, null, 2), 'utf8');
            console.log('Scriptler dosyaya kaydedildi');
        } catch (error) {
            console.error('Script dosyasına kaydetme hatası:', error.message);
        }
    }

    // Sistem kaynaklarını temizle
    cleanup() {
        // Önce script'leri kaydet
        this.saveScriptsToFile();
        
        // Sonra process'leri temizle
        for (const [pid, processInfo] of this.processes) {
            try {
                processInfo.process.kill('SIGTERM');
            } catch (error) {
                console.error(`Cleanup hatası: ${error.message}`);
            }
        }
        this.processes.clear();
        // Script'leri temizleme - kalıcı olmaları için
        // this.scripts.clear();
        this.logBuffers.clear();
    }
}

module.exports = ProcessManager;
