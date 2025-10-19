# 🚀 MZR Summarizer - AI Page Summary

Transform lengthy web pages into concise, actionable summaries with MZR Summarizer - your AI-powered reading assistant.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-brightgreen)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.2.3-orange.svg)](manifest.json)

## ✨ Features

### 🤖 Multiple AI Providers
- Google Gemini API support
- OpenAI API integration
- Choose your preferred AI model
- On-device AI support (experimental)

### 📊 Smart Summarization
- Three summary lengths: Short, Medium, Detailed
- Context-aware processing
- Maintains key information
- Customizable output format

### 🎨 Beautiful Interface
- Modern gradient design
- Dark theme optimized
- Smooth animations
- Zoom controls for comfortable reading
- Persistent panel mode

### 💾 History & Notes
- Save summaries locally
- Add custom notes
- Track URLs automatically
- Quick access to recent summaries
- Delete and manage saved items

### 📋 Export Options
- Copy as Markdown (with metadata)
- Copy as Plain Text
- Format with Bold/Italic
- Save with URL and notes

### 🔒 Privacy First
- All data stored locally
- No tracking or analytics
- Your API keys stay secure
- Open source and transparent
- [Read our Privacy Policy](https://mzr-summarizer.zainriaz.dev/Privacy)

## 🚀 Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store listing](https://mzr-summarizer.zainriaz.dev)
2. Click "Add to Chrome"
3. Set up your API keys in the options page

### From Source
1. Clone this repository:
   ```bash
   git clone https://github.com/zainriaz-dev/mzr-summarizer.git
   cd mzr-summarizer
   ```

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

3. Configure your API keys:
   - Click the extension icon
   - Go to Options
   - Add your Gemini or OpenAI API key

## 📖 Usage

### Popup Mode
1. Click the extension icon in your toolbar
2. Click "Summarize This Page"
3. View and edit your summary
4. Add notes and save to history

### Panel Mode (Persistent)
1. Press `Ctrl+Shift+Y` (or your custom shortcut)
2. Panel opens and stays visible
3. Drag to reposition
4. Minimize or close when done

### Keyboard Shortcuts
- **Open Panel**: `Ctrl+Shift+Y` (customizable in `chrome://extensions/shortcuts`)

## 🛠️ Development

### Project Structure
```
mzr-summarizer/
├── manifest.json          # Extension manifest (Manifest V3)
├── icons/                 # Extension icons (16, 32, 48, 128px)
├── src/
│   ├── popup/            # Popup interface
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── content/          # Content scripts (panel)
│   │   ├── content.js
│   │   └── styles.css
│   ├── background/       # Service worker
│   │   └── service_worker.js
│   ├── options/          # Options page
│   │   ├── options.html
│   │   ├── options.css
│   │   └── options.js
│   ├── about/            # About page
│   │   ├── about.html
│   │   └── about.css
│   └── common/           # Shared modules
│       ├── ai.js
│       └── messaging.js
├── assests/              # Screenshots
└── LICENSE
```

### Building
No build process required! This is a pure JavaScript extension.

To create a release ZIP:
```bash
zip -r mzr-summarizer-v1.2.3.zip manifest.json icons/ src/
```

### Testing
1. Load the extension in Chrome (see Installation)
2. Test all features:
   - Popup summarization
   - Panel mode
   - History management
   - Export options
   - Settings configuration

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Coding Standards
- Use ES6+ JavaScript
- Follow existing code style
- Comment complex logic
- Test thoroughly before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Homepage**: [https://mzr-summarizer.zainriaz.dev](https://mzr-summarizer.zainriaz.dev)
- **Chrome Web Store**: Coming soon
- **Support**: zainriaz.dev@gmail.com
- **GitHub**: [https://github.com/zainriaz-dev/mzr-summarizer](https://github.com/zainriaz-dev/mzr-summarizer)

## 🙏 Acknowledgments

- Google Gemini API
- OpenAI API
- Chrome Extension documentation
- All contributors and users

## 📊 Version History

### v1.2.3 (Current)
- ✅ Fixed delete confirmation modal
- ✅ Enhanced panel features (Bold/Italic, Copy options)
- ✅ Unified history storage between popup and panel
- ✅ Improved zoom functionality
- ✅ Better toast notifications
- ✅ Duplicate prevention for saved summaries

### v1.2.2
- Added persistent panel mode
- Improved UI/UX
- Bug fixes and optimizations

### v1.0.0
- Initial release
- Basic summarization features
- Popup interface

---

**Made with ❤️ by [Zain Riaz](https://zainriaz.dev)**

# mzr-summarizer
