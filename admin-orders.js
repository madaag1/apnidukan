import { auth, db, collection, getDocs, updateDoc, doc, onAuthStateChanged, ADMIN_AUTH_EMAIL } from './firebase-config.js';

const list = document.getElementById('ordersList');
const message = document.getElementById('ordersMessage');
const search = document.getElementById('orderSearch');
const statusFilter = document.getElementById('orderStatus');
let orders = [];

const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const dateLabel = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function updateStats() {
  document.getElementById('allCount').textContent = orders.length;
  document.getElementById('pendingCount').textContent = orders.filter(order => (order.status || 'pending') === 'pending').length;
  document.getElementById('confirmedCount').textContent = orders.filter(order => ['confirmed', 'packed', 'shipped', 'delivered'].includes(order.status)).length;
  document.getElementById('revenueTotal').textContent = money(orders.filter(order => order.status !== 'cancelled').reduce((total, order) => total + Number(order.total || 0), 0));
}

function filteredOrders() {
  const query = search.value.trim().toLowerCase();
  const status = statusFilter.value;
  return orders.filter(order => {
    const searchable = [order.id, order.customerEmail, order.shipping?.fullName, order.shipping?.phone].join(' ').toLowerCase();
    return (!query || searchable.includes(query)) && (status === 'all' || (order.status || 'pending') === status);
  });
}

function render() {
  const visible = filteredOrders();
  message.textContent = `${visible.length} order${visible.length === 1 ? '' : 's'} shown`;
  if (!visible.length) {
    list.innerHTML = '<div class="orders-empty"><h3>No matching orders</h3><p>New customer orders will appear here after checkout.</p></div>';
    return;
  }
  list.innerHTML = visible.map(order => {
    const status = order.status || 'pending';
    const customer = order.shipping?.fullName || order.customerEmail || 'Customer';
    const items = (order.items || []).map(item => `${escapeHtml(item.title)} × ${item.quantity}`).join(', ');
    return `<article class="order-card" data-order-id="${escapeHtml(order.id)}">
      <div class="order-card-top"><div><p class="eyebrow">Order #${escapeHtml(order.id.slice(0, 8).toUpperCase())}</p><h3>${escapeHtml(customer)}</h3><span>${escapeHtml(dateLabel(order.createdAt))}</span></div><span class="order-status status-${escapeHtml(status)}">${escapeHtml(status)}</span></div>
      <div class="order-card-grid"><div><span>Items</span><strong>${items || 'No items listed'}</strong></div><div><span>Contact</span><strong>${escapeHtml(order.shipping?.phone || order.customerEmail || 'Not provided')}</strong></div><div><span>Payment</span><strong>${escapeHtml(order.paymentMethod || 'Not specified')}</strong></div><div><span>Total</span><strong>${money(order.total)}</strong></div></div>
      <details><summary>Delivery details</summary><p>${escapeHtml(order.shipping?.address || 'Address unavailable')}, ${escapeHtml(order.shipping?.city || '')} ${escapeHtml(order.shipping?.postalCode || '')}</p></details>
      ${order.paymentProof ? `<details><summary>Payment proof</summary><a href="${order.paymentProof}" target="_blank" rel="noopener noreferrer">View payment screenshot</a></details>` : ''}
      <div class="order-card-actions"><label>Update status<select data-status-for="${escapeHtml(order.id)}"><option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option><option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>Confirmed</option><option value="packed" ${status === 'packed' ? 'selected' : ''}>Packed</option><option value="shipped" ${status === 'shipped' ? 'selected' : ''}>Shipped</option><option value="delivered" ${status === 'delivered' ? 'selected' : ''}>Delivered</option><option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancelled</option></select></label><a class="button button-secondary" href="https://wa.me/?text=${encodeURIComponent(`Hello ${customer}, update regarding your Apni Dukaan order #${order.id.slice(0, 8).toUpperCase()}.`)}" target="_blank" rel="noopener noreferrer">Message customer</a></div>
    </article>`;
  }).join('');
}

async function loadOrders() {
  message.textContent = 'Loading orders...';
  const snapshot = await getDocs(collection(db, 'orders'));
  orders = snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  updateStats();
  render();
}

list.addEventListener('change', async event => {
  const select = event.target.closest('[data-status-for]');
  if (!select) return;
  select.disabled = true;
  try {
    await updateDoc(doc(db, 'orders', select.dataset.statusFor), { status: select.value, updatedAt: new Date().toISOString() });
    const order = orders.find(item => item.id === select.dataset.statusFor);
    if (order) order.status = select.value;
    updateStats();
    render();
  } catch (error) {
    message.textContent = `Could not update order: ${error.message}`;
    select.disabled = false;
  }
});

search.addEventListener('input', render);
statusFilter.addEventListener('change', render);
document.getElementById('refreshOrders').addEventListener('click', () => loadOrders().catch(error => { message.textContent = `Could not load orders: ${error.message}`; }));

onAuthStateChanged(auth, user => {
  if (!user || user.email !== ADMIN_AUTH_EMAIL) {
    window.location.replace('index.html#top');
    return;
  }
  loadOrders().catch(error => { message.textContent = `Could not load orders: ${error.message}`; });
});
