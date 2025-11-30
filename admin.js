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
    await carregarVagasAdmin();
    await carregarGruposAdmin();
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

// ==================== FUNÇÕES DE NAVEGAÇÃO ====================

function mostrarAba(aba) {
    // Esconder todas as abas
    document.getElementById('abaUsuarios').style.display = 'none';
    document.getElementById('abaVagas').style.display = 'none';
    document.getElementById('abaGrupos').style.display = 'none';
    
    // Remover active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Mostrar aba selecionada
    if (aba === 'usuarios') {
        document.getElementById('abaUsuarios').style.display = 'block';
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else if (aba === 'vagas') {
        document.getElementById('abaVagas').style.display = 'block';
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    } else if (aba === 'grupos') {
        document.getElementById('abaGrupos').style.display = 'block';
        document.querySelectorAll('.tab-btn')[2].classList.add('active');
    }
}

// ==================== FUNÇÕES DE VAGAS ====================

async function carregarVagasAdmin() {
    try {
        const vagas = await listarVagas();
        const vagasList = document.getElementById('vagasList');
        
        if (!vagasList) return;
        
        if (vagas.length === 0) {
            vagasList.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Nenhuma vaga cadastrada.</p>';
            return;
        }
        
        vagasList.innerHTML = '<h3 style="margin-bottom: 15px; color: #000;">Vagas Cadastradas</h3>';
        
        vagas.forEach(vaga => {
            const vagaItem = document.createElement('div');
            vagaItem.className = 'vaga-item';
            
            const salario = vaga.salario_min && vaga.salario_max 
                ? `R$ ${vaga.salario_min.toLocaleString('pt-BR')} - R$ ${vaga.salario_max.toLocaleString('pt-BR')}`
                : vaga.salario_min 
                    ? `A partir de R$ ${vaga.salario_min.toLocaleString('pt-BR')}`
                    : 'Salário a combinar';
            
            vagaItem.innerHTML = `
                <div class="vaga-info">
                    <div class="vaga-titulo">${vaga.titulo || 'Vaga sem título'}</div>
                    <div class="vaga-detalhes">
                        ${vaga.empresa || 'Empresa não informada'} • ${vaga.localizacao || 'Localização não informada'} • ${salario}
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn-action btn-fechar" onclick="deletarVaga(${vaga.id})">Remover</button>
                </div>
            `;
            
            vagasList.appendChild(vagaItem);
        });
    } catch (error) {
        console.error('Erro ao carregar vagas:', error);
        const vagasList = document.getElementById('vagasList');
        if (vagasList) {
            vagasList.innerHTML = '<p style="text-align: center; color: #ff4444; padding: 40px;">Erro ao carregar vagas.</p>';
        }
    }
}

async function criarNovaVaga(event) {
    event.preventDefault();
    
    const usuario = obterUsuarioLogado();
    if (!usuario) return;
    
    const dados = {
        titulo: document.getElementById('vagaTitulo').value,
        empresa: document.getElementById('vagaEmpresa').value,
        localizacao: document.getElementById('vagaLocalizacao').value || null,
        tipo_emprego: document.getElementById('vagaTipo').value || null,
        salario_min: document.getElementById('vagaSalarioMin').value ? parseFloat(document.getElementById('vagaSalarioMin').value) : null,
        salario_max: document.getElementById('vagaSalarioMax').value ? parseFloat(document.getElementById('vagaSalarioMax').value) : null,
        descricao: document.getElementById('vagaDescricao').value || null,
        requisitos: document.getElementById('vagaRequisitos').value || null,
        criado_por: usuario.id
    };
    
    try {
        await criarVaga(dados);
        alert('Vaga criada com sucesso!');
        
        // Limpar formulário
        document.getElementById('formCriarVaga').reset();
        
        // Recarregar lista
        await carregarVagasAdmin();
    } catch (error) {
        alert('Erro ao criar vaga: ' + error.message);
    }
}

async function deletarVaga(vagaId) {
    if (!confirm('Tem certeza que deseja remover esta vaga? Esta ação não pode ser desfeita.')) return;
    
    const usuario = obterUsuarioLogado();
    try {
        await removerVaga(vagaId, usuario.id);
        alert('Vaga removida com sucesso!');
        await carregarVagasAdmin();
    } catch (error) {
        alert('Erro ao remover vaga: ' + error.message);
    }
}

// ==================== FUNÇÕES DE GRUPOS ====================

async function carregarGruposAdmin() {
    try {
        const grupos = await listarGrupos();
        const gruposList = document.getElementById('gruposList');
        
        if (!gruposList) return;
        
        if (grupos.length === 0) {
            gruposList.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Nenhum grupo cadastrado.</p>';
            return;
        }
        
        gruposList.innerHTML = '<h3 style="margin-bottom: 15px; color: #000;">Grupos Cadastrados</h3>';
        
        grupos.forEach(grupo => {
            const grupoItem = document.createElement('div');
            grupoItem.className = 'grupo-item';
            
            grupoItem.innerHTML = `
                <div class="grupo-info">
                    <div class="grupo-nome">${grupo.nome || 'Grupo sem nome'}</div>
                    <div class="grupo-detalhes">
                        ${grupo.descricao || 'Sem descrição'} • ${grupo.total_membros || 0} ${grupo.total_membros === 1 ? 'membro' : 'membros'} • ${grupo.tipo || 'público'}
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn-action btn-fechar" onclick="deletarGrupo(${grupo.id})">Remover</button>
                </div>
            `;
            
            gruposList.appendChild(grupoItem);
        });
    } catch (error) {
        console.error('Erro ao carregar grupos:', error);
        const gruposList = document.getElementById('gruposList');
        if (gruposList) {
            gruposList.innerHTML = '<p style="text-align: center; color: #ff4444; padding: 40px;">Erro ao carregar grupos.</p>';
        }
    }
}

async function criarNovoGrupo(event) {
    event.preventDefault();
    
    const usuario = obterUsuarioLogado();
    if (!usuario) return;
    
    const dados = {
        nome: document.getElementById('grupoNome').value,
        descricao: document.getElementById('grupoDescricao').value || null,
        tipo: document.getElementById('grupoTipo').value || 'publico',
        criado_por: usuario.id
    };
    
    try {
        await criarGrupo(dados);
        alert('Grupo criado com sucesso!');
        
        // Limpar formulário
        document.getElementById('formCriarGrupo').reset();
        
        // Recarregar lista
        await carregarGruposAdmin();
    } catch (error) {
        alert('Erro ao criar grupo: ' + error.message);
    }
}

async function deletarGrupo(grupoId) {
    if (!confirm('Tem certeza que deseja remover este grupo? Todas as mensagens e membros serão removidos. Esta ação não pode ser desfeita.')) return;
    
    const usuario = obterUsuarioLogado();
    try {
        await removerGrupo(grupoId, usuario.id);
        alert('Grupo removido com sucesso!');
        await carregarGruposAdmin();
    } catch (error) {
        alert('Erro ao remover grupo: ' + error.message);
    }
}

// Tornar funções disponíveis globalmente
window.mostrarAba = mostrarAba;
window.criarNovaVaga = criarNovaVaga;
window.deletarVaga = deletarVaga;
window.criarNovoGrupo = criarNovoGrupo;
window.deletarGrupo = deletarGrupo;

