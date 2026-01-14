// Facebook BrowserView preload script
// This runs in the Facebook webview context

const { contextBridge, ipcRenderer } = require('electron');

console.log('FB Injector preload loaded!');

// Listen for messages from injected content script
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'BRAINROT_CAPTURE') {
    console.log('FB Injector: Received capture, forwarding to main process');
    // Forward to main process
    ipcRenderer.send('brainrot-capture', event.data.data);
  }
});

// Expose minimal API
contextBridge.exposeInMainWorld('brainrotCapture', {
  send: (data) => {
    window.parent.postMessage({ type: 'BRAINROT_CAPTURE', data }, '*');
  }
});
