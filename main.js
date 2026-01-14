const { app, BrowserWindow, BrowserView, ipcMain, session } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize encrypted store for session data
const store = new Store({
  encryptionKey: 'better-world-browser-2024',
  name: 'session-data'
});

// Configuration
const BRAINROT_SERVER = 'https://brainrot.bluechiplabs.ai';
const FACEBOOK_URL = 'https://www.facebook.com';

let mainWindow;
let facebookView;
let isLoggedInToBrainrot = false;

// Window dimensions
const TOOLBAR_HEIGHT = 80;
const WINDOW_WIDTH = 1400;
const WINDOW_HEIGHT = 900;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: 800,
    minHeight: 600,
    title: 'Better World Browser',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the main UI (toolbar + container)
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Check if user is logged into brainrot
  checkBrainrotLogin();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Resize BrowserView when window resizes
  mainWindow.on('resize', () => {
    if (facebookView) {
      const bounds = mainWindow.getBounds();
      facebookView.setBounds({
        x: 0,
        y: TOOLBAR_HEIGHT,
        width: bounds.width,
        height: bounds.height - TOOLBAR_HEIGHT
      });
    }
  });
}

function checkBrainrotLogin() {
  const brainrotSession = store.get('brainrot_session');
  if (brainrotSession && brainrotSession.userid) {
    isLoggedInToBrainrot = true;
    // Check for Facebook session and load Facebook
    loadFacebookView();
  }
}

function loadFacebookView() {
  if (!mainWindow) return;

  // Create BrowserView for Facebook
  facebookView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'src', 'fb-injector.js'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:facebook' // Persistent session for Facebook
    }
  });

  mainWindow.setBrowserView(facebookView);

  const bounds = mainWindow.getBounds();
  facebookView.setBounds({
    x: 0,
    y: TOOLBAR_HEIGHT,
    width: bounds.width,
    height: bounds.height - TOOLBAR_HEIGHT
  });

  // Restore Facebook cookies if we have them
  restoreFacebookSession();

  // Load Facebook
  facebookView.webContents.loadURL(FACEBOOK_URL);

  // Inject brainrot buttons after page loads
  facebookView.webContents.on('did-finish-load', () => {
    injectBrainrotButtons();
  });

  // Also inject on navigation within Facebook
  facebookView.webContents.on('did-navigate-in-page', () => {
    setTimeout(injectBrainrotButtons, 1000);
  });

  // Save cookies when they change
  facebookView.webContents.session.cookies.on('changed', (event, cookie, cause) => {
    if (cookie.domain.includes('facebook.com')) {
      saveFacebookSession();
    }
  });
}

async function saveFacebookSession() {
  try {
    const cookies = await facebookView.webContents.session.cookies.get({ domain: '.facebook.com' });
    store.set('facebook_cookies', cookies);
    console.log('Facebook session saved');
  } catch (err) {
    console.error('Failed to save Facebook session:', err);
  }
}

async function restoreFacebookSession() {
  try {
    const cookies = store.get('facebook_cookies');
    if (cookies && cookies.length > 0) {
      for (const cookie of cookies) {
        const cookieDetails = {
          url: `https://${cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain}${cookie.path}`,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          expirationDate: cookie.expirationDate
        };
        try {
          await facebookView.webContents.session.cookies.set(cookieDetails);
        } catch (e) {
          // Some cookies may fail, that's ok
        }
      }
      console.log('Facebook session restored');
    }
  } catch (err) {
    console.error('Failed to restore Facebook session:', err);
  }
}

function injectBrainrotButtons() {
  if (!facebookView) return;

  const injectionScript = `
    (function() {
      // Don't re-inject if already done
      if (window.__brainrotInjected) return;
      window.__brainrotInjected = true;

      const style = document.createElement('style');
      style.textContent = \`
        .brainrot-btn {
          background: linear-gradient(135deg, #dc3545, #c82333);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          margin: 4px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .brainrot-btn:hover {
          background: linear-gradient(135deg, #c82333, #a71d2a);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .brainrot-btn:active {
          transform: translateY(0);
        }
        .brainrot-btn-container {
          display: flex;
          justify-content: flex-start;
          padding: 4px 8px;
          background: rgba(0,0,0,0.03);
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }
      \`;
      document.head.appendChild(style);

      function addBrainrotButtons() {
        // Target Facebook feed posts - multiple selectors for different FB layouts
        const selectors = [
          '[data-pagelet*="FeedUnit"]',
          '[role="article"]',
          'div[data-ad-comet-preview]'
        ];

        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(post => {
            if (post.querySelector('.brainrot-btn')) return; // Already has button

            const btnContainer = document.createElement('div');
            btnContainer.className = 'brainrot-btn-container';

            const btn = document.createElement('button');
            btn.className = 'brainrot-btn';
            btn.innerHTML = '🧠 BRAINROT';
            btn.title = 'Report this as brain rot content';
            btn.onclick = (e) => {
              e.stopPropagation();
              e.preventDefault();
              capturePost(post);
            };

            btnContainer.appendChild(btn);
            post.insertBefore(btnContainer, post.firstChild);
          });
        });
      }

      function capturePost(postElement) {
        // Extract post data
        const postData = {
          html: postElement.outerHTML,
          text: postElement.innerText.substring(0, 5000),
          url: window.location.href,
          timestamp: new Date().toISOString()
        };

        // Send to main process via exposed API
        if (window.brainrotCapture && window.brainrotCapture.submit) {
          window.brainrotCapture.submit(postData);
        } else {
          console.error('brainrotCapture API not available');
        }

        // Visual feedback
        const btn = postElement.querySelector('.brainrot-btn');
        if (btn) {
          btn.innerHTML = '✓ Captured!';
          btn.style.background = 'linear-gradient(135deg, #28a745, #218838)';
          setTimeout(() => {
            btn.innerHTML = '🧠 BRAINROT';
            btn.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
          }, 2000);
        }
      }

      // Initial injection
      addBrainrotButtons();

      // Re-inject on scroll (infinite scroll loads new posts)
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(addBrainrotButtons, 500);
      });

      // Re-inject periodically for dynamic content
      setInterval(addBrainrotButtons, 3000);

      console.log('Brainrot buttons injected!');
    })();
  `;

  facebookView.webContents.executeJavaScript(injectionScript).catch(err => {
    console.error('Failed to inject brainrot buttons:', err);
  });
}

// IPC Handlers

// Handle captures from Facebook BrowserView
ipcMain.on('brainrot-capture', async (event, captureData) => {
  console.log('Received capture from Facebook view:', captureData);

  try {
    const brainrotSession = store.get('brainrot_session');
    if (!brainrotSession) {
      console.error('Not logged in - cannot submit capture');
      return;
    }

    const response = await fetch(`${BRAINROT_SERVER}/api/capture.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${brainrotSession.token}`
      },
      body: JSON.stringify({
        ...captureData,
        userid: brainrotSession.userid,
        source: 'better-world-browser'
      })
    });

    const result = await response.json();
    console.log('Capture submitted:', result);

    // Notify the main window
    if (mainWindow) {
      mainWindow.webContents.send('capture-result', result);
    }
  } catch (err) {
    console.error('Failed to submit capture:', err);
  }
});

ipcMain.handle('brainrot-login', async (event, credentials) => {
  try {
    const response = await fetch(`${BRAINROT_SERVER}/api/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();

    if (data.success) {
      store.set('brainrot_session', {
        userid: data.userid,
        username: data.username,
        token: data.token
      });
      isLoggedInToBrainrot = true;
      loadFacebookView();
    }
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('brainrot-logout', async () => {
  store.delete('brainrot_session');
  isLoggedInToBrainrot = false;
  if (facebookView) {
    mainWindow.removeBrowserView(facebookView);
    facebookView = null;
  }
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
});

ipcMain.handle('get-session', () => {
  return {
    brainrot: store.get('brainrot_session'),
    hasFacebookCookies: !!store.get('facebook_cookies')
  };
});

ipcMain.handle('submit-capture', async (event, captureData) => {
  try {
    const brainrotSession = store.get('brainrot_session');
    if (!brainrotSession) {
      return { success: false, error: 'Not logged in' };
    }

    const response = await fetch(`${BRAINROT_SERVER}/api/capture.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${brainrotSession.token}`
      },
      body: JSON.stringify({
        ...captureData,
        userid: brainrotSession.userid,
        source: 'better-world-browser'
      })
    });

    return await response.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('clear-facebook-session', async () => {
  store.delete('facebook_cookies');
  if (facebookView) {
    await facebookView.webContents.session.clearStorageData();
    facebookView.webContents.loadURL(FACEBOOK_URL);
  }
  return { success: true };
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
