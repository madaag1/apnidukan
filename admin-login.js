import { auth, signInWithEmailAndPassword, ADMIN_AUTH_EMAIL } from './firebase-config.js';

const form = document.getElementById('adminLoginForm');
const message = document.getElementById('adminLoginMessage');

form.addEventListener('submit', async event => {
  event.preventDefault();
  const username = document.getElementById('adminUsername').value.trim().toLowerCase();
  const password = document.getElementById('adminPassword').value;
  message.classList.remove('is-error');
  message.textContent = 'Signing in...';
  if (username !== 'madaag1' || !password) {
    message.classList.add('is-error');
    message.textContent = 'Enter the correct admin ID and password.';
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, ADMIN_AUTH_EMAIL, password);
    window.location.replace('admin.html');
  } catch (error) {
    message.classList.add('is-error');
    message.textContent = error.code === 'auth/invalid-credential' ? 'Admin ID or password is incorrect.' : 'Login failed. Check Firebase Auth configuration.';
  }
});
