import { db, collection, doc, getDoc, getDocs } from './firebase-config.js';

const cartStorageKey = 'apniDukanCart';
const productId = new URLSearchParams(window.location.search).get('id');
const detail = document.getElementById('productDetail');
const status = document.getElementById('productDetailStatus');
const similarSection = document.getElementById('similarProducts');
const similarGrid = document.getElementById('similarProductsGrid');

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const formatPrice = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;

function getCart() {
  try { return JSON.parse(localStorage.getItem(cartStorageKey)) || []; } catch { return []; }
}

function updateCartCount() {
  const count = getCart().reduce((total, item) => total + Number(item.quantity || 0), 0);
  document.querySelectorAll('[data-cart-count]').forEach(node => { node.textContent = count; });
}

function showCartToast(message) {
  document.querySelector('.toast-message')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) existing.quantity = Math.min(existing.quantity + 1, Number(product.qty || 99));
  else cart.push({ id: product.id, title: product.title, price: Number(product.price), qty: Number(product.qty || 0), image: product.image, category: product.category, quantity: 1 });
  localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  updateCartCount();
  showCartToast(`${product.title} added to your cart.`);
  const button = document.getElementById('detailAddToCart');
  if (button) { button.textContent = 'Added to cart'; button.classList.add('is-added'); }
}

function renderDetail(product) {
  const discount = Number(product.marketPrice) > Number(product.price) ? Math.round(100 - (Number(product.price) / Number(product.marketPrice)) * 100) : 0;
  const images = [product.image, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean);
  detail.innerHTML = `
    <div class="product-gallery">
      <div class="product-main-image"><img id="productMainImage" src="${escapeHtml(images[0])}" alt="${escapeHtml(product.title)}" /></div>
      <div class="product-thumbnails" aria-label="Product images">
        ${images.map((image, index) => `<button class="product-thumbnail${index === 0 ? ' is-active' : ''}" type="button" data-image="${escapeHtml(image)}"><img src="${escapeHtml(image)}" alt="View ${escapeHtml(product.title)} image ${index + 1}" /></button>`).join('')}
      </div>
    </div>
    <div class="product-detail-copy">
      <p class="eyebrow">${escapeHtml(product.category || 'Lifestyle')}</p>
      <p class="product-detail-brand">${escapeHtml(product.brand || 'Apni Dukaan')}</p>
      <h1>${escapeHtml(product.title)}</h1>
      <p class="product-detail-rating"><strong>4.5</strong> <span>★★★★★</span> <a href="index.html#feedback">Customer reviews</a></p>
      <p class="product-detail-description">${escapeHtml(product.description || 'A carefully selected piece from our premium collection.')}</p>
      <div class="product-detail-price"><strong>${formatPrice(product.price)}</strong>${discount ? `<span>${discount}% off</span>` : ''}<del>${Number(product.marketPrice) > Number(product.price) ? formatPrice(product.marketPrice) : ''}</del></div>
      <p class="product-detail-delivery">FREE delivery <strong>Tue, 1 Sept</strong></p>
      <dl class="product-specs">
        ${[['Brand', product.brand], ['Category', product.category], ['Audience', product.audience], ['Size', product.size], ['Material', product.material], ['Color', product.color]].filter(([, value]) => value).map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}
      </dl>
      <div class="product-detail-actions">
        <button id="detailAddToCart" class="button button-primary" type="button">Add to cart</button>
        <button id="detailBuyNow" class="button button-secondary" type="button">Buy now</button>
      </div>
    </div>
  `;
  detail.hidden = false;
  status.hidden = true;
  document.getElementById('detailAddToCart').addEventListener('click', () => addToCart(product));
  document.getElementById('detailBuyNow').addEventListener('click', () => {
    addToCart(product);
    window.location.href = 'checkout.html';
  });
  detail.querySelectorAll('.product-thumbnail').forEach(button => button.addEventListener('click', () => {
    document.getElementById('productMainImage').src = button.dataset.image;
    detail.querySelectorAll('.product-thumbnail').forEach(item => item.classList.remove('is-active'));
    button.classList.add('is-active');
  }));
}

function renderSimilar(products, product) {
  const similar = products.filter(item => item.id !== product.id && item.category === product.category).slice(0, 4);
  if (!similar.length) return;
  similarGrid.innerHTML = similar.map(item => `<a class="similar-product-card" href="product.html?id=${encodeURIComponent(item.id)}"><div><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" /></div><p>${escapeHtml(item.brand || item.category)}</p><h3>${escapeHtml(item.title)}</h3><strong>${formatPrice(item.price)}</strong></a>`).join('');
  similarSection.hidden = false;
}

async function init() {
  updateCartCount();
  if (!productId) { status.textContent = 'Product not found.'; return; }
  try {
    const productSnapshot = await getDoc(doc(db, 'products', productId));
    const productsSnapshot = await getDocs(collection(db, 'products'));
    if (!productSnapshot.exists()) { status.textContent = 'Product not found.'; return; }
    const product = { id: productSnapshot.id, ...productSnapshot.data() };
    const products = productsSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));
    renderDetail(product);
    renderSimilar(products, product);
    document.title = `${product.title} | Apni Dukaan`;
  } catch (error) {
    status.textContent = 'Product details could not be loaded. Please try again.';
  }
}

init();
