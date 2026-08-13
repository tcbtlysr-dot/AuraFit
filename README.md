# AuraFit

Telefon görünümünde çalışan kişisel stil asistanı: dolaba kıyafet ekle, renk / ten / vücut / boy-kilo / hava durumuna göre kombin önerileri al.

## Çalıştırma

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

Tarayıcıda: [http://localhost:5500](http://localhost:5500)

## Google girişi + bulut yedek

Gerçek Google OAuth ve Drive yedek için bir kez kurulum gerekir:

1. [Google Cloud Console](https://console.cloud.google.com/) → yeni proje
2. **APIs & Services → Library** → **Google Drive API** → Enable
3. **OAuth consent screen** → External → test kullanıcısı olarak kendi Gmail’ini ekle
4. **Credentials → Create credentials → OAuth client ID → Web application**
   - Authorized JavaScript origins: `http://localhost:5500`
5. Client ID’yi kopyala
6. Projede:

```powershell
copy config.example.js config.js
```

`config.js` içine Client ID’yi yapıştır:

```javascript
window.AURAFIT_CONFIG = {
  GOOGLE_CLIENT_ID: "123456789-xxxx.apps.googleusercontent.com",
};
```

7. Sunucuyu yeniden başlat, **Profil → Google ile giriş**

### Bulut yedek nasıl çalışır?

- Girişten sonra dolap, profil ve meta veriler **Google Drive uygulama alanına** (`appDataFolder`) JSON olarak yedeklenir
- Yeni cihazda giriş yapınca boş dolap varsa buluttan **otomatik geri yüklenir**
- Değişiklikler ~3 sn sonra **otomatik yedeklenir**
- **Buluta yedekle** / **Buluttan yükle** ile manuel senkron

`config.js` git’e eklenmez (yerel anahtarın güvende kalır).

## Özellikler

- Dolap: kategori bazlı fotoğraf ekleme
- Kombin: renk uyumu, profil, etkinlik (günlük / iş / özel gün)
- Favori, giyildi, paylaş, kombin isimlendirme
- Yıkama / ütü hatırlatıcısı
- Alışveriş notları
- Keşfet: şehir hava durumu
- Profil: Google girişi, bulut yedek, ten, vücut tipi, boy, kilo, cinsiyet, bildirimler
