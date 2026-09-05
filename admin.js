import { db, auth, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onAuthStateChanged, ADMIN_AUTH_EMAIL } from './firebase-config.js?v=20260731-feedback';

const defaultTestimonials = [
  {
    id: 'review-priya',
    name: 'Priya',
    location: 'Bengaluru',
    quote: 'Amazing service and premium quality products. The delivery was fast, and the premium packaging made it feel special.',
    rating: 5,
    avatar: 'https://placehold.co/80?text=P'
  },
  {
    id: 'review-aarav',
    name: 'Aarav',
    location: 'Chennai',
    quote: 'WhatsApp ordering was quick and the packaging felt luxurious. I appreciate the personal service and smooth checkout.',
    rating: 5,
    avatar: 'https://placehold.co/80?text=A'
  },
  {
    id: 'review-meera',
    name: 'Meera',
    location: 'Pune',
    quote: 'The style curation is top-notch. Highly recommended—each product feels premium, and the service kept me informed at every step.',
    rating: 5,
    avatar: 'https://placehold.co/80?text=M'
  }
];

const defaultProducts = [
  {
    id: 'watch-sport-01',
    title: 'Signature Sport Watch',
    category: 'Watches',
    audience: 'Men',
    brand: 'Apni Dukan',
    color: 'Black',
    material: 'Leather',
    description: 'Sleek sport watch with premium leather strap and advanced features.',
    price: 2499,
    marketPrice: 3999,
    qty: 18,
    image: 'https://placehold.co/600x600?text=Sport+Watch'
  },
  {
    id: 'sneaker-air-02',
    title: 'Urban Runner Sneakers',
    category: 'Footwear',
    audience: 'Men',
    color: 'White',
    material: 'Mesh',
    description: 'Comfortable and stylish sneakers crafted for city life.',
    price: 1799,
    marketPrice: 2999,
    qty: 32,
    image: 'https://placehold.co/600x600?text=Urban+Sneakers'
  },
  {
    id: 'formal-shirt-03',
    title: 'Elegant Formal Shirt',
    category: 'Clothing',
    audience: 'Men',
    color: 'White',
    material: 'Cotton',
    description: 'Tailored formal shirt in premium cotton for every office meeting.',
    price: 899,
    marketPrice: 1599,
    qty: 45,
    image: 'https://placehold.co/600x600?text=Formal+Shirt'
  },
  {
    id: 'earbuds-pro-04',
    title: 'Noise-Canceling Earbuds',
    category: 'Electronics',
    audience: 'Unisex',
    color: 'Black',
    material: 'Plastic',
    description: 'Wireless earbuds with long battery life and crisp audio.',
    price: 2199,
    marketPrice: 3499,
    qty: 27,
    image: 'https://placehold.co/600x600?text=Earbuds'
  }
];

const settingsDocRef = doc(db, 'config', 'settings');

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
  welcomeEnabled: false,
  welcomeMessage: '',
  welcomeMedia: '',
  brandTextStyle: 'classic'
};

async function ensureProductsSeeded() {
  const snapshot = await getDocs(collection(db, 'products'));
  if (!snapshot.empty) return;
  let order = defaultProducts.length;
  for (const product of defaultProducts) {
    const { id, ...rest } = product;
    await setDoc(doc(db, 'products', id), { ...rest, createdAt: order });
    order -= 1;
  }
}

async function getProducts() {
  await ensureProductsSeeded();
  const snapshot = await getDocs(collection(db, 'products'));
  const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return products;
}

async function addProduct(product) {
  await addDoc(collection(db, 'products'), { ...product, createdAt: Date.now() });
}

async function updateProductById(id, product) {
  await updateDoc(doc(db, 'products', id), product);
}

async function deleteProductById(id) {
  await deleteDoc(doc(db, 'products', id));
}

async function getSettings() {
  const snap = await getDoc(settingsDocRef);
  if (!snap.exists()) {
    await setDoc(settingsDocRef, defaultSettings);
    return { ...defaultSettings };
  }
  return { ...defaultSettings, ...snap.data() };
}

async function saveSettings(settings) {
  await setDoc(settingsDocRef, settings, { merge: true });
}

async function getCoupons() {
  const snapshot = await getDocs(collection(db, 'coupons'));
  const coupons = snapshot.docs.map(d => ({ code: d.id, ...d.data() }));
  coupons.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return coupons;
}

async function addCoupon(code, discount) {
  await setDoc(doc(db, 'coupons', code), { discount, createdAt: Date.now() });
}

async function deleteCouponByCode(code) {
  await deleteDoc(doc(db, 'coupons', code));
}

let currentReviewFilter = 'all';

async function ensureTestimonialsSeeded() {
  const snapshot = await getDocs(collection(db, 'testimonials'));
  if (!snapshot.empty) return;
  let order = defaultTestimonials.length;
  for (const review of defaultTestimonials) {
    const { id, ...rest } = review;
    await setDoc(doc(db, 'testimonials', id), { ...rest, status: 'approved', createdAt: order });
    order -= 1;
  }
}

async function getTestimonials() {
  await ensureTestimonialsSeeded();
  const snapshot = await getDocs(collection(db, 'testimonials'));
  const testimonials = snapshot.docs.map(d => ({ id: d.id, status: 'pending', ...d.data() }));
  testimonials.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return testimonials;
}

async function addTestimonial(testimonial) {
  await addDoc(collection(db, 'testimonials'), { ...testimonial, createdAt: Date.now() });
}

async function updateTestimonialById(id, testimonial) {
  await updateDoc(doc(db, 'testimonials', id), testimonial);
}

async function deleteTestimonialById(id) {
  await deleteDoc(doc(db, 'testimonials', id));
}

function renderTestimonialListView(testimonials, filter = 'all') {
  const list = document.getElementById('testimonialList');
  if (!list) return;
  const filtered = filter === 'all' ? testimonials : testimonials.filter(review => review.status === filter);
  if (!filtered.length) {
    list.innerHTML = '<p style="color: var(--muted);">No customer reviews match this filter.</p>';
    return;
  }
  list.innerHTML = filtered.map(review => `
    <div class="product-row review-row review-status-${review.status}">
      <div>
        <div class="review-preview-top">
          <h3>${review.name} • ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</h3>
          <span>${review.location}</span>
          <span class="review-status-badge ${review.status}">${review.status}</span>
        </div>
        <p>${review.quote}</p>
        ${review.image ? `<img class="review-preview-image" src="${review.image}" alt="Review image for ${review.name}" />` : ''}
      </div>
      <div class="product-actions">
        <button class="button button-secondary" data-action="approve-review" data-id="${review.id}">Approve</button>
        <button class="button button-secondary" data-action="reject-review" data-id="${review.id}">Reject</button>
        <button class="button button-secondary" data-action="edit-review" data-id="${review.id}">Edit</button>
        <button class="button button-ghost" data-action="delete-review" data-id="${review.id}">Delete</button>
      </div>
    </div>
  `).join('');
}

async function renderTestimonialList(filter = currentReviewFilter) {
  const testimonials = await getTestimonials();
  renderTestimonialListView(testimonials, filter);
}

function clearTestimonialForm() {
  document.getElementById('testimonialName').value = '';
  document.getElementById('testimonialLocation').value = '';
  document.getElementById('testimonialQuote').value = '';
  document.getElementById('testimonialRating').value = '5';
  document.getElementById('testimonialAvatarUpload').value = '';
  document.getElementById('testimonialImageUpload').value = '';
  document.getElementById('testimonialForm').dataset.editing = '';
}

async function renderProductList() {
  const list = document.getElementById('productList');
  const products = await getProducts();
  if (!list) return;
  list.innerHTML = products.map(product => `
    <div class="product-row">
      <div>
        <h3>${product.title}</h3>
        <p>${product.category} · ₹${Number(product.price).toLocaleString()} · ₹${Number(product.marketPrice).toLocaleString()} · Qty: ${product.qty}</p>
      </div>
      <div class="product-actions">
        <button class="button button-secondary" data-action="edit" data-id="${product.id}">Edit</button>
        <button class="button button-ghost" data-action="delete" data-id="${product.id}">Delete</button>
      </div>
    </div>
  `).join('');
}

async function renderCoupons() {
  const list = document.getElementById('couponList');
  const coupons = await getCoupons();
  if (!coupons.length) {
    list.innerHTML = '<p style="color: var(--muted);">No coupons created yet. Generate one to share with customers.</p>';
    return;
  }
  list.innerHTML = coupons.map(coupon => `
    <div class="coupon-card">
      <div>
        <span>${coupon.code}</span>
        <p>${coupon.discount}% off</p>
      </div>
      <button class="button button-ghost" data-coupon="${coupon.code}">Remove</button>
    </div>
  `).join('');
}

function updateLogoPreview(src) {
  const preview = document.getElementById('logoPreview');
  if (!preview) return;
  preview.src = src || '';
  preview.dataset.source = src ? 'file' : '';
  preview.style.display = src ? 'block' : 'none';
}

function updateWelcomePreview(src) {
  const welcomeMediaPreview = document.getElementById('welcomeMediaPreview');
  if (!welcomeMediaPreview) return;
  welcomeMediaPreview.dataset.media = src || '';
  welcomeMediaPreview.innerHTML = '';
  if (!src) return;
  if (src.startsWith('data:video')) {
    welcomeMediaPreview.innerHTML = `<video controls src="${src}"></video>`;
  } else {
    welcomeMediaPreview.innerHTML = `<img src="${src}" alt="Welcome media preview" />`;
  }
}

async function populateSettings() {
  const settings = await getSettings();
  document.getElementById('whatsappNumber').value = settings.whatsappNumber;
  document.getElementById('supportEmail').value = settings.supportEmail;
  document.getElementById('supportPhone').value = settings.supportPhone;
  document.getElementById('instagramUrl').value = settings.instagramUrl;
  document.getElementById('themePack').value = settings.themePack;
  document.getElementById('accentColor').value = settings.accentColor;
  document.getElementById('headerColor').value = settings.headerColor || '#05070f';
  document.getElementById('surfaceColor').value = /^#[0-9a-fA-F]{6}$/.test(settings.surfaceColor) ? settings.surfaceColor : '#ffffff';
  document.getElementById('backgroundColor').value = settings.backgroundColor || '#050505';
  document.getElementById('welcomeEnabled').checked = settings.welcomeEnabled || false;
  document.getElementById('welcomeMessage').value = settings.welcomeMessage || '';
  document.getElementById('storeTagline').value = settings.storeTagline;
  document.getElementById('brandTextStyle').value = settings.brandTextStyle || 'classic';
  updateLogoPreview(settings.logoData || '');
  updateWelcomePreview(settings.welcomeMedia || '');
  applyAdminTheme(settings);
}

function applyAdminTheme(settings) {
  const classList = document.body.classList;
  classList.remove('theme-default', 'theme-midnight', 'theme-ivory', 'theme-noir');
  classList.add(`theme-${settings.themePack || 'default'}`);
  if (settings.accentColor) {
    document.body.style.setProperty('--accent', settings.accentColor);
  }
  if (settings.headerColor) {
    document.body.style.setProperty('--header-bg', settings.headerColor);
  }
  if (settings.surfaceColor) {
    document.body.style.setProperty('--surface', settings.surfaceColor);
  }
  if (settings.backgroundColor) {
    document.body.style.setProperty('--bg', settings.backgroundColor);
  }
}

function clearProductForm() {
  document.getElementById('productTitle').value = '';
  document.getElementById('productDescription').value = '';
  document.getElementById('productAudience').value = 'Men';
  document.getElementById('productCategory').value = 'Watches';
  document.getElementById('productBrand').value = '';
  document.getElementById('productSize').value = '';
  document.getElementById('productColor').value = '';
  document.getElementById('productMaterial').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productMarketPrice').value = '';
  document.getElementById('productQty').value = '';
  document.getElementById('productImage').value = '';
  document.getElementById('productImageUpload').value = '';
  document.getElementById('couponCode').value = '';
  document.getElementById('couponDiscount').value = '';
  document.getElementById('productForm').dataset.editing = '';
}

function showToast(message) {
  const existing = document.querySelector('.toast-message');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function readFileAsDataUrl(input) {
  return new Promise(resolve => {
    const file = input.files && input.files[0];
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.readAsDataURL(file);
  });
}

// Firestore documents are capped at 1MB, and phone photos are often bigger than that
// on their own. This resizes + compresses images down to a safe size before they're
// stored, so uploads don't silently fail. Videos are passed through unchanged since
// they can't be shrunk this way (keep welcome-banner videos small manually).
function readImageAsCompressedDataUrl(input, maxDimension = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const file = input.files && input.files[0];
    if (!file) return resolve('');
    if (!file.type.startsWith('image/')) {
      // Not an image (e.g. a video for the welcome banner) - read as-is.
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = () => reject(new Error('Could not read the selected file.'));
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        // If it's still too big for a Firestore field, compress further.
        let safeQuality = quality;
        while (dataUrl.length > 700000 && safeQuality > 0.3) {
          safeQuality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', safeQuality);
        }
        if (dataUrl.length > 700000) {
          reject(new Error('This image is too large even after compression. Please choose a smaller photo.'));
          return;
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Could not read that image file.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function setupEvents() {
  document.getElementById('saveSettings').addEventListener('click', async () => {
    const logoPreview = document.getElementById('logoPreview');
    const welcomePreview = document.getElementById('welcomeMediaPreview');
    const existingSettings = await getSettings();
    const logoDataValue = logoPreview && logoPreview.dataset.source === 'file' ? logoPreview.src : existingSettings.logoData;
    const welcomeMediaValue = welcomePreview && welcomePreview.dataset.media ? welcomePreview.dataset.media : existingSettings.welcomeMedia;
    const settings = {
      whatsappNumber: document.getElementById('whatsappNumber').value.trim() || '919999999999',
      supportEmail: document.getElementById('supportEmail').value.trim() || 'support@apnidukan.com',
      supportPhone: document.getElementById('supportPhone').value.trim() || '+91 99999 99999',
      instagramUrl: document.getElementById('instagramUrl').value.trim() || 'https://instagram.com',
      storeTagline: document.getElementById('storeTagline').value.trim() || 'Luxury curated for every style',
      themePack: document.getElementById('themePack').value || 'default',
      accentColor: document.getElementById('accentColor').value || '#d4af37',
      headerColor: document.getElementById('headerColor').value || '#05070f',
      surfaceColor: document.getElementById('surfaceColor').value || '#ffffff',
      backgroundColor: document.getElementById('backgroundColor').value || '#050505',
      logoData: logoDataValue || '',
      welcomeEnabled: document.getElementById('welcomeEnabled').checked,
      welcomeMessage: document.getElementById('welcomeMessage').value.trim(),
      welcomeMedia: welcomeMediaValue || '',
      brandTextStyle: document.getElementById('brandTextStyle').value || 'classic'
    };
    try {
      await saveSettings(settings);
      applyAdminTheme(settings);
      showToast('✅ Saved to Firebase — store settings updated.');
    } catch (error) {
      showToast('❌ Save failed: ' + (error.message || 'Please try again.'));
    }
  });

  document.getElementById('logoUpload').addEventListener('change', async event => {
    const preview = document.getElementById('logoPreview');
    if (!preview) return;
    try {
      const compressed = await readImageAsCompressedDataUrl(event.target, 400, 0.8);
      if (!compressed) return;
      preview.dataset.source = 'file';
      preview.src = compressed;
      preview.style.display = 'block';
    } catch (error) {
      showToast(error.message || 'Could not process that logo image.');
    }
  });

  const productImageUpload = document.getElementById('productImageUpload');
  const avatarUploadInput = document.getElementById('testimonialAvatarUpload');
  const imageUploadInput = document.getElementById('testimonialImageUpload');
  const welcomeMediaUpload = document.getElementById('welcomeMediaUpload');

  document.getElementById('saveProduct').addEventListener('click', async () => {
    const title = document.getElementById('productTitle').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const audience = document.getElementById('productAudience').value;
    const category = document.getElementById('productCategory').value;
    const price = Number(document.getElementById('productPrice').value);
    const marketPrice = Number(document.getElementById('productMarketPrice').value);
    const qty = Number(document.getElementById('productQty').value);
    const brand = document.getElementById('productBrand').value.trim();
    const size = document.getElementById('productSize').value.trim();
    const color = document.getElementById('productColor').value.trim();
    const material = document.getElementById('productMaterial').value.trim();
    const imageUrl = document.getElementById('productImage').value.trim();
    if (!title || !price || !marketPrice || !qty) {
      showToast('Please complete all required product fields.');
      return;
    }
    try {
      const imageFileData = await readImageAsCompressedDataUrl(productImageUpload);
      const editingId = document.getElementById('productForm').dataset.editing;
      let existingImage = '';
      if (editingId) {
        const products = await getProducts();
        const existingProduct = products.find(product => product.id === editingId);
        existingImage = existingProduct ? existingProduct.image : '';
      }
      const image = imageFileData || imageUrl || existingImage || 'https://placehold.co/600x600?text=Product';
      const payload = { title, audience, category, brand, size, color, material, description, price, marketPrice, qty, image };
      if (editingId) {
        await updateProductById(editingId, payload);
        showToast('✅ Saved to Firebase — product updated.');
      } else {
        await addProduct(payload);
        showToast('✅ Saved to Firebase — product added.');
      }
      await renderProductList();
      clearProductForm();
    } catch (error) {
      showToast('❌ Save failed: ' + (error.message || 'Please try again.'));
    }
  });

  document.getElementById('clearProduct').addEventListener('click', () => {
    clearProductForm();
  });

  document.getElementById('couponForm').addEventListener('submit', event => {
    event.preventDefault();
  });

  document.getElementById('generateCoupon').addEventListener('click', async () => {
    const codeInput = document.getElementById('couponCode').value.trim().toUpperCase();
    const discount = Number(document.getElementById('couponDiscount').value);
    if (!codeInput || !discount || discount <= 0) {
      showToast('Enter a valid coupon code and discount.');
      return;
    }
    await addCoupon(codeInput, discount);
    await renderCoupons();
    document.getElementById('couponCode').value = '';
    document.getElementById('couponDiscount').value = '';
    showToast('✅ Saved to Firebase — coupon generated.');
  });

  welcomeMediaUpload.addEventListener('change', async event => {
    try {
      const fileData = await readImageAsCompressedDataUrl(event.target, 900, 0.75);
      updateWelcomePreview(fileData);
    } catch (error) {
      showToast(error.message || 'Could not process that file.');
    }
  });

  document.getElementById('saveTestimonial').addEventListener('click', async () => {
    const name = document.getElementById('testimonialName').value.trim();
    const location = document.getElementById('testimonialLocation').value.trim();
    const quote = document.getElementById('testimonialQuote').value.trim();
    const rating = Number(document.getElementById('testimonialRating').value) || 5;
    if (!name || !location || !quote) {
      showToast('Please fill in name, location and review text.');
      return;
    }
    try {
      const avatarFileData = await readImageAsCompressedDataUrl(avatarUploadInput, 200, 0.8);
      const imageFileData = await readImageAsCompressedDataUrl(imageUploadInput, 900, 0.75);
      const editingId = document.getElementById('testimonialForm').dataset.editing;
      let existingReview = null;
      if (editingId) {
        const testimonials = await getTestimonials();
        existingReview = testimonials.find(review => review.id === editingId);
      }
      const avatar = avatarFileData || (existingReview ? existingReview.avatar : `https://placehold.co/80?text=${name ? name.charAt(0) : 'U'}`);
      const image = imageFileData || (existingReview ? existingReview.image : '');
      if (editingId) {
        await updateTestimonialById(editingId, {
          name, location, quote, rating, avatar, image,
          status: existingReview ? existingReview.status || 'pending' : 'pending'
        });
        showToast('✅ Saved to Firebase — review updated.');
      } else {
        await addTestimonial({ name, location, quote, rating, avatar, image, status: 'pending' });
        showToast('✅ Saved to Firebase — review added and pending approval.');
      }
      await renderTestimonialList(currentReviewFilter);
      clearTestimonialForm();
    } catch (error) {
      showToast('❌ Save failed: ' + (error.message || 'Please try again.'));
    }
  });

  document.getElementById('clearTestimonial').addEventListener('click', () => {
    clearTestimonialForm();
  });

  document.getElementById('testimonialList').addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'delete-review') {
      await deleteTestimonialById(id);
      await renderTestimonialList(currentReviewFilter);
      showToast('✅ Deleted from Firebase.');
      return;
    }
    if (action === 'approve-review' || action === 'reject-review') {
      await updateTestimonialById(id, { status: action === 'approve-review' ? 'approved' : 'rejected' });
      await renderTestimonialList(currentReviewFilter);
      showToast(`Review ${action === 'approve-review' ? 'approved' : 'rejected'}.`);
      return;
    }
    if (action === 'edit-review') {
      const testimonials = await getTestimonials();
      const review = testimonials.find(item => item.id === id);
      if (!review) return;
      document.getElementById('testimonialName').value = review.name;
      document.getElementById('testimonialLocation').value = review.location;
      document.getElementById('testimonialQuote').value = review.quote;
      document.getElementById('testimonialRating').value = review.rating.toString();
      document.getElementById('testimonialAvatarUpload').value = '';
      document.getElementById('testimonialImageUpload').value = '';
      document.getElementById('testimonialForm').dataset.editing = id;
      showToast('Editing review. Save to apply changes.');
    }
  });

  document.getElementById('showAllReviews').addEventListener('click', async () => {
    currentReviewFilter = 'all';
    await renderTestimonialList('all');
  });
  document.getElementById('showApprovedReviews').addEventListener('click', async () => {
    currentReviewFilter = 'approved';
    await renderTestimonialList('approved');
  });
  document.getElementById('showPendingReviews').addEventListener('click', async () => {
    currentReviewFilter = 'pending';
    await renderTestimonialList('pending');
  });
  document.getElementById('showRejectedReviews').addEventListener('click', async () => {
    currentReviewFilter = 'rejected';
    await renderTestimonialList('rejected');
  });

  document.getElementById('productList').addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'delete') {
      await deleteProductById(id);
      await renderProductList();
      showToast('✅ Deleted from Firebase.');
      return;
    }
    if (action === 'edit') {
      const products = await getProducts();
      const product = products.find(item => item.id === id);
      if (!product) return;
      document.getElementById('productTitle').value = product.title;
      document.getElementById('productDescription').value = product.description;
      document.getElementById('productAudience').value = product.audience || 'Men';
      document.getElementById('productCategory').value = product.category;
      document.getElementById('productBrand').value = product.brand || '';
      document.getElementById('productSize').value = product.size || '';
      document.getElementById('productColor').value = product.color || '';
      document.getElementById('productMaterial').value = product.material || '';
      document.getElementById('productPrice').value = product.price;
      document.getElementById('productMarketPrice').value = product.marketPrice;
      document.getElementById('productQty').value = product.qty;
      document.getElementById('productImage').value = product.image;
      document.getElementById('productImageUpload').value = '';
      document.getElementById('productForm').dataset.editing = id;
      showToast('Editing product. Update fields and save.');
    }
  });

  document.getElementById('couponList').addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    const code = button.dataset.coupon;
    if (!code) return;
    await deleteCouponByCode(code);
    await renderCoupons();
    showToast('✅ Deleted from Firebase.');
  });
}

async function initializeAdmin() {
  const user = await new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      unsubscribe();
      resolve(currentUser);
    });
  });
  if (!user || user.email !== ADMIN_AUTH_EMAIL) {
    window.location.replace('index.html#login');
    return;
  }
  setupEvents();
  try {
    await populateSettings();
    await renderProductList();
    await renderCoupons();
    await renderTestimonialList();
  } catch (error) {
    console.error('Admin data could not be loaded:', error);
    showToast('Firebase denied access. Configure Firestore rules, then reload this page.');
  }
}

initializeAdmin();
