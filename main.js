const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 950,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      /* 
         Security Warning: nodeIntegration: true and contextIsolation: false 
         allow the renderer process full access to Node.js APIs.
         This is convenient for rapid prototyping but insecure for production apps
         loading remote content. For a local-only app like this, it is acceptable.
      */
      nodeIntegration: true,
      contextIsolation: false,// Simplifies things for this prototype
      webSecurity: false // Often needed for local file access and cross-origin frames in dev
    },
    title: 'L.O.F.I - Let Off Fear & Intention',
    icon: path.join(__dirname, 'assets/images/icon.png'), // Use the new icon
    // transparent: true, // For custom window frames later if needed
    frame: true // Keep standard frame for now
  });

  // Hack for YouTube Embeds in Electron (Fixes Error 150/153)
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const { url } = details;
    /*
       Optimization: We clone the headers to avoid mutating the original object directly,
       ensuring cleaner state management.
    */
    const requestHeaders = { ...details.requestHeaders };
    if (url.includes('youtube.com') || url.includes('youtube-nocookie.com') || url.includes('googleapis.com')) {
      requestHeaders['Referer'] = 'https://www.youtube.com/';
      requestHeaders['Origin'] = 'https://www.youtube.com';
    }
    callback({cancel: false, requestHeaders: requestHeaders});
  });

  win.loadFile('index.html');
  
  // Open DevTools for debugging (can be removed later)
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
