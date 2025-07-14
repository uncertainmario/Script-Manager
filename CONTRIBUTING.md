# Contributing to Script Manager

Thank you for your interest in contributing to Script Manager! / Script Manager'a katkıda bulunmak istediğiniz için teşekkürler!

## 🌍 Language / Dil

This project supports both English and Turkish. / Bu proje hem İngilizce hem Türkçe destekler.

## 🚀 Getting Started / Başlangıç

### Prerequisites / Gereksinimler

- Node.js 18+
- npm or yarn
- Git

### Setup / Kurulum

```bash
# Fork the repository / Repository'yi fork edin
git clone https://github.com/uncertainmario/Script-Manager.git
cd Script-Manager

# Install dependencies / Bağımlılıkları yükleyin
npm install

# Run in development mode / Geliştirme modunda çalıştırın
npm run dev
```

## 📝 Development Guidelines / Geliştirme Kuralları

### Code Style / Kod Stili

- Use consistent indentation (2 spaces) / Tutarlı girinti kullanın (2 boşluk)
- Add comments for complex logic / Karmaşık mantık için yorum ekleyin
- Follow existing naming conventions / Mevcut isimlendirme kurallarını takip edin

### Commit Messages / Commit Mesajları

```
feat: add new feature
fix: bug fix
docs: documentation update
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### Testing / Test

```bash
# Run tests / Testleri çalıştır
npm test

# Run specific test / Belirli test çalıştır
node tests/script-lifecycle.test.js
```

## 🐛 Bug Reports / Hata Raporları

When reporting bugs, please include: / Hata raporlarken lütfen şunları ekleyin:

- OS version / İşletim sistemi sürümü
- Node.js version / Node.js sürümü
- Steps to reproduce / Yeniden üretme adımları
- Expected vs actual behavior / Beklenen vs gerçek davranış

## 💡 Feature Requests / Özellik İstekleri

- Check existing issues first / Önce mevcut issue'ları kontrol edin
- Describe the use case / Kullanım durumunu açıklayın
- Provide examples if possible / Mümkünse örnekler verin

## 🌐 Internationalization / Uluslararasılaştırma

### Adding New Languages / Yeni Dil Ekleme

1. Add language file in `src/renderer/locales/` / `src/renderer/locales/` klasörüne dil dosyası ekleyin
2. Update `i18n.js` configuration / `i18n.js` konfigürasyonunu güncelleyin
3. Test all UI elements / Tüm UI elementlerini test edin

### Translation Guidelines / Çeviri Kuralları

- Keep technical terms consistent / Teknik terimleri tutarlı tutun
- Consider cultural context / Kültürel bağlamı göz önünde bulundurun
- Test UI layout with translated text / Çevrilmiş metinle UI düzenini test edin

## 📦 Building / Build Etme

```bash
# Build for development / Geliştirme için build
npm run build

# Build for production / Production için build
npm run build:all

# Create portable version / Portable versiyon oluştur
npm run build:portable
```

## 🔄 Pull Request Process / Pull Request Süreci

1. Fork the repository / Repository'yi fork edin
2. Create feature branch / Özellik branch'i oluşturun
3. Make your changes / Değişikliklerinizi yapın
4. Add tests if needed / Gerekirse test ekleyin
5. Update documentation / Dokümantasyonu güncelleyin
6. Submit pull request / Pull request gönderin

### PR Checklist / PR Kontrol Listesi

- [ ] Code follows style guidelines / Kod stil kurallarına uyuyor
- [ ] Tests pass / Testler geçiyor
- [ ] Documentation updated / Dokümantasyon güncellendi
- [ ] No breaking changes / Breaking change yok
- [ ] Tested on Windows / Windows'ta test edildi

## 📞 Getting Help / Yardım Alma

- Create an issue for questions / Sorular için issue oluşturun
- Check existing documentation / Mevcut dokümantasyonu kontrol edin
- Review the code structure / Kod yapısını inceleyin

## 🏆 Recognition / Tanınma

Contributors will be recognized in: / Katkıda bulunanlar şurada tanınacak:

- README.md contributors section / README.md katkıda bulunanlar bölümü
- Release notes / Sürüm notları
- GitHub contributors page / GitHub katkıda bulunanlar sayfası

Thank you for contributing! / Katkıda bulunduğunuz için teşekkürler! 