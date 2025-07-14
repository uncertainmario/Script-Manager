# 🚀 Script Manager

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

### 💻 End User (Kullanıcı)

#### Seçenek 1: Installer (.exe) - Önerilen
1. `Script Manager Setup.exe` dosyasını indirin
2. Kurulum dosyasını çalıştırın
3. Kurulum tamamlandığında masaüstü kısayolundan başlatın

#### Seçenek 2: Portable (.exe)
1. `Script Manager-Portable.exe` dosyasını indirin
2. Dosyayı istediğiniz klasöre koyun
3. Direkt çalıştırın (kurulum gerektirmez)

### 🛠️ Developer (Geliştirici)

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

# Sadece installer
npm run build:win

# Sadece portable
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

### Script Çalıştırma
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

**Script Manager** ile Windows'ta tüm scriptlerinizi tek yerden yönetin! 🚀 