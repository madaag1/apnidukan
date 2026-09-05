import { auth, db, collection, addDoc, doc, getDoc, onAuthStateChanged } from './firebase-config.js';

const key = 'apniDukanCart';
const form = document.getElementById('checkoutForm');
const message = document.getElementById('checkoutMessage');
const onlinePanel = document.getElementById('onlinePaymentPanel');
const whatsappHint = document.getElementById('whatsappOrderHint');
const submitButton = document.getElementById('checkoutSubmit');
const paymentQr = document.getElementById('paymentQr');
const paymentQrState = document.getElementById('paymentQrState');
const paymentProof = document.getElementById('paymentProof');
const format = value => `₹${Number(value).toLocaleString('en-IN')}`;
const getCart = () => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
let storeSettings = { whatsappNumber: '919999999999', paymentQrData: '' };

function render() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById('checkoutItems').innerHTML = cart.map(item => `<div class="checkout-item"><span>${item.title} × ${item.quantity}</span><strong>${format(item.price * item.quantity)}</strong></div>`).join('') || '<p class="muted-copy">No items in your cart.</p>';
  document.getElementById('checkoutTotal').textContent = format(total);
  document.getElementById('paymentAmount').textContent = format(total);
  return { cart, total };
}

function selectedPayment() { return document.querySelector('input[name="payment"]:checked')?.value || 'online'; }
function updatePaymentMode() { const online = selectedPayment() === 'online'; onlinePanel.hidden = !online; whatsappHint.hidden = online; submitButton.textContent = online ? 'Done with payment' : 'Order on WhatsApp'; }

function paymentProofData() {
  return new Promise((resolve, reject) => {
    const file = paymentProof.files?.[0];
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        let data = canvas.toDataURL('image/jpeg', .78);
        if (data.length > 700000) data = canvas.toDataURL('image/jpeg', .55);
        resolve(data);
      };
      image.onerror = () => reject(new Error('Payment screenshot could not be read.'));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Payment screenshot could not be read.'));
    reader.readAsDataURL(file);
  });
}

function whatsappUrl(order, customer) {
  const phone = String(storeSettings.whatsappNumber || '').replace(/[^0-9]/g, '');
  const lines = [`Hello Apni Dukaan, I want to place an order.`, `Customer: ${customer.fullName}`, `Phone: ${customer.phone}`, `Email: ${customer.email}`, `Address: ${customer.address}, ${customer.city} - ${customer.postalCode}`, `Total: ${format(order.total)}`, `Order ID: ${order.id.slice(0, 8).toUpperCase()}`, '', 'Products:'];
  order.items.forEach(item => lines.push(`- ${item.title} x ${item.quantity}: ${window.location.origin}/product.html?id=${encodeURIComponent(item.id)}`));
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

async function loadStoreSettings() {
  try {
    const snapshot = await getDoc(doc(db, 'config', 'settings'));
    if (snapshot.exists()) storeSettings = { ...storeSettings, ...snapshot.data() };
    if (storeSettings.paymentQrData) {
      paymentQr.src = storeSettings.paymentQrData;
      paymentQr.hidden = false;
      paymentQrState.hidden = true;
    }
  } catch {
    // WhatsApp ordering can still work if the public settings read is unavailable.
  }
}

onAuthStateChanged(auth, user => {
  if (user) document.getElementById('email').value = user.email || '';
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const { cart, total } = render();
  if (!cart.length) { message.textContent = 'Your cart is empty.'; message.classList.add('is-error'); return; }
  const user = auth.currentUser;
  const shipping = Object.fromEntries(new FormData(form).entries());
  const paymentMethod = selectedPayment();
  if (paymentMethod === 'online' && !storeSettings.paymentQrData) { message.textContent = 'Online payment QR is not configured yet. Please choose Order on WhatsApp.'; message.classList.add('is-error'); return; }
  if (paymentMethod === 'online' && !paymentProof.files?.length) { message.textContent = 'Please upload your payment screenshot before confirming.'; message.classList.add('is-error'); return; }
  try {
    const proof = paymentMethod === 'online' ? await paymentProofData() : '';
    const order = { customerId: user?.uid || 'guest', customerEmail: user?.email || shipping.email, items: cart.map(({ id, title, price, quantity }) => ({ id, title, price, quantity })), shipping, total, paymentMethod, paymentProof: proof, status: 'pending', createdAt: new Date().toISOString() };
    const result = await addDoc(collection(db, 'orders'), order);
    localStorage.removeItem(key);
    message.classList.remove('is-error');
    message.textContent = `Order #${result.id.slice(0, 8).toUpperCase()} saved successfully.`;
    if (paymentMethod === 'whatsapp') window.location.href = whatsappUrl({ ...order, id: result.id }, shipping);
    form.reset();
    if (user) document.getElementById('email').value = user.email || '';
    updatePaymentMode();
    render();
  } catch (error) {
    message.classList.add('is-error');
    message.textContent = 'We could not save your order. Please try again or contact us on WhatsApp.';
  }
});

document.querySelectorAll('input[name="payment"]').forEach(input => input.addEventListener('change', updatePaymentMode));
loadStoreSettings();
updatePaymentMode();
render();
