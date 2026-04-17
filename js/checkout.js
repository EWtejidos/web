const checkoutState = {
  customer: {
    full_name: "",
    email: "",
    phone: ""
  },
  delivery: "",
  items: window.EWCart.getCart(),
  total: window.EWCart.getTotal()
};

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const deliveryTextarea = document.getElementById("delivery");
const checkoutError = document.getElementById("checkoutError");
const payButton = document.getElementById("payButton");
const summaryItems = document.getElementById("summaryItems");
const summaryTotal = document.getElementById("summaryTotal");
const checkoutStatus = document.getElementById("checkoutStatus");
const checkoutStatusMessage = document.getElementById("checkoutStatusMessage");

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP"
  }).format(value);
}

function renderSummary() {
  const cart = checkoutState.items;

  if (!cart.length) {
    summaryItems.innerHTML = '<p class="summary-empty">El carrito está vacío. Regresa a la tienda para agregar productos.</p>';
    payButton.disabled = true;
    return;
  }

  payButton.disabled = false;
  summaryItems.innerHTML = cart
    .map((item) => `
      <div class="summary-item">
        <strong>${item.name} × ${item.quantity}</strong>
        <span>Valor unitario: ${formatCurrency(item.price)}</span>
        <span>Subtotal: ${formatCurrency(item.price * item.quantity)}</span>
      </div>
    `)
    .join("");
  summaryTotal.textContent = formatCurrency(checkoutState.total);
}

function updateState() {
  checkoutState.customer.full_name = fullNameInput.value.trim();
  checkoutState.customer.email = emailInput.value.trim();
  checkoutState.customer.phone = phoneInput.value.trim();
  checkoutState.delivery = deliveryTextarea.value.trim();
}

function validateForm() {
  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const delivery = deliveryTextarea.value.trim();

  if (!fullName) {
    checkoutError.textContent = "El nombre completo es obligatorio.";
    fullNameInput.focus();
    return false;
  }

  if (!email) {
    checkoutError.textContent = "El correo electrónico es obligatorio.";
    emailInput.focus();
    return false;
  }

  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) {
    checkoutError.textContent = "Ingresa un correo electrónico válido.";
    emailInput.focus();
    return false;
  }

  if (!phone) {
    checkoutError.textContent = "El teléfono es obligatorio.";
    phoneInput.focus();
    return false;
  }

  if (phone.length < 7) {
    checkoutError.textContent = "Ingresa un teléfono válido.";
    phoneInput.focus();
    return false;
  }

  if (!delivery) {
    checkoutError.textContent = "La dirección de entrega es obligatoria.";
    deliveryTextarea.focus();
    return false;
  }

  checkoutError.textContent = "";
  return true;
}

async function loadMercadoPagoSdk() {
  if (window.MercadoPago) {
    return;
  }

  const script = document.createElement("script");
  script.src = "https://sdk.mercadopago.com/js/v2";
  script.async = true;

  return new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function openMercadoPagoCheckout(details) {
  await loadMercadoPagoSdk();

  if (!window.MercadoPago) {
    throw new Error("No se pudo cargar el SDK de Mercado Pago.");
  }

  const mp = new MercadoPago(details.public_key, {
    locale: "es-CO"
  });

  mp.checkout({
    preference: {
      id: details.preference_id
    }
  });
}

async function submitCheckout() {
  updateState();

  if (!validateForm()) {
    return;
  }

  if (!checkoutState.items.length) {
    checkoutError.textContent = "El carrito está vacío. No es posible continuar.";
    return;
  }

  const payload = {
    customer: checkoutState.customer,
    delivery: checkoutState.delivery,
    total: checkoutState.total,
    items: checkoutState.items
  };

  try {
    payButton.disabled = true;
    checkoutStatus.hidden = false;
    checkoutStatusMessage.textContent = "Creando el pago seguro...";

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "No se pudo iniciar el pago.");
    }

    checkoutStatusMessage.textContent = "Redireccionando al checkout de Mercado Pago...";
    window.EWCart.clearCart();
    if (data.init_point) {
      window.location.href = data.init_point;
    } else if (data.public_key) {
      await openMercadoPagoCheckout(data);
    } else {
      window.location.href = `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${encodeURIComponent(data.preference_id)}`;
    }
  } catch (error) {
    checkoutError.textContent = `Error: ${error.message || error}`;
    checkoutStatus.hidden = true;
    payButton.disabled = false;
  }
}

payButton.addEventListener("click", submitCheckout);

renderSummary();
