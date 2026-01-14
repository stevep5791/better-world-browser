const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('brainrot', {
  // Authentication
  login: (credentials) => ipcRenderer.invoke('brainrot-login', credentials),
  logout: () => ipcRenderer.invoke('brainrot-logout'),
  getSession: () => ipcRenderer.invoke('get-session'),

  // Capture
  submitCapture: (data) => ipcRenderer.invoke('submit-capture', data),

  // Facebook session
  clearFacebookSession: () => ipcRenderer.invoke('clear-facebook-session'),

  // Listen for captures from Facebook view
  onCapture: (callback) => {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'BRAINROT_CAPTURE') {
        callback(event.data.data);
      }
    });
  }
});
