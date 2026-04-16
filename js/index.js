const searchInput = document.getElementById("productSearch");
const searchButton = document.getElementById("searchButton");
const searchResults = document.getElementById("searchResults");
const publicProductGrid = document.getElementById("publicProductGrid");
const cartItemsContainer = document.getElementById("cartItems");
const cartTotalElement = document.getElementById("cartTotal");
const heroCartTotal = document.getElementById("heroCartTotal");
const cartEmptyState = document.getElementById("cartEmpty");
const clearCartButton = document.getElementById("clearCart");
const buyButton = document.getElementById("buyButton");
const viewCartButton = document.getElementById("viewCartButton");
const heroLogo = document.querySelector(".logo");
const heroTitle = document.querySelector("h1");
const heroDescription = document.querySelector(".hero-content > p");
const heroButtons = document.querySelectorAll(".cta a, .cta button");

let selectedSearchIndex = -1;
let productCards = [];

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getMatchingCards(term) {
  const normalizedTerm = normalizeText(term.trim());

  if (!normalizedTerm) {
    return productCards;
  }

  return productCards.filter((card) =>
    normalizeText(card.dataset.productName).includes(normalizedTerm)
  );
}

function normalizeImagePath(path) {
  if (!path) {
    return "images/products/top.jpg";
  }

  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

function focusCard(card) {
  productCards.forEach((item) => item.classList.remove("active", "is-focus"));
  card.classList.add("active", "is-focus");
  card.scrollIntoView({ behavior: "smooth", block: "center" });

  setTimeout(() => {
    card.classList.remove("is-focus");
  }, 2200);
}

function hideSearchResults() {
  searchResults.hidden = true;
  searchResults.innerHTML = "";
  selectedSearchIndex = -1;
}

function renderSearchResults(matches) {
  if (!searchInput.value.trim()) {
    hideSearchResults();
    return;
  }

  searchResults.hidden = false;
  searchResults.innerHTML = "";

  if (!matches.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "search-empty";
    emptyState.textContent = "No encontramos productos con ese nombre.";
    searchResults.appendChild(emptyState);
    return;
  }

  matches.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.textContent = card.dataset.productName;
    button.addEventListener("click", () => {
      searchInput.value = card.dataset.productName;
      focusCard(card);
      hideSearchResults();
    });

    if (index === selectedSearchIndex) {
      button.classList.add("is-selected");
    }

    searchResults.appendChild(button);
  });
}

function filterProducts() {
  const matches = getMatchingCards(searchInput.value);
  const visibleCards = new Set(matches);

  productCards.forEach((card) => {
    card.classList.toggle("is-hidden", !visibleCards.has(card));
  });

  renderSearchResults(matches);
}

function renderPublicProducts(products) {
  publicProductGrid.innerHTML = "";

  if (!products.length) {
    publicProductGrid.innerHTML = `
      <article class="card">
        <h3>Catalogo en actualizacion</h3>
        <p>Pronto veras aqui los tejidos activos publicados por nuestras tejedoras.</p>
      </article>
    `;
    productCards = [];
    return;
  }

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.productName = product.name;
    card.innerHTML = `
      <img src="${normalizeImagePath(product.image_path)}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${formatCurrency(product.price)}</p>
      <button
        class="add-to-cart"
        type="button"
        data-product-id="producto-${product.id}"
        data-product-name="${product.name}"
        data-product-price="${product.price}"
        data-product-image="${normalizeImagePath(product.image_path)}"
      >
        Anadir al carrito
      </button>
    `;
    publicProductGrid.appendChild(card);
  });

  productCards = Array.from(document.querySelectorAll(".card[data-product-name]"));

  publicProductGrid.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", () => {
      window.EWCart.addItem({
        id: button.dataset.productId,
        name: button.dataset.productName,
        price: Number(button.dataset.productPrice),
        image: button.dataset.productImage
      });
    });
  });

  productCards.forEach((card) => {
    card.addEventListener("click", () => {
      productCards.forEach((item) => item.classList.remove("active"));
      card.classList.add("active");
    });
  });
}

async function loadPublicProducts() {
  try {
    const response = await fetch("/api/public/productos", {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const products = await response.json();
    renderPublicProducts(products);
  } catch (error) {
    console.error("No fue posible cargar el catalogo publico", error);
    renderPublicProducts([]);
  }
}

function handleSearchAction() {
  const matches = getMatchingCards(searchInput.value);

  if (!matches.length) {
    return;
  }

  focusCard(matches[0]);
  hideSearchResults();
}

function renderCart() {
  const cart = window.EWCart.getCart();
  cartItemsContainer.innerHTML = "";
  cartEmptyState.hidden = cart.length > 0;

  cart.forEach((item) => {
    const row = document.createElement("article");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-copy">
        <span class="cart-item-title">${item.name}</span>
        <span class="cart-item-meta">Cantidad: ${item.quantity}</span>
      </div>
      <span class="cart-item-price">${formatCurrency(item.price * item.quantity)}</span>
      <button class="cart-item-remove" type="button" data-remove-id="${item.id}">Quitar</button>
    `;

    cartItemsContainer.appendChild(row);
  });

  cartItemsContainer.querySelectorAll("[data-remove-id]").forEach((button) => {
    button.addEventListener("click", () => {
      window.EWCart.removeItem(button.dataset.removeId);
    });
  });

  const total = window.EWCart.getTotal();
  cartTotalElement.textContent = formatCurrency(total);
  heroCartTotal.textContent = formatCurrency(total);
}

function animateHero() {
  heroLogo.style.opacity = "0";
  heroLogo.style.transform = "scale(0.6)";
  heroTitle.style.opacity = "0";
  heroTitle.style.transform = "translateY(60px)";
  searchInput.parentElement.style.opacity = "0";
  searchInput.parentElement.style.transform = "translateY(40px)";
  heroDescription.style.opacity = "0";
  heroDescription.style.transform = "translateY(25px)";

  setTimeout(() => {
    heroLogo.style.transition = "all 1.4s cubic-bezier(.17,.67,.83,.67)";
    heroLogo.style.opacity = "1";
    heroLogo.style.transform = "scale(1)";
  }, 200);

  setTimeout(() => {
    heroTitle.style.transition = "all 1.4s ease";
    heroTitle.style.opacity = "1";
    heroTitle.style.transform = "translateY(0)";
  }, 550);

  setTimeout(() => {
    searchInput.parentElement.style.transition = "all 1s ease";
    searchInput.parentElement.style.opacity = "1";
    searchInput.parentElement.style.transform = "translateY(0)";
  }, 800);

  setTimeout(() => {
    heroDescription.style.transition = "all 1s ease";
    heroDescription.style.opacity = "1";
    heroDescription.style.transform = "translateY(0)";
  }, 980);

  heroButtons.forEach((button, index) => {
    button.style.opacity = "0";
    button.style.transform = "translateY(30px)";

    setTimeout(() => {
      button.style.transition = "all 0.8s ease";
      button.style.opacity = "1";
      button.style.transform = "translateY(0)";
    }, 1120 + index * 180);
  });
}

searchInput.addEventListener("input", () => {
  selectedSearchIndex = -1;
  filterProducts();
});

searchInput.addEventListener("keydown", (event) => {
  const matches = getMatchingCards(searchInput.value);

  if (event.key === "ArrowDown" && matches.length) {
    event.preventDefault();
    selectedSearchIndex = Math.min(selectedSearchIndex + 1, matches.length - 1);
    renderSearchResults(matches);
  }

  if (event.key === "ArrowUp" && matches.length) {
    event.preventDefault();
    selectedSearchIndex = Math.max(selectedSearchIndex - 1, 0);
    renderSearchResults(matches);
  }

  if (event.key === "Enter") {
    event.preventDefault();

    if (selectedSearchIndex >= 0 && matches[selectedSearchIndex]) {
      searchInput.value = matches[selectedSearchIndex].dataset.productName;
      focusCard(matches[selectedSearchIndex]);
      hideSearchResults();
      return;
    }

    handleSearchAction();
  }

  if (event.key === "Escape") {
    hideSearchResults();
  }
});

searchButton.addEventListener("click", handleSearchAction);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-block")) {
    hideSearchResults();
  }
});

clearCartButton.addEventListener("click", () => {
  window.EWCart.clearCart();
});

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

buyButton.addEventListener("click", async () => {
  const cart = window.EWCart.getCart();
  if (!cart.length) {
    alert("Agrega productos antes de comprar.");
    return;
  }

  const fullName = prompt("Nombre completo del cliente:", "");
  if (!fullName) {
    alert("El nombre es obligatorio para continuar con la compra.");
    return;
  }

  const delivery = prompt("Direccion de entrega (obligatoria):", "");
  if (!delivery) {
    alert("La direccion de entrega es obligatoria.");
    return;
  }

  const email = prompt("Correo electronico del cliente (opcional):", "");
  const phone = prompt("Telefono de contacto (opcional):", "");

  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        customer: {
          full_name: fullName,
          email,
          phone
        },
        delivery,
        total: window.EWCart.getTotal(),
        items: cart
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "No se pudo iniciar el pago.");
    }

    await openMercadoPagoCheckout(data);
    window.EWCart.clearCart();
  } catch (error) {
    console.error(error);
    alert(`Error iniciando el pago: ${error.message || error}`);
  }
});

viewCartButton.addEventListener("click", () => {
  document.getElementById("carrito").scrollIntoView({ behavior: "smooth", block: "start" });
});

window.addEventListener("ew:cart-updated", renderCart);
window.EWCart.syncCounters();
renderCart();
animateHero();
loadPublicProducts();
