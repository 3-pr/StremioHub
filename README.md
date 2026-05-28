<div align="center">
  <img src="extension/icons/icon128.png" alt="StremioHub Logo" width="128" height="128">
  <h1>StremioHub</h1>
  <p><b>The all-in-one Stremio companion for your browser.</b></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#installation-developer-mode">Installation</a> •
    <a href="#chrome-extension-coming-soon">Chrome Web Store</a>
  </p>
  <p>
    <a href="README_AR.md">🇸🇦 Read in Arabic (اقرأ بالعربية)</a>
  </p>
</div>
<div align="center">
  <a href='https://ko-fi.com/V8P5206X9H' target='_blank'>
    <img height='36' src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' />
  </a>
</div>

---

<div align="center">
  <em>Manage your Stremio library directly from your browser. Instantly add movies and series to your library from sites like Google, IMDB, TMDB, Letterboxd, Rotten Tomatoes, and Metacritic!</em>
</div>

## ✨ Features

- **🌐 Cross-Site Integration**: Adds smart "Save to Library" and "Open in Stremio" buttons directly on your favorite movie discovery websites.
- **🖱️ Right-Click Quick Search**: Highlight any movie or show name, right-click, and instantly search for it in Stremio.
- **📚 Full Library Management**: View, filter, sort, and mark items as watched (Movies, Series, and Continue Watching) natively in your browser popup.
- **🎨 Glassmorphism UI**: A breathtaking, premium Apple-inspired dark mode design with buttery smooth micro-animations.
- **🔗 Smart Add-on Support**: Dynamically fetches descriptions and metadata from your actual Stremio add-ons (like TMDB) to provide rich, localized context.
- **🌍 Bilingual Support**: Fully supports Arabic & English with native right-to-left (RTL) alignments and live toggling.
- **🛠 Highly Customizable**: Choose between floating pop-up cards or full-screen immersive details views, adjust popup sizes, and more!

<details>
<summary><b>🎬 Feature Demonstrations</b></summary>
<br>

**1. Auto-save from External Sites**  
Seamlessly inject "Save to Library" buttons on sites like Google Search, Letterboxd, IMDB, Metacritic, Rotten Tomatoes, and Trakt!
<img src="assets/videos/websites.gif" width="100%" alt="Websites Demo">

**2. Quick Search via Right-Click**  
Highlight any text, right-click, and instantly search Stremio for it.
<img src="assets/videos/search.gif" width="100%" alt="Search Demo">

**3. Manage Watch Progress**  
Easily mark episodes or movies as watched directly from the popup.
<img src="assets/videos/watch.gif" width="100%" alt="Watch Demo">

</details>

## 🚀 Chrome Extension (Coming Soon)

We are currently preparing StremioHub for an official release on the Chrome Web Store. 
Soon, you will be able to install it with a single click and receive automatic updates! Stay tuned. ⏳

## 🛠 Installation (Developer Mode)

Until the official store release, you can install StremioHub locally:

1. **Download the latest release:** Go to the [Releases page](https://github.com/3-pr/StremioHub/releases) and download the `.zip` file of the latest version, then extract it to a folder.
   *Alternatively, you can clone the repository:*
   ```bash
   git clone https://github.com/3-pr/StremioHub.git
   ```
2. Open Google Chrome (or any Chromium-based browser) and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle switch in the top right corner).
4. Click on **Load unpacked** and select the `extension` folder inside the `StremioHub` folder you extracted.
5. Pin the extension to your toolbar, log in with your Stremio account, and enjoy!

## 🔐 Privacy & Security

- **No Passwords Stored**: Your Stremio credentials are used once to fetch an `authKey`.
- **Local Storage Only**: All your data, library cache, and settings are saved securely and locally on your browser using `chrome.storage.local`.
- **No Analytics**: We do not track your library, searches, or web activity.

## ⚠️ Disclaimer

**StremioHub is an unofficial, community-built extension.** It is not affiliated with, endorsed by, or officially connected to the Stremio team.

<br>
<div align="center">
  <p>Made with love for the Stremio community 🍿 by <b>Yasser</b></p>
</div>
