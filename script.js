const API_URL = ''; 
let libroActual = null;
let todosLosLibros = [];
//Mostrar y coultar secciones
function mostrarSeccion(seccionId) {
    document.querySelectorAll('main section').forEach(sec => {
        sec.classList.remove('seccion-activa');
        sec.classList.add('seccion-oculta');
    });
    
    const sec = document.getElementById(seccionId);
    if (sec) {
        sec.classList.remove('seccion-oculta'); 
        sec.classList.add('seccion-activa');
    }
    
    if (seccionId === 'catalogo') cargarLibros();
    if (seccionId === 'ventas') cargarVentas();
    if (seccionId === 'editar') {
        document.getElementById('form-editar-libro').classList.add('form-oculto'); 
        document.getElementById('id-editar').value = ''; 
    }
}

async function cargarLibros() {
    try {
        const lista = document.getElementById('lista-libros');
        lista.innerHTML = '<p>Cargando libros...</p>';
        
        const respuesta = await fetch(`${API_URL}/libros`);
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
        
        const libros = await respuesta.json();
        todosLosLibros = libros;
        mostrarLibros(libros);
        
    } catch (error) {
        document.getElementById('lista-libros').innerHTML = 
            `<p class="error">Error al cargar libros: ${error.message}</p>`;
    }
}
function mostrarLibros(libros) {
    const lista = document.getElementById('lista-libros');
    
    if (libros.length === 0) {
        lista.innerHTML = '<p>No hay libros en el catálogo.</p>';
        return;
    }
    
    lista.innerHTML = libros.map(libro => `
        <div class="libro-card">
            <p class="libro-id">ID: ${libro.id}</p>
            <h3>${libro.titulo}</h3>
            <p><strong>Autor:</strong> ${libro.autor}</p>
            <p>${libro.descripcion || 'Sin descripción'}</p>
            <p class="libro-precio">$${libro.precio}</p>
            <p class="libro-stock">Stock: ${libro.stock}</p>
            <div class="libro-botones">
                <button onclick="abrirModalCompra(${libro.id})">Comprar</button>
                <button onclick="editarLibroDesdeCatalogo(${libro.id})">Editar</button>
            </div>
        </div>
    `).join('');
}

function filtrarLibros() {
    const busqueda = document.getElementById('buscarLibro').value.toLowerCase();
    if (!busqueda) return mostrarLibros(todosLosLibros);
    
    const filtrados = todosLosLibros.filter(libro => 
        libro.titulo.toLowerCase().includes(busqueda) || 
        libro.autor.toLowerCase().includes(busqueda)
    );
    mostrarLibros(filtrados);
}

function configurarFormularioAgregar() {
    document.getElementById('form-agregar-libro').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nuevoLibro = {
            titulo: document.getElementById('titulo').value,
            autor: document.getElementById('autor').value,
            precio: parseFloat(document.getElementById('precio').value),
            stock: parseInt(document.getElementById('stock').value),
            descripcion: document.getElementById('descripcion').value
        };
        
        try {
            const respuesta = await fetch(`${API_URL}/libros`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(nuevoLibro)
            });
            
            if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
            
            alert(`Libro "${nuevoLibro.titulo}" agregado.`);
            e.target.reset();
            mostrarSeccion('catalogo');
            
        } catch (error) {
            alert(`Error al agregar libro: ${error.message}`);
        }
    });
}

async function buscarLibroParaEditar() {
    const id = document.getElementById('id-editar').value;
    const form = document.getElementById('form-editar-libro');
    form.classList.add('form-oculto'); 

    if (!id || isNaN(id) || parseInt(id) <= 0) {
        alert('Ingresa un ID de libro válido.');
        return;
    }
    
    try {
        const respuesta = await fetch(`${API_URL}/libros/${id}`);
        
        if (!respuesta.ok) {
            alert('Libro no encontrado con ese ID.');
            return;
        }
        
        const libro = await respuesta.json();
        mostrarFormularioEdicion(libro);
        
    } catch (error) {
        alert(`Error en la búsqueda de la API: ${error.message}`);
    }
}

function mostrarFormularioEdicion(libro) {
    libroActual = libro;
    
    document.getElementById('editar-id').value = libro.id;
    document.getElementById('editar-titulo').value = libro.titulo;
    document.getElementById('editar-autor').value = libro.autor;
    document.getElementById('editar-precio').value = libro.precio;
    document.getElementById('editar-stock').value = libro.stock;
    document.getElementById('editar-descripcion').value = libro.descripcion || ''; 
    
    document.getElementById('form-editar-libro').classList.remove('form-oculto');
}

function editarLibroDesdeCatalogo(id) {
    mostrarSeccion('editar');
    document.getElementById('id-editar').value = id;
    buscarLibroParaEditar();
}

function configurarFormularioEdicion() {
    document.getElementById('form-editar-libro').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editar-id').value;
        const libroActualizado = {
            titulo: document.getElementById('editar-titulo').value,
            autor: document.getElementById('editar-autor').value,
            precio: parseFloat(document.getElementById('editar-precio').value),
            stock: parseInt(document.getElementById('editar-stock').value),
            descripcion: document.getElementById('editar-descripcion').value
        };
        
        try {
            const respuesta = await fetch(`${API_URL}/libros/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(libroActualizado)
            });
            
            if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
            
            alert(`Libro actualizado.`);
            document.getElementById('form-editar-libro').classList.add('form-oculto');
            mostrarSeccion('catalogo');
            
        } catch (error) {
            alert(`Error al actualizar: ${error.message}`);
        }
    });
}

async function eliminarLibro() {
    if (!libroActual) return;
    if (!confirm(`¿Estás seguro de eliminar "${libroActual.titulo}"?`)) return;
    
    try {
        const respuesta = await fetch(`${API_URL}/libros/${libroActual.id}`, {
            method: 'DELETE'
        });
        
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
        
        alert(`Libro eliminado.`);
        document.getElementById('form-editar-libro').classList.add('form-oculto');
        mostrarSeccion('catalogo');
        
    } catch (error) {
        alert(`Error al eliminar: ${error.message}`);
    }
}

async function abrirModalCompra(id) {
    try {
        const respuesta = await fetch(`${API_URL}/libros/${id}`);
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
        
        const libro = await respuesta.json();
        libroActual = libro;
        
        document.getElementById('modal-titulo').textContent = libro.titulo;
        document.getElementById('modal-precio').textContent = `$${libro.precio}`;
        document.getElementById('modal-stock').textContent = libro.stock;
        document.getElementById('cantidad-comprar').value = 1;
        document.getElementById('cantidad-comprar').max = libro.stock;
        document.getElementById('modal-comprar').style.display = 'block';
        
    } catch (error) {
        alert(`Error al abrir compra: ${error.message}`);
    }
}

function cerrarModal() {
    document.getElementById('modal-comprar').style.display = 'none';
    libroActual = null;
}

async function confirmarCompra() {
    if (!libroActual) return;
    
    const cantidad = parseInt(document.getElementById('cantidad-comprar').value);
    
    if (cantidad < 1 || cantidad > libroActual.stock) {
        alert(`Cantidad inválida. Stock disponible: ${libroActual.stock}`);
        return;
    }
    
    try {
        const respuesta = await fetch(`${API_URL}/comprar`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                libro_id: libroActual.id,
                cantidad: cantidad
            })
        });
        
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
        
        const resultado = await respuesta.json();
        alert(`Compra exitosa! Total: $${resultado.total}`);
        
        cerrarModal();
        cargarLibros();
        
    } catch (error) {
        alert(`Error en la compra: ${error.message}`);
    }
}

async function cargarVentas() {
    try {
        const lista = document.getElementById('lista-ventas');
        lista.innerHTML = '<p>Cargando ventas...</p>';
        
        const respuesta = await fetch(`${API_URL}/ventas`);
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
        
        const ventas = await respuesta.json();
        mostrarVentas(ventas);
        
    } catch (error) {
        document.getElementById('lista-ventas').innerHTML = 
            `<p class="error">Error al cargar ventas: ${error.message}</p>`;
    }
}

function mostrarVentas(ventas) {
    const tabla = document.getElementById('lista-ventas'); 
    if (!tabla) return; 
    const tbody = tabla.querySelector('tbody');
    
    if (ventas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No hay registros de ventas.</td></tr>';
        return;
    }
    tbody.innerHTML = ventas.map(venta => `
        <tr>
            <td>#${venta.id}</td>
            <td>${venta.titulo || 'N/A'}</td>
            <td>${venta.autor || 'N/A'}</td>
            <td>${venta.cantidad}</td>
            <td>$${(parseFloat(venta.total) || 0).toFixed(2)}</td>
            <td>${new Date(venta.fecha_venta).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

function inicializarApp() {
    configurarFormularioAgregar();
    configurarFormularioEdicion();
    
    window.onclick = (e) => {
        if (e.target.id === 'modal-comprar') cerrarModal();
    };
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
    cargarLibros(); 
}
document.addEventListener('DOMContentLoaded', inicializarApp);