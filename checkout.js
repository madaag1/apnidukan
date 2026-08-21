import { auth, db, collection, addDoc, onAuthStateChanged } from './firebase-config.js';

const key = 'apniDukanCart';
const form = document.getElementById('checkoutForm');
const message = document.getElementById('checkoutMessage');
const format = value => `₹${Number(value).toLocaleString('en-IN')}`;
const getCart = () => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
function render() { const cart = getCart(); const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0); document.getElementById('checkoutItems').innerHTML = cart.map(item => `<div class="checkout-item"><span>${item.title} × ${item.quantity}</span><strong>${format(item.price * item.quantity)}</strong></div>`).join('') || '<p class="muted-copy">No items in your cart.</p>'; document.getElementById('checkoutTotal').textContent = format(total); return { cart, total }; }
onAuthStateChanged(auth, user => { if (!user) { window.location.replace('auth.html'); return; } document.getElementById('email').value = user.email || ''; });
form.addEventListener('submit', async event => {
  event.preventDefault(); const { cart, total } = render();
  if (!cart.length) { message.textContent = 'Your cart is empty.'; message.classList.add('is-error'); return; }
  const user = auth.currentUser; if (!user) return;
  const shipping = Object.fromEntries(new FormData(form).entries()); const order = { customerId: user.uid, customerEmail: user.email || shipping.email, items: cart.map(({ id, title, price, quantity }) => ({ id, title, price, quantity })), shipping, total, paymentMethod: shipping.payment, status: 'pending', createdAt: new Date().toISOString() };
  try { const result = await addDoc(collection(db, 'orders'), order); localStorage.removeItem(key); message.classList.remove('is-error'); message.textContent = `Order #${result.id.slice(0, 8).toUpperCase()} placed successfully.`; form.reset(); document.getElementById('email').value = user.email || ''; render(); }
  catch (error) { message.classList.add('is-error'); message.textContent = 'We could not save your order. Please try again or contact us on WhatsApp.'; }
});
render();
