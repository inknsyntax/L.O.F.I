# L.O.F.I - Let Off Fear & Intention

A modern, full-featured study and productivity application with interactive tools, ambient soundscapes, and comprehensive educational content.

## Features

### 📚 Study Tools
- **Notebook System**: Rich text editor for notes with formatting tools (tables, Venn diagrams, etc.)
- **Flashcard System**: Create and study flashcard decks with spaced repetition
- **Task Manager**: Organize and track your tasks
- **The Void**: Anonymously release your thoughts and emotions

### 📖 Educational Content
- **100+ Mathematical Formulas**: From basic algebra to advanced cryptography
- **100+ Science Concepts**: Biology, chemistry, physics, astronomy, and more
- **120+ Language Arts Terms**: Literary devices, grammar, essay types, poetry
- **45+ Computer Science Topics**: Algorithms, data structures, networking, and more
- **Historical Events**: Major world events and their significance

### 🧮 Advanced Calculator
- **Classic Mode**: Standard 4-function calculator
- **Scientific Mode**: 36 functions including trig, logarithmic, hyperbolic
- **Graphing Mode**: Plot mathematical functions in real-time (Desmos-style)

### 🔄 Unit Converter
Convert between 12 categories including:
- Length, Mass, Volume, Temperature, Speed, Area
- Energy, Power, Pressure, Time, Frequency, Density

### 🎵 Utilities
- **Breathing Exercise**: Guided 4-cycle breathing exercise
- **Stopwatch**: Track time with lap functionality
- **Timer**: Pomodoro-style focus, short break, and long break timers
- **Dictionary**: Look up word definitions via API
- **Sound Mixer**: Mix ambient soundscapes (nature, city, atmosphere)

### 🎨 Customization
- **8 Themes**: Pre-built color schemes
- **Custom Themes**: Create your own with gradients
- **Font Selection**: Choose from multiple UI and header fonts
- **Dark Mode**: Eye-friendly interface for extended use

## Getting Started

### Prerequisites
- Node.js 14+ and npm

### Installation

1. Clone or download this repository:
```bash
git clone https://github.com/yourusername/lofi.git
cd lofi
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser to `http://localhost:3000`

## Deployment

### GitHub Pages (Free Hosting)

1. **Create a GitHub repository** (if you don't have one):
   - Go to github.com and create a new repo named `lofi`

2. **Initialize git and push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/lofi.git
git branch -M main
git push -u origin main
```

3. **Enable GitHub Pages**:
   - Go to your repo Settings → Pages
   - Select "Deploy from a branch"
   - Choose `main` branch and save

4. **Your site is now live at** `https://yourusername.github.io/lofi`

### Using a Custom Domain

1. **Set up your custom domain** (e.g., yourlofi.com):
   - Purchase or use an existing domain from your registrar
   
2. **Update GitHub Pages Settings**:
   - Go to repo Settings → Pages
   - Enter your custom domain in the "Custom domain" field
   - Save (GitHub creates a CNAME file)

3. **Configure DNS** (with your domain registrar):
   - Add an A record pointing to `185.199.108.153`
   - Or add AAAA records for IPv6:
     - `2606:50c0:8000::153`
     - `2606:50c0:8001::153`
     - `2606:50c0:8002::153`
     - `2606:50c0:8003::153`
   
4. **Wait for DNS propagation** (can take up to 24 hours)

Your site should be live at your custom domain!

## File Structure

```
lofi/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # Styling
├── js/
│   ├── app.js            # App initialization
│   ├── ui.js             # UI components
│   ├── logic.js          # Core logic
│   ├── data.js           # Educational content & config
│   └── state.js          # Global state management
├── assets/
│   ├── images/           # Icons and images
│   └── sounds/           # Ambient sounds
├── server.js             # Express server
├── package.json          # Dependencies
└── README.md            # This file
```

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Storage

All data is stored locally in your browser's localStorage:
- Notes and notebooks
- Flashcard decks
- Tasks
- User preferences and themes
- Calculator mode preference

**Note**: Data persists only on the same browser/device. Use export features to backup.

## Features & Usage

### Calculator Modes
- **Classic**: Basic math operations
- **Scientific**: Advanced trig, logs, statistics
- **Graphing**: Plot y=f(x) functions with adjustable scale

### Keyboard Shortcuts
- `Ctrl/Cmd + +`: Zoom in
- `Ctrl/Cmd + -`: Zoom out
- `Ctrl/Cmd + 0`: Reset zoom
- `Enter`: In input fields, submit action

### Study Tips
- Use the breathing exercise before intense study sessions
- The Void is private - your entries don't leave your browser
- Mix ambient sounds to match your mood (Nature + Fireplace is popular!)
- Customize themes to reduce eye strain during long sessions

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Express.js (lightweight server)
- **Storage**: Browser localStorage (no backend database)
- **APIs**: Dictionary API (Free, public)
- **Hosting**: GitHub Pages + Custom domain

## License

MIT License - Feel free to use, modify, and deploy!

## Troubleshooting

**Q: Data disappeared!**
A: Browser storage resets if you clear cookies. Use Settings → Export Theme/Data to backup.

**Q: Sounds not playing?**
A: Check browser audio permissions. Some browsers require user interaction before playing audio.

**Q: Graph not displaying?**
A: Try simpler functions. Complex expressions may cause lag. Ensure syntax is correct (e.g., `x*x` not `x(x)`).

**Q: Custom domain not working?**
A: DNS changes take time (up to 48 hours). Check your DNS records are set correctly.

## Support & Feedback

Found a bug? Want a feature? Feel free to open an issue on GitHub!

---

Made with ☁️ and 🎵

