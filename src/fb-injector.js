// Facebook BrowserView preload script
// This runs in the Facebook webview context with context isolation

const { contextBridge, ipcRenderer } = require('electron');

console.log('FB Injector preload loaded!');

// Expose capture function directly to the page
// The injected script calls window.brainrotCapture.submit() which
// goes directly to ipcRenderer.send - no postMessage needed
contextBridge.exposeInMainWorld('brainrotCapture', {
  submit: (captureData) => {
    console.log('brainrotCapture.submit called');
    ipcRenderer.send('brainrot-capture', captureData);
  }
});

console.log('brainrotCapture.submit API exposed to page');
