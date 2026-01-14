// UI Elements
const loginContainer = document.getElementById('login-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const captureTools = document.getElementById('capture-tools');
const userInfo = document.getElementById('user-info');
const captureCount = document.getElementById('capture-count');
const captureNotification = document.getElementById('capture-notification');
const facebookContainer = document.getElementById('facebook-container');

let captures = 0;

// Check existing session on load
async function checkSession() {
  try {
    const session = await window.brainrot.getSession();
    if (session.brainrot && session.brainrot.userid) {
      showLoggedInState(session.brainrot.username);
    }
  } catch (err) {
    console.error('Session check failed:', err);
  }
}

// Show logged in state
function showLoggedInState(username) {
  loginContainer.style.display = 'none';
  captureTools.style.display = 'flex';
  userInfo.style.display = 'flex';
  captureCount.style.display = 'block';
  facebookContainer.style.display = 'block';

  document.querySelector('.username').textContent = username;
}

// Show logged out state
function showLoggedOutState() {
  loginContainer.style.display = 'flex';
  captureTools.style.display = 'none';
  userInfo.style.display = 'none';
  captureCount.style.display = 'none';
  facebookContainer.style.display = 'none';
}

// Login form handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  loginError.style.display = 'none';

  try {
    const result = await window.brainrot.login({ username, password });

    if (result.success) {
      showLoggedInState(username);
    } else {
      loginError.textContent = result.error || 'Login failed. Please check your credentials.';
      loginError.style.display = 'block';
    }
  } catch (err) {
    loginError.textContent = 'Connection error. Please try again.';
    loginError.style.display = 'block';
  }
});

// Logout handler
document.getElementById('btn-logout').addEventListener('click', async () => {
  await window.brainrot.logout();
  showLoggedOutState();
  captures = 0;
  updateCaptureCount();
});

// Listen for captures from Facebook view
window.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'BRAINROT_CAPTURE') {
    const captureData = event.data.data;
    const category = document.getElementById('category-dropdown').value;

    // Add category to capture
    captureData.category = category;

    // Submit to server
    const result = await window.brainrot.submitCapture(captureData);

    if (result.success) {
      captures++;
      updateCaptureCount();
      showNotification('Content captured and submitted!');
    } else {
      showNotification('Capture saved locally', 'warning');
    }
  }
});

// Update capture count display
function updateCaptureCount() {
  document.querySelector('#capture-count .count').textContent = captures;
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.getElementById('capture-notification');
  const notificationText = notification.querySelector('.notification-text');
  const notificationIcon = notification.querySelector('.notification-icon');

  notificationText.textContent = message;
  notificationIcon.textContent = type === 'success' ? '✓' : '⚠';

  notification.style.display = 'block';

  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// Tool button handlers
document.getElementById('btn-select').addEventListener('click', () => {
  // Toggle select mode (would communicate with Facebook view)
  const btn = document.getElementById('btn-select');
  btn.classList.toggle('active');
});

document.getElementById('btn-screenshot').addEventListener('click', async () => {
  // Take screenshot of current view
  showNotification('Screenshot feature coming soon!');
});

// Initialize
checkSession();
