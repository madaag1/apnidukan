import { auth, db, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, onAuthStateChanged, ADMIN_AUTH_EMAIL } from './firebase-config.js?v=20260905-admin';

const settingsRef = doc(db, 'config', 'settings');
const productsRef = collection(db, 'products');
const defaultImage = 'https://placehold.co/600x600?text=Product';

const value = id => document.getElementById(id)?.value.trim() || '';
const toast = message => {
  const current = document.querySelector('.toast-message');
  if (current) current.remove();
  const node = document.createElement('div');
  node.className = 'toast-message';
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3000);
};

async function loadSettings() {
  const snapshot = await getDoc(settingsRef);
  const settings = snapshot.exists() ? snapshot.data() : {};
  ['whatsappNumber', 'supportEmail', 'supportPhone', 'instagramUrl', 'storeTagline'].forEach(id => {
    const input = document.getElementById(id);
    if (input && settings[id] !== undefined) input.value = settings[id];
  });
}

async function saveSettings() {
  await setDoc(settingsRef, {
    whatsappNumber: value('whatsappNumber') || '919999999999',
    supportEmail: value('supportEmail') || 'support@apnidukan.com',
    supportPhone: value('supportPhone') || '+91 99999 99999',
    instagramUrl: value('instagramUrl') || 'https://instagram.com',
    storeTagline: value('storeTagline') || 'Luxury curated for every style'
  }, { merge: true });
  toast('Store settings saved to Firebase.');
}

function mediaUrls() {
  const entered = value('productImages').split(/[\n,]+/).map(url => url.trim()).filter(url => /^https?:\/\//i.test(url));
  const main = value('productImage');
  return [...new Set([main, ...entered].filter(Boolean))];
}

async function loadProducts() {
  const snapshot = await getDocs(productsRef);
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

async function saveProduct() {
  const title = value('productTitle');
  const price = Number(value('productPrice'));
  const marketPrice = Number(value('productMarketPrice'));
  const qty = Number(value('productQty'));
  if (!title || !price || !marketPrice || !qty) return toast('Please complete title, prices and quantity.');
  const images = mediaUrls();
  const editingId = document.getElementById('productForm')?.dataset.editing || '';
  const existing = editingId ? (await loadProducts()).find(product => product.id === editingId) : null;
  const finalImages = images.length ? images : (existing?.images || [existing?.image || defaultImage]);
  const payload = {
    title,
    audience: value('productAudience'),
    category: value('productCategory'),
    brand: value('productBrand'),
    size: value('productSize'),
    description: value('productDescription'),
    price,
    marketPrice,
    qty,
    image: finalImages[0],
    images: finalImages,
    video: value('productVideo'),
    updatedAt: Date.now()
  };
  if (editingId) await updateDoc(doc(db, 'products', editingId), payload);
  else await addDoc(productsRef, { ...payload, createdAt: Date.now() });
  toast(editingId ? 'Product updated in Firebase.' : 'Product added to Firebase.');
  document.getElementById('productForm')?.reset();
  if (document.getElementById('productForm')) document.getElementById('productForm').dataset.editing = '';
  await renderProducts();
}

async function renderProducts() {
  const list = document.getElementById('productList');
  if (!list) return;
  const products = await loadProducts();
  list.innerHTML = products.map(product => `<div class="product-row"><div><h3>${String(product.title || '').replace(/[<>]/g, '')}</h3><p>${product.category || ''} · ₹${Number(product.price || 0).toLocaleString('en-IN')}</p></div></div>`).join('');
}

onAuthStateChanged(auth, async user => {
  if (!user || user.email !== ADMIN_AUTH_EMAIL) {
    window.location.replace('admin-login.html');
    return;
  }
  try {
    await loadSettings();
    await renderProducts();
    document.getElementById('saveSettings')?.addEventListener('click', () => saveSettings().catch(error => toast(`Save failed: ${error.message}`)));
    document.getElementById('saveProduct')?.addEventListener('click', () => saveProduct().catch(error => toast(`Product save failed: ${error.message}`)));
  } catch (error) {
    toast(`Firebase load failed: ${error.message}`);
  }
});
