// ============================================================
// Panel de Gestión de Usuarios
// Actividad 1 - JavaScript: fetch, async/await, map, filter, DOM
// ============================================================

// URL de la API real (si la cambias por una incorrecta, se muestra el error)
const URL_API = "https://jsonplaceholder.typicode.com/users";

// ---------- Referencias al DOM ----------
const formulario = document.getElementById("formulario");
const inputId = document.getElementById("id");
const inputNombre = document.getElementById("nombre");
const inputCorreo = document.getElementById("correo");
const inputCiudad = document.getElementById("ciudad");
const botonEnviar = document.getElementById("boton-enviar");
const botonCancelar = document.getElementById("boton-cancelar");
const tituloFormulario = document.getElementById("titulo-formulario");
const buscador = document.getElementById("buscador");
const tbody = document.getElementById("tabla-usuarios");
const mensaje = document.getElementById("mensaje");
const resumen = document.getElementById("resumen");

// ---------- Estado de la aplicación ----------
// Array de objetos { id, nombre, correo, ciudad }
let usuarios = [];
// Guarda el id del usuario que se está editando (null = modo agregar)
let idEditando = null;

// ---------- Mensajes de estado ----------
// tipo: "info" | "exito" | "error"
const mostrarMensaje = (texto, tipo = "info") => {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
};

// ---------- Utilidades ----------
// Escapa caracteres especiales para insertar texto de forma segura en innerHTML
const escapar = (texto) =>
  String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Imprime en consola el array completo cada vez que cambia la lista
const registrarEnConsola = () => {
  console.log(JSON.stringify(usuarios, null, 2));
};

// Cuenta usuarios por ciudad usando un bucle for...of
const contarPorCiudad = (lista) => {
  const conteo = {};
  for (const { ciudad } of lista) {
    conteo[ciudad] = (conteo[ciudad] || 0) + 1;
  }
  return conteo;
};

// ---------- Dibujar la tabla ----------
// Recibe la lista a mostrar (puede ser la completa o la filtrada)
const dibujarTabla = (lista) => {
  // Si no hay usuarios, se muestra una fila informativa
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No hay usuarios para mostrar.</td></tr>`;
  } else {
    // map() convierte cada usuario en el HTML de su fila
    // Destructuring: extraemos los campos del objeto en los parámetros
    tbody.innerHTML = lista
      .map(
        ({ id, nombre, correo, ciudad }) => `
        <tr>
          <td data-etiqueta="Id">${id}</td>
          <td data-etiqueta="Nombre">${escapar(nombre)}</td>
          <td data-etiqueta="Correo">${escapar(correo)}</td>
          <td data-etiqueta="Ciudad">${escapar(ciudad)}</td>
          <td class="acciones">
            <button class="btn btn-editar" data-accion="editar" data-id="${id}">Editar</button>
            <button class="btn btn-eliminar" data-accion="eliminar" data-id="${id}">Eliminar</button>
          </td>
        </tr>`
      )
      .join("");
  }

  // Resumen: total de usuarios y cantidad por ciudad
  const conteo = contarPorCiudad(usuarios);
  const textoCiudades = Object.entries(conteo)
    .map(([ciudad, cantidad]) => `${ciudad} (${cantidad})`)
    .join(", ");
  resumen.textContent = `Mostrando ${lista.length} de ${usuarios.length} usuarios. Por ciudad: ${textoCiudades || "—"}`;
};

// Aplica el filtro del buscador y redibuja la tabla
// filter() NO modifica el array original, crea uno nuevo
const actualizarVista = () => {
  const texto = buscador.value.trim().toLowerCase();
  const filtrados = usuarios.filter(({ nombre }) =>
    nombre.toLowerCase().includes(texto)
  );
  dibujarTabla(filtrados);
};

// Se llama cada vez que cambia la lista de usuarios
const listaCambio = () => {
  registrarEnConsola();
  actualizarVista();
};

// ---------- Carga de datos con fetch + async/await ----------
const cargarUsuarios = async () => {
  mostrarMensaje("Cargando...", "info");
  try {
    const res = await fetch(URL_API);
    if (!res.ok) {
      throw new Error(`Respuesta del servidor: ${res.status}`);
    }
    const datos = await res.json();

    // map() transforma los datos de la API al formato de nuestra tabla
    usuarios = datos.map(({ id, name, email, address }) => ({
      id,
      nombre: name,
      correo: email,
      ciudad: address.city,
    }));

    listaCambio();
    mostrarMensaje(`Se cargaron ${usuarios.length} usuarios.`, "exito");
  } catch (error) {
    console.error(error);
    mostrarMensaje(
      "No pudimos cargar los usuarios. Revisa tu conexión e inténtalo de nuevo.",
      "error"
    );
    dibujarTabla([]);
  }
};

// ---------- Validación del formulario ----------
// Devuelve un código con el resultado; luego un switch elige el mensaje
const validarFormulario = ({ id, nombre, correo, ciudad }) => {
  // Bucle para revisar que ningún campo esté vacío
  const campos = { id, nombre, correo, ciudad };
  for (const valor of Object.values(campos)) {
    if (valor.trim() === "") return "VACIO";
  }
  if (isNaN(Number(id))) return "ID_NO_NUMERICO";
  if (!correo.includes("@")) return "CORREO_INVALIDO";

  // Solo se revisa que el id no exista al agregar (al editar el id no cambia)
  const existe = usuarios.some((u) => u.id === Number(id));
  if (idEditando === null && existe) return "ID_REPETIDO";

  return "OK";
};

const mensajeDeValidacion = (resultado, id) => {
  switch (resultado) {
    case "VACIO":
      return "Todos los campos son obligatorios.";
    case "ID_NO_NUMERICO":
      return "El id debe ser un número.";
    case "CORREO_INVALIDO":
      return "El correo debe contener '@'.";
    case "ID_REPETIDO":
      return `Ya existe un usuario con el id ${id}`;
    default:
      return "";
  }
};

// ---------- Modo del formulario ----------
const limpiarFormulario = () => {
  formulario.reset();
  inputId.disabled = false;
  idEditando = null;
  botonEnviar.textContent = "Agregar";
  tituloFormulario.textContent = "Registrar usuario";
  botonCancelar.hidden = true;
};

// ---------- Evento submit: agregar o guardar cambios ----------
formulario.addEventListener("submit", (event) => {
  event.preventDefault();

  const datos = {
    id: inputId.value,
    nombre: inputNombre.value,
    correo: inputCorreo.value,
    ciudad: inputCiudad.value,
  };

  const resultado = validarFormulario(datos);
  if (resultado !== "OK") {
    mostrarMensaje(mensajeDeValidacion(resultado, datos.id), "error");
    return;
  }

  const { id, nombre, correo, ciudad } = datos;

  if (idEditando === null) {
    // AGREGAR: creamos el objeto y lo añadimos con spread (nuevo array)
    const nuevo = {
      id: Number(id),
      nombre: nombre.trim(),
      correo: correo.trim(),
      ciudad: ciudad.trim(),
    };
    usuarios = [...usuarios, nuevo];
    mostrarMensaje(`Usuario "${nuevo.nombre}" agregado correctamente.`, "exito");
  } else {
    // MODIFICAR: buscamos el usuario por su id y lo reemplazamos
    usuarios = usuarios.map((u) =>
      u.id === idEditando
        ? {
            ...u,
            nombre: nombre.trim(),
            correo: correo.trim(),
            ciudad: ciudad.trim(),
          }
        : u
    );
    mostrarMensaje(`Usuario con id ${idEditando} actualizado correctamente.`, "exito");
  }

  limpiarFormulario();
  listaCambio();
});

// ---------- Evento input: búsqueda en vivo ----------
buscador.addEventListener("input", actualizarVista);

// ---------- Evento click: Editar y Eliminar (delegación sobre el tbody) ----------
tbody.addEventListener("click", (event) => {
  const boton = event.target.closest("button[data-accion]");
  if (!boton) return;

  const { accion, id } = boton.dataset; // destructuring del dataset
  const idNumero = Number(id);
  const usuario = usuarios.find((u) => u.id === idNumero);
  if (!usuario) return;

  if (accion === "editar") {
    // Cargamos los datos en el formulario y bloqueamos el id
    const { id: uid, nombre, correo, ciudad } = usuario;
    inputId.value = uid;
    inputNombre.value = nombre;
    inputCorreo.value = correo;
    inputCiudad.value = ciudad;
    inputId.disabled = true;
    idEditando = uid;
    botonEnviar.textContent = "Guardar cambios";
    tituloFormulario.textContent = `Editando usuario ${uid}`;
    botonCancelar.hidden = false;
    mostrarMensaje(`Editando a ${nombre}. Modifica los datos y guarda.`, "info");
    formulario.scrollIntoView({ behavior: "smooth" });
  } else if (accion === "eliminar") {
    // Pedimos confirmación antes de eliminar
    if (confirm(`¿Seguro que quieres eliminar a ${usuario.nombre}?`)) {
      // filter() deja todos los usuarios menos el eliminado
      usuarios = usuarios.filter((u) => u.id !== idNumero);

      // Si se estaba editando justo ese usuario, se cancela la edición
      if (idEditando === idNumero) limpiarFormulario();

      listaCambio();
      mostrarMensaje(`Usuario "${usuario.nombre}" eliminado correctamente.`, "exito");
    }
  }
});

// ---------- Botón cancelar edición ----------
botonCancelar.addEventListener("click", () => {
  limpiarFormulario();
  mostrarMensaje("Edición cancelada.", "info");
});

// ---------- Inicio: cargar usuarios al abrir la página ----------
cargarUsuarios();
