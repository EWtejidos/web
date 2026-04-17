const checkoutState = {
  step: 0,
  customer: {
    full_name: "",
    email: "",
    phone: ""
  },
  delivery: "",
  items: window.EWCart.getCart(),
  total: window.EWCart.getTotal()
};

const steps = [
  {
    title: "Nombre completo",
    question: "¿Cuál es tu nombre completo?",
    label: "Nombre completo",
    type: "text",
    field: "full_name",
    placeholder: "Ej. Andrea Martínez"
  },
  {
    title: "Correo electrónico",
    question: "Ingresa un correo válido para recibir información del pedido.",
    label: "Correo electrónico",
    type: "email",
    field: "email",
    placeholder: "ejemplo@correo.com"
  },
  {
    title: "Teléfono de contacto",
    question: "¿Cuál es tu número de teléfono?",
    label: "Teléfono",
    type: "tel",
    field: "phone",
    placeholder: "+57 300 123 4567"
  },
  {
    title: "Dirección de entrega",
    question: "Indica la dirección completa donde deseas recibir el pedido.",
    label: "Dirección",
    type: "textarea",
    field: "delivery",
    placeholder: "Calle 123 #45-67, Barranquilla"
  },
  {
    title: "Revisión final",
    question: "Revisa tus datos y confirma el pago.",
    label: "Orden lista",
    type: "review",
    field: null,
    placeholder: ""
  }
];

const stepCounter = document.getElementById("stepCounter");
const stepTitle = document.getElementById("stepTitle");
const stepQuestion = document.getElementById("stepQuestion");
const stepLabel = document.getElementById("stepLabel");
const checkoutInput = document.getElementById("checkoutInput");
const checkoutTextarea = document.getElementById("checkoutTextarea");
const checkoutError = document.getElementById("checkoutError");
const backButton = document.getElementById("backButton");
const nextButton = document.getElementById("nextButton");
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
    nextButton.disabled = true;
    backButton.disabled = false;
    return;
  }

  nextButton.disabled = false;
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

function renderStep() {
  const step = steps[checkoutState.step];
  stepCounter.textContent = `Paso ${checkoutState.step + 1} de ${steps.length}`;
  stepTitle.textContent = step.title;
  stepQuestion.textContent = step.question;
  stepLabel.textContent = step.label;
  checkoutError.textContent = "";

  if (step.type === "textarea") {
    checkoutInput.hidden = true;
    checkoutTextarea.hidden = false;
    checkoutTextarea.readOnly = false;
    checkoutTextarea.value = checkoutState.delivery;
    checkoutTextarea.placeholder = step.placeholder;
  } else if (step.type === "review") {
    checkoutInput.hidden = true;
    checkoutTextarea.hidden = false;
    checkoutTextarea.readOnly = true;
    checkoutTextarea.value = `Nombre: ${checkoutState.customer.full_name}\nCorreo: ${checkoutState.customer.email}\nTeléfono: ${checkoutState.customer.phone}\nDirección: ${checkoutState.delivery}\n\nTotal: ${formatCurrency(checkoutState.total)}`;
    nextButton.textContent = "Pagar ahora";
  } else {
    checkoutInput.hidden = false;
    checkoutTextarea.hidden = true;
    checkoutInput.type = step.type;
    checkoutInput.value = checkoutState.customer[step.field] || "";
    checkoutInput.placeholder = step.placeholder;
    nextButton.textContent = "Siguiente";
  }

  backButton.style.visibility = checkoutState.step === 0 ? "hidden" : "visible";
}

function getCurrentFieldValue() {
  const step = steps[checkoutState.step];
  if (step.type === "textarea") {
    return checkoutTextarea.value.trim();
  }
  return checkoutInput.value.trim();
}

function validateStep() {
  const step = steps[checkoutState.step];
  const value = getCurrentFieldValue();

  if (step.type === "review") {
    return true;
  }

  if (!value) {
    checkoutError.textContent = "Este campo es obligatorio.";
    return false;
  }

  if (step.type === "email") {
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(value)) {
      checkoutError.textContent = "Ingresa un correo electrónico válido.";
      return false;
    }
  }

  if (step.type === "tel") {
    if (value.length < 7) {
      checkoutError.textContent = "Ingresa un teléfono válido.";
      return false;
    }
  }

  return true;
}

function saveStepValue() {
  const step = steps[checkoutState.step];
  const value = getCurrentFieldValue();

  if (step.field === "delivery") {
    checkoutState.delivery = value;
    return;
  }

  if (step.field) {
    checkoutState.customer[step.field] = value;
  }
}

async function submitCheckout() {
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
    nextButton.disabled = true;
    backButton.disabled = true;
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
    window.location.href = `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${encodeURIComponent(data.preference_id)}`;
  } catch (error) {
    checkoutError.textContent = `Error: ${error.message || error}`;
    checkoutStatus.hidden = true;
    nextButton.disabled = false;
    backButton.disabled = false;
  }
}

backButton.addEventListener("click", () => {
  if (checkoutState.step > 0) {
    checkoutState.step -= 1;
    renderStep();
  }
});

nextButton.addEventListener("click", async () => {
  if (!validateStep()) {
    return;
  }

  saveStepValue();

  if (checkoutState.step === steps.length - 1) {
    await submitCheckout();
    return;
  }

  checkoutState.step += 1;
  renderStep();
});

renderSummary();
renderStep();
