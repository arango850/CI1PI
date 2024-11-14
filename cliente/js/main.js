const API_URL = 'http://localhost:3000'; // URL del backend

// Autenticación: Cargar y verificar el token
function getToken() {
    return localStorage.getItem('token');
}

function saveToken(token) {
    localStorage.setItem('token', token);
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = "/login";
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, contrasena: password })
    });

    if (response.ok) {
        const data = await response.json();
        saveToken(data.token);
        window.location.href = "/index";
    } else {
        alert('Error al iniciar sesión');
    }
});

async function loadProducts() {
    const response = await fetch(`${API_URL}/productos`);
    const products = await response.json();

    const productList = document.querySelector(".product-list");
    productList.innerHTML = ''; // Limpiar productos previos

    products.forEach(product => {
        const productItem = document.createElement("div");
        productItem.classList.add("product-item");
        productItem.innerHTML = `
            <h3>${product.nombre}</h3>
            <p>${product.descripcion}</p>
            <p>Precio: $${product.precio}</p>
            <button onclick="addToCart(${product.id})">Agregar al carrito</button>
        `;
        productList.appendChild(productItem);
    });
}

document.getElementById("form-agregar-producto").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const descripcion = document.getElementById("descripcion").value;
    const precio = document.getElementById("precio").value;
    const cantidad = document.getElementById("cantidad").value;

    const token = getToken();
    const response = await fetch(`${API_URL}/productos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre, descripcion, precio, cantidad })
    });

    if (response.ok) {
        alert("Producto agregado exitosamente");
        loadProducts();
    } else {
        alert("Error al agregar el producto");
    }
});

const cart = [];

function addToCart(productId) {
    const product = cart.find(item => item.id === productId);
    if (product) {
        product.cantidad += 1;
    } else {
        cart.push({ id: productId, cantidad: 1 });
    }
    updateCartDisplay();
}

async function checkout() {
    const token = getToken();
    const total = calculateTotal();
    const response = await fetch(`${API_URL}/compras`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productos: cart, total })
    });

    if (response.ok) {
        alert("Compra realizada exitosamente");
        cart.length = 0; // Limpiar el carrito
        updateCartDisplay();
    } else {
        alert("Error al finalizar la compra");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const token = getToken();
    if (token) {
        document.getElementById("auth-link").style.display = "none";
        document.getElementById("logout-link").style.display = "block";
        // Verificar si el usuario es administrador
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.rol === "admin") {
            document.getElementById("admin-link").style.display = "block";
        }
    } else {
        document.getElementById("auth-link").style.display = "block";
        document.getElementById("logout-link").style.display = "none";
    }
});

