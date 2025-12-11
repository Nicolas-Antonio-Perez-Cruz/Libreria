    // CORRECCIÓN FINAL: La API está en el mismo host de Railway, por lo que usamos rutas relativas.
    const API_URL = ''; 
    let libroActual = null;
    let todosLosLibros = [];

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
        
        // **Ajuste para la sección Editar**
        if (seccionId === 'editar') {
            // Ocultar el formulario de edición (solo se muestra al buscar un ID)
            document.getElementById('form-editar-libro').classList.add('form-oculto'); 
            // Limpiar el campo de búsqueda de ID
            document.getElementById('id-editar').value = ''; 
        }
    }
    async function cargarLibros() {
        try {
            const lista = document.getElementById('lista-libros');
            lista.innerHTML = '<p>Cargando...</p>';
            
            // fetch('/libros')
            const respuesta = await fetch(`${API_URL}/libros`);
            if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
            
            const libros = await respuesta.json();
            todosLosLibros = libros;
            mostrarLibros(libros);
            
        } catch (error) {
            document.getElementById('lista-libros').innerHTML = 
                `<p class="error">Error: ${error.message}</p>`;
        }
    }

    function mostrarLibros(libros) {
        const lista = document.getElementById('lista-libros');
        
        if (libros.length === 0) {
            lista.innerHTML = '<p>No hay libros</p>';
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
                
                alert(`Libro "${nuevoLibro.titulo}" agregado ✓`);
                e.target.reset();
                mostrarSeccion('catalogo');
                cargarLibros();
                
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    }

    // La función debe ser global (no dentro de otro scope)
    async function buscarLibroParaEditar() {
        // CRÍTICO: Agregamos este console.log para verificar si el botón está llamando a la función.
        console.log('--- Función buscarLibroParaEditar llamada ---'); 
        
        // 1. Obtener y validar el ID
        const id = document.getElementById('id-editar').value;
        
        if (!id || isNaN(id) || parseInt(id) <= 0) {
            alert('Ingresa un ID de libro válido.');
            document.getElementById('form-editar-libro').classList.add('form-oculto');
            return;
        }
        
        try {
            // 2. Llamada a la API (API_URL debe ser vacía: '')
            const respuesta = await fetch(`${API_URL}/libros/${id}`);
            
            if (!respuesta.ok) {
                if (respuesta.status === 404) {
                alert('Error: Libro no encontrado con ese ID.');
            } else {
                // Modifica esta línea para manejar respuestas no-JSON:
                let errorMensaje = `Error ${respuesta.status}`;
                try {
                    const errorData = await respuesta.json();
                    errorMensaje += `: ${errorData.error}`;
                } catch (e) {
                    errorMensaje += `: Error al procesar respuesta del servidor (No es JSON).`;
                }
                throw new Error(errorMensaje);
            }
            }
            
            // 3. Si es exitoso, mostrar el formulario
            const libro = await respuesta.json();
            mostrarFormularioEdicion(libro);
            
        } catch (error) {
            alert(`Error en la búsqueda de la API: ${error.message}`);
            document.getElementById('form-editar-libro').classList.add('form-oculto');
        }
    }

    function mostrarFormularioEdicion(libro) {
    // 1. Guarda el objeto del libro para usarlo en Guardar o Eliminar
    libroActual = libro;
    
    // 2. Carga los valores del libro en los campos del formulario
    document.getElementById('editar-id').value = libro.id;
    document.getElementById('editar-titulo').value = libro.titulo;
    document.getElementById('editar-autor').value = libro.autor;
    document.getElementById('editar-precio').value = libro.precio;
    document.getElementById('editar-stock').value = libro.stock;
    // Manejo de la descripción si es NULL o vacía
    document.getElementById('editar-descripcion').value = libro.descripcion || ''; 
    
    // 3. CRÍTICO: Remueve la clase que oculta el formulario
    // Si esta línea falla, el formulario permanece invisible.
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
            
            const libroActualizado = {
                titulo: document.getElementById('editar-titulo').value,
                autor: document.getElementById('editar-autor').value,
                precio: parseFloat(document.getElementById('editar-precio').value),
                stock: parseInt(document.getElementById('editar-stock').value),
                descripcion: document.getElementById('editar-descripcion').value
            };
            
            const id = document.getElementById('editar-id').value;
            
            try {
                const respuesta = await fetch(`${API_URL}/libros/${id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(libroActualizado)
                });
                
                if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
                
                alert(`Libro actualizado ✓`);
                cargarLibros();
                mostrarSeccion('catalogo');
                
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    }

    async function eliminarLibro() {
        if (!libroActual || !confirm(`¿Eliminar "${libroActual.titulo}"?`)) return;
        
        try {
            const respuesta = await fetch(`${API_URL}/libros/${libroActual.id}`, {
                method: 'DELETE'
            });
            
            if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
            
            alert(`Libro eliminado ✓`);
            document.getElementById('form-editar-libro').classList.add('form-oculto');
            cargarLibros();
            mostrarSeccion('catalogo');
            
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    async function abrirModalCompra(id) {
        try {
            const respuesta = await fetch(`${API_URL}/libros/${id}`);
            if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
            
            const libro = await respuesta.json();
            libroActual = libro;
            
            document.getElementById('modal-titulo').textContent = libro.titulo;
            document.getElementById('modal-precio').textContent = libro.precio;
            document.getElementById('modal-stock').textContent = libro.stock;
            document.getElementById('cantidad-comprar').value = 1;
            document.getElementById('cantidad-comprar').max = libro.stock;
            
            document.getElementById('modal-comprar').style.display = 'block';
            
        } catch (error) {
            alert(`Error: ${error.message}`);
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
            alert(`Cantidad inválida. Stock: ${libroActual.stock}`);
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
            alert(`Error: ${error.message}`);
        }
    }

    async function cargarVentas() {
        try {
            const lista = document.getElementById('lista-ventas');
            lista.innerHTML = '<p>Cargando...</p>';
            
            const respuesta = await fetch(`${API_URL}/ventas`);
            if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
            
            const ventas = await respuesta.json();
            mostrarVentas(ventas);
            
        } catch (error) {
            document.getElementById('lista-ventas').innerHTML = 
                `<p class="error">Error: ${error.message}</p>`;
        }
    }

    function mostrarVentas(ventas) {
        const lista = document.getElementById('lista-ventas');
        
        if (ventas.length === 0) {
            lista.innerHTML = '<p>No hay ventas</p>';
            return;
        }
        
        lista.innerHTML = ventas.map(venta => `
            <div class="venta-item">
                <div>
                    <strong>Venta #${venta.id}</strong><br>
                    Libro ID: ${venta.libro_id}<br>
                    Cantidad: ${venta.cantidad}
                </div>
                <div>
                    Total: $${venta.total}<br>
                    Fecha: ${new Date(venta.fecha_venta).toLocaleDateString()}
                </div>
            </div>
        `).join('');
    }

    function inicializarApp() {
        console.log('App iniciada');
        
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