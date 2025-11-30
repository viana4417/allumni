// Script para página de Administração

document.addEventListener('DOMContentLoaded', async function() {
    // Aguardar inicialização do banco
    if (typeof initDB === 'function') {
        await initDB();
        await initDefaultData();
    }
    
    const usuario = verificarLogin();
    if (!usuario) return;
    
    // Verificar se é admin
    if (!usuario.is_admin) {
        alert('Acesso negado. Apenas administradores podem acessar esta página.');
        window.location.href = 'home.html';
        return;
    }
    
    // Mostrar link de admin na navegação de todas as páginas
    mostrarAdminNav();
    
    await carregarUsuarios(usuario.id);
});

function mostrarAdminNav() {
    // Adicionar link de admin em todas as páginas
    const navs = document.querySelectorAll('.sidebar-nav');
    navs.forEach(nav => {
        const adminLink = nav.querySelector('#adminNav');
        if (!adminLink) {
            const adminItem = document.createElement('a');
            adminItem.href = 'admin.html';
            adminItem.className = 'nav-item';
            adminItem.id = 'adminNav';
            adminItem.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Administração</span>
            `;
            nav.appendChild(adminItem);
        }
    });
}

async function carregarUsuarios(adminId) {
    try {
        const usuarios = await listarUsuariosAdmin(adminId);
        const adminContent = document.getElementById('adminContent');
        
        if (!adminContent) return;
        
        if (usuarios.length === 0) {
            adminContent.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Nenhum usuário encontrado.</p>';
            return;
        }
        
        adminContent.innerHTML = '';
        
        usuarios.forEach(usuario => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            
            const badges = [];
            if (usuario.is_admin) badges.push('<span class="badge badge-admin">Admin</span>');
            if (usuario.status_conta === 'fechada') {
                badges.push('<span class="badge badge-fechada">Conta Fechada</span>');
            } else {
                badges.push('<span class="badge badge-ativa">Ativa</span>');
            }
            
            userItem.innerHTML = `
                <div class="user-info">
                    <div class="user-name">${usuario.nome || 'Sem nome'}</div>
                    <div class="user-email">${usuario.email}</div>
                    <div class="user-badges">${badges.join('')}</div>
                </div>
                <div class="user-actions">
                    ${usuario.status_conta === 'fechada' 
                        ? `<button class="btn-action btn-reabrir" onclick="reabrirConta(${usuario.id})">Reabrir Conta</button>`
                        : `<button class="btn-action btn-fechar" onclick="fecharConta(${usuario.id})">Fechar Conta</button>`
                    }
                    ${usuario.is_admin 
                        ? `<button class="btn-action btn-remove-admin" onclick="removerAdmin(${usuario.id})" ${usuario.id === parseInt(localStorage.getItem('usuarioLogado') ? JSON.parse(localStorage.getItem('usuarioLogado')).id : 0) ? 'disabled' : ''}>Remover Admin</button>`
                        : `<button class="btn-action btn-admin" onclick="tornarAdmin(${usuario.id})">Tornar Admin</button>`
                    }
                </div>
            `;
            
            adminContent.appendChild(userItem);
        });
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        const adminContent = document.getElementById('adminContent');
        if (adminContent) {
            adminContent.innerHTML = '<p style="text-align: center; color: #ff4444; padding: 40px;">Erro ao carregar usuários.</p>';
        }
    }
}

async function fecharConta(userId) {
    if (!confirm('Tem certeza que deseja fechar esta conta?')) return;
    
    const usuario = obterUsuarioLogado();
    try {
        await fecharContaUsuario(userId, usuario.id);
        alert('Conta fechada com sucesso!');
        location.reload();
    } catch (error) {
        alert('Erro ao fechar conta: ' + error.message);
    }
}

async function reabrirConta(userId) {
    const usuario = obterUsuarioLogado();
    try {
        await reabrirContaUsuario(userId, usuario.id);
        alert('Conta reaberta com sucesso!');
        location.reload();
    } catch (error) {
        alert('Erro ao reabrir conta: ' + error.message);
    }
}

async function tornarAdmin(userId) {
    if (!confirm('Tem certeza que deseja tornar este usuário administrador?')) return;
    
    const usuario = obterUsuarioLogado();
    try {
        await promoverAdmin(userId, usuario.id);
        alert('Usuário promovido a administrador!');
        location.reload();
    } catch (error) {
        alert('Erro ao promover usuário: ' + error.message);
    }
}

async function removerAdmin(userId) {
    if (!confirm('Tem certeza que deseja remover os privilégios de administrador deste usuário?')) return;
    
    const usuario = obterUsuarioLogado();
    try {
        await removerAdminUsuario(userId, usuario.id);
        alert('Privilégios de administrador removidos!');
        location.reload();
    } catch (error) {
        alert('Erro ao remover admin: ' + error.message);
    }
}

