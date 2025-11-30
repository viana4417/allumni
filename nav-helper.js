// Helper para adicionar navegação de admin em todas as páginas

document.addEventListener('DOMContentLoaded', function() {
    const usuario = obterUsuarioLogado();
    if (usuario && usuario.is_admin) {
        mostrarAdminNav();
    }
});

function mostrarAdminNav() {
    const navs = document.querySelectorAll('.sidebar-nav');
    navs.forEach(nav => {
        // Verificar se já existe
        const existingAdmin = nav.querySelector('a[href="admin.html"]');
        if (existingAdmin) {
            existingAdmin.style.display = 'flex';
            return;
        }
        
        // Criar link de admin
        const adminItem = document.createElement('a');
        adminItem.href = 'admin.html';
        adminItem.className = 'nav-item';
        adminItem.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Administração</span>
        `;
        nav.appendChild(adminItem);
    });
}

