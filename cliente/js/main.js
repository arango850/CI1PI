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
        window.location.href = '/index';
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

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
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
                window.location.href = '/clienteHome';
            }
        } else {
            alert(result.message);
        }
    });
}


async function addProduct(event) {
    const nombre = document.getElementById("nombre").value;
    const descripcion = document.getElementById("descripcion").value;
    const precio = parseFloat(document.getElementById("precio").value);
    const cantidad = parseInt(document.getElementById("cantidad").value);

    try {
        const response = await fetch('/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion, precio, cantidad })
        });

        const messageElement = document.getElementById('message');
        if (!response.ok) {
            const errorData = await response.json();
            messageElement.textContent = errorData.message || 'Error al añadir el producto';
            return;
        }

        const data = await response.json();
        messageElement.textContent = 'Producto añadido exitosamente';
        document.getElementById('add-product-form').reset();
        loadProducts(); // Recargar lista de productos
       
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'Error de red, intenta de nuevo más tarde';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('add-product-form');
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await addProduct();
        });
    } else {
        console.error("El formulario no se encontró.");
    }
});



async function loadProducts() {
    const productTable = document.getElementById('productos-body');

    if (!productTable) {
        console.error('No se encontró el contenedor de productos');
        return;
    }

    try {
        const response = await fetch('/productos');
        const products = await response.json();

        productTable.innerHTML = '';
        products.forEach(product => {
            const row = `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.nombre}</td>
                    <td>${product.descripcion}</td>
                    <td>${product.precio}</td>
                    <td>${product.cantidad}</td>
                    <td>
                        <button onclick="editProduct(${product.id})">Editar</button>
                        <button onclick="deleteProduct(${product.id})">Eliminar</button>
                    </td>
                </tr>
            `;
            productTable.innerHTML += row;
        });
    } catch (error) {
        console.error('Error al cargar productos:', error);
        document.getElementById('message').textContent = 'Error al cargar productos';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();  // Llamar a la función para cargar productos
});


// Definir carrito globalmente
let carrito = [];

// Función para cargar el carrito desde localStorage
function loadCart() {
    const savedCart = localStorage.getItem('carrito');
    if (savedCart) {
        carrito = JSON.parse(savedCart);
        renderCart();  // Actualizar la vista del carrito
    }
}

// Función para renderizar el carrito en la vista
function renderCart() {
    const cartTable = document.getElementById('cart-body');  // Contenedor donde se muestran los productos del carrito
    if (!cartTable) {
        console.error('No se encontró el contenedor de productos');
        return;
    }

    cartTable.innerHTML = '';  // Limpiar el carrito antes de agregar productos
    carrito.forEach((product, index) => {
        const row = `
            <tr>
                <td>${product.nombre}</td>
                <td>${product.precio}</td>
                <td>${product.cantidad}</td>
                <td><button onclick="removeProductFromCart(${index})">Eliminar</button></td>
            </tr>
        `;
        cartTable.innerHTML += row;
    });
}

// Función para agregar un producto al carrito
function addProductToCart(product) {
    carrito.push(product);  // Agregar el producto al carrito
    saveCart();  // Guardar el carrito en localStorage
    renderCart();  // Actualizar la vista del carrito
}

// Función para eliminar un producto del carrito
function removeProductFromCart(index) {
    carrito.splice(index, 1);  // Eliminar el producto por su índice
    saveCart();  // Guardar el carrito actualizado en localStorage
    renderCart();  // Actualizar la vista del carrito
}

// Función para guardar el carrito en localStorage
function saveCart() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

// Función para vaciar el carrito
function clearCart() {
    carrito = [];  // Limpiar el carrito
    saveCart();  // Guardar el carrito vacío en localStorage
    renderCart();  // Actualizar la vista del carrito
}

// Función para manejar el evento de ir al carrito
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('view-cart-button').addEventListener('click', () => {
        window.location.href = '/carritoCliente';  // Redirigir a la página del carrito
    });
});




