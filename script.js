// Elementos del DOM
const burbuja = document.getElementById("bot-burbuja");
const modal = document.getElementById("bot-modal");
const chatForm = document.getElementById("chat-form");
const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");

// Estado de sesión
let esperandoNombre = false;
let nombreUsuario = "";
let asesorAsignado = sessionStorage.getItem("asesorAsignado") || "";
let sessionId = localStorage.getItem("chatbot_session_id");

if (!sessionId) {
  sessionId = "user_" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("chatbot_session_id", sessionId);
}

const asesores = ["Sofía", "Andrés", "Camila", "Daniel", "Valentina", "Carlos", "Laura", "Felipe", "Juliana", "Mateo"];

// Función para mostrar mensajes
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "user-message" : "bot-message";
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return msg;
}

// Abrir o cerrar el bot
burbuja.addEventListener("click", () => {
  const isOpen = modal.style.display === "block";
  modal.style.display = isOpen ? "none" : "block";

  if (!sessionStorage.getItem("bienvenidaMostrada") && !isOpen) {
    // Asignar asesor aleatorio si no está asignado
    if (!asesorAsignado) {
      asesorAsignado = asesores[Math.floor(Math.random() * asesores.length)];
      sessionStorage.setItem("asesorAsignado", asesorAsignado);
    }

    // Paso 1: Saludo del asesor
    appendMessage("bot", `¡Hola! Soy ${asesorAsignado}, tu asistente inteligente de IngeLean.`);

    // Paso 2: Pedir nombre del usuario
    setTimeout(() => {
      appendMessage("bot", "¿Cuál es tu nombre?");
      esperandoNombre = true;
    }, 1000); // breve pausa para naturalidad

    sessionStorage.setItem("bienvenidaMostrada", "true");
  }
});

// Envío del formulario
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  userInput.value = "";

  // Paso 3: Guardar nombre del usuario
  if (esperandoNombre) {
    if (/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{1,50}$/.test(message)) {
      nombreUsuario = message.trim().replace(/ +/g, " ");
      appendMessage("bot", `Mucho gusto, ${nombreUsuario}. ¿En qué puedo ayudarte hoy?`);
      esperandoNombre = false;
      userInput.placeholder = "Escribe tu pregunta...";
      userInput.classList.remove("input-error");
    } else {
      appendMessage("bot", "Por favor, ingresa un nombre válido (solo letras).");
      userInput.classList.add("input-error");
    }
    return;
  }

  // Paso 4: Enviar consulta al webhook
  const loadingMessage = appendMessage("bot", "Escribiendo...");

  try {
    const response = await fetch("https://isabellamartl.app.n8n.cloud/webhook/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        name: nombreUsuario,
        message
      })
    });

    if (!response.ok) throw new Error("Error del servidor");

    const data = await response.json();
    loadingMessage.textContent = data.respuesta || "Lo siento, no entendí tu pregunta.";
  } catch (error) {
    loadingMessage.textContent = "Error al conectar con el asistente.";
    console.error(error);
  }
});
