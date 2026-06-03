/* ==========================================================================
   VICENTE FOOD - APPLICATION LOGIC
   ========================================================================== */

// Base de Datos de Productos (Viandas Congeladas)
const PRODUCTS = [
    {
        id: 1,
        name: "Lasaña de Carne y Espinaca",
        price: 5400,
        category: "meat",
        image: "assets/vianda-lasana.png",
        description: "Láminas de pasta casera rellenas de carne bolognesa cocinada a fuego lento y espinaca fresca, cubiertas de salsa mixta y queso gratinado.",
        tags: ["Casero", "Alto en Proteínas", "Más Vendido"]
    },
    {
        id: 2,
        name: "Pastel de Papas Clásico",
        price: 4900,
        category: "potato",
        image: "assets/vianda-pastel-papas.png",
        description: "Carne vacuna seleccionada salteada con cebolla, morrón, aceitunas y huevo duro picado, cubierta de puré de papas gratinado con queso.",
        tags: ["Sin TACC", "Receta de la Abuela"]
    },
    {
        id: 3,
        name: "Wok de Vegetales y Fideos",
        price: 4500,
        category: "veggie",
        image: "assets/vianda-wok-vegetales.png",
        description: "Fideos de arroz salteados al wok con brócoli, zanahoria, zucchini, cebolla, morrones, cebolla de verdeo y dados de tofu dorado.",
        tags: ["Vegano", "Bajo en Sodio", "Liviano"]
    },
    {
        id: 4,
        name: "Pollo con Puré de Calabaza",
        price: 4800,
        category: "meat",
        image: "assets/vianda-pollo-calabaza.png",
        description: "Suprema de pollo a la plancha marinada con finas hierbas y limón, acompañada de un puré súper cremoso de calabaza asada.",
        tags: ["Fitness", "Bajo en Grasas", "Saludable"]
    },
    {
        id: 5,
        name: "Canelones de Verdura Mixtos",
        price: 4700,
        category: "veggie",
        image: "assets/vianda-canelones.png",
        description: "Panqueques caseros rellenos de espinaca, acelga y ricota condimentada, servidos con salsa de tomate y bechamel con queso fundido.",
        tags: ["Vegetariano", "Casero"]
    }
];

// Configuración de Envío de Pedidos
const CONFIG = {
    whatsappNumber: "5491123456789", // Reemplazar con el número del negocio (código de país + código de área + número)
    contactEmail: "pedidos@vicentefood.com"
};

// Estado Global de la Aplicación
let cart = [];
let currentFilter = "all";

// Inicializar la Aplicación
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    // Cargar Carrito desde LocalStorage
    const savedCart = localStorage.getItem("vicente_food_cart");
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            cart = [];
        }
    }

    // Configurar fecha mínima para el formulario de catering (hoy)
    setupMinCateringDate();

    // Renderizar Productos e Interfaz
    renderProducts();
    updateCartUI();

    // Registrar Event Listeners
    setupEventListeners();

    // Renderizar iconos de Lucide
    lucide.createIcons();
}

// Configurar Fecha Mínima en Formulario de Catering
function setupMinCateringDate() {
    const cateringDateInput = document.getElementById("cateringDate");
    if (cateringDateInput) {
        const today = new Date();
        // Sumar 1 día para darle margen mínimo de preparación
        today.setDate(today.getDate() + 1);
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Enero es 0
        let dd = today.getDate();

        if (mm < 10) mm = '0' + mm;
        if (dd < 10) dd = '0' + dd;

        cateringDateInput.setAttribute("min", `${yyyy}-${mm}-${dd}`);
    }
}

// Renderizar las Tarjetas de Viandas
function renderProducts() {
    const grid = document.getElementById("viandasGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const filteredProducts = PRODUCTS.filter(prod => {
        if (currentFilter === "all") return true;
        return prod.category === currentFilter;
    });

    if (filteredProducts.length === 0) {
        grid.innerHTML = `<p class="no-products">No hay viandas disponibles en esta categoría por el momento.</p>`;
        return;
    }

    filteredProducts.forEach(prod => {
        const tagsHTML = prod.tags.map(tag => {
            const isVeggie = tag.toLowerCase().includes("veggie") || tag.toLowerCase().includes("vegan");
            return `<span class="nutri-badge ${isVeggie ? 'veggie' : ''}">${tag}</span>`;
        }).join("");

        const cardHTML = `
            <div class="vianda-card" data-id="${prod.id}">
                <div class="vianda-img-container">
                    <img src="${prod.image}" alt="${prod.name}" loading="lazy">
                    <span class="vianda-tag ${prod.category === 'veggie' ? 'veggie' : ''}">
                        ${prod.category === 'veggie' ? 'Vegetariano' : 'Con Carne'}
                    </span>
                </div>
                <div class="vianda-content">
                    <h4>${prod.name}</h4>
                    <p class="vianda-description">${prod.description}</p>
                    <div class="vianda-nutritional">
                        ${tagsHTML}
                    </div>
                    <div class="vianda-footer">
                        <span class="vianda-price">$${prod.price.toLocaleString("es-AR")}</span>
                        <button class="btn-add-cart" onclick="addToCart(${prod.id})" aria-label="Agregar al carrito">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML("beforeend", cardHTML);
    });

    // Volver a renderizar los iconos dinámicos
    lucide.createIcons();
}

// Agregar Item al Carrito
window.addToCart = function (productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.product.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            product: product,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();

    // Animación visual de rebote en el badge
    const badge = document.getElementById("cartBadge");
    if (badge) {
        badge.classList.remove("bounce");
        void badge.offsetWidth; // Forzar reflow para reiniciar la animación
        badge.classList.add("bounce");
    }

    // Feedback visual: mostrar botón flotante (manejado en updateCartUI)
};

// Guardar Carrito en LocalStorage
function saveCart() {
    localStorage.setItem("vicente_food_cart", JSON.stringify(cart));
}

// Modificar cantidad desde el Carrito
window.updateQuantity = function (productId, delta) {
    const itemIndex = cart.findIndex(item => item.product.id === productId);
    if (itemIndex === -1) return;

    cart[itemIndex].quantity += delta;

    if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
    }

    saveCart();
    updateCartUI();
};

// Eliminar elemento del Carrito
window.removeFromCart = function (productId) {
    cart = cart.filter(item => item.product.id !== productId);
    saveCart();
    updateCartUI();
};

// Actualizar Interfaz Completa del Carrito
function updateCartUI() {
    const badge = document.getElementById("cartBadge");
    const container = document.getElementById("cartItemsContainer");
    const totalDisplay = document.getElementById("cartTotalPrice");
    const checkoutBtn = document.getElementById("btnCheckoutInit");

    // Contar total de ítems
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    if (badge) {
        badge.textContent = totalItems;
        if (totalItems === 0) {
            badge.style.display = "none";
        } else {
            badge.style.display = "flex";
        }
    }

    // Si el carrito está vacío
    if (cart.length === 0) {
        if (container) {
            container.innerHTML = `
                <div class="empty-cart-state">
                    <i data-lucide="shopping-cart" class="empty-cart-icon"></i>
                    <p>Tu carrito está vacío</p>
                    <small>Explora nuestras viandas y agrega las que más te gusten.</small>
                </div>
            `;
        }
        if (totalDisplay) totalDisplay.textContent = "$0";
        if (checkoutBtn) checkoutBtn.disabled = true;
        // Ocultar botón flotante si el carrito está vacío
        const floatingBtnEmpty = document.getElementById('btnFloatingConfirm');
        if (floatingBtnEmpty) floatingBtnEmpty.classList.add('hidden');
        lucide.createIcons();
        return;
    }

    // Renderizar ítems del carrito
    if (container) {
        container.innerHTML = "";
        cart.forEach(item => {
            const subtotal = item.product.price * item.quantity;
            const itemHTML = `
                <div class="cart-item">
                    <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.product.name}</div>
                        <div class="cart-item-price">$${item.product.price.toLocaleString("es-AR")}</div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="quantity-controller">
                            <button class="qty-btn" onclick="updateQuantity(${item.product.id}, -1)">
                                <i data-lucide="minus"></i>
                            </button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${item.product.id}, 1)">
                                <i data-lucide="plus"></i>
                            </button>
                        </div>
                        <button class="cart-item-remove-btn" onclick="removeFromCart(${item.product.id})" aria-label="Eliminar item">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML("beforeend", itemHTML);
        });
    }

    // Calcular Total
    const grandTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    if (totalDisplay) {
        totalDisplay.textContent = `$${grandTotal.toLocaleString("es-AR")}`;
    }
    if (checkoutBtn) {
        checkoutBtn.disabled = false;
    }

    // Mostrar botón flotante cuando el carrito tiene ítems
    const floatingBtn = document.getElementById('btnFloatingConfirm');
    if (floatingBtn) floatingBtn.classList.remove('hidden');

    lucide.createIcons();
}

// Controladores del Sidebar del Carrito
const cartOverlay = document.getElementById("cartOverlay");
const cartDrawer = document.getElementById("cartDrawer");

function openCartDrawer() {
    if (cartOverlay && cartDrawer) {
        cartOverlay.classList.add("active");
        cartDrawer.classList.add("active");
        document.body.style.overflow = "hidden"; // Desactivar scroll fondo
    }
    // Ocultar botón flotante mientras el drawer está abierto
    const floatingBtn = document.getElementById('btnFloatingConfirm');
    if (floatingBtn) floatingBtn.classList.add('hidden');
}

function closeCartDrawer() {
    if (cartOverlay && cartDrawer) {
        cartOverlay.classList.remove("active");
        cartDrawer.classList.remove("active");
        document.body.style.overflow = ""; // Reactivar scroll fondo
    }
    // Volver a mostrar botón flotante si el carrito tiene ítems
    const floatingBtn = document.getElementById('btnFloatingConfirm');
    if (floatingBtn && cart.length > 0) floatingBtn.classList.remove('hidden');
}

// Controladores de Modales (Checkout)
const checkoutModalOverlay = document.getElementById("checkoutModalOverlay");

function openCheckoutModal() {
    closeCartDrawer();
    if (checkoutModalOverlay) {
        checkoutModalOverlay.classList.add("active");
        renderCheckoutSummary();
    }
}

function closeCheckoutModal() {
    if (checkoutModalOverlay) {
        checkoutModalOverlay.classList.remove("active");
    }
}

// Renderizar Resumen en Checkout
function renderCheckoutSummary() {
    const container = document.getElementById("checkoutSummaryItems");
    const subtotalText = document.getElementById("summarySubtotal");
    const discountRow = document.getElementById("summaryDiscountRow");
    const discountText = document.getElementById("summaryDiscount");
    const totalText = document.getElementById("summaryTotal");

    if (!container) return;

    container.innerHTML = "";

    let subtotal = 0;

    cart.forEach(item => {
        const itemSubtotal = item.product.price * item.quantity;
        subtotal += itemSubtotal;

        const rowHTML = `
            <div class="summary-item-row">
                <span class="summary-item-name">
                    <span class="summary-item-qty">${item.quantity}x</span>${item.product.name}
                </span>
                <span class="summary-item-price">$${itemSubtotal.toLocaleString("es-AR")}</span>
            </div>
        `;
        container.insertAdjacentHTML("beforeend", rowHTML);
    });

    subtotalText.textContent = `$${subtotal.toLocaleString("es-AR")}`;

    // Validar método de pago activo para el descuento (Transferencia tiene 5% descuento)
    const activePayment = document.querySelector('input[name="paymentMethod"]:checked').value;

    if (activePayment === "transferencia") {
        const discount = Math.round(subtotal * 0.05);
        const total = subtotal - discount;

        discountRow.classList.add("active");
        discountText.textContent = `-$${discount.toLocaleString("es-AR")}`;
        totalText.textContent = `$${total.toLocaleString("es-AR")}`;
    } else {
        discountRow.classList.remove("active");
        totalText.textContent = `$${subtotal.toLocaleString("es-AR")}`;
    }
}

// Configurar los Event Listeners
function setupEventListeners() {
    // 1. Header scroll effect
    window.addEventListener("scroll", () => {
        const header = document.getElementById("header");
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        }
    });

    // 2. Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const navMenu = document.getElementById("navMenu");
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener("click", () => {
            navMenu.classList.toggle("active");
            const isOpened = navMenu.classList.contains("active");
            mobileMenuBtn.innerHTML = isOpened ? `<i data-lucide="x"></i>` : `<i data-lucide="menu"></i>`;
            lucide.createIcons();
        });
    }

    // Cerrar menú móvil al hacer click en un enlace
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", (e) => {
            // Manejar clase activa
            document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            // Cerrar menú si está abierto
            if (navMenu && navMenu.classList.contains("active")) {
                navMenu.classList.remove("active");
                if (mobileMenuBtn) {
                    mobileMenuBtn.innerHTML = `<i data-lucide="menu"></i>`;
                    lucide.createIcons();
                }
            }
        });
    });

    // 3. Cart Toggle
    const cartToggleBtn = document.getElementById("cartToggleBtn");
    const cartCloseBtn = document.getElementById("cartCloseBtn");

    if (cartToggleBtn) cartToggleBtn.addEventListener("click", openCartDrawer);
    if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCartDrawer);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCartDrawer);

    // Botón flotante de Confirmar Pedido
    const btnFloatingConfirm = document.getElementById("btnFloatingConfirm");
    if (btnFloatingConfirm) btnFloatingConfirm.addEventListener("click", openCartDrawer);

    // 4. Filters Viandas
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            renderProducts();
        });
    });

    // 5. Checkout Modal
    const btnCheckoutInit = document.getElementById("btnCheckoutInit");
    const checkoutCloseBtn = document.getElementById("checkoutCloseBtn");
    const checkoutModalOverlay = document.getElementById("checkoutModalOverlay");

    if (btnCheckoutInit) btnCheckoutInit.addEventListener("click", openCheckoutModal);
    if (checkoutCloseBtn) checkoutCloseBtn.addEventListener("click", closeCheckoutModal);
    if (checkoutModalOverlay) {
        checkoutModalOverlay.addEventListener("click", (e) => {
            if (e.target === checkoutModalOverlay) closeCheckoutModal();
        });
    }

    // 6. Payment Selection Toggle
    const paymentOptions = document.querySelectorAll(".payment-option");
    paymentOptions.forEach(option => {
        option.addEventListener("click", () => {
            paymentOptions.forEach(opt => opt.classList.remove("active"));
            option.classList.add("active");

            const radio = option.querySelector('input[type="radio"]');
            radio.checked = true;

            const val = radio.value;

            const bankInstructions = document.getElementById("bankTransferInstructions");
            const mpInstructions = document.getElementById("mercadoPagoInstructions");

            if (val === "transferencia") {
                bankInstructions.classList.remove("hidden");
                mpInstructions.classList.add("hidden");
            } else {
                bankInstructions.classList.add("hidden");
                mpInstructions.classList.remove("hidden");
            }

            // Recalcular totales con el descuento si aplica
            renderCheckoutSummary();
        });
    });

    // 7. Catering Form Buttons (WhatsApp y Email)
    const btnCateringWhatsApp = document.getElementById("btnCateringWhatsApp");
    const btnCateringEmail = document.getElementById("btnCateringEmail");

    if (btnCateringWhatsApp) {
        btnCateringWhatsApp.addEventListener("click", () => {
            processCateringSubmission("whatsapp");
        });
    }
    if (btnCateringEmail) {
        btnCateringEmail.addEventListener("click", () => {
            processCateringSubmission("email");
        });
    }

    // 8. Order Checkout Buttons (WhatsApp y Email)
    const btnConfirmWhatsApp = document.getElementById("btnConfirmWhatsApp");
    const btnConfirmEmail = document.getElementById("btnConfirmEmail");

    if (btnConfirmWhatsApp) {
        btnConfirmWhatsApp.addEventListener("click", () => {
            processCheckoutSubmission("whatsapp");
        });
    }
    if (btnConfirmEmail) {
        btnConfirmEmail.addEventListener("click", () => {
            processCheckoutSubmission("email");
        });
    }
}

/* ==========================================================================
   PROCESAMIENTO DE FORMULARIOS Y REDIRECCIONES
   ========================================================================== */

// 1. Procesar Formulario de Catering
function processCateringSubmission(method) {
    const form = document.getElementById("cateringForm");

    // Campos
    const name = document.getElementById("cateringName").value.trim();
    const phone = document.getElementById("cateringPhone").value.trim();
    const dateVal = document.getElementById("cateringDate").value;
    const guests = document.getElementById("cateringGuests").value;
    const details = document.getElementById("cateringDetails").value.trim();

    // Validación manual
    if (!name || !phone || !dateVal || !guests || !details) {
        alert("Por favor, completa todos los campos requeridos (*).");
        form.reportValidity(); // Disparar avisos nativos del navegador
        return;
    }

    if (parseInt(guests) < 10) {
        alert("El servicio de catering requiere un mínimo de 10 personas.");
        return;
    }

    // Formatear la fecha a dd/mm/aaaa
    const dateArray = dateVal.split("-");
    const formattedDate = `${dateArray[2]}/${dateArray[1]}/${dateArray[0]}`;

    // Formatear Mensajes
    if (method === "whatsapp") {
        const textMessage = `Hola!\n` +
            `Me gustaría consultar por el servicio de *Catering* para un evento.\n\n` +
            `*Detalles de la Solicitud:*\n` +
            `• *Nombre:* ${name}\n` +
            `• *Teléfono:* ${phone}\n` +
            `• *Fecha tentativa:* ${formattedDate}\n` +
            `• *Cantidad de comensales:* ${guests} personas\n` +
            `• *Detalles:* ${details}\n\n` +
            `Quedo atento a su respuesta para coordinar la propuesta. ¡Muchas gracias!`;

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${CONFIG.whatsappNumber}&text=${encodeURIComponent(textMessage)}`;
        window.open(whatsappUrl, "_blank");
    } else {
        const emailSubject = `Consulta de Catering - Vicente Food (${name})`;
        const emailBody = `Hola Vicente Food,\n\n` +
            `Me pongo en contacto para consultar por el servicio de catering para mi evento.\n\n` +
            `Detalles del Evento:\n` +
            `- Nombre: ${name}\n` +
            `- Teléfono: ${phone}\n` +
            `- Fecha tentativa: ${formattedDate}\n` +
            `- Cantidad de invitados: ${guests} personas\n\n` +
            `Mensaje / Preferencias del Menú:\n` +
            `${details}\n\n` +
            `Quedo a la espera de su respuesta.\n` +
            `Saludos cordiales,\n` +
            `${name}`;

        const mailtoUrl = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailtoUrl;
    }
}

// 2. Procesar Formulario de Checkout (Viandas)
function processCheckoutSubmission(method) {
    const form = document.getElementById("checkoutForm");

    // Campos personales
    const name = document.getElementById("checkoutName").value.trim();
    const lastName = document.getElementById("checkoutLastName").value.trim();
    const phone = document.getElementById("checkoutPhone").value.trim();
    const address = document.getElementById("checkoutAddress").value.trim();
    const paymentVal = document.querySelector('input[name="paymentMethod"]:checked').value;

    // Validación
    if (!name || !lastName || !phone || !address) {
        alert("Por favor, completa todos los datos de envío requeridos.");
        form.reportValidity();
        return;
    }

    if (cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    // Cálculos
    let subtotal = 0;
    let itemsText = "";

    cart.forEach(item => {
        const itemSubtotal = item.product.price * item.quantity;
        subtotal += itemSubtotal;
        itemsText += `• ${item.quantity}x ${item.product.name} ($${item.product.price.toLocaleString("es-AR")} c/u) - Subtotal: $${itemSubtotal.toLocaleString("es-AR")}\n`;
    });

    let total = subtotal;
    let paymentMethodDisplay = "";
    let paymentDetailsText = "";

    if (paymentVal === "transferencia") {
        const discount = Math.round(subtotal * 0.05);
        total = subtotal - discount;
        paymentMethodDisplay = "Transferencia Bancaria (Descuento del 5% Aplicado)";
        paymentDetailsText = `• Subtotal: $${subtotal.toLocaleString("es-AR")}\n` +
            `• Descuento Transferencia (-5%): -$${discount.toLocaleString("es-AR")}\n` +
            `• TOTAL A PAGAR: $${total.toLocaleString("es-AR")}`;
    } else {
        paymentMethodDisplay = "Mercado Pago";
        paymentDetailsText = `• TOTAL A PAGAR: $${total.toLocaleString("es-AR")}`;
    }

    const fullName = `${name} ${lastName}`;

    // Enviar por WhatsApp
    if (method === "whatsapp") {
        const textMessage = `Hola Vicente Food!\n` +
            `Quiero realizar un pedido de *Viandas Congeladas*.\n\n` +
            `*Detalles del Pedido:*\n` +
            `${itemsText}\n` +
            `*Resumen del Pago:*\n` +
            `• *Medio de Pago:* ${paymentMethodDisplay}\n` +
            `${paymentDetailsText}\n\n` +
            `*Datos de Envío:*\n` +
            `• *Cliente:* ${fullName}\n` +
            `• *Teléfono:* ${phone}\n` +
            `• *Dirección:* ${address}\n\n` +
            (paymentVal === "transferencia"
                ? `*Nota:* Ya realicé la transferencia, en breve envío el comprobante por este medio.`
                : `*Nota:* Aguardo el enlace o QR de Mercado Pago para realizar el pago.`);

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${CONFIG.whatsappNumber}&text=${encodeURIComponent(textMessage)}`;
        window.open(whatsappUrl, "_blank");
    }
    // Enviar por Email
    else {
        const emailSubject = `Nuevo Pedido de Viandas - Vicente Food (${fullName})`;
        let emailBody = `Hola Vicente Food,\n\n` +
            `Quiero realizar un pedido de Viandas Congeladas a través de la página web.\n\n` +
            `Detalles del Pedido:\n` +
            `-----------------------------------------\n` +
            `${itemsText.replace(/• /g, "- ")}` +
            `-----------------------------------------\n` +
            `Resumen de Pago:\n` +
            `- Medio de Pago: ${paymentMethodDisplay}\n` +
            `${paymentDetailsText.replace(/• /g, "- ")}\n\n` +
            `Datos de Envío:\n` +
            `- Cliente: ${fullName}\n` +
            `- Teléfono: ${phone}\n` +
            `- Dirección: ${address}\n\n` +
            `Quedo a la espera de coordinar la entrega.\n` +
            `Saludos,\n` +
            `${fullName}`;

        const mailtoUrl = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailtoUrl;
    }

    // Post-envío: Vaciar carrito y cerrar modales
    clearCart();
    closeCheckoutModal();
    alert("¡Pedido registrado! Te hemos redirigido para completar la comunicación.");
}

// Vaciar el Carrito y limpiar LocalStorage
function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
}
