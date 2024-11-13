document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
});

function cargarProductos() {
    fetch('http://localhost:3000/productos')  
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar productos");
            }
            return response.json();
        })
        .then(productos => {
            const productContainer = document.querySelector(".product-list");
            productContainer.innerHTML = "";  

            productos.forEach(producto => {
                const productElement = document.createElement("div");
                productElement.classList.add("product-item");

                productElement.innerHTML = `
                    <img src="${producto.imagen || '../images/default.jpg'}" alt="${producto.nombre}" class="product-image">
                    <h3 class="product-name">${producto.nombre}</h3>
                    <p class="product-price">$${producto.precio}</p>
                    <button onclick="agregarAlCarrito(${producto.id})" class="add-to-cart-button">Agregar al carrito</button>
                `;

                productContainer.appendChild(productElement);
            });
        })
        .catch(error => {
            console.error("Hubo un problema al cargar los productos:", error);
        });
}

document.addEventListener("DOMContentLoaded", () => {
    cargarCarrito();
    calcularTotal();

    const finalizarCompraBtn = document.getElementById("finalizar-compra");
    finalizarCompraBtn.addEventListener("click", finalizarCompra);
});


function cargarCarrito() {
    const carritoContainer = document.getElementById("carrito-container");
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    carritoContainer.innerHTML = ""; // Limpiar contenedor

    carrito.forEach((producto, index) => {
        const productoElem = document.createElement("div");
        productoElem.classList.add("producto-en-carrito");

        productoElem.innerHTML = `
            <h3>${producto.nombre}</h3>
            <p>Precio: $${producto.precio}</p>
            <p>Cantidad: ${producto.cantidad}</p>
            <button onclick="eliminarDelCarrito(${index})">Eliminar</button>
        `;

        carritoContainer.appendChild(productoElem);
    });
}

function eliminarDelCarrito(index) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito.splice(index, 1);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    cargarCarrito();
    calcularTotal();
}

function calcularTotal() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const total = carrito.reduce((sum, producto) => sum + (producto.precio * producto.cantidad), 0);
    document.getElementById("total-amount").textContent = total.toFixed(2);
}

function finalizarCompra() {
    localStorage.removeItem("carrito");
    cargarCarrito();
    calcularTotal();
    alert("Compra finalizada. ¡Gracias por su compra!");
}

document.addEventListener("DOMContentLoaded", () => {
    cargarHistorialCompras();

    const cerrarSesionBtn = document.getElementById("cerrar-sesion");
    cerrarSesionBtn.addEventListener("click", cerrarSesion);
});

function cargarHistorialCompras() {
    const historialContainer = document.getElementById("historial-compras");

    // Supongamos que tenemos un endpoint en el backend que devuelve el historial de compras
    fetch('/compras', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}` // Usar el token JWT
        }
    })
    .then(response => response.json())
    .then(compras => {
        historialContainer.innerHTML = ""; // Limpiar contenedor

        if (compras.length === 0) {
            historialContainer.innerHTML = "<li>No hay compras registradas.</li>";
            return;
        }

        compras.forEach(compra => {
            const compraElem = document.createElement("li");
            compraElem.innerHTML = `
                <p><strong>ID de Compra:</strong> ${compra.id}</p>
                <p><strong>Total:</strong> $${compra.total}</p>
                <p><strong>Fecha:</strong> ${new Date(compra.fecha).toLocaleDateString()}</p>
                <h4>Productos:</h4>
                <ul>
                    ${compra.productos.map(prod => `
                        <li>${prod.nombre} - Cantidad: ${prod.cantidad} - Precio: $${prod.precio}</li>
                    `).join('')}
                </ul>
            `;
            historialContainer.appendChild(compraElem);
        });
    })
    .catch(error => console.error("Error al cargar el historial de compras:", error));
}

function cerrarSesion() {
    localStorage.removeItem("token"); // Eliminar el token JWT
    alert("Sesión cerrada.");
    window.location.href = "index.html"; // Redirigir al inicio
}

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();

    const formAgregarProducto = document.getElementById("form-agregar-producto");
    formAgregarProducto.addEventListener("submit", agregarProducto);
});

function cargarProductos() {
    const productosLista = document.getElementById("productos-lista");

    fetch('/productos', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
        }
    })
    .then(response => response.json())
    .then(productos => {
        productosLista.innerHTML = ""; // Limpiar lista actual

        productos.forEach(producto => {
            const productoElem = document.createElement("li");
            productoElem.innerHTML = `
                <span><strong>${producto.nombre}</strong> - $${producto.precio} (Cantidad: ${producto.cantidad})</span>
                <div>
                    <button class="editar" onclick="editarProducto(${producto.id})">Editar</button>
                    <button onclick="eliminarProducto(${producto.id})">Eliminar</button>
                </div>
            `;
            productosLista.appendChild(productoElem);
        });
    })
    .catch(error => console.error("Error al cargar productos:", error));
}

function agregarProducto(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const descripcion = document.getElementById("descripcion").value;
    const precio = document.getElementById("precio").value;
    const cantidad = document.getElementById("cantidad").value;

    fetch('/productos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ nombre, descripcion, precio, cantidad })
    })
    .then(response => {
        if (response.ok) {
            alert("Producto agregado exitosamente.");
            cargarProductos(); // Recargar la lista de productos
        } else {
            alert("Error al agregar producto.");
        }
    })
    .catch(error => console.error("Error al agregar producto:", error));
}

function editarProducto(id) {
    // Implementar lógica para editar producto, podría incluir un modal o formulario de edición
    alert(`Funcionalidad para editar el producto con ID ${id} en construcción.`);
}

function eliminarProducto(id) {
    fetch(`/productos/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
        }
    })
    .then(response => {
        if (response.ok) {
            alert("Producto eliminado exitosamente.");
            cargarProductos(); // Recargar la lista de productos
        } else {
            alert("Error al eliminar producto.");
        }
    })
    .catch(error => console.error("Error al eliminar producto:", error));
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("jwt", data.token); // Guardar el JWT en localStorage
            alert("Inicio de sesión exitoso");
            // Redireccionar a la página principal o perfil
            window.location.href = "index.html";
        } else {
            alert("Error en el inicio de sesión. Verifica tus credenciales.");
        }
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
    }
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    try {
        const response = await fetch("http://localhost:3000/registro", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, password }),
        });

        if (response.ok) {
            alert("Registro exitoso. Ahora puedes iniciar sesión.");
            // Limpiar campos del formulario
            document.getElementById("register-form").reset();
        } else {
            alert("Error en el registro. Intenta con otro correo.");
        }
    } catch (error) {
        console.error("Error al registrar usuario:", error);
    }
});

async function fetchProducts() {
    try {
        const response = await fetch("http://localhost:3000/productos", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const products = await response.json();
            const productList = document.getElementById("product-list");

            // Limpiar cualquier contenido previo
            productList.innerHTML = "";

            // Mostrar cada producto
            products.forEach(product => {
                const productDiv = document.createElement("div");
                productDiv.classList.add("product-item");

                productDiv.innerHTML = `
                    <img src="${product.imagen}" alt="${product.nombre}">
                    <h3>${product.nombre}</h3>
                    <p>Precio: $${product.precio}</p>
                    <button onclick="addToCart(${product.id})">Agregar al carrito</button>
                `;
                productList.appendChild(productDiv);
            });
        } else {
            console.error("Error al obtener los productos.");
        }
    } catch (error) {
        console.error("Error en la solicitud de productos:", error);
    }
}

// Llamada a la función para cargar productos al cargar la página
document.addEventListener("DOMContentLoaded", fetchProducts);

function checkAdminRole() {
    const token = localStorage.getItem("jwt");
    if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.rol === "admin") {
            document.getElementById("add-product-section").style.display = "block";
        }
    }
}

// Llamar a checkAdminRole al cargar la página
document.addEventListener("DOMContentLoaded", checkAdminRole);

// Función para enviar un nuevo producto al backend
document.getElementById("add-product-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("product-name").value;
    const price = document.getElementById("product-price").value;
    const description = document.getElementById("product-description").value;
    const token = localStorage.getItem("jwt");

    try {
        const response = await fetch("http://localhost:3000/productos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ nombre: name, precio: price, descripcion: description }),
        });

        if (response.ok) {
            alert("Producto agregado exitosamente.");
            fetchProducts(); // Actualizar la lista de productos
            document.getElementById("add-product-form").reset();
        } else {
            alert("Error al agregar el producto.");
        }
    } catch (error) {
        console.error("Error al agregar el producto:", error);
    }
});

// Obtener el carrito de localStorage o inicializarlo como un array vacío
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

// Guardar el carrito en localStorage
function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Agregar un producto al carrito
function addToCart(productId, productName, productPrice) {
    const cart = getCart();
    const existingProduct = cart.find(item => item.id === productId);

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({ id: productId, name: productName, price: productPrice, quantity: 1 });
    }

    saveCart(cart);
    updateCartDisplay();
}

// Eliminar un producto del carrito
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    updateCartDisplay();
}

// Calcular el total del carrito
function calculateTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

// Actualizar la visualización del carrito
function updateCartDisplay() {
    const cart = getCart();
    const cartContainer = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");

    cartContainer.innerHTML = "";
    cart.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("cart-item");

        itemDiv.innerHTML = `
            <span>${item.name}</span>
            <span>Cantidad: ${item.quantity}</span>
            <span>Precio: $${item.price}</span>
            <button onclick="removeFromCart(${item.id})">Eliminar</button>
        `;
        cartContainer.appendChild(itemDiv);
    });

    cartTotal.textContent = `Total: $${calculateTotal().toFixed(2)}`;
}

// Llamar a updateCartDisplay al cargar la página para mostrar el carrito actual
document.addEventListener("DOMContentLoaded", updateCartDisplay);

async function checkout() {
    const cart = getCart();
    const token = localStorage.getItem("jwt");

    if (cart.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/compras", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ items: cart })
        });

        if (response.ok) {
            alert("Compra realizada exitosamente.");
            localStorage.removeItem("cart"); // Limpiar el carrito
            updateCartDisplay(); // Actualizar la visualización del carrito
            window.location.href = "perfil.html"; // Redirigir a la página de perfil o confirmación
        } else {
            alert("Error al procesar la compra.");
        }
    } catch (error) {
        console.error("Error en la solicitud de compra:", error);
    }
}

async function checkout() {
    const cart = getCart();
    const token = localStorage.getItem("jwt");

    if (cart.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/compras", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ items: cart }) // Enviar carrito como JSON al backend
        });

        if (response.ok) {
            alert("Compra realizada exitosamente.");
            localStorage.removeItem("cart"); // Limpiar el carrito en el frontend
            updateCartDisplay(); // Refrescar la visualización del carrito
            window.location.href = "perfil.html"; // Redirigir a la página de perfil
        } else {
            alert("Error al procesar la compra.");
        }
    } catch (error) {
        console.error("Error en la solicitud de compra:", error);
    }
}

async function fetchPurchaseHistory() {
    const token = localStorage.getItem("jwt");
    
    try {
        const response = await fetch("http://localhost:3000/compras", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const purchases = await response.json();
            displayPurchaseHistory(purchases); // Función para mostrar el historial en perfil.html
        } else {
            console.error("Error al obtener el historial de compras");
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
    }
}

// Función para mostrar el historial de compras en perfil.html
function displayPurchaseHistory(purchases) {
    const historyContainer = document.getElementById("purchase-history");
    historyContainer.innerHTML = "";

    purchases.forEach(purchase => {
        const purchaseDiv = document.createElement("div");
        purchaseDiv.classList.add("purchase-item");

        purchaseDiv.innerHTML = `
            <h4>Compra ID: ${purchase.id}</h4>
            <p>Total: $${purchase.total.toFixed(2)}</p>
            <p>Fecha: ${new Date(purchase.date).toLocaleDateString()}</p>
        `;

        historyContainer.appendChild(purchaseDiv);
    });
}

async function downloadInvoice(compraId) {
    const token = localStorage.getItem("jwt");

    try {
        const response = await fetch(`http://localhost:3000/compras/${compraId}/factura`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            // Crear un enlace para descargar el archivo PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `factura_${compraId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } else {
            alert("Error al descargar la factura.");
        }
    } catch (error) {
        console.error("Error al descargar la factura:", error);
    }
}