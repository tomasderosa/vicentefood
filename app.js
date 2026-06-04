// Configuración de Envío de Pedidos
const CONFIG = {
    whatsappNumber: "5491150250623", // Reemplazar con el número del negocio
    contactEmail: "pedidos@vicentefood.com",
    transferDiscount: 0, // Descuento por transferencia
    workerURL: "https://vicentefood-api.tomas-aderosa.workers.dev"
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

    // Actualizar clase activa del menú
    updateActiveNavLink();

    // Actualizar textos de descuento en interfaz
    updateTransferDiscountUI();

    // Renderizar iconos de Lucide
    lucide.createIcons();
}

// Actualizar clase activa del menú de navegación basado en la URL/hash actual
function updateActiveNavLink() {
    const hash = window.location.hash;
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll(".nav-link");

    if (navLinks.length === 0) return;

    // Quitar active a todos
    navLinks.forEach(link => link.classList.remove("active"));

    let matched = false;

    // 1. Si hay hash en la URL, buscar coincidencia exacta
    if (hash) {
        navLinks.forEach(link => {
            const href = link.getAttribute("href");
            if (href === hash || href.endsWith(hash)) {
                link.classList.add("active");
                matched = true;
            }
        });
    }

    // 2. Si no hubo coincidencia por hash, buscar por nombre de archivo en path
    if (!matched) {
        navLinks.forEach(link => {
            const href = link.getAttribute("href");
            // Evitar coincidir con anclas vacías o hashes locales
            if (href && href !== "#" && !href.startsWith("#")) {
                if (path.includes(href)) {
                    link.classList.add("active");
                    matched = true;
                }
            }
        });
    }

    // 3. Fallbacks si nada coincide
    if (!matched) {
        if (path.includes("viandas.html")) {
            const viandasLink = Array.from(navLinks).find(link => link.getAttribute("href").includes("viandas.html"));
            if (viandasLink) viandasLink.classList.add("active");
        } else {
            // En index.html o raíz, por defecto Inicio
            const inicioLink = Array.from(navLinks).find(link => link.getAttribute("href") === "#inicio" || link.getAttribute("href").endsWith("#inicio"));
            if (inicioLink) inicioLink.classList.add("active");
        }
    }
}

// Actualizar textos de descuento por transferencia en la interfaz según CONFIG
function updateTransferDiscountUI() {
    const paymentSelector = document.querySelector('.payment-selector');
    if (!paymentSelector) return;

    const transferInput = paymentSelector.querySelector('input[value="transferencia"]');
    if (transferInput) {
        const optionLabel = transferInput.closest('.payment-option');
        if (optionLabel) {
            const optionContentSpan = optionLabel.querySelector('.payment-option-content div span');
            if (optionContentSpan) {
                const discountRate = CONFIG.transferDiscount;
                if (discountRate !== null && discountRate > 0) {
                    optionContentSpan.textContent = `Obtén un ${Math.round(discountRate * 100)}% de descuento`;
                    optionContentSpan.style.display = "";
                } else {
                    optionContentSpan.style.display = "none";
                }
            }
        }
    }
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
        const tagsHTML = (prod.tags || []).map(tag => {
            const isVeggie = tag.toLowerCase().includes("veggie") || tag.toLowerCase().includes("vegan") || tag.toLowerCase().includes("vegetariano");
            return `<span class="nutri-badge ${isVeggie ? 'veggie' : ''}">${tag}</span>`;
        }).join("");

        const cartItem = cart.find(item => item.product.id === prod.id);
        const actionButtonHTML = cartItem && cartItem.quantity > 0 
            ? `
                <div class="quantity-controller">
                    <button class="qty-btn" onclick="updateQuantity(${prod.id}, -1)" aria-label="Disminuir cantidad">
                        <i data-lucide="minus"></i>
                    </button>
                    <span class="qty-val">${cartItem.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${prod.id}, 1)" aria-label="Aumentar cantidad">
                        <i data-lucide="plus"></i>
                    </button>
                </div>
            `
            : `
                <button class="btn-add-cart" onclick="addToCart(${prod.id})" aria-label="Agregar al carrito">
                    <i data-lucide="plus"></i>
                </button>
            `;

        const cardHTML = `
            <div class="vianda-card" data-id="${prod.id}">
                <div class="vianda-img-container">
                    <img src="${prod.image}" alt="${prod.name}" loading="lazy">
                    <span class="vianda-tag ${prod.tipo === 'vegetariano' ? 'veggie' : ''}">
                        ${prod.tipo === 'vegetariano' ? 'Vegetariano' : 'Con Carne'}
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
                        ${actionButtonHTML}
                    </div>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML("beforeend", cardHTML);
    });

    // Volver a renderizar los iconos dinámicos
    lucide.createIcons();
}

// Sincronizar las cantidades de las tarjetas de productos sin reconstruir el grid
function syncProductCardQuantities() {
    const grid = document.getElementById("viandasGrid");
    if (!grid) return;

    PRODUCTS.forEach(prod => {
        const card = grid.querySelector(`.vianda-card[data-id="${prod.id}"]`);
        if (!card) return;

        const footer = card.querySelector(".vianda-footer");
        if (!footer) return;

        const cartItem = cart.find(item => item.product.id === prod.id);
        const hasQuantity = cartItem && cartItem.quantity > 0;
        const isCurrentlyController = footer.querySelector(".quantity-controller") !== null;

        if (hasQuantity) {
            if (isCurrentlyController) {
                // Si ya es un controlador, solo actualizamos el valor de texto
                const qtyValSpan = footer.querySelector(".qty-val");
                if (qtyValSpan && qtyValSpan.textContent !== String(cartItem.quantity)) {
                    qtyValSpan.textContent = cartItem.quantity;
                }
            } else {
                // Reemplazamos el botón "+" por el controlador de cantidad
                const oldBtn = footer.querySelector(".btn-add-cart");
                if (oldBtn) oldBtn.remove();

                const controllerHTML = `
                    <div class="quantity-controller">
                        <button class="qty-btn" onclick="updateQuantity(${prod.id}, -1)" aria-label="Disminuir cantidad">
                            <i data-lucide="minus"></i>
                        </button>
                        <span class="qty-val">${cartItem.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${prod.id}, 1)" aria-label="Aumentar cantidad">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                `;
                footer.insertAdjacentHTML("beforeend", controllerHTML);
                lucide.createIcons();
            }
        } else {
            // Si no está en el carrito
            if (isCurrentlyController) {
                // Reemplazamos el controlador por el botón "+"
                const oldController = footer.querySelector(".quantity-controller");
                if (oldController) oldController.remove();

                const btnHTML = `
                    <button class="btn-add-cart" onclick="addToCart(${prod.id})" aria-label="Agregar al carrito">
                        <i data-lucide="plus"></i>
                    </button>
                `;
                footer.insertAdjacentHTML("beforeend", btnHTML);
                lucide.createIcons();
            }
        }
    });
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
        syncProductCardQuantities();
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
    if (floatingBtn) {
        floatingBtn.classList.remove('hidden');
        adjustFloatingButtonPosition();
    }

    syncProductCardQuantities();
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
    if (floatingBtn && cart.length > 0) {
        floatingBtn.classList.remove('hidden');
        adjustFloatingButtonPosition();
    }
}

// Controladores de Modales (Checkout)
const checkoutModalOverlay = document.getElementById("checkoutModalOverlay");

function openCheckoutModal() {
    closeCartDrawer();
    const floatingBtn = document.getElementById('btnFloatingConfirm');
    if (floatingBtn) floatingBtn.classList.add('hidden');

    if (checkoutModalOverlay) {
        checkoutModalOverlay.classList.add("active");
        renderCheckoutSummary();
    }
}

function closeCheckoutModal() {
    const floatingBtn = document.getElementById('btnFloatingConfirm');
    if (floatingBtn && cart.length > 0) {
        floatingBtn.classList.remove('hidden');
        adjustFloatingButtonPosition();
    }

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

    // Validar método de pago activo para el descuento (Transferencia)
    const activePayment = document.querySelector('input[name="paymentMethod"]:checked').value;
    const discountRate = CONFIG.transferDiscount;

    if (activePayment === "transferencia" && discountRate !== null && discountRate > 0) {
        const discount = Math.round(subtotal * discountRate);
        const total = subtotal - discount;

        discountRow.classList.add("active");
        const discountLabel = discountRow.querySelector("span:first-child");
        if (discountLabel) {
            discountLabel.textContent = `Descuento Transferencia (${Math.round(discountRate * 100)}%)`;
        }
        discountText.textContent = `-$${discount.toLocaleString("es-AR")}`;
        totalText.textContent = `$${total.toLocaleString("es-AR")}`;
    } else {
        discountRow.classList.remove("active");
        totalText.textContent = `$${subtotal.toLocaleString("es-AR")}`;
    }
}

// Ajustar posición del botón flotante para evitar que se superponga con el footer
function adjustFloatingButtonPosition() {
    const btn = document.getElementById("btnFloatingConfirm");
    if (!btn || btn.classList.contains("hidden")) return;

    const footer = document.querySelector(".main-footer");
    if (!footer) return;

    const footerRect = footer.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const offset = window.innerWidth <= 600 ? 20 : 28;

    if (footerRect.top < viewportHeight) {
        // El footer está en el viewport
        const newBottom = viewportHeight - footerRect.top + offset;
        btn.style.bottom = `${newBottom}px`;
    } else {
        btn.style.bottom = `${offset}px`;
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
        adjustFloatingButtonPosition();
    });

    window.addEventListener("resize", adjustFloatingButtonPosition);

    // Evento de cambio de hash
    window.addEventListener("hashchange", updateActiveNavLink);

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

    if (parseInt(guests) < 25) {
        alert("El servicio de catering requiere un mínimo de 25 personas.");
        return;
    }

    // Formatear la fecha a dd/mm/aaaa y validar año
    const dateArray = dateVal.split("-");
    const year = dateArray[0];
    if (year.length > 4 || parseInt(year) > 2040) {
        alert("Por favor, ingresa un año válido de 4 dígitos (máximo 2040).");
        return;
    }
    const formattedDate = `${dateArray[2]}/${dateArray[1]}/${dateArray[0]}`;

    // Formatear Mensajes
    if (method === "whatsapp") {
        const textMessage = `Hola!\n` +
            `Me gustaría consultar por el servicio de *Catering* para un evento.\n\n` +
            `*Detalles del Evento:*\n` +
            `• *Fecha tentativa:* ${formattedDate}\n` +
            `• *Cantidad de invitados:* ${guests} personas\n\n` +
            `*Detalles:* ${details}\n\n` +
            `*Datos de Contacto:*\n` +
            `• *Nombre:* ${name}\n` +
            `• *Teléfono:* ${phone}\n\n` +
            `Quedo atento a su respuesta para coordinar la propuesta. ¡Muchas gracias!`;

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${CONFIG.whatsappNumber}&text=${encodeURIComponent(textMessage)}`;
        window.open(whatsappUrl, "_blank");
    } else {
        const emailSubject = `Consulta de Catering - Vicente Food (${name})`;
        const emailBody = `Hola Vicente Food,\n\n` +
            `Me pongo en contacto para consultar por el servicio de catering para mi evento.\n\n` +
            `Detalles del Evento:\n` +
            `- Fecha tentativa: ${formattedDate}\n` +
            `- Cantidad de invitados: ${guests} personas\n\n` +
            `Detalles:\n` +
            `${details}\n\n` +
            `Datos de Contacto:\n` +
            `- Nombre: ${name}\n` +
            `- Teléfono: ${phone}\n\n` +
            `Quedo a la espera de su respuesta.\n` +
            `Saludos cordiales,\n` +
            `${name}`;

        const mailtoUrl = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailtoUrl;
    }
}

// 2. Procesar Formulario de Checkout (Viandas)
async function processCheckoutSubmission(method) {
    const form = document.getElementById("checkoutForm");

    // Campos personales
    const name = document.getElementById("checkoutName").value.trim();
    const lastName = document.getElementById("checkoutLastName").value.trim();
    const phone = document.getElementById("checkoutPhone").value.trim();
    const email = document.getElementById("checkoutEmail").value.trim();
    const address = document.getElementById("checkoutAddress").value.trim();
    const paymentVal = document.querySelector('input[name="paymentMethod"]:checked').value;

    // Validación
    if (!name || !lastName || !phone || !email || !address) {
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
        itemsText += `• ${item.quantity}x ${item.product.name} ($${item.product.price.toLocaleString("es-AR")} c/u)\n`;
    });

    let total = subtotal;
    let paymentMethodDisplay = "";
    let paymentDetailsText = "";

    const discountRate = CONFIG.transferDiscount;
    if (paymentVal === "transferencia" && discountRate !== null && discountRate > 0) {
        const discount = Math.round(subtotal * discountRate);
        total = subtotal - discount;
        const discountPercentText = `${Math.round(discountRate * 100)}%`;
        paymentMethodDisplay = `Transferencia Bancaria (Descuento del ${discountPercentText} Aplicado)`;
        paymentDetailsText = `• Subtotal: $${subtotal.toLocaleString("es-AR")}\n` +
            `• Descuento Transferencia (-${discountPercentText}): -$${discount.toLocaleString("es-AR")}\n` +
            `• Envío: Gratis\n` +
            `• TOTAL: $${total.toLocaleString("es-AR")}`;
    } else {
        paymentMethodDisplay = paymentVal === "transferencia" ? "Transferencia Bancaria" : "Mercado Pago";
        paymentDetailsText = `• Subtotal: $${subtotal.toLocaleString("es-AR")}\n` +
            `• Envío: Gratis\n` +
            `• TOTAL: $${total.toLocaleString("es-AR")}`;
    }

    const fullName = `${name} ${lastName}`;

    const orderData = {
        customer: {
            firstName: name,
            lastName: lastName,
            fullName: fullName,
            phone: phone,
            email: email,
            address: address
        },

        payment: {
            method: paymentVal === "transferencia" ? "Transferencia" : "Mercado Pago",
            methodDisplay: paymentMethodDisplay
        },

        pricing: {
            subtotal: subtotal,
            total: total
        },

        items: cart.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.price,
            subtotal: item.product.price * item.quantity
        })),

        createdAt: new Date().toISOString()
    };

    const savePromise = fetch(CONFIG.workerURL, 
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(orderData)
        }
    );

    // Enviar por WhatsApp
    if (method === "whatsapp") {
        const textMessage = `Hola Vicente Food!\n` +
            `Quiero realizar un pedido de *Viandas Congeladas*:\n\n` +
            `*Detalles del Pedido:*\n` +
            `${itemsText}\n` +
            `*Resumen del Pago:*\n` +
            `• Medio de Pago: ${paymentMethodDisplay}\n` +
            `${paymentDetailsText}\n\n` +
            `*Datos de Envío:*\n` +
            `• *Cliente:* ${fullName}\n` +
            `• *Teléfono:* ${phone}\n` +
            `• *Email:* ${email}\n` +
            `• *Dirección:* ${address}\n\n` +
            `A continuación adjunto el comprobante de la transferencia.`;

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${CONFIG.whatsappNumber}&text=${encodeURIComponent(textMessage)}`;
        window.open(whatsappUrl, "_blank");
    }
    // Enviar por Email (sacar)
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
            `- Email: ${email}\n` +
            `- Dirección: ${address}\n\n` +
            `Quedo a la espera de coordinar la entrega.\n` +
            `Saludos,\n` +
            `${fullName}`;

        const mailtoUrl = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailtoUrl;
    }

    try {
        const response = await savePromise;
        const result = await response.json();
        console.log(result);
        alert("Pedido enviado correctamente.");
    } catch (error) {
        console.error(error);
        //alert("Error enviando pedido.");
    }

    // Post-envío: Vaciar carrito y cerrar modales
    clearCart();
    closeCheckoutModal();
    //alert("¡Pedido registrado! Te hemos redirigido para completar la comunicación.");
}

// Vaciar el Carrito y limpiar LocalStorage
function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
}
