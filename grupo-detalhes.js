// Script para página de detalhes do grupo com chat

let grupoId = null;
let usuarioAtual = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let intervaloCarregamento = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Aguardar inicialização do banco
    if (typeof initDB === 'function') {
        await initDB();
        await initDefaultData();
    }
    
    usuarioAtual = verificarLogin();
    if (!usuarioAtual) return;
    
    // Obter ID do grupo da URL
    const urlParams = new URLSearchParams(window.location.search);
    grupoId = urlParams.get('id');
    
    if (!grupoId) {
        alert('Grupo não encontrado.');
        window.location.href = 'grupos.html';
        return;
    }
    
    await carregarGrupo();
    await carregarMembros();
    await carregarMensagens();
    
    // Configurar upload de imagem
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
    
    // Enviar mensagem ao pressionar Enter
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensagem();
        }
    });
    
    // Carregar mensagens a cada 3 segundos
    intervaloCarregamento = setInterval(carregarMensagens, 3000);
});

async function carregarGrupo() {
    try {
        const grupos = await buscarGruposUsuario(usuarioAtual.id);
        const grupo = grupos.find(g => g.id == grupoId);
        
        if (grupo) {
            document.getElementById('grupoNome').textContent = grupo.nome || 'Grupo';
        }
    } catch (error) {
        console.error('Erro ao carregar grupo:', error);
    }
}

async function carregarMembros() {
    try {
        // Usar função global ou fazer requisição direta
        let membros;
        if (typeof listarMembrosGrupo === 'function') {
            membros = await listarMembrosGrupo(grupoId);
        } else {
            // Fallback: fazer requisição direta
            const API_BASE_URL = 'http://localhost:3000/api';
            const response = await fetch(`${API_BASE_URL}/grupos/${grupoId}/membros`);
            if (!response.ok) throw new Error('Erro ao buscar membros');
            membros = await response.json();
        }
        
        const membersList = document.getElementById('membersList');
        
        if (membersList) {
            membersList.innerHTML = '<strong style="color: white;">Membros:</strong> ';
            if (membros && membros.length > 0) {
                membros.forEach(membro => {
                    const span = document.createElement('span');
                    span.className = 'member-item';
                    span.textContent = membro.nome || membro.email;
                    membersList.appendChild(span);
                });
            } else {
                membersList.innerHTML += '<span class="member-item">Nenhum membro encontrado</span>';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar membros:', error);
        const membersList = document.getElementById('membersList');
        if (membersList) {
            membersList.innerHTML = '<strong style="color: white;">Membros:</strong> <span style="color: #ff4444;">Erro ao carregar</span>';
        }
    }
}

async function carregarMensagens() {
    try {
        let mensagens;
        if (typeof buscarMensagensGrupo === 'function') {
            mensagens = await buscarMensagensGrupo(grupoId);
        } else {
            // Fallback: fazer requisição direta
            const API_BASE_URL = 'http://localhost:3000/api';
            const response = await fetch(`${API_BASE_URL}/chat/grupo/${grupoId}`);
            if (!response.ok) throw new Error('Erro ao buscar mensagens');
            mensagens = await response.json();
        }
        
        const chatMessages = document.getElementById('chatMessages');
        
        if (!chatMessages) return;
        
        chatMessages.innerHTML = '';
        
        if (mensagens.length === 0) {
            chatMessages.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhuma mensagem ainda. Seja o primeiro a escrever!</p>';
            return;
        }
        
        mensagens.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.remetente_id === usuarioAtual.id ? 'own' : ''}`;
            
            const time = new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            let contentHTML = `<div class="message-header">${msg.remetente_nome || 'Usuário'}</div>`;
            
            // Debug: log da mensagem
            console.log('Mensagem carregada:', { 
                id: msg.id,
                tipo: msg.tipo, 
                tem_arquivo: !!msg.arquivo_url, 
                tamanho_arquivo: msg.arquivo_url ? msg.arquivo_url.length : 0,
                conteudo: msg.conteudo 
            });
            
            // Verificar se é imagem
            if (msg.tipo === 'imagem' && msg.arquivo_url) {
                contentHTML += `<img src="${msg.arquivo_url}" class="message-image" alt="Imagem" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">`;
                // Se houver texto além da imagem, mostrar também
                if (msg.conteudo && msg.conteudo !== '📷 Imagem') {
                    contentHTML += `<div class="message-content" style="margin-top: 8px;">${msg.conteudo}</div>`;
                }
            } 
            // Verificar se é áudio - múltiplas condições
            else if (
                (msg.tipo === 'audio' && msg.arquivo_url) || 
                (msg.tipo === 'audio' && msg.conteudo && msg.conteudo.includes('🎤')) ||
                (msg.arquivo_url && msg.conteudo && (msg.conteudo.includes('🎤') || msg.conteudo.includes('Áudio gravado')))
            ) {
                // Se não tem arquivo_url mas é tipo audio, pode ser que não foi salvo ainda
                if (!msg.arquivo_url) {
                    console.warn('Mensagem de áudio sem arquivo_url:', msg);
                    contentHTML += `<div class="message-content" style="color: #ff4444;">⚠️ Áudio não disponível (erro ao salvar)</div>`;
                } else {
                // Áudio pode estar em base64 ou URL
                // Se não começa com data:, assumir que é base64 puro e adicionar prefixo
                let audioSrc = msg.arquivo_url;
                if (!audioSrc.startsWith('data:')) {
                    // Se não tem prefixo data:, adicionar
                    audioSrc = `data:audio/webm;base64,${audioSrc}`;
                }
                
                contentHTML += `
                    <div class="message-audio">
                        <div class="audio-icon-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="currentColor"/>
                                <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 19V23M8 23H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="audio-player-wrapper">
                            <audio controls preload="metadata" onloadedmetadata="this.parentElement.style.display='block'">
                                <source src="${audioSrc}" type="audio/webm">
                                <source src="${audioSrc}" type="audio/mpeg">
                                <source src="${audioSrc}" type="audio/wav">
                                <source src="${audioSrc}" type="audio/ogg">
                                Seu navegador não suporta áudio.
                            </audio>
                        </div>
                    </div>
                `;
                    // Se houver texto além do áudio, mostrar também (removendo emojis de áudio)
                    const textoLimpo = msg.conteudo ? msg.conteudo.replace(/🎤\s*Áudio\s*(gravado)?/gi, '').trim() : '';
                    if (textoLimpo) {
                        contentHTML += `<div class="message-content" style="margin-top: 8px;">${textoLimpo}</div>`;
                    }
                }
            } 
            // Mensagem de texto normal
            else {
                contentHTML += `<div class="message-content">${msg.conteudo}</div>`;
            }
            
            contentHTML += `<div class="message-time">${time}</div>`;
            
            messageDiv.innerHTML = contentHTML;
            chatMessages.appendChild(messageDiv);
        });
        
        // Scroll para o final
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

async function enviarMensagem() {
    const input = document.getElementById('messageInput');
    const texto = input.value.trim();
    
    if (!texto && !fotoPendente && !audioPendente) return;
    
    try {
        // Determinar tipo e conteúdo
        let tipoFinal = 'texto';
        let conteudoFinal = texto;
        let arquivoFinal = null;
        
        if (audioPendente) {
            tipoFinal = 'audio';
            arquivoFinal = audioPendente;
            conteudoFinal = texto || '🎤 Áudio';
        } else if (fotoPendente) {
            tipoFinal = 'imagem';
            arquivoFinal = fotoPendente;
            conteudoFinal = texto || '📷 Imagem';
        }
        
        const dados = {
            remetente_id: usuarioAtual.id,
            grupo_id: grupoId,
            conteudo: conteudoFinal,
            tipo: tipoFinal,
            arquivo_url: arquivoFinal
        };
        
        console.log('Enviando mensagem:', { tipo: tipoFinal, tem_arquivo: !!arquivoFinal, tamanho_arquivo: arquivoFinal ? arquivoFinal.length : 0 });
        
        // Usar função global ou fazer requisição direta
        if (typeof enviarMensagemAPI === 'function') {
            await enviarMensagemAPI(dados);
        } else {
            const API_BASE_URL = 'http://localhost:3000/api';
            const response = await fetch(`${API_BASE_URL}/chat/enviar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro ao enviar mensagem');
        }
        
        input.value = '';
        fotoPendente = null;
        audioPendente = null;
        
        // Recarregar mensagens após pequeno delay para garantir que foi salvo
        setTimeout(async () => {
            await carregarMensagens();
        }, 500);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        alert('Erro ao enviar mensagem: ' + error.message);
    }
}

let fotoPendente = null;
let audioPendente = null;

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        fotoPendente = e.target.result;
        document.getElementById('messageInput').value = '📷 Imagem anexada';
        enviarMensagem();
    };
    reader.readAsDataURL(file);
}

async function toggleAudioRecording() {
    if (!isRecording) {
        iniciarGravacao();
    } else {
        pararGravacao();
    }
}

async function iniciarGravacao() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            if (audioChunks.length === 0) {
                console.warn('Nenhum dado de áudio gravado');
                pararGravacao();
                return;
            }
            
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            console.log('Áudio gravado:', { tamanho: audioBlob.size, tipo: audioBlob.type });
            
            const reader = new FileReader();
            reader.onload = function(e) {
                audioPendente = e.target.result; // Já vem como data:audio/webm;base64,...
                console.log('Áudio convertido para base64, tamanho:', audioPendente.length);
                document.getElementById('messageInput').value = '🎤 Áudio gravado';
                enviarMensagem();
            };
            reader.onerror = function(error) {
                console.error('Erro ao converter áudio:', error);
                alert('Erro ao processar áudio gravado.');
                pararGravacao();
            };
            reader.readAsDataURL(audioBlob);
            
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.onerror = (event) => {
            console.error('Erro na gravação:', event.error);
            alert('Erro ao gravar áudio.');
            pararGravacao();
        };
        
        mediaRecorder.start();
        isRecording = true;
        const audioBtn = document.getElementById('audioBtn');
        audioBtn.classList.add('recording');
        const audioIcon = document.getElementById('audioIcon');
        if (audioIcon) {
            audioIcon.innerHTML = `
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.3"/>
                <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/>
            `;
        }
        audioBtn.title = 'Parar gravação (clique novamente)';
    } catch (error) {
        console.error('Erro ao iniciar gravação:', error);
        alert('Erro ao acessar o microfone. Verifique as permissões do navegador.');
    }
}

function pararGravacao() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        const audioBtn = document.getElementById('audioBtn');
        audioBtn.classList.remove('recording');
        const audioIcon = document.getElementById('audioIcon');
        if (audioIcon) {
            audioIcon.innerHTML = `
                <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 19V23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 23H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            `;
        }
        audioBtn.title = 'Gravar áudio';
    }
}

// Limpar intervalo ao sair da página
window.addEventListener('beforeunload', function() {
    if (intervaloCarregamento) {
        clearInterval(intervaloCarregamento);
    }
    pararGravacao();
});

// Funções de API serão usadas do dashboard-api.js ou fallback direto
async function enviarMensagemAPI(dados) {
    const API_BASE_URL = 'http://localhost:3000/api';
    const response = await fetch(`${API_BASE_URL}/chat/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao enviar mensagem');
    return data;
}

async function buscarMensagensGrupo(grupoId) {
    const API_BASE_URL = 'http://localhost:3000/api';
    const response = await fetch(`${API_BASE_URL}/chat/grupo/${grupoId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao buscar mensagens');
    return data;
}

// Tornar funções disponíveis globalmente
window.enviarMensagemAPI = enviarMensagemAPI;
window.buscarMensagensGrupo = buscarMensagensGrupo;

