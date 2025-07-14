# Script Manager - Build Guide / Build Rehberi

*[English](#english) | [Türkçe](#türkçe)*

---

## English

### 📋 Requirements

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**

### 🚀 Building the Application

#### 1. Clone the Project
```bash
git clone https://github.com/uncertainmario/Script-Manager.git
cd Script-Manager
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Build Options

##### 📦 Create Installer (.exe)
```bash
npm run build:win
```
- Creates **Script Manager Setup.exe** in `dist/` folder
- Installation file (NSIS installer)
- Creates system menu and desktop shortcuts

##### 🎯 Create Portable (.exe)
```bash
npm run build:portable
```
- Creates **Script Manager-1.0.0-Portable.exe** in `dist/` folder
- No installation required, directly executable
- Runs in its own folder

##### 🔧 Create Both
```bash
npm run build:all
```
or
```bash
npm run dist
```

#### 4. Development Mode
```bash
npm run dev
```

### 📁 Build Results

After build completion, the following files will be created in `dist/` folder:

- **Script Manager Setup.exe** - Installation file
- **Script Manager-1.0.0-Portable.exe** - Portable version
- **latest.yml** - Update information

### 🎨 Changing Icon

The application uses `assets/stm.ico` as the main icon:
- **File**: `assets/stm.ico`
- **Size**: 256x256 pixels
- **Format**: ICO (Windows)

### 🔧 Configuration

#### Build Settings
- Configuration in `package.json` -> `build` section
- **appId**: Application identifier
- **productName**: Product name
- **directories**: Build directories

#### Installer Settings
- **NSIS**: Windows installer settings
- **Portable**: Portable exe settings
- **Auto-update**: Automatic update system

### 📚 Usage

#### End User
1. **Installer**: Run Setup.exe and install
2. **Portable**: Download Portable.exe and run

#### Developer
1. `npm run dev` - Run in development mode
2. `npm run build` - Create production build
3. `npm run pack` - Package test (without installation)

### 🛠️ Quick Build Tool

Use the interactive build tool:
```bash
./build.bat
```
- Select language (English/Türkçe)
- Choose build type
- Automatic process management

### 🚨 Troubleshooting

#### Build Errors
- Check Node.js version
- `npm cache clean --force`
- `rm -rf node_modules && npm install`

#### Icon Error
- Ensure `assets/stm.ico` file exists
- Verify icon format is correct

#### Antivirus Warning
- Electron applications sometimes trigger false positives
- Add exception to security software

---

## Türkçe

### 📋 Gereksinimler

- **Node.js** (v18 veya üzeri)
- **npm** veya **yarn**
- **Git**

### 🚀 Uygulama Build Etme

#### 1. Projeyi İndir
```bash
git clone https://github.com/uncertainmario/Script-Manager.git
cd Script-Manager
```

#### 2. Bağımlılıkları Yükle
```bash
npm install
```

#### 3. Build Seçenekleri

##### 📦 Kurulum Dosyası (.exe) Oluştur
```bash
npm run build:win
```
- `dist/` klasöründe **Script Manager Setup.exe** oluşur
- Kurulum dosyası (NSIS installer)
- Sistem menüsü ve masaüstü kısayolu oluşturur

##### 🎯 Taşınabilir (.exe) Oluştur
```bash
npm run build:portable
```
- `dist/` klasöründe **Script Manager-1.0.0-Portable.exe** oluşur
- Kurulum gerektirmez, direkt çalıştırılabilir
- Kendi klasöründe çalışır

##### 🔧 Her İkisini Birden Oluştur
```bash
npm run build:all
```
veya
```bash
npm run dist
```

#### 4. Geliştirme Modunda Çalıştırma
```bash
npm run dev
```

### 📁 Build Sonuçları

Build işlemi tamamlandığında `dist/` klasöründe şu dosyalar oluşur:

- **Script Manager Setup.exe** - Kurulum dosyası
- **Script Manager-1.0.0-Portable.exe** - Taşınabilir sürüm
- **latest.yml** - Güncelleme bilgileri

### 🎨 Icon Değiştirme

Uygulama ana icon olarak `assets/stm.ico` kullanır:
- **Dosya**: `assets/stm.ico`
- **Boyut**: 256x256 piksel
- **Format**: ICO (Windows)

### 🔧 Ayarlar

#### Build Ayarları
- `package.json` -> `build` bölümünde konfigürasyon
- **appId**: Uygulama kimliği
- **productName**: Ürün adı
- **directories**: Build dizinleri

#### Kurulum Ayarları
- **NSIS**: Windows kurulum ayarları
- **Portable**: Taşınabilir exe ayarları
- **Auto-update**: Otomatik güncelleme sistemi

### 📚 Kullanım

#### Son Kullanıcı
1. **Kurulum**: Setup.exe'yi çalıştır ve kur
2. **Taşınabilir**: Portable.exe'yi indir ve çalıştır

#### Geliştirici
1. `npm run dev` - Geliştirme modunda çalıştır
2. `npm run build` - Production build yap
3. `npm run pack` - Paketleme testi (kurulum olmadan)

### 🛠️ Hızlı Build Aracı

İnteraktif build aracını kullan:
```bash
./build.bat
```
- Dil seçimi (English/Türkçe)
- Build türü seçimi
- Otomatik işlem yönetimi

### 🚨 Sorun Giderme

#### Build Hataları
- Node.js sürümünü kontrol edin
- `npm cache clean --force`
- `rm -rf node_modules && npm install`

#### Icon Hatası
- `assets/stm.ico` dosyasının var olduğundan emin olun
- Icon formatının doğru olduğundan emin olun

#### Antivirus Uyarısı
- Electron uygulamaları bazen false positive verir
- Güvenlik yazılımına exception ekleyin

---

## 📊 Build Statistics

| Build Type | File Size | Features |
|------------|-----------|----------|
| Installer | ~80MB | Auto-install, shortcuts, uninstaller |
| Portable | ~250MB | No installation, self-contained |

## 🔄 Version Management

- Version defined in `package.json`
- Auto-increment available
- Build artifacts include version number

---

*Last updated: July 2025* 