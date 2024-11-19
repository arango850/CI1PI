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

// Seleccionamos el formulario de registro
const registerForm = document.getElementById("registerForm");

// Añadimos un event listener para el envío del formulario de registro
if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Previene el envío automático del formulario

        // Llamada a la función registerUser
        await registerUser();
    });
}

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

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el formulario de agregar producto está presente
    const formAgregarProducto = document.getElementById("form-agregar-producto");
    if (formAgregarProducto) {
        formAgregarProducto.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nombre = document.getElementById("nombre").value;
            const descripcion = document.getElementById("descripcion").value;
            const precio = document.getElementById("precio").value;
            const cantidad = document.getElementById("cantidad").value;

            const token = getToken();
            try {
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
            } catch (error) {
                console.error("Error en la solicitud:", error);
                alert("Error en la conexión al servidor");
            }
        });
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

    const authLink = document.getElementById("auth-link");
    const logoutLink = document.getElementById("logout-link");
    const adminLink = document.getElementById("admin-link");

    if (token) {
        if (authLink) authLink.style.display = "none";
        if (logoutLink) logoutLink.style.display = "block";
        
        // Verificar si el usuario es administrador
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.rol === "admin" && adminLink) {
            adminLink.style.display = "block";
        }
    } else {
        if (authLink) authLink.style.display = "block";
        if (logoutLink) logoutLink.style.display = "none";
    }
});


document.addEventListener('DOMContentLoaded', function() {
    // Manejo de registro en register.html
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", function(event) {
            event.preventDefault();
            registerUser();
        });
    }

    // Manejo de inicio de sesión en login.html
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();
            loginUser();
        });
    }
});

async function registerUser() {
    const nombre = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const contrasena = document.getElementById("password").value;
    const rol = "cliente"
    try {
        const response = await fetch('/registro', { // Cambiar si el puerto o dominio es diferente
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, contrasena })
        });

        const messageElement = document.getElementById('message');
        if (messageElement) {
            if (!response.ok) {
                const errorData = await response.json();
                messageElement.textContent = errorData.message || 'Error en el registro';
                return;
            }

            const data = await response.json();
            messageElement.textContent = 'Registro exitoso';
        }
    } catch (error) {
        console.error('Error:', error);
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.textContent = 'Error de red, intenta de nuevo más tarde';
        }
    }
}




// Función de inicio de sesión
async function loginUser() {
    const email = document.getElementById("email").value;
    const constrasena = document.getElementById("password").value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, constrasena })
        });

        const messageElement = document.getElementById('message');
        if (!response.ok) {
            const errorData = await response.json();
            messageElement.textContent = errorData.message || 'Error en el inicio de sesión';
            return;
        }

        const data = await response.json();
        messageElement.textContent = 'Inicio de sesión exitoso';
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'Error de red, intenta de nuevo más tarde';
    }
}

document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const contrasena = document.getElementById('password').value;
    const rol = document.getElementById('rol').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, contrasena, rol })
    });

    const result = await response.json();

    if (response.ok) {
        // Redirige según el rol
        if (rol === 'admin') {
            window.location.href = '/adminHome';
        } else {
            window.location.href = '/perfil';
        }
    } else {
        alert(result.message);
    }
});




