import { auth, db, collection, query, where, getDocs, onAuthStateChanged } from './firebase-config.js';

const list = document.getElementById('customerOrdersList');
const message = document.getElementById('customerOrdersMessage');
const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const dateLabel = value => { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); };

function render(orders) {
  if (!orders.length) { message.textContent = 'No orders yet.'; list.innerHTML = '<div class="orders-empty"><h2>Your order history is empty</h2><p>Explore the collection and find something special.</p><a class="button button-primary" href="index.html#collections">Explore products</a></div>'; return; }
  message.textContent = `${orders.length} order${orders.length === 1 ? '' : 's'}`;
  list.innerHTML = orders.map(order => `<article class="customer-order-card"><div class="customer-order-top"><div><p class="eyebrow">Order #${order.id.slice(0, 8).toUpperCase()}</p><h2>${dateLabel(order.createdAt)}</h2></div><span class="order-status status-${order.status || 'pending'}">${order.status || 'pending'}</span></div><div class="customer-order-items">${(order.items || []).map(item => `<div><span>${item.title} × ${item.quantity}</span><strong>${money(item.price * item.quantity)}</strong></div>`).join('')}</div><div class="customer-order-bottom"><span>${order.shipping?.city || 'Delivery address saved'}</span><strong>${money(order.total)}</strong></div></article>`).join('');
}

onAuthStateChanged(auth, async user => {
  if (!user) { window.location.replace('auth.html'); return; }
  try {
    const snapshot = await getDocs(query(collection(db, 'orders'), where('customerId', '==', user.uid)));
    const orders = snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    render(orders);
  } catch (error) { message.textContent = 'Orders could not be loaded. Please try again.'; }
});
