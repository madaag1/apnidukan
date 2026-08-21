import { db, collection, doc, getDoc, getDocs, setDoc, addDoc, auth, onAuthStateChanged } from './firebase-config.js';

const cartStorageKey = 'apniDukanCart';
const recentStorageKey = 'apniDukanRecentProducts';
let visibleProducts = new Map();

function getCart() {
  try { return JSON.parse(localStorage.getItem(cartStorageKey)) || []; } catch { return []; }
}

function updateCartCount() {
  const count = getCart().reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll('[data-cart-count]').forEach(node => { node.textContent = count; });
}

function addToCart(product) {
  if (!product || Number(product.qty) < 1) return showTemporaryToast('This product is currently out of stock.');
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) existing.quantity = Math.min(existing.quantity + 1, Number(product.qty));
  else cart.push({ id: product.id, title: product.title, price: Number(product.price), qty: Number(product.qty), image: product.image, category: product.category, quantity: 1 });
  localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  const recent = [product.id, ...getRecentProductIds().filter(id => id !== product.id)].slice(0, 8);
  localStorage.setItem(recentStorageKey, JSON.stringify(recent));
  renderHomeProductRails([...visibleProducts.values()]);
  updateCartCount();
  showTemporaryToast(`${product.title} added to your cart.`);
}

function getRecentProductIds() {
  try { return JSON.parse(localStorage.getItem(recentStorageKey)) || []; } catch { return []; }
}

const defaultProducts = [
  {
    id: 'watch-sport-01',
    title: 'Signature Sport Watch',
    category: 'Watches',
    audience: 'Men',
    description: 'Sleek sport watch with premium leather strap and advanced features.',
    price: 2499,
    marketPrice: 3999,
    qty: 18,
    image: 'https://via.placeholder.com/600x600?text=Sport+Watch'
  },
  {
    id: 'sneaker-air-02',
    title: 'Urban Runner Sneakers',
    category: 'Footwear',
    audience: 'Men',
    description: 'Comfortable and stylish sneakers crafted for city life.',
    price: 1799,
    marketPrice: 2999,
    qty: 32,
    image: 'https://via.placeholder.com/600x600?text=Urban+Sneakers'
  },
  {
    id: 'formal-shirt-03',
    title: 'Elegant Formal Shirt',
    category: 'Clothing',
    audience: 'Men',
    description: 'Tailored formal shirt in premium cotton for every office meeting.',
    price: 899,
    marketPrice: 1599,
    qty: 45,
    image: 'https://via.placeholder.com/600x600?text=Formal+Shirt'
  },
  {
    id: 'earbuds-pro-04',
    title: 'Noise-Canceling Earbuds',
    category: 'Electronics',
    audience: 'Unisex',
    description: 'Wireless earbuds with long battery life and crisp audio.',
    price: 2199,
    marketPrice: 3499,
    qty: 27,
    image: 'https://via.placeholder.com/600x600?text=Earbuds'
  }
];

const defaultTestimonials = [
  {
    id: 'review-priya',
    name: 'Priya',
    location: 'Bengaluru',
    quote: 'Amazing service and premium quality products. The delivery was fast, and the premium packaging made it feel special.',
    rating: 5,
    avatar: 'https://via.placeholder.com/80?text=P'
  },
  {
    id: 'review-aarav',
    name: 'Aarav',
    location: 'Chennai',
    quote: 'WhatsApp ordering was quick and the packaging felt luxurious. I appreciate the personal service and smooth checkout.',
    rating: 5,
    avatar: 'https://via.placeholder.com/80?text=A'
  },
  {
    id: 'review-meera',
    name: 'Meera',
    location: 'Pune',
    quote: 'The style curation is top-notch. Highly recommended—each product feels premium, and the service kept me informed at every step.',
    rating: 5,
    avatar: 'https://via.placeholder.com/80?text=M'
  }
];

const settingsDocRef = doc(db, 'config', 'settings');
const adminCredDocRef = doc(db, 'config', 'adminCredentials');

const defaultSettings = {
  whatsappNumber: '919999999999',
  supportEmail: 'support@apnidukan.com',
  supportPhone: '+91 99999 99999',
  instagramUrl: 'https://instagram.com',
  storeTagline: 'Luxury curated for every style',
  themePack: 'default',
  accentColor: '#d4af37',
  headerColor: '#05070f',
  surfaceColor: '#ffffff',
  backgroundColor: '#050505',
  logoData: '',
  brandTextStyle: 'classic'
};

async function ensureProductsSeeded() {
  const snapshot = await getDocs(collection(db, 'products'));
  return snapshot;
}

async function loadProducts() {
  const snapshot = await ensureProductsSeeded();
  if (snapshot.empty) return defaultProducts;
  const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return products;
}

async function loadSettings() {
  const snap = await getDoc(settingsDocRef);
  if (!snap.exists()) return { ...defaultSettings };
  return { ...defaultSettings, ...snap.data() };
}

async function ensureTestimonialsSeeded() {
  const snapshot = await getDocs(collection(db, 'testimonials'));
  return snapshot;
}

async function loadTestimonials() {
  const snapshot = await ensureTestimonialsSeeded();
  if (snapshot.empty) return defaultTestimonials;
  const testimonials = snapshot.docs
    .map(d => ({ id: d.id, status: 'pending', ...d.data() }))
    .filter(review => review.status === 'approved');
  testimonials.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return testimonials;
}

async function getAdminCredentials() {
  const snap = await getDoc(adminCredDocRef);
  return snap.exists() ? snap.data() : null;
}

async function getAuthUsers() {
  const snapshot = await getDocs(collection(db, 'customers'));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function findAuthUser(contact) {
  const users = await getAuthUsers();
  return users.find(user => user.email === contact || user.mobile === contact);
}

async function renderTestimonials() {
  const rotator = document.getElementById('testimonialRotator');
  const indicators = document.getElementById('testimonialIndicators');
  if (!rotator) return;
  const testimonials = await loadTestimonials();
  if (!testimonials.length) {
    rotator.innerHTML = '<p style="color: var(--muted);">No customer reviews available yet.</p>';
    if (indicators) indicators.innerHTML = '';
    return;
  }
  rotator.innerHTML = testimonials.map((item, index) => {
    const stars = '★★★★★'.slice(0, item.rating) + '☆☆☆☆☆'.slice(0, 5 - item.rating);
    return `
      <article class="testimonial-item${index === 0 ? ' active' : ''}" data-id="${item.id}">
        <div class="testimonial-top">
          <img class="testimonial-avatar" src="${item.avatar || 'https://via.placeholder.com/80?text=' + item.name.charAt(0)}" alt="${item.name} portrait" />
          <div>
            <div class="testimonial-rating">${stars}</div>
            <span class="testimonial-name">${item.name}, ${item.location}</span>
          </div>
        </div>
        <p>${item.quote}</p>
        ${item.image ? `<img class="testimonial-image" src="${item.image}" alt="Customer image from ${item.name}" />` : ''}
      </article>
    `;
  }).join('');
  if (indicators) {
    indicators.innerHTML = testimonials.map((_, index) => `
      <span class="testimonial-indicator${index === 0 ? ' active' : ''}" data-index="${index}"></span>
    `).join('');
  }
  rotateTestimonials();
}

function createWhatsAppUrl(product, settings) {
  const phone = settings.whatsappNumber.replace(/[\s+]/g, '');
  const text = encodeURIComponent(`Hello Apni Dukaan, I would like to order ${product.title} priced at ₹${product.price}. Please help me proceed.`);
  return `https://wa.me/${phone}?text=${text}`;
}

async function applyStoreSettings() {
  const settings = await loadSettings();
  applyTheme(settings);
  applyLogo(settings);
  applyBrandTextStyle(settings.brandTextStyle);

  const heroAction = document.querySelector('.hero-actions .button-secondary');
  if (heroAction) {
    heroAction.href = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent('Hello Apni Dukaan, I would like to order a product.')}`;
  }
  const supportButton = document.querySelector('.support-section .button-secondary');
  if (supportButton) {
    supportButton.href = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent('Hello Apni Dukaan, I need support.')}`;
  }
  const footerLinks = document.querySelectorAll('.social-links a');
  if (footerLinks.length >= 2) {
    footerLinks[0].href = settings.instagramUrl;
    footerLinks[1].href = `https://wa.me/${settings.whatsappNumber}`;
  }
  const headerInstagram = document.getElementById('headerInstagram');
  const headerWhatsApp = document.getElementById('headerWhatsApp');
  const floatInstagram = document.getElementById('floatInstagram');
  const floatWhatsApp = document.getElementById('floatWhatsApp');

  if (headerInstagram) headerInstagram.href = settings.instagramUrl;
  if (headerWhatsApp) headerWhatsApp.href = `https://wa.me/${settings.whatsappNumber}`;
  if (floatInstagram) floatInstagram.href = settings.instagramUrl;
  if (floatWhatsApp) floatWhatsApp.href = `https://wa.me/${settings.whatsappNumber}`;

  const footerWhatsAppLink = document.querySelector('.footer-card a[href*="wa.me"]');
  if (footerWhatsAppLink) footerWhatsAppLink.href = `https://wa.me/${settings.whatsappNumber}`;
  const supportWhatsAppLink = document.querySelector('.support-panel .button-secondary');
  if (supportWhatsAppLink) {
    supportWhatsAppLink.href = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent('Hello Apni Dukaan, I need support.')}`;
  }
  const emailText = document.querySelector('.support-panel p:nth-of-type(2)');
  if (emailText) emailText.textContent = `Email: ${settings.supportEmail}`;
  const phoneText = document.querySelector('.support-panel p:nth-of-type(3)');
  if (phoneText) phoneText.textContent = `Phone: ${settings.supportPhone}`;
  const tagline = document.querySelector('.hero-copy p');
  if (tagline) tagline.textContent = settings.storeTagline;

  return settings;
}

function applyTheme(settings) {
  const classList = document.body.classList;
  classList.remove('theme-default', 'theme-midnight', 'theme-ivory', 'theme-noir');
  classList.add(`theme-${settings.themePack || 'default'}`);
  if (settings.accentColor) document.body.style.setProperty('--accent', settings.accentColor);
  if (settings.headerColor) document.body.style.setProperty('--header-bg', settings.headerColor);
  if (settings.surfaceColor) document.body.style.setProperty('--surface', settings.surfaceColor);
  if (settings.backgroundColor) document.body.style.setProperty('--bg', settings.backgroundColor);
}

function applyLogo(settings) {
  const logoContainer = document.getElementById('logoContainer');
  if (!logoContainer) return;
  const logoSrc = settings.logoData;
  if (logoSrc) {
    logoContainer.classList.add('custom-logo');
    logoContainer.innerHTML = `<img class="site-logo" src="${logoSrc}" alt="Apni Dukaan logo" />`;
  } else {
    logoContainer.classList.remove('custom-logo');
    logoContainer.innerHTML = `
      <svg viewBox="0 0 160 120" class="logo-svg" aria-hidden="true">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f4d86c" />
            <stop offset="100%" stop-color="#d4af37" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g fill="none" stroke="url(#goldGrad)" stroke-width="10" filter="url(#glow)">
          <path d="M24 102 L24 18 L74 18" />
          <path d="M74 18 L100 18 L100 102" />
          <path d="M100 18 A32 32 0 0 1 132 50 L132 70 A32 32 0 0 1 100 102" />
        </g>
        <circle cx="116" cy="55" r="20" fill="url(#goldGrad)" opacity="0.08" />
        <circle cx="116" cy="55" r="18" fill="none" stroke="url(#goldGrad)" stroke-width="6" />
        <line x1="116" y1="55" x2="116" y2="41" stroke="url(#goldGrad)" stroke-width="4" />
        <line x1="116" y1="55" x2="130" y2="55" stroke="url(#goldGrad)" stroke-width="4" />
        <path d="M28 86 C36 78, 48 74, 58 78 C68 82, 80 92, 102 92" stroke="url(#goldGrad)" stroke-width="6" fill="none" />
        <path d="M30 86 L40 74 L56 74 L64 86" stroke="url(#goldGrad)" stroke-width="5" fill="none" />
      </svg>
    `;
  }
}

function applyBrandTextStyle(style) {
  const logoTitle = document.querySelector('.logo-copy strong');
  if (!logoTitle) return;
  logoTitle.classList.remove('brand-text-classic', 'brand-text-glam', 'brand-text-modern');
  if (style === 'glam') {
    logoTitle.classList.add('brand-text-glam');
  } else if (style === 'modern') {
    logoTitle.classList.add('brand-text-modern');
  } else {
    logoTitle.classList.add('brand-text-classic');
  }
}

function getFilteredProducts(allProducts, settings) {
  const searchValue = document.getElementById('productSearch')?.value.trim().toLowerCase() || '';
  const selectedAudience = document.getElementById('filterAudience')?.value || '';
  const selectedCategory = document.getElementById('filterCategory')?.value || '';
  const selectedBrand = document.getElementById('filterBrand')?.value.trim().toLowerCase() || '';
  const selectedSize = document.getElementById('filterSize')?.value.trim().toLowerCase() || '';
  const minPrice = Number(document.getElementById('filterMinPrice')?.value || 0);
  const maxPrice = Number(document.getElementById('filterMaxPrice')?.value || 0);

  return allProducts.filter(product => {
    const matchesSearch = !searchValue || [product.title, product.description, product.category, product.brand, product.size, product.audience].some(field => String(field || '').toLowerCase().includes(searchValue));
    const matchesAudience = !selectedAudience || String(product.audience || '').toLowerCase() === selectedAudience.toLowerCase();
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesBrand = !selectedBrand || String(product.brand || '').toLowerCase().includes(selectedBrand);
    const matchesSize = !selectedSize || String(product.size || '').toLowerCase().includes(selectedSize);
    const matchesMinPrice = !minPrice || product.price >= minPrice;
    const matchesMaxPrice = !maxPrice || product.price <= maxPrice;
    return matchesSearch && matchesAudience && matchesCategory && matchesBrand && matchesSize && matchesMinPrice && matchesMaxPrice;
  });
}

let cachedSettings = null;

async function renderProducts() {
  const productGrid = document.getElementById('productGrid');
  if (!productGrid) return;

  const allProducts = await loadProducts();
  if (!cachedSettings) cachedSettings = await loadSettings();
  const products = getFilteredProducts(allProducts, cachedSettings);
  visibleProducts = new Map(allProducts.map(product => [product.id, product]));
  renderHomeProductRails(allProducts);
  const resultCount = document.getElementById('productResultCount');
  if (resultCount) resultCount.textContent = `${products.length} product${products.length === 1 ? '' : 's'}`;

  if (!products.length) {
    productGrid.innerHTML = '<p style="color: var(--muted);">No products match the selected filters. Clear filters to see all items.</p>';
    return;
  }

  productGrid.innerHTML = products.map(product => {
    const discount = product.marketPrice > product.price ? Math.round(100 - (product.price / product.marketPrice) * 100) : 0;
    return `
      <article class="product-card">
        <img src="${product.image}" alt="${product.title}" />
        <div class="product-info">
          <div>
            <p class="customer-tag">${product.category}</p>
            <h3>${product.title}</h3>
            <p>${product.description}</p>
            ${product.brand ? `<p class="product-detail">Brand: ${product.brand}</p>` : ''}
            ${product.size ? `<p class="product-detail">Size: ${product.size}</p>` : ''}
          </div>
          <div>
            <div class="product-pricing">
              <span class="product-price">₹${Number(product.price).toLocaleString()}</span>
              <span class="product-market">₹${Number(product.marketPrice).toLocaleString()}</span>
            </div>
            <div class="product-actions">
              <button class="button button-primary add-to-cart" type="button" data-product-id="${product.id}">Add to cart</button>
              <a class="product-whatsapp" href="${createWhatsAppUrl(product, cachedSettings)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <span>${product.qty} in stock</span>
            </div>
            ${discount ? `<p style="margin-top:12px;color:var(--accent);">Save ${discount}%</p>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function productRailCard(product) {
  return `<article class="rail-product-card"><img src="${product.image}" alt="${product.title}" /><div><p>${product.category}</p><h3>${product.title}</h3><strong>₹${Number(product.price).toLocaleString('en-IN')}</strong><button class="add-to-cart" type="button" data-product-id="${product.id}">Add to cart</button></div></article>`;
}

function renderHomeProductRails(products) {
  const recentIds = getRecentProductIds();
  const recent = recentIds.map(id => products.find(product => product.id === id)).filter(Boolean);
  const recommended = [...products].slice(0, 4);
  const sale = [...products].filter(product => Number(product.marketPrice) > Number(product.price)).sort((a, b) => (b.marketPrice - b.price) - (a.marketPrice - a.price)).slice(0, 4);
  const writeRail = (id, items, empty) => {
    const grid = document.getElementById(id);
    if (grid) grid.innerHTML = items.length ? items.map(productRailCard).join('') : `<p class="rail-empty">${empty}</p>`;
  };
  writeRail('recentlyViewedGrid', recent, 'Your recently added products will appear here.');
  writeRail('recommendedGrid', recommended, 'New recommendations are coming soon.');
  writeRail('saleGrid', sale, 'Today’s special offers are coming soon.');
}

function setupDealCarousel() {
  const track = document.getElementById('dealTrack');
  if (!track) return;
  const slides = track.children.length;
  let index = 0;
  const move = step => { index = (index + step + slides) % slides; track.style.transform = `translateX(-${index * 100}%)`; };
  document.getElementById('dealPrevious')?.addEventListener('click', () => move(-1));
  document.getElementById('dealNext')?.addEventListener('click', () => move(1));
  setInterval(() => move(1), 4500);
}

function updateFiltersFromAction(filterType, filterValue, audienceValue) {
  if (filterType === 'category') {
    const categorySelect = document.getElementById('filterCategory');
    if (categorySelect) categorySelect.value = filterValue;
  }
  if (filterType === 'audience') {
    const audienceSelect = document.getElementById('filterAudience');
    if (audienceSelect) audienceSelect.value = filterValue;
  }
  if (audienceValue) {
    const audienceSelect = document.getElementById('filterAudience');
    if (audienceSelect) audienceSelect.value = audienceValue;
  }
  renderProducts();
  const collectionsSection = document.getElementById('collections');
  if (collectionsSection) {
    collectionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

const audienceSubcategories = {
  Men: ['Footwear', 'Watches', 'Sunglasses', 'Perfume', 'Belts'],
  Women: ['Handbags', 'Perfume', 'Shoes', 'Accessories', 'Watches'],
  Kids: ['Footwear', 'Clothing', 'Accessories', 'Other'],
  Unisex: ['Watches', 'Sunglasses', 'Perfume', 'Accessories']
};

function showAudienceSubmenu(audience) {
  const submenu = document.getElementById('dropdownSubmenu');
  const submenuTitle = document.getElementById('submenuTitle');
  const submenuItems = document.getElementById('submenuItems');
  const menu = document.getElementById('navDropdownMenu');
  if (!submenu || !submenuTitle || !submenuItems || !menu) return;
  submenuTitle.textContent = `${audience} subcategories`;
  const items = audienceSubcategories[audience] || [];
  submenuItems.innerHTML = items.map(item => `
    <a class="dropdown-item" href="#collections" data-role="subcat" data-category="${item}" data-audience="${audience}">${item}</a>
  `).join('');
  submenu.hidden = false;
  menu.classList.add('submenu-active');
}

function hideAudienceSubmenu() {
  const submenu = document.getElementById('dropdownSubmenu');
  const menu = document.getElementById('navDropdownMenu');
  if (!submenu || !menu) return;
  submenu.hidden = true;
  menu.classList.remove('submenu-active');
}

function setupStorefrontFilters() {
  const filterToggle = document.getElementById('filterToggle');
  const filtersPanel = document.getElementById('filtersPanel');
  if (filterToggle && filtersPanel) {
    filterToggle.addEventListener('click', () => {
      const isOpen = filtersPanel.classList.toggle('filters-open');
      filterToggle.setAttribute('aria-expanded', String(isOpen));
      filterToggle.innerHTML = isOpen ? '✕ Close filters <span>Back to products</span>' : '☰ Filters <span>Refine products</span>';
    });
  }
  const categoryButtons = document.querySelectorAll('.category-action');
  categoryButtons.forEach(button => {
    button.addEventListener('click', event => {
      const filterType = button.dataset.filterType;
      const filterValue = button.dataset.filter;
      if (!filterType || !filterValue) return;
      updateFiltersFromAction(filterType, filterValue);
      event.preventDefault();
    });
  });

  const dropdownMenu = document.getElementById('navDropdownMenu');
  if (dropdownMenu) {
    dropdownMenu.addEventListener('click', event => {
      const target = event.target.closest('[data-role], [data-filter-type]');
      if (!target) return;
      event.preventDefault();
      const role = target.dataset.role;
      if (role === 'audience') {
        showAudienceSubmenu(target.dataset.audience);
        return;
      }
      if (role === 'subcat') {
        const category = target.dataset.category;
        const audience = target.dataset.audience;
        updateFiltersFromAction('category', category, audience);
        hideAudienceSubmenu();
        return;
      }
      const filterType = target.dataset.filterType;
      const filterValue = target.dataset.filter;
      if (!filterType || !filterValue) return;
      updateFiltersFromAction(filterType, filterValue);
    });
  }

  const dropdownBack = document.getElementById('dropdownBack');
  if (dropdownBack) {
    dropdownBack.addEventListener('click', () => {
      hideAudienceSubmenu();
    });
  }

  const searchForm = document.querySelector('.search-bar');
  if (searchForm) {
    searchForm.addEventListener('submit', event => {
      event.preventDefault();
      const headerSearch = searchForm.querySelector('input[type="search"]');
      const productSearch = document.getElementById('productSearch');
      if (headerSearch && productSearch) productSearch.value = headerSearch.value;
      renderProducts();
      document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const filterInputs = ['productSearch', 'filterAudience', 'filterCategory', 'filterBrand', 'filterSize', 'filterMinPrice', 'filterMaxPrice'];
  filterInputs.forEach(id => {
    const field = document.getElementById(id);
    if (field) {
      field.addEventListener('input', () => renderProducts());
    }
  });

  const clearFilters = document.getElementById('clearFilters');
  if (clearFilters) {
    clearFilters.addEventListener('click', () => {
      document.getElementById('productSearch').value = '';
      document.getElementById('filterAudience').value = '';
      document.getElementById('filterCategory').value = '';
      document.getElementById('filterBrand').value = '';
      document.getElementById('filterSize').value = '';
      document.getElementById('filterMinPrice').value = '';
      document.getElementById('filterMaxPrice').value = '';
      renderProducts();
    });
  }
}

function rotateTestimonials() {
  const rotator = document.getElementById('testimonialRotator');
  if (!rotator) return;
  const items = Array.from(rotator.querySelectorAll('.testimonial-item'));
  const indicators = Array.from(document.querySelectorAll('.testimonial-indicator'));
  if (!items.length) return;
  let currentIndex = 0;

  const showItem = index => {
    items.forEach((item, itemIndex) => {
      item.classList.toggle('active', itemIndex === index);
    });
    indicators.forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === index);
    });
  };

  showItem(currentIndex);
  indicators.forEach(dot => {
    dot.addEventListener('click', () => {
      currentIndex = Number(dot.dataset.index);
      showItem(currentIndex);
    });
  });
  if (rotator.dataset.rotating) return;
  rotator.dataset.rotating = 'true';
  setInterval(() => {
    currentIndex = (currentIndex + 1) % items.length;
    showItem(currentIndex);
  }, 4000);
}

function showTemporaryToast(message) {
  const existing = document.querySelector('.toast-message');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function updateAuthMode(mode) {
  const tabs = document.querySelectorAll('.tab-button');
  const rows = document.querySelectorAll('.form-row');
  tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
  rows.forEach(row => row.classList.toggle('hidden', row.dataset.mode !== mode));
}

async function handleCustomerLogin(event) {
  event.preventDefault();
  const contact = document.getElementById('authContact').value.trim();
  const password = document.getElementById('authPassword').value.trim();
  if (!contact || !password) {
    showTemporaryToast('Enter your email or mobile and password.');
    return;
  }
  const user = await findAuthUser(contact);
  if (user && user.password === password) {
    showTemporaryToast(`Welcome back, ${user.name || 'customer'}!`);
    return;
  }
  showTemporaryToast('Login failed. Please check your credentials or sign up.');
}

async function handleSignup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const mobile = document.getElementById('signupMobile').value.trim();
  const password = document.getElementById('signupPassword').value.trim();

  if (!name || !email || !mobile || !password) {
    showTemporaryToast('Complete all signup fields to create your account.');
    return;
  }
  const existing = await findAuthUser(email) || await findAuthUser(mobile);
  if (existing) {
    showTemporaryToast('An account already exists with that email or mobile.');
    return;
  }
  await addDoc(collection(db, 'customers'), { name, email, mobile, password });
  showTemporaryToast('Account created successfully. You can now login.');
  document.getElementById('signupName').value = '';
  document.getElementById('signupEmail').value = '';
  document.getElementById('signupMobile').value = '';
  document.getElementById('signupPassword').value = '';
}

async function handleAdminLogin() {
  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const credentials = await getAdminCredentials();
  if (!username || !password) {
    showTemporaryToast('Enter admin username and password.');
    return;
  }
  if (credentials && username === credentials.username && password === credentials.password) {
    window.location.href = 'admin.html';
    return;
  }
  showTemporaryToast('Admin login failed. Check username/password.');
}

async function handleOtpLogin() {
  const contact = document.getElementById('authContact').value.trim();
  if (!contact) {
    showTemporaryToast('Enter email or mobile to receive an OTP.');
    return;
  }
  const user = await findAuthUser(contact);
  if (!user) {
    showTemporaryToast('No user found for that email or mobile. Please sign up first.');
    return;
  }
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const entered = prompt(`Enter the OTP sent to ${contact}. (Simulated OTP: ${otp})`);
  if (entered === otp) {
    showTemporaryToast(`OTP verified. Welcome back, ${user.name}!`);
  } else {
    showTemporaryToast('OTP verification failed. Try again.');
  }
}

function handleGoogleLogin() {
  showTemporaryToast('Google login simulated. Welcome to Apni Dukaan!');
}

async function init() {
  cachedSettings = await applyStoreSettings();
  await renderProducts();
  await renderTestimonials();
  updateCartCount();

  document.addEventListener('click', event => {
    const button = event.target.closest('.add-to-cart');
    if (button) addToCart(visibleProducts.get(button.dataset.productId));
  });

  setupDealCarousel();

  onAuthStateChanged(auth, user => {
    const accountLink = document.getElementById('accountLink');
    if (accountLink) accountLink.textContent = user ? 'My account' : 'Sign in';
  });

  const authForm = document.getElementById('userAuthForm');
  if (authForm) {
    authForm.addEventListener('submit', handleCustomerLogin);
  }

  setupStorefrontFilters();

  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => updateAuthMode(button.dataset.mode));
  });

  const signupButton = document.getElementById('signupButton');
  if (signupButton) signupButton.addEventListener('click', handleSignup);

  const adminLoginButton = document.getElementById('adminLoginButton');
  if (adminLoginButton) adminLoginButton.addEventListener('click', handleAdminLogin);

  const otpLoginButton = document.getElementById('otpLoginButton');
  if (otpLoginButton) otpLoginButton.addEventListener('click', handleOtpLogin);

  const googleLoginButton = document.getElementById('googleLoginButton');
  if (googleLoginButton) googleLoginButton.addEventListener('click', handleGoogleLogin);
}

init();
