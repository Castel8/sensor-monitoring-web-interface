// Inicializar Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCwJqu0Zhx7J4wDbKQOlU5p7CqMACRDbw8",
    authDomain: "detector-1.firebaseapp.com",
    databaseURL: "https://detector-1-default-rtdb.firebaseio.com",
    projectId: "detector-1",
    storageBucket: "detector-1.firebasestorage.app",
    messagingSenderId: "36854127803",
    appId: "1:36854127803:web:7446f96a6f1088cd1e1d9e"
};
        
firebase.initializeApp(firebaseConfig);
console.log("Firebase inicializado");
const database = firebase.database();
const sensoresRef = database.ref("sensores");
const auth = firebase.auth(); // Inicializar Firebase Auth

// Proveedor de autenticación de Google
const proveedorGoogle = new firebase.auth.GoogleAuthProvider();
proveedorGoogle.setCustomParameters({
    prompt: 'select_account'
});


// Arrays para almacenar los datos
// Arrays independientes para cada gráfica (IMPORTANTE: No compartir arrays entre gráficas)
let datosFormolGrafica = [];
let datosCO2Grafica = [];
let datosTempGrafica = [];
let datosHumedadGrafica = [];
let tiempoGrafica = [];

// Arrays para almacenamiento histórico de datos (no para gráficas)
let datosFormol = [];
let datosCO2 = [];
let datosTemp = [];
let datosHumedad = [];

// Variables para las gráficas
let graficaCO2, graficaFormol, graficaTempHumedad, graficaFormolTemp;

// Asegurarse de que solo se muestre un momento a la vez
document.addEventListener('DOMContentLoaded', function() {
    console.log("Página cargada completamente");
    
    // Ocultar explícitamente momentos 2 y 3 al inicio
    document.getElementById("momento2").style.display = 'none';
    document.getElementById("momento3").style.display = 'none';
    
    // Asegurarse de que Momento 1 esté visible
    document.getElementById("momento1").style.display = 'block';
    
    // Inicializar las gráficas
    inicializarGraficas();
    
    // Configurar autenticación primero, luego escuchar datos de Firebase
    // Verificar si hay un usuario autenticado al cargar la página
    auth.onAuthStateChanged(function(user) {
        // Verificar si estamos en un proceso de inicio de sesión activo
        const loginEnProceso = localStorage.getItem('loginEnProceso') === 'true';
        
        if (user) {
            const userInfoElement = document.getElementById("userInfo");
            const userNameElement = document.getElementById("userName");
            
            if (userInfoElement) userInfoElement.style.display = "flex";
            if (userNameElement) userNameElement.textContent = user.displayName || user.email;
            
            console.log("Usuario autenticado:", user.displayName || user.email);
            
            // Ahora que estamos autenticados, configurar escucha de Firebase
            configurarEscuchaFirebase();
            
            if (loginEnProceso) {
                mostrarMomento(2);
                // Limpiar la bandera
                localStorage.removeItem('loginEnProceso');
            }
        } else if (!loginEnProceso) {
            // No hay usuario autenticado y no estamos en proceso de login
            mostrarMomento(1);
            console.log("No hay usuario autenticado");
        }
    });
    
    // Ajustar tamaño de las gráficas
    const graficas = ["graficaCO2", "graficaFormol", "graficaTempHumedad", "graficaFormolTemp"];
    graficas.forEach(id => {
        const canvas = document.getElementById(id);
        // Remover cualquier estilo inline que pueda estar afectando
        if (canvas) {
            canvas.style.removeProperty('width');
            canvas.style.removeProperty('height');
        } else {
            console.error(`Elemento canvas con id ${id} no encontrado`);
        }
    });

    // Añadir un listener para el redimensionamiento de la ventana
    window.addEventListener('resize', function() {
        if (graficaCO2) graficaCO2.resize();
        if (graficaFormol) graficaFormol.resize();
        if (graficaTempHumedad) graficaTempHumedad.resize();
        if (graficaFormolTemp) graficaFormolTemp.resize();
    });

    const botonManual = document.getElementById("manual-button");
    if (botonManual) {
        botonManual.addEventListener("click", function () {
            window.open("Manual de Usuario-Sistema de Sensado y Monitoreo.pdf", "_blank");
        });
    } else {
        console.warn("El botón del manual no fue encontrado");
    }
});

// Modificación de la función de inicio de sesión con Google para mostrar bienvenida
function loginWithGoogle() {
    // Establecer que estamos en proceso de login
    localStorage.setItem('loginEnProceso', 'true');
    
    auth.signInWithPopup(proveedorGoogle)
        .then((result) => {
            // El usuario ha iniciado sesión correctamente
            const user = result.user;
            console.log("Inicio de sesión con Google exitoso:", user.displayName);
            
            // Mostrar mensaje de bienvenida con el nombre del usuario
            mostrarNotificacion(`BIENVENIDO ${user.displayName || 'USUARIO'}`);
            
            mostrarMomento(2);
        })
        .catch((error) => {
            // Manejar errores de inicio de sesión
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Error al iniciar sesión con Google:", errorCode, errorMessage);
            alert("Error al iniciar sesión con Google: " + errorMessage);
            
            // Limpiar la bandera en caso de error
            localStorage.removeItem('loginEnProceso');
        });
}

function validarAcceso() {
    try {
        const usuarioIngresado = document.getElementById("usuario").value;
        const contrasenaIngresada = document.getElementById("password").value;

        if (usuarioIngresado === "Anfiteatro" && contrasenaIngresada === "Formolppm") {
            console.log("Credenciales correctas, iniciando sesión anónima");
            
            // Establecemos que estamos en proceso de login
            localStorage.setItem('loginEnProceso', 'true');
            
            // Usar autenticación anónima para acceder a la base de datos
            auth.signInAnonymously()
                .then(() => {
                    console.log("Autenticación anónima exitosa");
                    
                    // Mostrar mensaje de bienvenida 
                    mostrarNotificacion("BIENVENIDO USUARIO");
                    
                    mostrarMomento(2);
                })
                .catch((error) => {
                    console.error("Error en autenticación anónima:", error);
                    alert("Error de autenticación: " + error.message);
                    localStorage.removeItem('loginEnProceso');
                });
        } else {
            alert("Usuario o contraseña incorrectos. Inténtelo nuevamente.");
        }
    } catch (error) {
        console.error("Error en validación de acceso:", error);
    }
}
// Modificación de la función para cerrar sesión
function cerrarSesion() {
    // Primero desconectar listeners de Firebase
    sensoresRef.off();
    console.log("Listeners de Firebase desconectados");

    // Limpiar la bandera
    localStorage.removeItem('loginEnProceso');
    
    auth.signOut()
        .then(() => {
            console.log("Sesión cerrada correctamente");
            
            // Mostrar mensaje de cierre de sesión
            mostrarNotificacion("HAS CERRADO SESIÓN");
            
            mostrarMomento(1);
            // Limpiar campos de usuario y contraseña
            const usuarioInput = document.getElementById("usuario");
            const passwordInput = document.getElementById("password");
            
            if (usuarioInput) usuarioInput.value = "";
            if (passwordInput) passwordInput.value = "";
        })
        .catch((error) => {
            console.error("Error al cerrar sesión:", error);
        });
}

function configurarEscuchaFirebase() {
    console.log("Configurando escucha de Firebase en la ruta 'sensores'");

    // Limpiar completamente las gráficas al reconectar
    limpiarTodasLasGraficas();
    
    // Usar .once para verificar permiso primero
    sensoresRef.once("value")
        .then((snapshot) => {
            console.log("Permiso verificado para acceder a 'sensores'");
            
            // Ahora configurar la escucha en tiempo real
            sensoresRef.on("value", (snapshot) => {
                try {
                    const data = snapshot.val();
                    console.log("Datos recibidos de Firebase:", data);
                    
                    if (data) {
                        // Actualizar los elementos HTML con los datos más recientes
                        actualizarElementosHTML(data);

                        // Actualizar nivel de formol según el valor
                        actualizarNivelFormol(data.Formaldehído);

                        // Procesar datos para gráficas de manera inmediata y eficiente
                        procesarDatosParaGraficas(data);

                        // Almacenar datos para poder guardarlos después (array de almacenamiento)
                        almacenarDato(datosCO2, data.CO2);
                        almacenarDato(datosFormol, data.Formaldehído);
                        almacenarDato(datosTemp, data.Temperatura);
                        almacenarDato(datosHumedad, data.Humedad);
                    } else {
                        console.error("No se recibieron datos de Firebase o la estructura es incorrecta");
                    }
                } catch (error) {
                    console.error("Error al procesar datos de Firebase:", error);
                }
            }, (error) => {
                console.error("Error en la escucha de Firebase:", error);
                
                if (error.code === "PERMISSION_DENIED") {
                    alert("Error de permisos al acceder a los datos. Por favor, inicie sesión nuevamente.");
                    mostrarMomento(1);
                }
            });
        })
        .catch((error) => {
            console.error("Error al verificar permiso para 'sensores':", error);
            
            if (error.code === "PERMISSION_DENIED") {
                alert("No tiene permiso para acceder a los datos. Por favor, inicie sesión con credenciales válidas.");
                mostrarMomento(1);
            }
        });
}
// Nueva función para actualizar elementos HTML

function inicializarGraficas() {
    // Configuración optimizada para mejor rendimiento
        const opcionesComunes = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300, // animación suave y rápida (300 ms)
                easing: 'linear'
            },
            layout: {
                padding: {
                    left: 5,
                    right: 10,
                    top: 0,
                    bottom: 5
                }
            },
            elements: {
                point: {
                    radius: 3,
                    hoverRadius: 5
                },
                line: {
                    tension: 0.2 // leve suavizado de líneas
                }
            }
        };


    try {
        // Destruir gráficas existentes si existen
        if (graficaCO2) {
            graficaCO2.destroy();
            graficaCO2 = null;
        }
        if (graficaFormol) {
            graficaFormol.destroy();
            graficaFormol = null;
        }
        if (graficaTempHumedad) {
            graficaTempHumedad.destroy();
            graficaTempHumedad = null;
        }
        if (graficaFormolTemp) {
            graficaFormolTemp.destroy();
            graficaFormolTemp = null;
        }

        // Inicialización de gráfica CO2
        const ctxCO2 = document.getElementById("graficaCO2");
        if (ctxCO2) {
            graficaCO2 = new Chart(ctxCO2, {
                type: "line",
                data: { 
                    labels: [], 
                    datasets: [
                        { 
                            label: "CO2 (ppm)", 
                            data: [], 
                            borderColor: "#20a79f", 
                            backgroundColor: "rgba(32, 167, 159, 0.1)",
                            fill: false,
                            pointRadius: 3
                        },
                        {
                            label: "Límite 800 ppm",
                            data: [],
                            borderColor: "rgba(26, 80, 161, 0.7)",
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0
                        }
                    ] 
                },
                options: { 
                    ...opcionesComunes,
                    scales: { 
                        x: { 
                            title: { display: true, text: "Tiempo" },
                            grid: { display: true },
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 10
                            }
                        }, 
                        y: { 
                            title: { display: true, text: "CO2 (ppm)" },
                            beginAtZero: true,
                            suggestedMax: 1100
                        } 
                    } 
                }
            });
            console.log("Gráfica CO2 inicializada correctamente");
        }

        // Inicialización de gráfica Formol
        const ctxFormol = document.getElementById("graficaFormol");
        if (ctxFormol) {
            graficaFormol = new Chart(ctxFormol, {
                type: "line",
                data: { 
                    labels: [], 
                    datasets: [
                        { 
                            label: "Formol (ppm)", 
                            data: [], 
                            borderColor: "#20a79f", 
                            backgroundColor: "rgba(32, 167, 159, 0.1)",
                            fill: false,
                            pointRadius: 3
                        },
                        {
                            label: "Límite 0.75 ppm",
                            data: [],
                            borderColor: "rgba(255, 165, 0, 0.7)",
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0
                        },
                        {
                            label: "Límite 2.00 ppm",
                            data: [],
                            borderColor: "rgba(110, 204, 22, 0.7)",
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0
                        }
                    ] 
                },
                options: { 
                    ...opcionesComunes,
                    scales: { 
                        x: { 
                            title: { display: true, text: "Tiempo" },
                            grid: { display: true },
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 10
                            }
                        }, 
                        y: { 
                            title: { display: true, text: "Formol (ppm)" },
                            beginAtZero: true,
                            suggestedMax: 2.10
                        } 
                    } 
                }
            });
            console.log("Gráfica Formol inicializada correctamente");
        }

       // Inicialización de gráfica Temperatura y Humedad
const ctxTempHumedad = document.getElementById("graficaTempHumedad");
if (ctxTempHumedad) {
    graficaTempHumedad = new Chart(ctxTempHumedad, {
        type: "line",
        data: { 
            labels: [], 
            datasets: [
                { 
                    label: "Temperatura (°C)", 
                    data: [], 
                    borderColor: "#ff6b6b", 
                    backgroundColor: "rgba(255, 107, 107, 0.1)",
                    fill: false,
                    pointRadius: 3
                },
                { 
                    label: "Humedad (%)", 
                    data: [], 
                    borderColor: "#4ecdc4", 
                    backgroundColor: "rgba(78, 205, 196, 0.1)",
                    fill: false,
                    pointRadius: 3
                }
            ] 
        },
        options: { 
            ...opcionesComunes,
            scales: { 
                x: { 
                    title: { display: true, text: "Tiempo" },
                    ticks: {
                        color: "#333",
                        font: { size: 12 }
                    },
                    grid: { display: true }
                }, 
                y: {
                    title: { display: true, text: "Valores" },
                    ticks: {
                        color: "#333",
                        font: { size: 12 }
                    },
                    grid: { display: true },
                    beginAtZero: false
                }
            }
        }
    });
    console.log("Gráfica Temperatura y Humedad inicializada correctamente");
}
        // Inicialización de gráfica Formol vs Temperatura (scatter plot)
        const ctxFormolTemp = document.getElementById("graficaFormolTemp");
        if (ctxFormolTemp) {
            graficaFormolTemp = new Chart(ctxFormolTemp, {
                type: "scatter",
                data: { 
                    datasets: [
                        { 
                            label: "Formol vs Temperatura", 
                            data: [], 
                            borderColor: "#9b59b6", 
                            backgroundColor: "rgba(26, 70, 99, 0.6)",
                            pointRadius: 5
                        }
                    ] 
                },
                options: {
                    ...opcionesComunes,
                    scales: {
                        x: {
                            title: { display: true, text: "Temperatura (°C)" },
                            ticks: {
                                color: "#333",
                                font: { size: 12 }
                            },
                            grid: { display: true }
                        },
                        y: {
                            title: { display: true, text: "Formol (ppm)" },
                            ticks: {
                                color: "#333",
                                font: { size: 12 }
                            },
                            beginAtZero: true,
                            suggestedMax: 1.60,
                            grid: { display: true }
                        }
                    }
                }
            });
            console.log("Gráfica Formol vs Temperatura inicializada correctamente");
        }

    } catch (error) {
        console.error("Error al inicializar gráficas:", error);
    }
}


// Configuración de Telegram - REEMPLAZA ESTOS VALORES
const TELEGRAM_BOT_TOKEN = '7579093861:AAHacaJ1JzC_d32_W6pt2YEEkUAH-bIxjac'; // Reemplaza con tu token real
const TELEGRAM_CHAT_ID = '6999266184';       // Reemplaza con tu chat id real
// 1. Primero, añade la función para verificar conexión a internet
function verificarConexionInternet() {
    return navigator.onLine;
  }

// Variable global para rastrear el último nivel de formol
let ultimoNivelFormol = ""; 

function actualizarNivelFormol(valorFormol) {
    const nivelFormolElement = document.getElementById("nivelFormol");
    const alarmaIcon = document.getElementById("alarmaIcon");
    
    if (!nivelFormolElement || !alarmaIcon) {
        console.error("Elementos no encontrados");
        return;
    }
    
    let nuevoNivel = "PERMITIDO";
    let colorClase = "alarma-verde";
    let colorTexto = "green"; // Color para el texto PERMITIDO
    let strokeColor = "#004d00"; // Contorno verde oscuro para PERMITIDO
    let strokeWeight = "1px"; // Grosor del stroke
    
    // Determinar nivel y color
    if (valorFormol > 2.00) {
        nuevoNivel = "PELIGROSO";
        colorClase = "alarma-rojo";
        colorTexto = "red"; // Color para el texto PELIGROSO
        strokeColor = "#800000"; // Contorno rojo oscuro para PELIGROSO
    } else if (valorFormol > 0.75) {
        nuevoNivel = "RIESGOSO";
        colorClase = "alarma-azul";
        colorTexto = "yellow"; // Color para el texto RIESGOSO
        strokeColor = "#663300"; // Contorno marrón para RIESGOSO
    }
    
    // Crear el estilo CSS con text-shadow para simular un stroke
    const textStyle = `
        color: ${colorTexto}; 
        font-weight: bold;
        letter-spacing: 2px; 
        text-shadow: 
            -${strokeWeight} -${strokeWeight} 0 ${strokeColor},
            ${strokeWeight} -${strokeWeight} 0 ${strokeColor},
            -${strokeWeight} ${strokeWeight} 0 ${strokeColor},
            ${strokeWeight} ${strokeWeight} 0 ${strokeColor};
    `;
    
    // Actualiza el texto en la interfaz con color y stroke
    nivelFormolElement.innerHTML = " <span style='" + textStyle + "'>" + nuevoNivel + "</span>";
    
    // Actualiza la clase de color del ícono
    alarmaIcon.classList.remove("alarma-verde", "alarma-azul", "alarma-rojo");
    alarmaIcon.classList.add(colorClase);
    
    // Activa la animación de parpadeo
    activarParpadeoIcono();
    
    // Resto de la función (manejo de alertas) permanece igual
    try {
        if (ultimoNivelFormol !== "" && nuevoNivel !== ultimoNivelFormol) {
            if ((ultimoNivelFormol === "PERMITIDO" && nuevoNivel === "RIESGOSO") || 
                (ultimoNivelFormol === "PERMITIDO" && nuevoNivel === "PELIGROSO")) {
                enviarAlertaTelegram(
                    "⚠️ Alerta de Nivel de Formol: " + nuevoNivel,
                    `El nivel de formol ha cambiado de estado ${ultimoNivelFormol} a estado ${nuevoNivel} con un valor de ${valorFormol.toFixed(3)} ppm.`
                );
            } else if (ultimoNivelFormol === "RIESGOSO" && nuevoNivel === "PELIGROSO") {
                enviarAlertaTelegram(
                    "🔴 ¡ALERTA CRÍTICA! Nivel de Formol: PELIGROSO",
                    `¡ATENCIÓN! El nivel de formol ha alcanzado un estado PELIGROSO con un valor de ${valorFormol.toFixed(3)} ppm. Se requiere atención inmediata.`
                );
            }
        }
    } catch (error) {
        console.error("Error al enviar alerta de cambio de nivel:", error);
        // Guardar la alerta para reintento posterior
        if (nuevoNivel === "RIESGOSO" || nuevoNivel === "PELIGROSO") {
            guardarAlertaPendiente(
                "⚠️ Alerta de Nivel de Formol: " + nuevoNivel,
                `El nivel de formol ha cambiado a ${nuevoNivel} con un valor de ${valorFormol.toFixed(3)} ppm.`
            );
        }
    }
    
    // Actualizar el último nivel registrado
    ultimoNivelFormol = nuevoNivel;
}

document.addEventListener('DOMContentLoaded', function() {
    // Código existente...
    
    // Añadir comprobación de alertas pendientes
    if (verificarConexionInternet()) {
        setTimeout(() => {
            reintentarAlertasPendientes();
        }, 5000); // Esperar 5 segundos después de cargar para dar tiempo a otras inicializaciones
    }
    
    // Resto del código existente...
});

// 4. Añadir una comprobación periódica para reenviar alertas pendientes
setInterval(() => {
    if (verificarConexionInternet() && auth.currentUser) {
        reintentarAlertasPendientes();
    }
}, 30000); 

// Función mejorada para enviar alerta a Telegram
function enviarAlertaTelegram(titulo, mensaje) {
    // Obtener info del usuario si está disponible
    let nombreUsuario = "Usuario no identificado";
    try {
      const usuario = firebase.auth().currentUser;
      if (usuario) {
        nombreUsuario = usuario.displayName || usuario.email || "Usuario autenticado";
      }
    } catch (e) {
      console.log("No se pudo obtener info del usuario:", e);
    }
    
    // Preparar mensaje con formato
    const fecha = new Date();
    const textoMensaje = `
  🚨 *${titulo}* 🚨
  
  ${mensaje}
  
  📊 *Detalles*:
  📆 Fecha: ${fecha.toLocaleDateString()}
  ⏰ Hora: ${fecha.toLocaleTimeString()}
  👤 Usuario: ${nombreUsuario}
  📍 Ubicación: Sistema de monitoreo de formaldehído
    `;
    
    // Mostrar indicador de envío
    console.log("Preparando envío de alerta a Telegram...");
    
    // Método 1: Usando un servidor intermedio propio (recomendado)
    // Debes tener configurado un servidor propio que reciba esta solicitud y la reenvíe a Telegram
    // Este enfoque es el más confiable para entornos de producción
    const servidorIntermedio = 'https://tu-servidor-intermedio.com/relay-telegram';
    
    // Datos para la solicitud
    const datos = {
      bot_token: TELEGRAM_BOT_TOKEN,
      chat_id: TELEGRAM_CHAT_ID,
      text: textoMensaje,
      parse_mode: 'Markdown'
    };
    
    // Método alternativo: Intentar directamente con servicios CORS Proxy
    // Este método es menos confiable pero puede funcionar para pruebas
    intentarEnvioTelegram(datos)
      .then(exito => {
        if (exito) {
          console.log("✅ Alerta enviada con éxito a Telegram");
          mostrarNotificacion("Alerta enviada", "Se ha enviado una notificación por Telegram");
        } else {
          console.error("❌ Todos los intentos de envío a Telegram fallaron");
          mostrarNotificacion("Error", "No se pudo enviar la alerta por Telegram", true);
          
          // Alternativa de respaldo: Almacenar la alerta para envío posterior
          guardarAlertaPendiente(titulo, mensaje);
        }
      });
  }
  
  // Función para intentar enviar a Telegram por diferentes métodos
  async function intentarEnvioTelegram(datos) {
    // Lista de servicios CORS proxy para intentar
    const proxies = [
      '', // Intento directo primero (por si estás en un entorno que lo permite)
      'https://cors-anywhere.herokuapp.com/',
      'https://corsproxy.io/?',
      'https://api.allorigins.win/raw?url='
    ];
    
    // URL base de la API de Telegram
    const telegramUrl = `https://api.telegram.org/bot${datos.bot_token}/sendMessage`;
    
    // Preparar payload para Telegram (sin el token que va en la URL)
    const telegramPayload = {
      chat_id: datos.chat_id,
      text: datos.text,
      parse_mode: datos.parse_mode
    };
    
    // Intentar con cada proxy secuencialmente
    for (const proxy of proxies) {
      try {
        console.log(`Intentando envío con proxy: ${proxy || 'directo'}`);
        
        let urlFinal = proxy;
        
        // Diferentes formatos según el proxy
        if (proxy === 'https://corsproxy.io/?' || proxy === 'https://api.allorigins.win/raw?url=') {
          urlFinal += encodeURIComponent(telegramUrl);
        } else {
          urlFinal += telegramUrl;
        }
        
        // Configurar opciones de fetch según el proxy
        const fetchOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(telegramPayload)
        };
        
        // Agregar origen si es necesario para CORS
        if (proxy === 'https://cors-anywhere.herokuapp.com/') {
          fetchOptions.headers['Origin'] = window.location.origin;
        }
        
        // Intentar la solicitud
        const response = await fetch(urlFinal, fetchOptions);
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.ok) {
          return true; // Éxito
        } else {
          throw new Error(`Error de Telegram: ${data.description}`);
        }
      } catch (error) {
        console.error(`Error con proxy ${proxy || 'directo'}:`, error);
        // Continuar con el siguiente proxy
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    return false;
  }

  // Función para guardar alertas pendientes para reintento posterior
function guardarAlertaPendiente(titulo, mensaje) {
    try {
      // Obtener alertas existentes
      let alertasPendientes = JSON.parse(localStorage.getItem('alertasPendientes') || '[]');
      
      // Añadir nueva alerta
      alertasPendientes.push({
        titulo,
        mensaje,
        timestamp: Date.now()
      });
      
      // Limitar a 20 alertas máximo para no saturar el localStorage
      if (alertasPendientes.length > 20) {
        alertasPendientes = alertasPendientes.slice(-20);
      }
      
      // Guardar en localStorage
      localStorage.setItem('alertasPendientes', JSON.stringify(alertasPendientes));
      
      console.log("Alerta guardada para reintento posterior");
    } catch (error) {
      console.error("Error al guardar alerta pendiente:", error);
    }
  }

  // Función para reintentar enviar alertas pendientes
// Esta función debería llamarse periódicamente o cuando el usuario vuelva a conectarse
function reintentarAlertasPendientes() {
    try {
      // Obtener alertas pendientes
      const alertasPendientes = JSON.parse(localStorage.getItem('alertasPendientes') || '[]');
      
      if (alertasPendientes.length === 0) {
        return; // No hay alertas pendientes
      }
      
      console.log(`Reintentando enviar ${alertasPendientes.length} alertas pendientes...`);
      
      // Crear copia del array para poder modificar el original mientras iteramos
      const alertasCopia = [...alertasPendientes];
      
      // Limpiar lista de alertas pendientes
      localStorage.setItem('alertasPendientes', '[]');
      
      // Reintentar enviar cada alerta
      for (const alerta of alertasCopia) {
        // Esperar un breve tiempo entre envíos para no sobrecargar
        setTimeout(() => {
          enviarAlertaTelegram(alerta.titulo, alerta.mensaje);
        }, 2000); // 2 segundos entre cada intento
      }
    } catch (error) {
      console.error("Error al reintentar alertas pendientes:", error);
    }
  }
  
  // Añadir al evento de conexión para reintentar cuando vuelva a estar online
  window.addEventListener('online', function() {
    console.log("Conexión restablecida. Verificando alertas pendientes...");
    reintentarAlertasPendientes();
  });

  // Función auxiliar para mostrar notificaciones en la interfaz
function mostrarNotificacion(titulo, mensaje, esError = false) {
    // Puedes personalizar esto según tu interfaz
    // Por ahora usamos una alerta simple
    alert(`${titulo}: ${mensaje}`);
    
    // Alternativa: crear un elemento de notificación visual en la página
    /*
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${esError ? 'error' : 'exito'}`;
    notificacion.innerHTML = `
      <h4>${titulo}</h4>
      <p>${mensaje}</p>
    `;
    document.body.appendChild(notificacion);
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
      notificacion.classList.add('ocultar');
      setTimeout(() => notificacion.remove(), 500);
    }, 5000);
    */
  }

// Función para activar el parpadeo del icono
function activarParpadeoIcono() {
    const alarmaIcon = document.getElementById("alarmaIcon");
    
    // Removemos la clase primero (por si ya estaba aplicada)
    alarmaIcon.classList.remove("blink-animation");
    
    // Forzamos un reflow para reiniciar la animación
    void alarmaIcon.offsetWidth;
    
    // Añadimos la clase para iniciar la animación
    alarmaIcon.classList.add("blink-animation");
    
    // Opcional: Eliminar la clase después de que termine la animación
    setTimeout(() => {
        alarmaIcon.classList.remove("blink-animation");
    }, 800); // Un poco más que la duración de la animación (0.7s)
}

function actualizarGraficaDatos(grafica, labelsArray, dataArray, nuevoLabel, nuevoValor) {
    try {
        // Verificar si la gráfica está inicializada
        if (!grafica || !grafica.data || !grafica.data.datasets) {
            console.error("La gráfica no está correctamente inicializada");
            return;
        }
        
        // Convertir a número si es string
        const valorNumerico = typeof nuevoValor === 'string' ? parseFloat(nuevoValor) : nuevoValor;
        
        // Agregar nuevos datos
        labelsArray.push(nuevoLabel);
        dataArray.push(valorNumerico);
        
        // Mantener solo los últimos 25 puntos de datos para visualización
        if (labelsArray.length > 25) {
            labelsArray.shift();
            dataArray.shift();
        }
        
        // Actualizar datos en la gráfica
        grafica.data.labels = labelsArray;
        grafica.data.datasets[0].data = dataArray;
        
        // Actualizar límites constantes si es la gráfica de CO2 o Formol
        if (grafica === graficaCO2) {
            // Asegurarnos de que el dataset para el límite exista
            if (grafica.data.datasets.length < 2) {
                grafica.data.datasets.push({
                    label: "Límite 800 ppm",
                    data: [],
                    borderColor: "rgba(26, 80, 161, 0.7)",
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                });
            }
            // Actualizar los datos del límite para que coincidan con la longitud de los datos actuales
            grafica.data.datasets[1].data = Array(labelsArray.length).fill(800);
        } 
        else if (grafica === graficaFormol) {
            // Asegurarnos de que los datasets para los límites existan
            if (grafica.data.datasets.length < 2) {
                grafica.data.datasets.push({
                    label: "Límite 0.75 ppm",
                    data: [],
                    borderColor: "rgba(255, 165, 0, 0.7)",
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                });
            }
            if (grafica.data.datasets.length < 3) {
                grafica.data.datasets.push({
                    label: "Límite 2.00 ppm",
                    data: [],
                    borderColor: "rgba(110, 204, 22, 0.7)",
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                });
            }
            // Actualizar los datos de los límites
            grafica.data.datasets[1].data = Array(labelsArray.length).fill(0.75);
            grafica.data.datasets[2].data = Array(labelsArray.length).fill(2.00);
        }
        
        // Actualizar la gráfica de manera segura
        requestAnimationFrame(() => {
            try {
                grafica.update();
            } catch (e) {
                console.error("Error al actualizar gráfica:", e);
            }
        });
    } catch (error) {
        console.error("Error al actualizar gráfica de datos:", error);
    }
}

// Función mejorada para cambiar de vista (momentos)
function mostrarMomento(momento) {
    try {
        console.log(`Cambiando al Momento ${momento}`);
        
        // Ocultar todos los momentos primero
        for (let i = 1; i <= 3; i++) {
            const elementoMomento = document.getElementById(`momento${i}`);
            if (elementoMomento) {
                elementoMomento.style.display = 'none';
                elementoMomento.classList.add('oculto');
            } else {
                console.error(`Elemento momento${i} no encontrado`);
            }
        }
        
        // Luego mostrar solo el momento solicitado
        const momentoActivo = document.getElementById(`momento${momento}`);
        if (momentoActivo) {
            momentoActivo.style.display = 'block';
            momentoActivo.classList.remove('oculto');
        } else {
            console.error(`Elemento momento${momento} no encontrado`);
        }
        
        // Forzar un redibujado del navegador y desplazarse al inicio
        setTimeout(() => {
            window.scrollTo(0, 0);
            
            // Si estamos en el momento 3, redimensionar las gráficas
            if (momento === 3) {
                if (graficaCO2) graficaCO2.resize();
                if (graficaFormol) graficaFormol.resize();
                if (graficaTempHumedad) graficaTempHumedad.resize();
                if (graficaFormolTemp) graficaFormolTemp.resize();
            }
        }, 50);
        
    } catch (error) {
        console.error(`Error al cambiar al Momento ${momento}:`, error);
    }
}

// Función para mostrar/ocultar la contraseña
function togglePassword() {
    try {
        const passwordInput = document.getElementById("password");
        
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
        } else {
            passwordInput.type = "password";
        }
    } catch (error) {
        console.error("Error al cambiar visibilidad de contraseña:", error);
    }
}

// Función para almacenar datos manteniendo 900 registros máximo
function almacenarDato(array, nuevoValor) {
    try {
        // Convertir a número si es string
        const valorNumerico = typeof nuevoValor === 'string' ? parseFloat(nuevoValor) : nuevoValor;
        
        array.push(valorNumerico);
        if (array.length > 900) {
            array.shift();
        }
    } catch (error) {
        console.error("Error al almacenar dato:", error);
    }
}

// Modificación de la función para guardar datos
// Función modificada para guardar datos con fecha y estado
function guardarDatos() {
    try {
        // Obtener fecha y hora actual
        const ahora = new Date();
        const fechaHora = ahora.toLocaleDateString() + " A LAS " + ahora.toLocaleTimeString();

        // Crear el contenido del archivo
        let contenido = `DATOS TOMADOS EL ${fechaHora}\n`;
        contenido += "CO2\tFormol\tTemp\tHumedad\tEstado\n";

        // Determinar la longitud mínima entre todos los arrays para evitar valores undefined
        const minLength = Math.min(
            datosCO2.length,
            datosFormol.length,
            datosTemp.length,
            datosHumedad.length
        );

        // Verificar si hay datos para guardar
        if (minLength === 0) {
            mostrarNotificacion("DATOS NO GUARDADOS", "error");
            console.error("No hay datos para guardar");
            return;
        }

        // Agregar cada fila de datos, solo hasta la longitud mínima
        for (let i = 0; i < minLength; i++) {
            const co2 = datosCO2[i];
            const formol = datosFormol[i];
            const temp = datosTemp[i];
            const humedad = datosHumedad[i];

            // Determinar el estado según el nivel de formol
            let estado = "PERMITIDO";
            if (formol > 1.5) {
                estado = "PELIGROSO";
            } else if (formol > 0.75) {
                estado = "RIESGOSO";
            }

            contenido += `${co2}\t${formol}\t${temp}\t${humedad}\t${estado}\n`;
        }

        try {
            // Crear un blob con el contenido
            let blob = new Blob([contenido], { type: "text/plain" });

            // Crear un enlace temporal para descargar el archivo
            let link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "datos_sensores.txt";

            // Simular clic en el enlace para descargar
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log("Datos guardados exitosamente");
            mostrarNotificacion("DATOS GUARDADOS CON ÉXITO");
        } catch (downloadError) {
            console.error("Error al descargar datos:", downloadError);
            mostrarNotificacion("DATOS NO GUARDADOS", "error");
        }
    } catch (error) {
        console.error("Error al guardar datos:", error);
        mostrarNotificacion("DATOS NO GUARDADOS", "error");
    }
}

// Función para mostrar notificaciones evanescentes
function mostrarNotificacion(mensaje, tipo = 'success') {
    try {
        // Eliminar cualquier notificación existente
        const notificacionesExistentes = document.querySelectorAll('.toast-notification');
        notificacionesExistentes.forEach(notif => {
            document.body.removeChild(notif);
        });
        
        // Crear el elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `toast-notification ${tipo}`;
        notificacion.textContent = mensaje;
        
        // Añadir al body
        document.body.appendChild(notificacion);
        
        // Forzar un reflow para que la transición funcione
        void notificacion.offsetWidth;
        
        // Mostrar la notificación
        notificacion.classList.add('show');
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notificacion.classList.add('fade-out');
            
            // Eliminar del DOM después de que termine la animación
            setTimeout(() => {
                if (document.body.contains(notificacion)) {
                    document.body.removeChild(notificacion);
                }
            }, 500); // Duración de la animación de desvanecimiento
        }, 6000);
    } catch (error) {
        console.error("Error al mostrar notificación:", error);
    }
}

function actualizarElementosHTML(data) {
    const elementos = {
        co2: data.CO2,
        formol: data.Formaldehído,
        temp: data.Temperatura,
        humedad: data.Humedad
    };
    
    Object.keys(elementos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = elementos[id];
        } else {
            console.error(`Elemento ${id} no encontrado`);
        }
    });
}

function procesarDatosParaGraficas(data) {
    const timestamp = new Date().toLocaleTimeString();
    
    // Convertir todos los valores a números inmediatamente
    const valores = {
        co2: parseFloat(data.CO2) || 0,
        formol: parseFloat(data.Formaldehído) || 0,
        temp: parseFloat(data.Temperatura) || 0,
        humedad: parseFloat(data.Humedad) || 0
    };
    
    console.log("Valores procesados para gráficas:", valores);
    
    // Verificar que las gráficas estén inicializadas antes de actualizar
    if (!verificarGraficasInicializadas()) {
        console.warn("Reinicializando gráficas...");
        inicializarGraficas();
        return; // Salir para no actualizar con gráficas no inicializadas
    }
    
    try {
        // Actualizar cada gráfica de forma independiente y eficiente
        actualizarGraficaCO2Mejorada(timestamp, valores.co2);
        actualizarGraficaFormolMejorada(timestamp, valores.formol);
        actualizarGraficaTempHumedadMejorada(timestamp, valores.temp, valores.humedad);
        actualizarGraficaFormolTempMejorada(valores.temp, valores.formol);
        
    } catch (error) {
        console.error("Error al actualizar gráficas:", error);
        // Reinicializar gráficas en caso de error
        setTimeout(() => {
            inicializarGraficas();
        }, 1000);
    }
}

function verificarGraficasInicializadas() {
    return graficaCO2 && graficaFormol && graficaTempHumedad && graficaFormolTemp &&
           graficaCO2.data && graficaFormol.data && graficaTempHumedad.data && graficaFormolTemp.data;
}

function actualizarGraficaCO2Mejorada(timestamp, valorCO2) {
    if (!graficaCO2 || !graficaCO2.data) {
        console.error("Gráfica CO2 no inicializada");
        return;
    }
    
    try {
        // Agregar nuevos datos a los arrays específicos de la gráfica
        tiempoGrafica.push(timestamp);
        datosCO2Grafica.push(valorCO2);
        
        // Mantener solo los últimos 20 puntos
        if (tiempoGrafica.length > 20) {
            tiempoGrafica.shift();
            datosCO2Grafica.shift();
        }
        
        // Actualizar datos de la gráfica directamente (sin referencias a arrays externos)
        graficaCO2.data.labels = [...tiempoGrafica]; // Crear copia del array
        graficaCO2.data.datasets[0].data = [...datosCO2Grafica]; // Crear copia del array
        
        // Actualizar línea de límite (800 ppm)
        if (graficaCO2.data.datasets[1]) {
            graficaCO2.data.datasets[1].data = Array(tiempoGrafica.length).fill(800);
        }
        
        // Forzar actualización inmediata
      // Actualizar la gráfica de manera segura
        requestAnimationFrame(() => {
            try {
                graficaCO2.update();
            } catch (e) {
                console.error("Error al actualizar gráfica de temperatura y humedad:", e);
            }
        }); // 'none' evita animaciones que pueden causar retrasos
        
        console.log(`CO2 actualizado: ${valorCO2} ppm a las ${timestamp}`);
        
    } catch (error) {
        console.error("Error al actualizar gráfica CO2:", error);
    }
}

function actualizarGraficaFormolMejorada(timestamp, valorFormol) {
    if (!graficaFormol || !graficaFormol.data) {
        console.error("Gráfica Formol no inicializada");
        return;
    }
    
    try {
        // Usar array independiente para formol con su propio tiempo
        if (!window.formolTiempos) {
            window.formolTiempos = [];
        }
        
        // Agregar nuevos datos
        window.formolTiempos.push(timestamp);
        datosFormolGrafica.push(valorFormol);
        
        // Mantener solo los últimos 20 puntos
        if (window.formolTiempos.length > 25) {
            window.formolTiempos.shift();
            datosFormolGrafica.shift();
        }
        
        // Actualizar datos de la gráfica directamente
        graficaFormol.data.labels = [...window.formolTiempos];
        graficaFormol.data.datasets[0].data = [...datosFormolGrafica];
        
        // Actualizar líneas de límites
        const longitudDatos = window.formolTiempos.length;
        if (graficaFormol.data.datasets[1]) {
            graficaFormol.data.datasets[1].data = Array(longitudDatos).fill(0.75);
        }
        if (graficaFormol.data.datasets[2]) {
            graficaFormol.data.datasets[2].data = Array(longitudDatos).fill(2.00);
        }
        
        // Forzar actualización inmediata sin animación
        // Actualizar la gráfica de manera segura
        requestAnimationFrame(() => {
            try {
                graficaFormol.update();
            } catch (e) {
                console.error("Error al actualizar gráfica de temperatura y humedad:", e);
            }
        });
        console.log(`Formol actualizado: ${valorFormol} ppm a las ${timestamp}`);
        
    } catch (error) {
        console.error("Error al actualizar gráfica Formol:", error);
    }
}

function actualizarGraficaTempHumedadMejorada(timestamp, valorTemp, valorHumedad) {
    if (!graficaTempHumedad || !graficaTempHumedad.data) {
        console.error("Gráfica Temperatura/Humedad no inicializada");
        return;
    }
    
    try {
        // Usar arrays independientes globales
        if (!window.tempHumedadTiempos) {
            window.tempHumedadTiempos = [];
        }
        
        // Agregar nuevos datos
        window.tempHumedadTiempos.push(timestamp);
        datosTempGrafica.push(valorTemp);
        datosHumedadGrafica.push(valorHumedad);
        
        // Mantener solo los últimos 20 puntos
        if (window.tempHumedadTiempos.length > 20) {
            window.tempHumedadTiempos.shift();
            datosTempGrafica.shift();
            datosHumedadGrafica.shift();
        }
        
        // Actualizar datos de la gráfica
        graficaTempHumedad.data.labels = [...window.tempHumedadTiempos];
        graficaTempHumedad.data.datasets[0].data = [...datosTempGrafica];
        graficaTempHumedad.data.datasets[1].data = [...datosHumedadGrafica];
        
        // Actualizar la gráfica de manera segura
        requestAnimationFrame(() => {
            try {
                graficaTempHumedad.update();
            } catch (e) {
                console.error("Error al actualizar gráfica de temperatura y humedad:", e);
            }
        });
        console.log(`Temp/Humedad actualizada: ${valorTemp}°C, ${valorHumedad}% a las ${timestamp}`);
        
    } catch (error) {
        console.error("Error al actualizar gráfica Temperatura/Humedad:", error);
    }
}

function actualizarGraficaFormolTempMejorada(valorTemp, valorFormol) {
    if (!graficaFormolTemp || !graficaFormolTemp.data) {
        console.error("Gráfica Formol/Temperatura no inicializada");
        return;
    }
    
    try {
        // Crear nuevo punto de datos
        const nuevoPunto = {
            x: valorTemp,
            y: valorFormol
        };
        
        // Agregar nuevo punto
        graficaFormolTemp.data.datasets[0].data.push(nuevoPunto);
        
        // Mantener solo los últimos 20 puntos
        if (graficaFormolTemp.data.datasets[0].data.length > 20) {
            graficaFormolTemp.data.datasets[0].data.shift();
        }
        
        // Forzar actualización inmediata
        // Actualizar la gráfica de manera segura
        requestAnimationFrame(() => {
            try {
                graficaFormolTemp.update();
            } catch (e) {
                console.error("Error al actualizar gráfica de temperatura y humedad:", e);
            }
        });
        
        console.log(`Formol vs Temp actualizada: ${valorFormol} ppm a ${valorTemp}°C`);
        
    } catch (error) {
        console.error("Error al actualizar gráfica Formol/Temperatura:", error);
    }
}

function limpiarTodasLasGraficas() {
    console.log("Limpiando todas las gráficas...");
    
    // Limpiar arrays de gráficas
    datosFormolGrafica = [];
    datosCO2Grafica = [];
    datosTempGrafica = [];
    datosHumedadGrafica = [];
    tiempoGrafica = [];
    
    // Limpiar datos de las gráficas si están inicializadas
    if (graficaCO2 && graficaCO2.data) {
        graficaCO2.data.labels = [];
        graficaCO2.data.datasets[0].data = [];
        if (graficaCO2.data.datasets[1]) graficaCO2.data.datasets[1].data = [];
        graficaCO2.update('none');
    }
    
    if (graficaFormol && graficaFormol.data) {
        graficaFormol.data.labels = [];
        graficaFormol.data.datasets[0].data = [];
        if (graficaFormol.data.datasets[1]) graficaFormol.data.datasets[1].data = [];
        if (graficaFormol.data.datasets[2]) graficaFormol.data.datasets[2].data = [];
        graficaFormol.update('none');
    }
    
    if (graficaTempHumedad && graficaTempHumedad.data) {
        graficaTempHumedad.data.labels = [];
        graficaTempHumedad.data.datasets[0].data = [];
        graficaTempHumedad.data.datasets[1].data = [];
        graficaTempHumedad.update('none');
    }
    
    if (graficaFormolTemp && graficaFormolTemp.data) {
        graficaFormolTemp.data.datasets[0].data = [];
        graficaFormolTemp.update('none');
    }
}