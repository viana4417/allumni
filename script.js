// Estado do formulário: 'cadastro' ou 'login'
let currentMode = 'cadastro';

// Elementos do DOM
const formTitle = document.getElementById('formTitle');
const submitButton = document.getElementById('submitButton');
const toggleButton = document.getElementById('toggleButton');
const authForm = document.getElementById('authForm');
const nomeGroup = document.getElementById('nomeGroup');
const nomeInput = document.getElementById('nome');

// Função para alternar entre Cadastro e Login
function toggleMode() {
    if (currentMode === 'cadastro') {
        // Mudar para modo Login
        currentMode = 'login';
        formTitle.textContent = 'Login';
        submitButton.textContent = 'Entrar';
        toggleButton.textContent = 'Não tenho uma conta. Criar cadastro';
        
        // Ocultar campo Nome
        nomeGroup.classList.add('hidden');
        nomeInput.removeAttribute('required');
    } else {
        // Mudar para modo Cadastro
        currentMode = 'cadastro';
        formTitle.textContent = 'Cadastro';
        submitButton.textContent = 'Criar conta';
        toggleButton.textContent = 'Já tenho uma conta. Fazer login';
        
        // Mostrar campo Nome
        nomeGroup.classList.remove('hidden');
        nomeInput.setAttribute('required', 'required');
    }
}

// Event listeners
toggleButton.addEventListener('click', toggleMode);

submitButton.addEventListener('click', function(e) {
    e.preventDefault();
    
    if (currentMode === 'cadastro') {
        // Lógica de cadastro
        console.log('Cadastrando usuário...');
        // Aqui você pode adicionar a lógica de cadastro
    } else {
        // Lógica de login
        console.log('Fazendo login...');
        // Aqui você pode adicionar a lógica de login
    }
});

