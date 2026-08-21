import { auth, db, doc, setDoc, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut } from './firebase-config.js';

const cartStorageKey = 'apniDukanCart';
let mode = 'signin';
const message = document.getElementById('authMessage');

function cartCount() { try { return (JSON.parse(localStorage.getItem(cartStorageKey)) || []).reduce((n, item) => n + item.quantity, 0); } catch { return 0; } }
function updateCartCount() { document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = cartCount(); }); }
function setMessage(text, isError = false) { message.textContent = text; message.classList.toggle('is-error', isError); }
function setMode(next) {
  mode = next;
  document.querySelectorAll('[data-auth-mode]').forEach(button => button.classList.toggle('active', button.dataset.authMode === next));
  document.getElementById('nameField').classList.toggle('hidden', next !== 'signup');
  document.getElementById('submitAuth').textContent = next === 'signup' ? 'Create account' : 'Sign in';
  document.getElementById('password').autocomplete = next === 'signup' ? 'new-password' : 'current-password';
  setMessage('');
}
async function saveProfile(user, name = '') {
  await setDoc(doc(db, 'customers', user.uid), { name: name || user.displayName || '', email: user.email || '', updatedAt: new Date().toISOString() }, { merge: true });
}
document.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.authMode)));
document.getElementById('authPageForm').addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const name = document.getElementById('displayName').value.trim();
  if (!email || !password || (mode === 'signup' && !name)) return setMessage('Please complete the required fields.', true);
  try {
    const credential = mode === 'signup' ? await createUserWithEmailAndPassword(auth, email, password) : await signInWithEmailAndPassword(auth, email, password);
    if (mode === 'signup') await saveProfile(credential.user, name);
    window.location.href = 'checkout.html';
  } catch (error) { setMessage(error.code === 'auth/invalid-credential' ? 'Email or password is incorrect.' : error.message.replace('Firebase: ', ''), true); }
});
document.getElementById('googleAuth').addEventListener('click', async () => {
  try { const result = await signInWithPopup(auth, new GoogleAuthProvider()); await saveProfile(result.user); window.location.href = 'checkout.html'; }
  catch (error) { setMessage(error.message.replace('Firebase: ', ''), true); }
});
document.getElementById('signOutButton').addEventListener('click', () => signOut(auth));
onAuthStateChanged(auth, user => {
  document.getElementById('authView').classList.toggle('hidden', Boolean(user));
  document.getElementById('signedInView').classList.toggle('hidden', !user);
  if (user) { document.getElementById('signedInName').textContent = `Welcome, ${user.displayName || user.email.split('@')[0]}`; document.getElementById('signedInEmail').textContent = user.email || ''; }
});
updateCartCount();
