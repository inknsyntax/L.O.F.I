const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve index.html for all routes (SPA support)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// For GitHub Pages: make sure /LOFI/* routes also serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🎵 L.O.F.I is running at http://localhost:${PORT}`);
    console.log(`   Press Ctrl+C to stop the server`);
});
