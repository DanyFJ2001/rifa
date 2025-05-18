

// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Configuración de Firebase
    // IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase
    const firebaseConfig = {
        apiKey: "TU_API_KEY",
        authDomain: "tu-proyecto.firebaseapp.com",
        databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
        projectId: "tu-proyecto",
        storageBucket: "tu-proyecto.appspot.com",
        messagingSenderId: "TU_MESSAGING_SENDER_ID",
        appId: "TU_APP_ID"
    };
    
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const numerosRef = database.ref('numeros');
    
    // Referencias a elementos del DOM
    const formStep1 = document.getElementById('form-step-1');
    const formStep2 = document.getElementById('form-step-2');
    const formStep3 = document.getElementById('form-step-3');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const btnVolver = document.getElementById('btn-volver');
    const btnConfirmar = document.getElementById('btn-confirmar');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const numeroSeleccionadoInput = document.getElementById('numeros');
    const gridNumeros = document.getElementById('grid-numeros');
    const selectedList = document.getElementById('selected-list');
    const totalPagar = document.getElementById('total-pagar');
    
    // Variables globales
    let datosUsuario = {
        nombre: '',
        telefono: '',
        email: '',
        numerosSeleccionados: []
    };
    
    // Limitar a 10 números seleccionados
    const MAX_NUMEROS = 10;
    const PRECIO_NUMERO = 10;
    
    // Inicializar cuenta regresiva
    initCountdown();
    
    // Generar grid de números
    generarNumeros();
    
    // Escuchar cambios en la base de datos
    numerosRef.on('value', (snapshot) => {
        actualizarNumeros(snapshot.val());
    });
    
    // Event Listeners
    btnSiguiente.addEventListener('click', function() {
        // Validar datos del formulario
        const nombre = document.getElementById('nombre').value;
        const telefono = document.getElementById('telefono').value;
        const email = document.getElementById('email').value;
        
        if (!nombre || !telefono || !email) {
            alert('Por favor, completa todos los campos');
            return;
        }
        
        // Guardar datos
        datosUsuario.nombre = nombre;
        datosUsuario.telefono = telefono;
        datosUsuario.email = email;
        
        // Cambiar al paso 2 con animación
        formStep1.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            formStep1.style.display = 'none';
            formStep2.style.display = 'block';
            formStep2.style.animation = 'fadeIn 0.3s forwards';
        }, 300);
    });
    
    btnVolver.addEventListener('click', function() {
        // Cambiar al paso 1 con animación
        formStep2.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            formStep2.style.display = 'none';
            formStep1.style.display = 'block';
            formStep1.style.animation = 'fadeIn 0.3s forwards';
        }, 300);
    });
    
    btnConfirmar.addEventListener('click', function() {
        if (datosUsuario.numerosSeleccionados.length === 0) {
            alert('Por favor, selecciona al menos un número');
            return;
        }
        
        // Reservar números en Firebase
        reservarNumeros()
            .then(() => {
                // Calcular total a pagar
                const total = datosUsuario.numerosSeleccionados.length * PRECIO_NUMERO;
                totalPagar.textContent = total.toFixed(2);
                
                // Cambiar al paso 3 con animación
                formStep2.style.animation = 'fadeOut 0.3s forwards';
                setTimeout(() => {
                    formStep2.style.display = 'none';
                    formStep3.style.display = 'block';
                    formStep3.style.animation = 'fadeIn 0.3s forwards';
                }, 300);
            })
            
.catch(error => {
                console.error("Error al reservar números:", error);
                alert('Error al reservar números. Inténtalo de nuevo.');
            });
    });
    
    btnWhatsapp.addEventListener('click', function() {
        enviarWhatsapp();
    });
    
    // Funciones
    function initCountdown() {
        // Fecha del sorteo (ajustar según necesidades)
        const countDownDate = new Date();
        countDownDate.setDate(countDownDate.getDate() + 7); // Una semana desde hoy
        
        // Actualizar cada segundo
        const x = setInterval(function() {
            const now = new Date().getTime();
            const distance = countDownDate - now;
            
            // Cálculos de tiempo
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            // Mostrar resultado con animación
            updateCountdownDigit("days", days);
            updateCountdownDigit("hours", hours);
            updateCountdownDigit("minutes", minutes);
            updateCountdownDigit("seconds", seconds);
            
            // Cuando termina la cuenta regresiva
            if (distance < 0) {
                clearInterval(x);
                document.getElementById("days").textContent = "00";
                document.getElementById("hours").textContent = "00";
                document.getElementById("minutes").textContent = "00";
                document.getElementById("seconds").textContent = "00";
            }
        }, 1000);
    }

    // Función para actualizar dígitos con animación
    function updateCountdownDigit(id, value) {
        const element = document.getElementById(id);
        const currentValue = element.textContent;
        const newValue = value.toString().padStart(2, '0');
        
        if (currentValue !== newValue) {
            element.style.animation = 'none';
            element.offsetHeight; // Trigger reflow
            element.textContent = newValue;
            element.style.animation = 'fadeNumberChange 0.5s';
        }
    }
    
    function generarNumeros() {
        // Limpiar grid
        gridNumeros.innerHTML = '';
        
        // Generar 100 números
        for (let i = 1; i <= 100; i++) {
            const numeroElement = document.createElement('div');
            numeroElement.classList.add('numero');
            numeroElement.textContent = i;
            numeroElement.setAttribute('data-numero', i);
            
            // Evento click para seleccionar número
            numeroElement.addEventListener('click', function() {
                seleccionarNumero(this);
            });
            
            gridNumeros.appendChild(numeroElement);
            
            // Inicializar en Firebase si no existe
            numerosRef.child(i).once('value', snapshot => {
                if (!snapshot.exists()) {
                    numerosRef.child(i).set({
                        estado: 'libre',
                        usuario: null,
                        telefono: null,
                        email: null
                    });
                }
            });
        }
    }
    
    function actualizarNumeros(data) {
        if (!data) return;
        
        // Actualizar el estado de cada número en el DOM
        for (const num in data) {
            const numeroElement = document.querySelector(`.numero[data-numero="${num}"]`);
            if (numeroElement) {
                // Limpiar clases previas
                numeroElement.classList.remove('libre', 'reservado', 'pagado');
                
                // Añadir clase según estado
                numeroElement.classList.add(data[num].estado);
                
                // Deshabilitar selección si no está libre
                if (data[num].estado !== 'libre') {
                    numeroElement.removeEventListener('click', function() {
                        seleccionarNumero(this);
                    });
                    numeroElement.style.cursor = 'not-allowed';
                }
            }
        }
    }
    
    function seleccionarNumero(elemento) {
        // Obtener número
        const numero = elemento.getAttribute('data-numero');
        
        // Verificar si ya está seleccionado
        if (elemento.classList.contains('selected')) {
            // Quitar de seleccionados
            elemento.classList.remove('selected');
            const index = datosUsuario.numerosSeleccionados.indexOf(numero);
            if (index > -1) {
                datosUsuario.numerosSeleccionados.splice(index, 1);
            }
        } else {
            // Verificar límite de números
            if (datosUsuario.numerosSeleccionados.length >= MAX_NUMEROS) {
                alert(`Solo puedes seleccionar un máximo de ${MAX_NUMEROS} números.`);
                return;
            }
            
            // Añadir a seleccionados
            elemento.classList.add('selected');
            datosUsuario.numerosSeleccionados.push(numero);
        }
        
        // Actualizar lista de seleccionados
        actualizarListaSeleccionados();
    }
    
    function actualizarListaSeleccionados() {
        // Ordenar números
        datosUsuario.numerosSeleccionados.sort((a, b) => a - b);
        
        // Actualizar inputs
        selectedList.textContent = datosUsuario.numerosSeleccionados.join(', ');
        numeroSeleccionadoInput.value = datosUsuario.numerosSeleccionados.join(', ');
        
        // Calcular total
        const total = datosUsuario.numerosSeleccionados.length * PRECIO_NUMERO;
        totalPagar.textContent = total.toFixed(2);
    }
    
    function reservarNumeros() {
        // Crear array de promesas para todas las actualizaciones
        const promises = datosUsuario.numerosSeleccionados.map(numero => {
            return numerosRef.child(numero).update({
                estado: 'reservado',
                usuario: datosUsuario.nombre,
                telefono: datosUsuario.telefono,
                email: datosUsuario.email,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        });
        
        return Promise.all(promises);
    }
    
    function enviarWhatsapp() {
        // Número de teléfono del organizador (reemplazar con el número correcto)
        const telefonoOrganizador = "1234567890";
        
        // Construir mensaje
        const mensaje = `¡Hola! He reservado los siguientes números para la rifa: ${datosUsuario.numerosSeleccionados.join(', ')}. Mi nombre es ${datosUsuario.nombre}, mi teléfono es ${datosUsuario.telefono} y mi email es ${datosUsuario.email}. Adjunto comprobante de pago.`;
        
        // Construir URL de WhatsApp
        const whatsappUrl = `https://wa.me/${telefonoOrganizador}?text=${encodeURIComponent(mensaje)}`;
        
        // Abrir WhatsApp en nueva pestaña
        window.open(whatsappUrl, '_blank');
    }
    
    // Panel de administración (oculto por defecto)
    // Para acceder: presionar Alt+A
    let adminMode = false;
    
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === 'a') {
            toggleAdminMode();
        }
    });
    
    function toggleAdminMode() {
        adminMode = !adminMode;
        
        if (adminMode) {
            const password = prompt("Ingrese la contraseña de administrador:");
            if (password === "admin123") { // Cambiar a una contraseña segura
                alert("Modo administrador activado. Ahora puedes hacer clic en los números para cambiar su estado.");
                // Añadir eventos para cambiar estado
                const numeros = document.querySelectorAll('.numero');
                numeros.forEach(num => {
                    num.addEventListener('contextmenu', adminChangeStatus);
                });
                
                // Prevenir menú contextual
                document.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                });
            } else {
                adminMode = false;
                alert("Contraseña incorrecta.");
            }
        } else {
            // Quitar eventos de administrador
            const numeros = document.querySelectorAll('.numero');
            numeros.forEach(num => {
                num.removeEventListener('contextmenu', adminChangeStatus);
            });
            
            // Restaurar menú contextual
            document.removeEventListener('contextmenu', function(e) {
                e.preventDefault();
            });
            
            alert("Modo administrador desactivado.");
        }
    }
    
    function adminChangeStatus(e) {
        e.preventDefault();
        
        if (!adminMode) return;
        
        const numero = this.getAttribute('data-numero');
        const options = ["libre", "reservado", "pagado"];
        
        const currentState = this.classList.contains('libre') ? 'libre' : 
                            this.classList.contains('reservado') ? 'reservado' : 'pagado';
        
        const currentIndex = options.indexOf(currentState);
        const nextIndex = (currentIndex + 1) % options.length;
        const newState = options[nextIndex];
        
        // Actualizar en Firebase
        numerosRef.child(numero).update({
            estado: newState
        })
        .then(() => {
            console.log(`Número ${numero} actualizado a ${newState}`);
        })
        .catch(error => {
            console.error(`Error al actualizar número ${numero}:`, error);
        });
    }
    
    // Añadir animaciones CSS adicionales
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeNumberChange {
            0% { transform: translateY(-10px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});
// Funcionalidad del carrusel mejorado
document.addEventListener('DOMContentLoaded', function() {
  const slides = document.querySelectorAll('.carrusel-slide');
  const indicators = document.querySelectorAll('.indicador');
  const prevBtn = document.querySelector('.carrusel-prev');
  const nextBtn = document.querySelector('.carrusel-next');
  
  let currentIndex = 0;
  let slideInterval;
  
  // Inicializar el carrusel
  initCarousel();
  
  function initCarousel() {
    // Preparar las posiciones iniciales de los slides
    updateSlides();
    
    // Iniciar el deslizamiento automático
    startAutoSlide();
    
    // Agregar eventos a los controles
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    // Eventos para los indicadores
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => goToSlide(index));
    });
    
    // Pausar la reproducción automática al pasar el mouse por encima
    document.querySelector('.carrusel-premio').addEventListener('mouseenter', stopAutoSlide);
    document.querySelector('.carrusel-premio').addEventListener('mouseleave', startAutoSlide);
  }
  
  function updateSlides() {
    slides.forEach((slide, index) => {
      slide.classList.remove('active', 'prev');
      
      if (index === currentIndex) {
        slide.classList.add('active');
      } else if (index === getPrevIndex()) {
        slide.classList.add('prev');
      }
    });
    
    // Actualizar indicadores
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === currentIndex);
    });
  }
  
  function nextSlide() {
    currentIndex = getNextIndex();
    updateSlides();
  }
  
  function prevSlide() {
    currentIndex = getPrevIndex();
    updateSlides();
  }
  
  function goToSlide(index) {
    currentIndex = index;
    updateSlides();
    resetAutoSlide();
  }
  
  function getNextIndex() {
    return (currentIndex + 1) % slides.length;
  }
  
  function getPrevIndex() {
    return (currentIndex - 1 + slides.length) % slides.length;
  }
  
  function startAutoSlide() {
    stopAutoSlide(); // Evitar múltiples intervalos
    slideInterval = setInterval(nextSlide, 5000);
  }
  
  function stopAutoSlide() {
    clearInterval(slideInterval);
  }
  
  function resetAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
  }
  
  // Efecto visual para la barra de progreso
  const progressMarker = document.querySelector('.progreso-marker');
  const progressBar = document.querySelector('.progreso');
  const progressValue = 0; // Mantenemos en 0% como solicitaste
  
  // Configurar la barra de progreso
  progressBar.style.width = progressValue + '%';
  progressMarker.style.left = progressValue + '%';
});