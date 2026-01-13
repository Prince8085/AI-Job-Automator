# AI Job Automator - Chrome Extension

## 🚀 Installation Guide

### Step 1: Open Chrome Extensions
1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)

### Step 2: Load Extension
1. Click **"Load unpacked"** button
2. Select the `extension` folder from this project
3. Extension will appear in your toolbar!

---

## 📋 How to Use

### Method 1: Popup
1. Navigate to any job application page
2. Click the ✨ extension icon in toolbar
3. Click **"Scan Page for Forms"**
4. Review detected fields
5. Click **"Auto-Fill All Fields"**
6. Submit the form manually

### Method 2: Floating Button
1. On pages with forms, a floating ✨ button appears
2. Click it to open the auto-fill panel
3. Scan and fill directly on the page

---

## ⚙️ Configure Your Profile

Edit your profile data in the web app:
- Go to http://localhost:5173/#/profile
- Fill in your details
- Click Save

The extension will sync your profile data.

---

## 🔧 Files Structure

```
extension/
├── manifest.json      # Extension configuration
├── popup.html         # Popup UI
├── popup.js           # Popup logic
├── content.js         # Page injection script
├── content.css        # Content styles
├── background.js      # Service worker
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

---

## ⚠️ Limitations

- Cannot auto-submit forms (security)
- File upload fields need manual handling
- Some sites block content scripts
- Works best on standard HTML forms

---

## 🐛 Troubleshooting

**Extension not appearing?**
- Reload the extension in chrome://extensions/
- Refresh the page

**Fields not detected?**
- Some sites use custom form elements
- Try the popup scan instead

**Fields not filling?**
- Check if values exist in your profile
- Some fields have validation

---

Made with ❤️ by AI Job Automator
