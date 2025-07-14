# 🚀 Script Manager

A powerful Electron desktop application for managing scripts and bots in Windows from a single panel.

## ✨ Features

### 📋 Script Management
- **Multi-Language Support**: JavaScript (.js), Python (.py), Batch (.bat/.cmd), PowerShell (.ps1), Executable (.exe)
- **Drag & Drop**: Add files by dragging and dropping
- **Auto Restart**: Automatic restart when scripts crash
- **Scheduled Execution**: Automatic execution at specific times
- **File Watching**: Automatic detection when script files change

### 📊 Monitoring & Logging
- **Real-Time Logs**: Live log viewing
- **Log Levels**: All/Critical/Error/None options
- **Log Rotation**: Automatic log rotation
- **File-Based Logging**: Persistent log storage
- **System Resources**: CPU, RAM, Uptime monitoring

### 🔧 Advanced Settings
- **Email Notifications**: Automatic email sending in error cases
- **Priority Levels**: System priority of scripts
- **Working Directory**: Custom working directory for each script
- **Parameter Support**: Command line arguments

### 🌐 Multilingual Interface
- **English** and **Turkish** language support
- **Menu-Based Language Switching**
- **Translator Friendly**: Easy translation system

## 🚀 Quick Start

### 💻 End User

#### Option 1: Installer (.exe) - Recommended
1. Download `Script Manager Setup.exe`
2. Run the installer
3. Launch from desktop shortcut after installation

#### Option 2: Portable (.exe)
1. Download `Script Manager-Portable.exe`
2. Place the file in desired folder
3. Run directly (no installation required)

### 🛠️ Developer

#### Development Environment
```bash
# Clone the project
git clone https://github.com/uncertainmario/Script-Manager.git
cd Script-Manager

# Install dependencies
npm install

# Run in development mode
npm run dev
```

#### Building

**Easy Build for Windows:**
```bash
# Run build.bat file
./build.bat
```

**Manual Build:**
```bash
# Build both versions
npm run build:all

# Installer only
npm run build:win

# Portable only
npm run build:portable
```

## 📁 Project Structure

```
scriptmanager/
├── src/
│   ├── main/           # Main Electron process
│   │   ├── main.js     # Main application file
│   │   └── preload.js  # Preload script
│   └── renderer/       # Renderer process (UI)
│       ├── index.html  # Main HTML
│       ├── css/        # Style files
│       ├── js/         # JavaScript files
│       └── locales/    # Language files
├── data/               # Application data
├── logs/               # Log files
├── assets/             # Application resources
├── processManager.js   # Script management engine
├── package.json        # Project configuration
├── build.bat          # Windows build script
└── BUILD.md           # Detailed build guide
```

## 🎯 Usage

### Adding Scripts
1. Click **Add Script** button
2. Select your script file (.js, .py, .bat, .cmd, .ps1, .exe)
3. Add parameters if needed
4. Click **Save** button

### Script Operations
- **▶️ Start**: Starts the script
- **⏹️ Stop**: Stops the script
- **🔄 Restart**: Restarts the script
- **📋 View Logs**: Views logs
- **📁 Show in Folder**: Shows file in folder
- **⚙️ Settings**: Opens script settings

### Logging Settings
1. Click **⚙️ Settings** button on script card
2. Select **Log Level**:
   - **No logging**: Logging disabled
   - **All logs**: All logs
   - **Critical only**: Only critical logs
   - **Error only**: Only error logs
3. Set **Max Log Size** (MB)
4. Enable **Log Rotation** (optional)

## 🔧 System Requirements

- **Operating System**: Windows 10/11 (64-bit)
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk**: 100MB free space
- **Runtimes**: 
  - Node.js (for JavaScript files)
  - Python (for Python files)
  - PowerShell (for PS1 files)

## 🌐 Language Support

### Supported Languages
- 🇺🇸 English
- 🇹🇷 Turkish

### Changing Language
You can select language from **Settings → Language** menu.

### Adding New Language
See `TRANSLATION_GUIDE.md` for detailed guide.

## 📚 Supported Script Types

| File Type | Extension | Runner | Requirements |
|-------------|---------|-------------|---------------|
| JavaScript | .js | Node.js | Node.js must be installed |
| Python | .py | Python | Python must be installed |
| Batch | .bat/.cmd | Windows CMD | Windows built-in |
| PowerShell | .ps1 | PowerShell | Windows built-in |
| Executable | .exe | Direct | None |

## 📧 Email Notifications

### Setup
1. Configure email settings from **Settings → Email Settings**
2. Gmail, Outlook, Yahoo or Custom SMTP supported
3. Test settings with **Test Email** button

### Usage
- Enable **Email Notifications** from script settings
- Automatic email sent in error cases
- Notification when script closes unexpectedly

## 🐛 Troubleshooting

### Antivirus Warning
- Electron applications may sometimes give false positives
- Add exception to your security software

### Script Not Working
- Check if file path is correct
- Check if required runtime is installed (Node.js, Python)
- Check logs

### Build Error
- Check Node.js version (v18+)
- `npm cache clean --force`
- `rm -rf node_modules && npm install`

## 📄 License

MIT License - See `LICENSE.txt` for details.

## 🤝 Contributing

1. Fork it
2. Create feature branch
3. Commit your changes
4. Send pull request

## 📞 Contact

- **Issues**: Use GitHub Issues
- **Discussions**: GitHub Discussions
- **Wiki**: GitHub Wiki for documentation

---

# 🚀 Script Manager (Türkçe)

Windows'ta scriptler ve botları tek panelden yönetmeye yarayan güçlü Electron desktop uygulaması.

## ✨ Özellikler

### 📋 Script Yönetimi
- **Çoklu Dil Desteği**: JavaScript (.js), Python (.py), Batch (.bat/.cmd), PowerShell (.ps1), Executable (.exe) 
- **Drag & Drop**: Dosyaları sürükleyip bırakarak ekleyin
- **Otomatik Restart**: Scriptler crash olduğunda otomatik yeniden başlatma
- **Zamanlanmış Çalıştırma**: Belirli saatlerde otomatik çalıştırma
- **Dosya İzleme**: Script dosyası değiştiğinde otomatik algılama

### 📊 Monitoring & Logging
- **Gerçek Zamanlı Loglar**: Canlı log görüntüleme
- **Log Seviyeleri**: All/Critical/Error/None seçenekleri
- **Log Rotation**: Otomatik log döndürme
- **Dosya Tabanlı Loglama**: Kalıcı log depolama
- **Sistem Kaynakları**: CPU, RAM, Uptime izleme

### 🔧 Gelişmiş Ayarlar
- **Email Bildirimleri**: Hata durumlarında otomatik email gönderme
- **Öncelik Seviyeleri**: Script'lerin sistem önceliği
- **Çalışma Dizini**: Her script için özel çalışma dizini
- **Parametre Desteği**: Command line argümanları

### 🌐 Çok Dilli Arayüz
- **İngilizce** ve **Türkçe** dil desteği
- **Menü Tabanlı Dil Değiştirme**
- **Çevirmen Dostu**: Kolay çeviri sistemi

## 🚀 Hızlı Başlangıç

### 💻 Son Kullanıcı

#### Seçenek 1: Kurulum (.exe) - Önerilen
1. `Script Manager Setup.exe` dosyasını indirin
2. Kurulum dosyasını çalıştırın
3. Kurulum tamamlandığında masaüstü kısayolundan başlatın

#### Seçenek 2: Taşınabilir (.exe)
1. `Script Manager-Portable.exe` dosyasını indirin
2. Dosyayı istediğiniz klasöre koyun
3. Direkt çalıştırın (kurulum gerektirmez)

### 🛠️ Geliştirici

#### Geliştirme Ortamı
```bash
# Projeyi klonlayın
git clone https://github.com/uncertainmario/Script-Manager.git
cd Script-Manager

# Bağımlılıkları yükleyin
npm install

# Geliştirme modunda çalıştırın
npm run dev
```

#### Build Yapma

**Windows için Kolay Build:**
```bash
# build.bat dosyasını çalıştırın
./build.bat
```

**Manuel Build:**
```bash
# Her ikisini birden oluştur
npm run build:all

# Sadece kurulum
npm run build:win

# Sadece taşınabilir
npm run build:portable
```

## 📁 Proje Yapısı

```
scriptmanager/
├── src/
│   ├── main/           # Ana Electron süreç
│   │   ├── main.js     # Ana uygulama dosyası
│   │   └── preload.js  # Preload script
│   └── renderer/       # Renderer süreç (UI)
│       ├── index.html  # Ana HTML
│       ├── css/        # Stil dosyaları
│       ├── js/         # JavaScript dosyaları
│       └── locales/    # Dil dosyaları
├── data/               # Uygulama verileri
├── logs/               # Log dosyaları
├── assets/             # Uygulama kaynakları
├── processManager.js   # Script yönetim motoru
├── package.json        # Proje konfigürasyonu
├── build.bat          # Windows build script
└── BUILD.md           # Detaylı build rehberi
```

## 🎯 Kullanım

### Script Ekleme
1. **Add Script** butonuna tıklayın
2. Script dosyanızı seçin (.js, .py, .bat, .cmd, .ps1, .exe)
3. Gerekirse parametreler ekleyin
4. **Save** butonuna tıklayın

### Script İşlemleri
- **▶️ Start**: Script'i başlatır
- **⏹️ Stop**: Script'i durdurur
- **🔄 Restart**: Script'i yeniden başlatır
- **📋 View Logs**: Logları görüntüler
- **📁 Show in Folder**: Dosyayı klasörde gösterir
- **⚙️ Settings**: Script ayarlarını açar

### Loglama Ayarları
1. Script kartındaki **⚙️ Settings** butonuna tıklayın
2. **Log Level** seçin:
   - **No logging**: Loglama kapalı
   - **All logs**: Tüm loglar
   - **Critical only**: Sadece kritik loglar
   - **Error only**: Sadece hata logları
3. **Max Log Size** (MB) belirleyin
4. **Log Rotation** aktif edin (isteğe bağlı)

## 🔧 Sistem Gereksinimleri

- **İşletim Sistemi**: Windows 10/11 (64-bit)
- **RAM**: Minimum 4GB (8GB önerilen)
- **Disk**: 100MB boş alan
- **Çalışma Zamanları**: 
  - Node.js (JavaScript dosyaları için)
  - Python (Python dosyaları için)
  - PowerShell (PS1 dosyaları için)

## 🌐 Dil Desteği

### Desteklenen Diller
- 🇺🇸 English
- 🇹🇷 Türkçe

### Dil Değiştirme
**Settings → Language** menüsünden dil seçimi yapabilirsiniz.

### Yeni Dil Ekleme
Detaylı rehber için `TRANSLATION_GUIDE.md` dosyasına bakın.

## 📚 Desteklenen Script Türleri

| Dosya Türü | Uzantı | Çalıştırıcı | Gereksinimler |
|-------------|---------|-------------|---------------|
| JavaScript | .js | Node.js | Node.js kurulu olmalı |
| Python | .py | Python | Python kurulu olmalı |
| Batch | .bat/.cmd | Windows CMD | Windows built-in |
| PowerShell | .ps1 | PowerShell | Windows built-in |
| Executable | .exe | Direkt | Yok |

## 📧 Email Bildirimleri

### Kurulum
1. **Settings → Email Settings** menüsünden email ayarlarını yapın
2. Gmail, Outlook, Yahoo veya Custom SMTP desteklenir
3. **Test Email** butonu ile ayarları test edin

### Kullanım
- Script ayarlarından **Email Notifications** aktif edin
- Hata durumlarında otomatik email gönderilir
- Script beklenmedik şekilde kapandığında bildirim gelir

## 🐛 Sorun Giderme

### Antivirus Uyarısı
- Electron uygulamaları bazen false positive verebilir
- Güvenlik yazılımınıza exception ekleyin

### Script Çalışmıyor
- Dosya yolunun doğru olduğunu kontrol edin
- Gerekli runtime'ın kurulu olduğunu kontrol edin (Node.js, Python)
- Log'ları kontrol edin

### Build Hatası
- Node.js sürümünü kontrol edin (v18+)
- `npm cache clean --force`
- `rm -rf node_modules && npm install`

## 📄 Lisans

MIT License - Detaylar için `LICENSE.txt` dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun
3. Değişikliklerinizi commit edin
4. Pull request gönderin

## 📞 İletişim

- **Issues**: GitHub Issues kullanın
- **Discussions**: GitHub Discussions
- **Wiki**: Dokümantasyon için GitHub Wiki

---

**Script Manager** - Manage all your Windows scripts from one place! 🚀 