// ============ MENU DATA ============
const menuData = [
    { id: 1, name: "Classic Chicken Burger", price: 1200, category: "burger", emoji: "🍔", popular: true },
    { id: 2, name: "Zinger Burger", price: 1500, category: "burger", emoji: "🍔", popular: true },
    { id: 3, name: "Double Cheese Burger", price: 1800, category: "burger", emoji: "🧀", popular: false },
    { id: 4, name: "Margherita Pizza", price: 2200, category: "pizza", emoji: "🍕", popular: true },
    { id: 5, name: "Pepperoni Pizza", price: 2800, category: "pizza", emoji: "🍕", popular: true },
    { id: 6, name: "BBQ Chicken Pizza", price: 3000, category: "pizza", emoji: "🍕", popular: false },
    { id: 7, name: "Vegetable Fried Rice", price: 1600, category: "rice", emoji: "🍚", popular: true },
    { id: 8, name: "Chicken Fried Rice", price: 1800, category: "rice", emoji: "🍚", popular: true },
    { id: 9, name: "Egg Fried Rice", price: 1500, category: "rice", emoji: "🍚", popular: false },
    { id: 10, name: "Coca Cola", price: 200, category: "drink", emoji: "🥤", popular: true },
    { id: 11, name: "Sprite", price: 200, category: "drink", emoji: "🥤", popular: false },
    { id: 12, name: "Orange Juice", price: 350, category: "drink", emoji: "🧃", popular: true },
    { id: 13, name: "Chocolate Cake", price: 450, category: "dessert", emoji: "🍰", popular: true },
    { id: 14, name: "Ice Cream", price: 300, category: "dessert", emoji: "🍦", popular: false }
];

// ============ GLOBAL STATE ============
let currentUser = null;
let cart = [];
let currentCategory = "all";
let searchQuery = "";
let appliedPromo = null;
let currentOrder = null;
let ratingForOrder = null;
let trackingInterval = null;
let selectedRating = 0;

// Promo codes
const promos = {
    "WELCOME20": { discount: 20, type: "percent" },
    "SAVE50": { discount: 50, type: "fixed" },
    "FREEDEL": { discount: 150, type: "fixed", description: "Free Delivery" }
};

// ============ AUTHENTICATION ============
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelector('.auth-tab:first-child').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelector('.auth-tab:last-child').classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }
}

function login() {
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;
    
    // Demo login
    if (phone && password) {
        currentUser = {
            id: Date.now(),
            name: "Food Lover",
            phone: phone,
            email: "",
            orders: []
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        closeAuthModal();
        showMainApp();
        showToast("Login successful! 🎉");
        loadUserData();
    } else {
        showToast("Please enter phone and password");
    }
}

function signup() {
    const name = document.getElementById('signupName').value;
    const phone = document.getElementById('signupPhone').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (name && phone && password) {
        currentUser = {
            id: Date.now(),
            name: name,
            phone: phone,
            email: email,
            orders: []
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        closeAuthModal();
        showMainApp();
        showToast("Account created successfully! 🎉");
        loadUserData();
    } else {
        showToast("Please fill all required fields");
    }
}

function logout() {
    currentUser = null;
    cart = [];
    localStorage.removeItem('currentUser');
    localStorage.removeItem('foodieCart');
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('authModal').style.display = 'flex';
    showToast("Logged out successfully");
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function showMainApp() {
    document.getElementById('mainApp').style.display = 'block';
}

function loadUserData() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0);
        
        // Load saved cart
        const savedCart = localStorage.getItem('foodieCart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            updateCartUI();
        }
    }
}

// ============ CART FUNCTIONS ============
function addToCart(itemId, quantity = 1) {
    const item = menuData.find(i => i.id === itemId);
    if (!item) return;
    
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: quantity,
            emoji: item.emoji
        });
    }
    
    saveCart();
    updateCartUI();
    showToast(`✓ Added ${item.name} to cart`);
    animateCartIcon();
}

function updateCartQuantity(itemId, change) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        const newQuantity = cart[itemIndex].quantity + change;
        
        if (newQuantity <= 0) {
            cart.splice(itemIndex, 1);
        } else {
            cart[itemIndex].quantity = newQuantity;
        }
        
        saveCart();
        updateCartUI();
        renderCartModal();
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartUI();
    renderCartModal();
    showToast("Item removed from cart");
}

function saveCart() {
    localStorage.setItem('foodieCart', JSON.stringify(cart));
}

function getCartTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let deliveryFee = 150;
    let discount = 0;
    
    if (appliedPromo) {
        if (appliedPromo.type === "percent") {
            discount = (subtotal * appliedPromo.discount) / 100;
        } else if (appliedPromo.type === "fixed") {
            discount = appliedPromo.discount;
        }
    }
    
    if (subtotal > 1000) deliveryFee = 0;
    
    return { subtotal, deliveryFee, discount, total: subtotal + deliveryFee - discount };
}

function applyPromo() {
    const code = document.getElementById('promoCode').value.toUpperCase();
    
    if (promos[code]) {
        appliedPromo = promos[code];
        showToast(`Promo code applied! ${appliedPromo.description || `Save ${appliedPromo.discount}${appliedPromo.type === 'percent' ? '%' : ' Rs'}`}`);
        updateCartUI();
        renderCartModal();
    } else {
        showToast("Invalid promo code");
    }
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('floatingCartCount').textContent = count;
    
    const totals = getCartTotal();
    document.getElementById('subtotal').textContent = totals.subtotal;
    document.getElementById('deliveryFee').textContent = totals.deliveryFee;
    document.getElementById('cartTotal').textContent = totals.total;
    
    if (appliedPromo) {
        document.getElementById('discountRow').style.display = 'flex';
        document.getElementById('discount').textContent = totals.discount;
    }
}

function animateCartIcon() {
    const cartIcon = document.querySelector('.cart-floating');
    cartIcon.style.transform = 'scale(1.2)';
    setTimeout(() => {
        cartIcon.style.transform = 'scale(1)';
    }, 200);
}

// ============ RENDER FUNCTIONS ============
function renderMenu() {
    const menuContainer = document.getElementById('menu');
    let filtered = menuData;
    
    if (currentCategory !== "all") {
        filtered = filtered.filter(item => item.category === currentCategory);
    }
    
    if (searchQuery) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    document.getElementById('itemCount').textContent = `${filtered.length} items`;
    
    if (filtered.length === 0) {
        menuContainer.innerHTML = '<div class="empty-cart">😢 No items found</div>';
        return;
    }
    
    menuContainer.innerHTML = filtered.map(item => `
        <div class="menu-item" data-id="${item.id}">
            <div class="menu-item-image">${item.emoji}</div>
            <div class="menu-item-info">
                <span class="category-badge">${item.category.toUpperCase()}</span>
                <h4>${item.name}</h4>
                <div class="price">Rs. ${item.price}</div>
                <div class="item-controls">
                    <div class="quantity-selector">
                        <button class="qty-btn" onclick="event.stopPropagation(); updateItemQty(${item.id}, -1)">-</button>
                        <span id="qty-display-${item.id}">1</span>
                        <button class="qty-btn" onclick="event.stopPropagation(); updateItemQty(${item.id}, 1)">+</button>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart(${item.id}, getCurrentQty(${item.id}))">Add</button>
                </div>
            </div>
        </div>
    `).join('');
}

let itemQuantities = {};

function updateItemQty(itemId, change) {
    const current = itemQuantities[itemId] || 1;
    const newQty = Math.max(1, current + change);
    itemQuantities[itemId] = newQty;
    document.getElementById(`qty-display-${itemId}`).textContent = newQty;
}

function getCurrentQty(itemId) {
    return itemQuantities[itemId] || 1;
}

function renderCartModal() {
    const cartContainer = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">🛒 Your cart is empty</div>';
        return;
    }
    
    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.emoji} ${item.name}</div>
                <div class="cart-item-price">Rs. ${item.price} each</div>
            </div>
            <div class="cart-item-controls">
                <button class="cart-qty-btn" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="cart-qty-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                <button class="cart-qty-btn" onclick="removeFromCart(${item.id})" style="background:#ff4757; color:white;">🗑️</button>
            </div>
        </div>
    `).join('');
    
    updateCartUI();
}

// ============ CHECKOUT & ORDER ============
function proceedToCheckout() {
    if (cart.length === 0) {
        showToast("Cart is empty!");
        return;
    }
    closeCartModal();
    document.getElementById('checkoutModal').style.display = 'flex';
}

function placeOrder() {
    const address = document.getElementById('deliveryAddress').value;
    const instructions = document.getElementById('specialInstructions').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (!address) {
        showToast("Please enter delivery address");
        return;
    }
    
    const totals = getCartTotal();
    
    currentOrder = {
        id: "ORD" + Date.now(),
        items: [...cart],
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        discount: totals.discount,
        total: totals.total,
        address: address,
        instructions: instructions,
        paymentMethod: paymentMethod,
        status: "confirmed",
        timestamp: new Date().toISOString(),
        estimatedTime: 25
    };
    
    // Save to user orders
    if (currentUser) {
        if (!currentUser.orders) currentUser.orders = [];
        currentUser.orders.push(currentOrder);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    // Send WhatsApp order
    sendWhatsAppOrder(currentOrder);
    
    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();
    
    // Close checkout modal
    document.getElementById('checkoutModal').style.display = 'none';
    
    // Start tracking
    startOrderTracking(currentOrder);
    
    showToast("Order placed successfully! 🎉");
}

function sendWhatsAppOrder(order) {
    let itemsList = order.items.map(item => 
        `${item.emoji} ${item.name} x${item.quantity} = Rs.${item.price * item.quantity}`
    ).join('%0A');
    
    let msg = `🍔 *NEW FOOD ORDER* 🍕%0A%0A`;
    msg += `📋 *Order ID:* ${order.id}%0A`;
    msg += `👤 *Customer:* ${currentUser?.name || 'Guest'}%0A`;
    msg += `📞 *Phone:* ${currentUser?.phone || 'Not provided'}%0A`;
    msg += `━━━━━━━━━━━━━━━━%0A`;
    msg += `${itemsList}%0A`;
    msg += `━━━━━━━━━━━━━━━━%0A`;
    msg += `💰 *Total: Rs. ${order.total}*%0A`;
    msg += `💳 *Payment:* ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}%0A`;
    msg += `📍 *Address:* ${order.address}%0A`;
    msg += `📝 *Instructions:* ${order.instructions || 'None'}%0A%0A`;
    msg += `🚚 *Est. Delivery: ${order.estimatedTime} minutes*`;
    
    window.open(`https://wa.me/94756330068?text=${msg}`);
}

function startOrderTracking(order) {
    document.getElementById('trackingModal').style.display = 'flex';
    document.getElementById('orderId').textContent = order.id;
    
    let step = 1;
    let timeLeft = order.estimatedTime;
    
    const steps = ['step1', 'step2', 'step3', 'step4'];
    const statusMessages = [
        "✅ Order confirmed! Preparing your food...",
        "🍳 Your food is being prepared...",
        "🛵 Rider is on the way! Your food is coming...",
        "🏠 Order delivered! Enjoy your meal!"
    ];
    
    // Clear previous interval
    if (trackingInterval) clearInterval(trackingInterval);
    
    trackingInterval = setInterval(() => {
        if (step <= 4) {
            // Update step UI
            for (let i = 0; i < steps.length; i++) {
                const element = document.getElementById(steps[i]);
                if (i < step) {
                    element.classList.add('completed');
                    element.classList.remove('active');
                } else if (i === step) {
                    element.classList.add('active');
                    element.classList.remove('completed');
                } else {
                    element.classList.remove('active', 'completed');
                }
            }
            
            document.getElementById('trackingStatus').textContent = statusMessages[step - 1];
            
            if (step === 4) {
                // Order delivered, show rating
                clearInterval(trackingInterval);
                setTimeout(() => {
                    document.getElementById('trackingModal').style.display = 'none';
                    showRatingModal(order.id);
                }, 3000);
            }
            
            step++;
        }
    }, 5000); // Change status every 5 seconds for demo
}

function showRatingModal(orderId) {
    ratingForOrder = orderId;
    document.getElementById('ratingModal').style.display = 'flex';
}

function submitRating() {
    if (selectedRating === 0) {
        showToast("Please select a rating");
        return;
    }
    
    const review = document.getElementById('reviewText').value;
    
    // Save rating
    if (currentUser) {
        const orderIndex = currentUser.orders.findIndex(o => o.id === ratingForOrder);
        if (orderIndex !== -1) {
            currentUser.orders[orderIndex].rating = selectedRating;
            currentUser.orders[orderIndex].review = review;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }
    
    showToast(`Thank you for rating ${selectedRating} stars! ⭐`);
    document.getElementById('ratingModal').style.display = 'none';
    selectedRating = 0;
    document.getElementById('reviewText').value = '';
    document.querySelectorAll('.stars i').forEach(star => {
        star.classList.remove('active');
        star.classList.add('far');
    });
}

// ============ MODAL CONTROLS ============
function openCartModal() {
    renderCartModal();
    document.getElementById('cartModal').style.display = 'flex';
}

function closeCartModal() {
    document.getElementById('cartModal').style.display = 'none';
}

function closeTrackingModal() {
    if (trackingInterval) clearInterval(trackingInterval);
    document.getElementById('trackingModal').style.display = 'none';
}

// ============ NOTIFICATIONS ============
function toggleNotifications() {
    if ("Notification" in window) {
        Notification.requestPermission().then(perm => {
            if (perm === "granted") {
                new Notification("FoodieDash", {
                    body: "You'll receive order updates here!",
                    icon: "https://via.placeholder.com/64"
                });
                showToast("Notifications enabled!");
            }
        });
    }
}

// ============ SEARCH & FILTERS ============
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderMenu();
    });
    
    // Category clicks
    document.querySelectorAll('.category-item').forEach(cat => {
        cat.addEventListener('click', () => {
            document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
            cat.classList.add('active');
            currentCategory = cat.dataset.category;
            renderMenu();
        });
    });
    
    // Rating stars
    document.querySelectorAll('.stars i').forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            document.querySelectorAll('.stars i').forEach(s => {
                s.classList.remove('active');
                s.classList.add('far');
            });
            for (let i = 0; i < selectedRating; i++) {
                document.querySelectorAll('.stars i')[i].classList.add('active');
                document.querySelectorAll('.stars i')[i].classList.remove('far');
                document.querySelectorAll('.stars i')[i].classList.add('fas');
            }
        });
    });
}

// ============ TOAST NOTIFICATION ============
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ============ INITIALIZATION ============
function init() {
    // Check for existing user
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loadUserData();
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
    } else {
        document.getElementById('authModal').style.display = 'flex';
    }
    
    setupEventListeners();
    renderMenu();
    
    // Load saved cart
    const savedCart = localStorage.getItem('foodieCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(() => {
            console.log('SW registered');
        });
    }
}

// Start the app
init();