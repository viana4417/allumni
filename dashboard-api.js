// API Client usando IndexedDB (funciona sem servidor)

// Obter usuário logado do localStorage
function obterUsuarioLogado() {
    const usuario = localStorage.getItem('usuarioLogado');
    return usuario ? JSON.parse(usuario) : null;
}

// Verificar se está logado, senão redirecionar
function verificarLogin() {
    const usuario = obterUsuarioLogado();
    if (!usuario) {
        window.location.href = 'index.html';
        return null;
    }
    return usuario;
}

// ==================== PERFIS ====================

async function buscarPerfil(userId) {
    const user = await dbGet('usuarios', userId);
    if (!user) {
        throw new Error('Usuário não encontrado');
    }
    
    const perfil = await dbGetByIndex('perfis', 'usuario_id', userId);
    
    // Remover senha
    const { senha, ...userSafe } = user;
    
    return { user: userSafe, perfil: perfil || {} };
}

async function atualizarPerfil(userId, dados) {
    const { nome, curso, ano_formatura, bio, linkedin_url, github_url, telefone, empresa_atual, cargo_atual, foto_perfil } = dados;
    
    // Atualizar usuário
    if (nome || curso || ano_formatura) {
        const updates = {};
        if (nome) updates.nome = nome;
        if (curso) updates.curso = curso;
        if (ano_formatura) updates.ano_formatura = ano_formatura;
        updates.updated_at = new Date().toISOString();
        await dbUpdate('usuarios', userId, updates);
    }
    
    // Atualizar perfil
    const perfil = await dbGetByIndex('perfis', 'usuario_id', userId);
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url;
    if (github_url !== undefined) updates.github_url = github_url;
    if (telefone !== undefined) updates.telefone = telefone;
    if (empresa_atual !== undefined) updates.empresa_atual = empresa_atual;
    if (cargo_atual !== undefined) updates.cargo_atual = cargo_atual;
    if (foto_perfil !== undefined) updates.foto_perfil = foto_perfil;
    
    if (perfil) {
        Object.assign(updates, { updated_at: new Date().toISOString() });
        await dbPut('perfis', { ...perfil, ...updates });
    } else {
        await dbAdd('perfis', {
            usuario_id: userId,
            ...updates,
            created_at: new Date().toISOString()
        });
    }
    
    return { success: true, message: 'Perfil atualizado com sucesso' };
}

// ==================== VAGAS ====================

async function listarVagas() {
    const vagas = await dbGetAll('vagas');
    const vagasAtivas = vagas.filter(v => v.status === 'ativa' || !v.status);
    
    // Adicionar nome do criador
    for (const vaga of vagasAtivas) {
        if (vaga.criado_por) {
            const criador = await dbGet('usuarios', vaga.criado_por);
            vaga.criador_nome = criador ? criador.nome : 'Desconhecido';
        }
    }
    
    return vagasAtivas.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

async function buscarVaga(id) {
    const vaga = await dbGet('vagas', id);
    if (!vaga) {
        throw new Error('Vaga não encontrada');
    }
    
    if (vaga.criado_por) {
        const criador = await dbGet('usuarios', vaga.criado_por);
        vaga.criador_nome = criador ? criador.nome : 'Desconhecido';
    }
    
    return vaga;
}

async function criarVaga(dados) {
    const { titulo, descricao, empresa, localizacao, tipo_emprego, salario_min, salario_max, requisitos, criado_por } = dados;
    
    if (!titulo || !empresa || !criado_por) {
        throw new Error('Título, empresa e criador são obrigatórios');
    }
    
    const vaga = {
        titulo,
        descricao: descricao || null,
        empresa,
        localizacao: localizacao || null,
        tipo_emprego: tipo_emprego || null,
        salario_min: salario_min || null,
        salario_max: salario_max || null,
        requisitos: requisitos || null,
        criado_por,
        status: 'ativa',
        created_at: new Date().toISOString()
    };
    
    const result = await dbAdd('vagas', vaga);
    return { success: true, vagaId: result.id };
}

async function candidatarVaga(vagaId, usuarioId, mensagem = null) {
    // Verificar se já se candidatou
    const candidaturas = await dbGetAll('candidaturas', 'vaga_id', vagaId);
    const jaCandidatou = candidaturas.some(c => c.usuario_id === usuarioId);
    
    if (jaCandidatou) {
        throw new Error('Você já se candidatou a esta vaga');
    }
    
    await dbAdd('candidaturas', {
        vaga_id: vagaId,
        usuario_id: usuarioId,
        mensagem: mensagem || null,
        created_at: new Date().toISOString()
    });
    
    return { success: true };
}

// ==================== GRUPOS ====================

async function listarGrupos() {
    const grupos = await dbGetAll('grupos');
    
    // Adicionar nome do criador e total de membros
    for (const grupo of grupos) {
        if (grupo.criado_por) {
            const criador = await dbGet('usuarios', grupo.criado_por);
            grupo.criador_nome = criador ? criador.nome : 'Desconhecido';
        }
        
        const membros = await dbGetAll('grupo_membros', 'grupo_id', grupo.id);
        grupo.total_membros = membros.length;
    }
    
    return grupos.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

async function buscarGruposUsuario(userId) {
    const membros = await dbGetAll('grupo_membros', 'usuario_id', userId);
    const grupos = [];
    
    for (const membro of membros) {
        const grupo = await dbGet('grupos', membro.grupo_id);
        if (grupo) {
            grupo.role = membro.role || 'membro';
            
            // Adicionar nome do criador
            if (grupo.criado_por) {
                const criador = await dbGet('usuarios', grupo.criado_por);
                grupo.criador_nome = criador ? criador.nome : 'Desconhecido';
            }
            
            // Adicionar total de membros
            const todosMembros = await dbGetAll('grupo_membros', 'grupo_id', grupo.id);
            grupo.total_membros = todosMembros.length;
            
            grupos.push(grupo);
        }
    }
    
    return grupos.sort((a, b) => a.nome.localeCompare(b.nome));
}

async function criarGrupo(dados) {
    const { nome, descricao, criado_por } = dados;
    
    if (!nome || !criado_por) {
        throw new Error('Nome e criador são obrigatórios');
    }
    
    const grupo = {
        nome,
        descricao: descricao || null,
        criado_por,
        created_at: new Date().toISOString()
    };
    
    const result = await dbAdd('grupos', grupo);
    
    // Adicionar criador como admin
    await dbAdd('grupo_membros', {
        grupo_id: result.id,
        usuario_id: criado_por,
        role: 'admin',
        joined_at: new Date().toISOString()
    });
    
    return { success: true, grupoId: result.id };
}

async function entrarGrupo(grupoId, usuarioId) {
    // Verificar se já é membro
    const membros = await dbGetAll('grupo_membros', 'grupo_id', grupoId);
    const jaMembro = membros.some(m => m.usuario_id === usuarioId);
    
    if (jaMembro) {
        throw new Error('Você já é membro deste grupo');
    }
    
    await dbAdd('grupo_membros', {
        grupo_id: grupoId,
        usuario_id: usuarioId,
        role: 'membro',
        joined_at: new Date().toISOString()
    });
    
    return { success: true };
}

async function listarMembrosGrupo(grupoId) {
    const membros = await dbGetAll('grupo_membros', 'grupo_id', grupoId);
    const membrosCompleto = [];
    
    for (const membro of membros) {
        const usuario = await dbGet('usuarios', membro.usuario_id);
        if (usuario) {
            const { senha, ...usuarioSafe } = usuario;
            membrosCompleto.push({
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                curso: usuario.curso,
                role: membro.role || 'membro',
                joined_at: membro.joined_at
            });
        }
    }
    
    return membrosCompleto.sort((a, b) => new Date(a.joined_at || 0) - new Date(b.joined_at || 0));
}

// ==================== CHAT ====================

async function buscarMensagensGrupo(grupoId) {
    // Buscar todas as mensagens e filtrar manualmente para evitar problemas de tipo
    const todasMensagens = await dbGetAll('mensagens');
    
    // Filtrar mensagens do grupo (comparação flexível para string/number)
    const mensagens = todasMensagens.filter(m => m.grupo_id == grupoId);
    
    // Adicionar nome do remetente
    for (const msg of mensagens) {
        if (msg.remetente_id) {
            const remetente = await dbGet('usuarios', msg.remetente_id);
            msg.remetente_nome = remetente ? remetente.nome : 'Desconhecido';
        }
    }
    
    return mensagens.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
}

async function enviarMensagemAPI(dados) {
    const { remetente_id, destinatario_id, grupo_id, conteudo, tipo, arquivo_url } = dados;
    
    if (!remetente_id) {
        throw new Error('Remetente é obrigatório');
    }
    
    if (!destinatario_id && !grupo_id) {
        throw new Error('Destinatário ou grupo é obrigatório');
    }
    
    // Se não tem conteúdo mas tem arquivo, usar conteúdo padrão
    const conteudoFinal = conteudo || (arquivo_url && tipo === 'imagem' ? '📷 Imagem' : arquivo_url && tipo === 'audio' ? '🎤 Áudio' : '');
    
    // Determinar tipo se não foi fornecido mas tem arquivo
    let tipoFinal = tipo || 'texto';
    if (!tipo && arquivo_url) {
        if (arquivo_url.startsWith('data:image/')) {
            tipoFinal = 'imagem';
        } else if (arquivo_url.startsWith('data:audio/')) {
            tipoFinal = 'audio';
        }
    }
    
    const mensagem = {
        remetente_id,
        destinatario_id: destinatario_id || null,
        grupo_id: grupo_id || null,
        conteudo: conteudoFinal,
        tipo: tipoFinal,
        arquivo_url: arquivo_url || null,
        created_at: new Date().toISOString()
    };
    
    const result = await dbAdd('mensagens', mensagem);
    return { success: true, mensagemId: result.id };
}

// ==================== ADMINISTRAÇÃO ====================

async function verificarAdmin(userId) {
    const user = await dbGet('usuarios', userId);
    return user && user.is_admin === 1;
}

async function listarUsuariosAdmin(adminId) {
    const isAdmin = await verificarAdmin(adminId);
    if (!isAdmin) {
        throw new Error('Acesso negado. Apenas administradores.');
    }
    
    // Listar apenas contas ativas (não há mais contas fechadas, elas são removidas)
    const usuarios = await dbGetAll('usuarios');
    const usuariosAtivos = usuarios.filter(u => u.status_conta !== 'fechada' || !u.status_conta);
    
    return usuariosAtivos.map(u => {
        const { senha, ...usuarioSafe } = u;
        return usuarioSafe;
    }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

async function fecharContaUsuario(userId, adminId) {
    const isAdmin = await verificarAdmin(adminId);
    if (!isAdmin) {
        throw new Error('Acesso negado. Apenas administradores.');
    }
    
    // Verificar se o usuário existe
    const usuario = await dbGet('usuarios', userId);
    if (!usuario) {
        throw new Error('Usuário não encontrado');
    }
    
    // Não permitir fechar a própria conta
    if (parseInt(userId) === parseInt(adminId)) {
        throw new Error('Você não pode fechar sua própria conta');
    }
    
    // Remover perfil do usuário
    const perfil = await dbGetByIndex('perfis', 'usuario_id', userId);
    if (perfil) {
        await dbDelete('perfis', perfil.id);
    }
    
    // Remover mensagens do usuário
    const todasMensagens = await dbGetAll('mensagens');
    const mensagensUsuario = todasMensagens.filter(m => 
        m.remetente_id == userId || m.destinatario_id == userId
    );
    for (const msg of mensagensUsuario) {
        await dbDelete('mensagens', msg.id);
    }
    
    // Remover membros de grupos
    const todosMembros = await dbGetAll('grupo_membros');
    const membrosUsuario = todosMembros.filter(m => m.usuario_id == userId);
    for (const membro of membrosUsuario) {
        await dbDelete('grupo_membros', membro.id);
    }
    
    // Remover candidaturas
    const todasCandidaturas = await dbGetAll('candidaturas');
    const candidaturasUsuario = todasCandidaturas.filter(c => c.usuario_id == userId);
    for (const candidatura of candidaturasUsuario) {
        await dbDelete('candidaturas', candidatura.id);
    }
    
    // Remover vagas criadas pelo usuário (opcional - você pode decidir manter as vagas)
    // Por enquanto, vamos manter as vagas mas remover a referência ao criador
    
    // Finalmente, remover o usuário
    await dbDelete('usuarios', userId);
    
    return { success: true, message: 'Conta removida permanentemente' };
}

async function promoverAdmin(userId, adminId) {
    const isAdmin = await verificarAdmin(adminId);
    if (!isAdmin) {
        throw new Error('Acesso negado. Apenas administradores.');
    }
    
    await dbUpdate('usuarios', userId, {
        is_admin: 1,
        updated_at: new Date().toISOString()
    });
    
    return { success: true, message: 'Usuário promovido a administrador' };
}

async function removerAdminUsuario(userId, adminId) {
    const isAdmin = await verificarAdmin(adminId);
    if (!isAdmin) {
        throw new Error('Acesso negado. Apenas administradores.');
    }
    
    if (parseInt(userId) === parseInt(adminId)) {
        throw new Error('Você não pode remover seus próprios privilégios de admin');
    }
    
    await dbUpdate('usuarios', userId, {
        is_admin: 0,
        updated_at: new Date().toISOString()
    });
    
    return { success: true, message: 'Privilégios de administrador removidos' };
}

async function removerVaga(vagaId, adminId) {
    const isAdmin = await verificarAdmin(adminId);
    if (!isAdmin) {
        throw new Error('Acesso negado. Apenas administradores.');
    }
    
    // Verificar se a vaga existe
    const vaga = await dbGet('vagas', vagaId);
    if (!vaga) {
        throw new Error('Vaga não encontrada');
    }
    
    // Remover candidaturas relacionadas
    const todasCandidaturas = await dbGetAll('candidaturas');
    const candidaturas = todasCandidaturas.filter(c => c.vaga_id == vagaId);
    for (const candidatura of candidaturas) {
        await dbDelete('candidaturas', candidatura.id);
    }
    
    // Remover a vaga
    await dbDelete('vagas', vagaId);
    
    return { success: true, message: 'Vaga removida com sucesso' };
}

async function removerGrupo(grupoId, adminId) {
    const isAdmin = await verificarAdmin(adminId);
    if (!isAdmin) {
        throw new Error('Acesso negado. Apenas administradores.');
    }
    
    // Verificar se o grupo existe
    const grupo = await dbGet('grupos', grupoId);
    if (!grupo) {
        throw new Error('Grupo não encontrado');
    }
    
    // Remover mensagens relacionadas
    const todasMensagens = await dbGetAll('mensagens');
    const mensagens = todasMensagens.filter(m => m.grupo_id == grupoId);
    for (const mensagem of mensagens) {
        await dbDelete('mensagens', mensagem.id);
    }
    
    // Remover membros do grupo
    const membros = await dbGetAll('grupo_membros', 'grupo_id', grupoId);
    for (const membro of membros) {
        await dbDelete('grupo_membros', membro.id);
    }
    
    // Remover o grupo
    await dbDelete('grupos', grupoId);
    
    return { success: true, message: 'Grupo removido com sucesso' };
}

// Tornar todas as funções disponíveis globalmente
window.buscarPerfil = buscarPerfil;
window.atualizarPerfil = atualizarPerfil;
window.listarVagas = listarVagas;
window.buscarVaga = buscarVaga;
window.criarVaga = criarVaga;
window.candidatarVaga = candidatarVaga;
window.listarGrupos = listarGrupos;
window.buscarGruposUsuario = buscarGruposUsuario;
window.criarGrupo = criarGrupo;
window.entrarGrupo = entrarGrupo;
window.listarMembrosGrupo = listarMembrosGrupo;
window.buscarMensagensGrupo = buscarMensagensGrupo;
window.enviarMensagemAPI = enviarMensagemAPI;
window.listarUsuariosAdmin = listarUsuariosAdmin;
window.fecharContaUsuario = fecharContaUsuario;
window.promoverAdmin = promoverAdmin;
window.removerAdminUsuario = removerAdminUsuario;
window.removerVaga = removerVaga;
window.removerGrupo = removerGrupo;
window.obterUsuarioLogado = obterUsuarioLogado;
window.verificarLogin = verificarLogin;
