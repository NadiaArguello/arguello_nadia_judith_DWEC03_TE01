document.addEventListener("DOMContentLoaded", function() {
    fetch('../data/usuarios.json')
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('usuarios', JSON.stringify(data));
        });
});

function validarFormulario(event) {
    event.preventDefault();
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;
    const usuarios = JSON.parse(localStorage.getItem('usuarios'));
    const loginIncorrecto = document.getElementById('login-incorrecto');
    const mensajeLogin = document.getElementById('mensaje-login');
    const imagenError = document.getElementById('imagen-error');

    const usuarioValido = usuarios.find(u => u.usuario === usuario && u.contraseña === password);

    if (!/^[a-zA-Z0-9]+$/.test(password)) {
        mensajeLogin.textContent = 'La contraseña debe ser alfanumérica.';
        imagenError.src = '../img/aspa-roja.png'; // Ruta de la imagen de error
        imagenError.style.display = 'inline';
        loginIncorrecto.style.display = 'flex';
        return false;
    }

    if (usuarioValido) {
        location.href = './web/bienvenida.html';
    } else {
        mensajeLogin.textContent = 'Usuario o contraseña incorrectos.';
        imagenError.src = '../img/aspa-roja.png'; // Ruta de la imagen de error
        imagenError.style.display = 'inline';
        loginIncorrecto.style.display = 'flex';
    }
}