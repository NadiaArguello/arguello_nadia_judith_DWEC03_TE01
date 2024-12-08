// ------------------------------ 1. VARIABLES GLOBALES ------------------------------

let tableroJugador, tableroMaquina; // Almacenan el estado del juego
let tiempoTurnoJugador; // Intervalo del temporizador
let barcosJugador, barcosMaquina;
let estadoBarcoJugador = {}, // Estado de los barcos del jugador
    estadoBarcoMaquina = {}; // Estado de los barcos de la máquina
let tiempo;
let historialJuego = []; // Array global para guardar el historial de mensajes

// ------------------------------ 2. CARGA INICIAL DE DATOS ------------------------------

document.addEventListener('DOMContentLoaded', function() {
    const paginaActual = window.location.pathname.split('/').pop(); // Obtiene el nombre del archivo actual

    if (paginaActual === 'bienvenida.html') {
        borrarHistorialJuego();
        inicioTemporizador(); // Inicia el temporizador al cargar bienvenida.html

        // Configura los botones de selección de nivel
        const botonesNivel = document.querySelectorAll('.nivel button');
        botonesNivel.forEach(boton => {
            boton.addEventListener('click', () => {
                clearInterval(intervaloTiempo); // Detén el temporizador si selecciona un nivel
                const nivel = boton.getAttribute('onclick').match(/'(.*?)'/)[1];
                elegirNivel(nivel);
            });
        });
    }

    if (paginaActual === 'resumen.html') {
        cargarHistorialJuego();
    }

    const nivel = localStorage.getItem('nivelElegido');
    let tamanosBarco;

    switch (nivel) {
        case 'principiante':
            tamanoTablero = 8;
            tamanosBarco = [1, 2, 3, 4, 5];
            tiempo = 30;
            break;
        case 'intermedio':
            tamanoTablero = 10;
            tamanosBarco = [1, 2, 3, 4, 5, 6];
            tiempo = 20;
            break;
        case 'avanzado':
            tamanoTablero = 12;
            tamanosBarco = [1, 2, 3, 4, 5, 6, 7];
            tiempo = 10;
            break;
        default:
            tamanoTablero = 8; // Nivel por defecto
            tamanosBarco = [1, 2, 3, 4, 5];
            tiempo = 30;
    }
    // Seleccionamos todos los tableros con la clase 'tablero-jugador'
    const tableros = document.querySelectorAll('.tablero-jugador .grid');

    tableros.forEach(tablero => {
        // Actualiza el número de columnas dinámicamente
        tablero.style.gridTemplateColumns = `repeat(${tamanoTablero}, 1fr)`;
    });

    tableroJugador = crearTablero('rejillaJugador');
    tableroMaquina = crearTablero('rejillaMaquina');
    estadoBarcoJugador = {};
    estadoBarcoMaquina = {};
    colocarTodosBarcos(tableroJugador, tamanosBarco, estadoBarcoJugador);
    colocarTodosBarcos(tableroMaquina, tamanosBarco, estadoBarcoMaquina);
    dibujarTabla("rejillaJugador", tableroJugador, true, nivel);
    dibujarTabla("rejillaMaquina", tableroMaquina, false, nivel);
    mostrarAccion("¡A jugar!");
    entradaHistorialDeJuego(`Partida iniciada`);

});

// ------------------------------ 3. FUNCIONES ------------------------------

/*Inicia el temporizador de 100segundos de  la página "Bienvenida" y, si el temporizador llega a 0 antes de que 
 *el jugador haya elegido un nivel, redirige al jugador de vuelta a la página de Login */
function inicioTemporizador() {
    const temporizador = document.querySelector('.temporizador');
    let segundosTotales = 100; // 1 minuto y 40 segundos = 100 segundos

    intervaloTiempo = setInterval(() => {
        segundosTotales--;

        const minutos = Math.floor(segundosTotales / 60);
        const segundos = segundosTotales % 60;

        temporizador.textContent = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

        if (segundosTotales <= 0) {
            clearInterval(intervaloTiempo);
            alert('El tiempo se agotó. Regresando al inicio...');
            location.href = '../index.html'; // Redirige al login
        }
    }, 1000);
}

/*Crea un tablero en el contenedor indicado
 *    @Parámetro de entrada: El nombre del contenedor
 *    @Salida: Un array vacío del tamaño del tablero según la dificultad elegida */
function crearTablero(localizacion) {
    const contenedorTablero = document.getElementById(localizacion);
    
    contenedorTablero.innerHTML = ''; // Limpia el contenedor
    
    return Array(tamanoTablero)
        .fill(null)
        .map(() => Array(tamanoTablero).fill(0));
}

/*Coloca todos barcos aleatoriamente con IDs únicos. 
 * Para ello, recorrerá uno a uno todos los tamaños de barco que se introduzcan, asignará una posición y una dirección aleatorias y comprobará si el barco puede colocarse.
 * Si el barco puede colocarse, llamará a la función colocarUnBarco asignando una ID única al barco, de forma que esta función registe la ID del barco en la posición deseada.
 *    @Parámetros de entrada: 
 *      - El tablero
 *      - Los tamaños de barco
 *      - El estado de los barcos
 *    @Salida: No devuelve nada, sólamente define la posición de los barcos en el tablero ya creado */
function colocarTodosBarcos(tablero, tamanosBarco, estadoBarco) {
    let idBarcoActual = 1; // Cada barco tiene un ID único
    tamanosBarco.forEach(tamanoBarco => {
        let colocado = false;
        while (!colocado) {
            const direccion = Math.random() < 0.5 ? "horizontal" : "vertical";
            const x = Math.floor(Math.random() * tamanoTablero);
            const y = Math.floor(Math.random() * tamanoTablero);

            if (puedeColocarseBarco(tablero, x, y, tamanoBarco, direccion)) {
                colocarUnBarco(tablero, x, y, tamanoBarco, direccion, idBarcoActual);
                estadoBarco[idBarcoActual] = tamanoBarco; // Registra el tamaño del barco
                idBarcoActual++;
                colocado = true;
            }
        }
    });
}

/* Verificar si un barco puede colocarse en una posición.
 * Comprobará que las celdas que ocupa un barco en el tablero no estén ya ocupadas o no tengan otro barco al lado
 *    @Parámetros de entrada: 
 *      - El tablero
 *      - La posición en x de la celda seleccionada
 *      - La posición en y de la celda seleccionada
 *      - El tamaño del barco
 *      - La dirección
 *    @Salida: Devuelve un valor boolean que nos indica si un barco puede o no puede colocarse  
*/
function puedeColocarseBarco(tablero, x, y, tamano, direccion) {
    if (direccion === "horizontal") {
        if (y + tamano > tamanoTablero) return false; // No cabe horizontalmente
        for (let i = -1; i <= tamano; i++) {
            for (let j = -1; j <= 1; j++) {
                const nx = x + j;
                const ny = y + i;
                if (nx >= 0 && nx < tamanoTablero && ny >= 0 && ny < tamanoTablero && tablero[nx][ny] !== 0) {
                    return false; // // Hay un barco al lado o en alguna de las celdas seleccionadas y por lo tanto no puede colocarse el barco en esta posición
                }
            }
        }
    } else {
        if (x + tamano > tamanoTablero) return false; // No cabe verticalmente
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= tamano; j++) {
                const nx = x + j;
                const ny = y + i;
                if (nx >= 0 && nx < tamanoTablero && ny >= 0 && ny < tamanoTablero && tablero[nx][ny] !== 0) {
                    return false; // Hay un barco al lado o en alguna de las celdas seleccionadas y por lo tanto no puede colocarse el barco en esta posición
                }
            }
        }
    }
    return true;
}

/* Coloca el barco en el tablero. 
 *    @Parámetros de entrada: 
 *      - El tablero
 *      - La posición en x de la celda seleccionada
 *      - La posición en y de la celda seleccionada
 *      - El tamaño del barco
 *      - La dirección
 *      - La ID del barco en cuestión
 *    @Salida: No devuelve nada. Actualiza el array del tablero grabando la ID del barco en las celdas correspondientes.
*/
function colocarUnBarco(tablero, x, y, tamano, direccion, idBarco) {
    if (direccion === "horizontal") {
        for (let i = 0; i < tamano; i++) {
            tablero[x][y + i] = idBarco; // Asigna la ID del barco a las celdas correspondientes
        }
    } else {
        for (let i = 0; i < tamano; i++) {
            tablero[x + i][y] = idBarco; // Asigna la ID del barco a las celdas correspondientes
        }
    }
}

/* Dibuja las tablas en el DOM. 
 *    @Parámetros de entrada: 
 *      - El contenedor donde se va a dibujar la tabla
 *      - El tablero, con los barcos ya colocados en él
 *      - Un balor boolean que indica si el tablero es del jugador o no
 *      - El nivel seleccionado
 *    @Salida: No devuelve nada. Dibuja el tablero en él.
*/
function dibujarTabla(idContenedor, tablero, esJugador, nivel) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.innerHTML = ""; // Limpiar contenido previo

    // Creación del contenedor principal del tablero
    const contenedorTablero = document.createElement("div");
    contenedorTablero.className = "contenedor-tablero";
    contenedorTablero.style.display = "grid";
    switch (nivel) { //Adapta la anchura de las celdas del tablero en función de su número
        case 'principiante':
            contenedorTablero.style.gridTemplateColumns = `30px repeat(${tamanoTablero}, 4vw)`;
            break;
        case 'intermedio':
            contenedorTablero.style.gridTemplateColumns = `30px repeat(${tamanoTablero}, 3.2vw)`;
            break;
        case 'avanzado':
            contenedorTablero.style.gridTemplateColumns = `30px repeat(${tamanoTablero}, 2.7vw)`;
            break;
        default:
            contenedorTablero.style.gridTemplateColumns = `30px repeat(${tamanoTablero}, 4vw)`;

    }

    contenedorTablero.style.gridTemplateRows = `30px repeat(${tamanoTablero}, 1fr)`;

    // Etiqueta superior izquierda (vacía)
    const zonaVacia = document.createElement("div");
    contenedorTablero.appendChild(zonaVacia);

    // Etiquetas de columnas (A, B, C, ...)
    for (let columna = 0; columna < tamanoTablero; columna++) {
        const etiqColumna = document.createElement("div");
        etiqColumna.className = "label";
        etiqColumna.textContent = String.fromCharCode(65 + columna); // Letras A, B, C...
        contenedorTablero.appendChild(etiqColumna);
    }

    // Filas del tablero con etiquetas de fila (1, 2, 3...)
    tablero.forEach((row, x) => {
        // Etiqueta de fila
        const etiqFila = document.createElement("div");
        etiqFila.className = "label";
        etiqFila.textContent = x + 1; // Números 1, 2, 3...
        contenedorTablero.appendChild(etiqFila);

        // Celdas del tablero
        row.forEach((cell, y) => {
            const celda = document.createElement("div");
            celda.className = "cell";
            celda.dataset.x = x;
            celda.dataset.y = y;

            //En el tablero del jugador coloca la imagen de un barco en las celdas que contengan barcos
            if (esJugador && cell > 0) {
                const imagen = document.createElement("img");
                imagen.src = '../img/barco-pirata.png';
                celda.appendChild(imagen);
            }

            //En el tablero de la máquina convierte las celdas en botones que se pueden pulsar durante el turno del jugador
            if (!esJugador) {
                celda.addEventListener("click", turnoJugador);
            }

            contenedorTablero.appendChild(celda);
        });
    });

    contenedor.appendChild(contenedorTablero);
}

/* Convierte las coordenadas x, y a un formato "letra-número" como A1, B2, etc.
 *    @Parámetros de entrada: 
 *      - Coordenada x de una celda
 *      - Coordenada y de una celda
 *    @Salida: La celda en coordenadas letra/número
*/
function conseguirCoordenadas(x, y) {
    const letra = String.fromCharCode(65 + y); // A, B, C... (columna)
    const numero = x + 1; // 1, 2, 3... (fila)
    return `${letra}${numero}`;
}

/* Define un turno del jugador
 * Cuando el jugador hace click en una celda del tablero de la máquina, comprueba si en ella hay un barco
 *    @Parámetros de entrada: El evento, en este caso el click del jugador en una celda del tablero de la máquina
 *    @Salida: No devuelve nada. Simplemente se selecciona una celda y comprueba su valor. La marca como "acierto" o  "fallo"
*/
function turnoJugador(e) {
    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    const coordenadasCelda = conseguirCoordenadas(x, y);

    const valorCelda = tableroMaquina[x][y]; //Recibe el valor almacenado en la celda donde el jugador ha hecho click

    //Si el valor recibido no es cero, en la celda hay un barco. Ha "TOCADO" una de las partes del barco
    if (valorCelda > 0) {
        e.target.classList.add("hit");
        const idBarco = valorCelda;
        estadoBarcoMaquina[idBarco]--; // Reduce las partes restantes del barco
        tableroMaquina[x][y] = -1; // Marca el barco golpeado

        //Si al barco golpeado no le quedan más partes, el barco está hundido. Lo registra e informa al jugador en el DOM. Mostrará el dibujo de una explosión en el tablero de la máquina y la celda se volverá roja.
        if (estadoBarcoMaquina[idBarco] === 0) {
            mostrarAccion(`Has atacado al enemigo en la celda ${coordenadasCelda}`);
            mostrarResultado("¡HUNDIDO!");
            entradaHistorialDeJuego(`Has atacado al enemigo en la celda ${coordenadasCelda}. ¡HUNDIDO!`);
            const imagen = document.createElement('img');
            imagen.src = '../img/explosion.png'; // Ruta de la imagen
            e.target.appendChild(imagen);
 
        //Si al barco golpeado le quedan más partes, el barco está tocado. Lo registra e informa al jugador en el DOM. Mostrará el dibujo de un barco en el tablero de la máquina y la celda se volverá roja.
        } else {    
            mostrarAccion(`Has atacado al enemigo en la celda ${coordenadasCelda}`);
            mostrarResultado("¡TOCADO!");
            entradaHistorialDeJuego(`Has atacado al enemigo en la celda ${coordenadasCelda}. ¡TOCADO!`);
            const imagen = document.createElement('img');
            imagen.src = '../img/barco-militar.png'; // Ruta de la imagen
            e.target.appendChild(imagen);
        }
    //Si el valor de la celda recibido es cero, el jugador ha fallado. Lo registra e informa al jugador en el DOM. Mostrará el dibujo de una gota de agua en el tablero de la máquina y la celda se volverá azul.
    } else if (valorCelda === 0) {
        e.target.classList.add("miss");
        tableroMaquina[x][y] = -1; // Marcar agua
        mostrarAccion(`Has atacado al enemigo en la celda ${coordenadasCelda}`);
        mostrarResultado("¡AGUA!");
        entradaHistorialDeJuego(`Has atacado al enemigo en la celda ${coordenadasCelda}. ¡AGUA!`);
        const imagen = document.createElement('img');
        imagen.src = '../img/agua.png'; // Ruta de la imagen
        e.target.appendChild(imagen);

    }

    //Deshabilita los clicks en el tablero de la máquina para que el jugador no pueda seguir atacando.
    e.target.removeEventListener("click", turnoJugador);
    deshabilitarClicksJugador();

    clearInterval(tiempoTurnoJugador); // Detiene el temporizador

    comprobarGameOver(); //Comprueba si el juego se ha acabado.

    //Si el juego no se ha acabado, pasa a ser turno de la máquina, con un pequeño retardo.
    if (barcosMaquina > 0) {
        setTimeout(turnoMaquina, 1000);
    }
}

/* Inicia un temporizador durante el turno del jugador.
Si el temporizador termina antes de que el jugador ataque, este pierde su turno
*/
function reiniciarTemporizadorTurno() {
    const temporizador = document.querySelector('.reloj');
    let segundosTotales = tiempo;

    tiempoTurnoJugador = setInterval(() => {
        segundosTotales--;

        temporizador.textContent = `${String(segundosTotales).padStart(2, '0')}`;

        //Si el temporizador termina
        if (segundosTotales <= 0) {
            clearInterval(tiempoTurnoJugador); //Reinicia el temporizador
            mostrarAccion('El tiempo se agotó.');
            mostrarResultado('¡PIERDES TU TURNO!');
            entradaHistorialDeJuego(`El tiempo se agotó. Pierdes tu turno`);
            deshabilitarClicksJugador(); // Deshabilita clics del jugador
            setTimeout(turnoMaquina, 1000); // Pasa a ser turno de la máquina
        }
    }, 1000);
}

/* Define un turno de la máquina
 * Después de que termina el turno del jugador, la máquina ataca una celda al azar del jugador
 *    @Parámetros de entrada: No tiene
 *    @Salida: No devuelve nada. Simplemente selecciona una celda y comprueba su valor. La marca como "acierto" o  "fallo"
*/
function turnoMaquina() {
    
    //Selecciona una casilla al azar del tablero del jugador
    let x, y;
    do {
        x = Math.floor(Math.random() * tamanoTablero);
        y = Math.floor(Math.random() * tamanoTablero);
    } while (tableroJugador[x][y] === -1);

    const coordenadasCelda = conseguirCoordenadas(x, y);
    const celda = document.querySelector(
        `#rejillaJugador .cell[data-x="${x}"][data-y="${y}"]`
    );

    const valorCelda = tableroJugador[x][y];

    //Si el valor recibido no es cero, en la celda hay un barco. Ha "TOCADO" una de las partes del barco
    if (valorCelda > 0) {
        celda.classList.add("hit");
        const idBarco = valorCelda;
        estadoBarcoJugador[idBarco]--; // Reduce partes restantes del barco
        tableroJugador[x][y] = -1; // Marca el barco golpeado

        //Si al barco golpeado no le quedan más partes, el barco está hundido. Lo registra e informa al jugador en el DOM. La celda se volverá roja.
        if (estadoBarcoJugador[idBarco] === 0) {
            mostrarAccion(`El enemigo te ha atacado en la celda ${coordenadasCelda}`);
            mostrarResultado("¡HUNDIDO!");
            entradaHistorialDeJuego(`La máquina te ha atacado en la celda ${coordenadasCelda}. ¡HUNDIDO!`);
        //Si al barco golpeado le quedan más partes, el barco está tocado. Lo registra e informa al jugador en el DOM. La celda se volverá roja.
        } else {
            mostrarAccion(`El enemigo te ha atacado en la celda ${coordenadasCelda}`);
            mostrarResultado("¡TOCADO!");
            entradaHistorialDeJuego(`La máquina te ha atacado en la celda ${coordenadasCelda}. ¡TOCADO!`);
        }

    //Si el valor de la celda recibido es cero, el jugador ha fallado. Lo registra e informa al jugador en el DOM. La celda se volverá azul.
    } else if (valorCelda === 0) {
        celda.classList.add("miss");
        tableroJugador[x][y] = -1; // Marcar agua
        mostrarAccion(`El enemigo te ha atacado en la celda ${coordenadasCelda}`);
        mostrarResultado("¡AGUA!");
        entradaHistorialDeJuego(`La máquina te ha atacado en la celda ${coordenadasCelda}. ¡AGUA!`);
    }

    comprobarGameOver(); //Comprueba si el juego se ha acabado.

    reiniciarTemporizadorTurno(); // Reinicia el temporizador

    habilitarClicksJugador(); //Vuelve a habilitar los clicks del jugador para que, al pasar a ser su turno, este pueda atacar una casilla del tablero de la máquina

}

//Deshabilita los clicks del jugador para que este no pueda atacar una casilla del tablero de la máquina
function deshabilitarClicksJugador() {
    const celdasMaquina = document.querySelectorAll("#rejillaMaquina .cell");
    celdasMaquina.forEach(celda => {
        celda.style.pointerEvents = "none"; // Deshabilita clics
    });
}

//Habilita los clicks del jugador para que este pueda atacar una casilla del tablero de la máquina
function habilitarClicksJugador() {
    const celdasMaquina = document.querySelectorAll("#rejillaMaquina .cell");
    celdasMaquina.forEach(celda => {
        celda.style.pointerEvents = "auto"; // Habilita clics
    });
}

// Verifica si el juego terminó comprobando si tanto al jugador como a la máquina le quedan barcos
function comprobarGameOver() {
    barcosJugador = Object.values(estadoBarcoJugador).reduce((a, b) => a + b, 0);
    barcosMaquina = Object.values(estadoBarcoMaquina).reduce((a, b) => a + b, 0);

    const dibujoFinal = document.getElementById("dibujo-final");
    dibujoFinal.innerHTML = ""; // Limpiar el contenido anterior, si lo hubiera

    const imagen = document.createElement("img"); // Crear una nueva imagen

    //Si los barcos del jugador se reducen a cero, el jugador pierde
    if (barcosJugador === 0) {
        mostrarAccion("La máquina gana");
        mostrarResultado("¡HAS PERDIDO TU FLOTA!");
        entradaHistorialDeJuego(`La máquina gana. ¡HAS PERDIDO TU FLOTA!`);
        // Mostrar la imagen de partida perdida
        imagen.src = "../img/partida-perdida.png";
        dibujoFinal.appendChild(imagen);
        dibujoFinal.classList.remove("hidden"); //Muestra el dibujo final, que estaba oculto 
        document.getElementById('resumen').classList.remove('hidden'); //Muestra el botón para ir al resumen que estaba oculto
        terminarJuego();
 
    //Si los barcos de la máquina se reducen a cero, la máquina pierde
    } else if (barcosMaquina === 0) {
        mostrarAccion("Has ganado la partida");
        mostrarResultado("¡FELICIDADES MARINERO!");
        entradaHistorialDeJuego(`Has ganado la partida. ¡FELICIDADES MARINERO!`);
        // Mostrar la imagen de partida perdida
        imagen.src = "../img/partida-ganada.png";
        dibujoFinal.appendChild(imagen);
        dibujoFinal.classList.remove("hidden"); //Muestra el dibujo final, que estaba oculto
        document.getElementById('resumen').classList.remove('hidden'); //Muestra el botón para ir al resumen que estaba oculto
        terminarJuego();
    }
}

// Finaliza el juego desactivando la opción de que el jugador pueda hacer click en más celdas de la máquina y deteniendo el temporizador
function terminarJuego() {
    document.querySelectorAll("#rejillaMaquina .cell").forEach(celda => {
        celda.removeEventListener("click", turnoJugador);
    });
    clearInterval(tiempoTurnoJugador); 
}

// Muestra mensajes en el DOM de la interfaz de juego. Se utiliza para mostrar las acciones de las celdas atacadas por el jugador y la máquina
function mostrarAccion(mensaje) {
    document.getElementById("action").textContent = mensaje;
}

// Muestra mensajes en el DOM de la interfaz de juego. Se utiliza para mostrar el resultado de un ataque
function mostrarResultado(mensaje) {
    document.getElementById("result").textContent = mensaje;
}

//Almacena en el localStorage el nivel seleccionado por el jugador y redirige a la página juego.html
function elegirNivel(nivel) {
    localStorage.setItem('nivelElegido', nivel);
    location.href = './juego.html';
}

// Añade un mensaje al historial del juego
function entradaHistorialDeJuego(mensaje) {
    const historia = JSON.parse(localStorage.getItem('historialJuego')) || [];
    historia.push(mensaje);
    localStorage.setItem('historialJuego', JSON.stringify(historia));
}

// Muestra en el contenedor de resumen el contenido del historial del juego
function cargarHistorialJuego() {
    const contenedorHistoria = document.querySelector('.resumenJuego');
    const historia = JSON.parse(localStorage.getItem('historialJuego')) || [];

    // Limpia el contenedor de la interfaz de resumen y agrega cada mensaje del historial
    contenedorHistoria.innerHTML = '';
    historia.forEach(mensaje => {
        const textoMensaje = document.createElement('p');
        textoMensaje.textContent = mensaje;
        contenedorHistoria.appendChild(textoMensaje);
    });
}

// Borra el historial del juego
function borrarHistorialJuego() {
    localStorage.removeItem('historialJuego');
}