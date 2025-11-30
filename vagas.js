// Script para página de Vagas

document.addEventListener('DOMContentLoaded', async function() {
    // Aguardar inicialização do banco
    if (typeof initDB === 'function') {
        await initDB();
        await initDefaultData();
    }
    
    const usuario = verificarLogin();
    if (!usuario) return;
    
    await carregarVagas();
});

async function carregarVagas() {
    try {
        const vagas = await listarVagas();
        const vagasContent = document.getElementById('vagasContent');
        
        if (!vagasContent) return;
        
        if (vagas.length === 0) {
            vagasContent.innerHTML = `
                <div class="card" style="max-width: 800px;">
                    <p style="text-align: center; padding: 40px; color: #666;">Nenhuma vaga disponível no momento.</p>
                </div>
            `;
            return;
        }
        
        vagasContent.innerHTML = '';
        
        vagas.forEach(vaga => {
            const vagaCard = document.createElement('div');
            vagaCard.className = 'card';
            vagaCard.style.cssText = 'max-width: 800px; margin-bottom: 20px;';
            
            const salario = vaga.salario_min && vaga.salario_max 
                ? `R$ ${vaga.salario_min.toLocaleString('pt-BR')} - R$ ${vaga.salario_max.toLocaleString('pt-BR')}`
                : vaga.salario_min 
                    ? `A partir de R$ ${vaga.salario_min.toLocaleString('pt-BR')}`
                    : 'Salário a combinar';
            
            vagaCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div style="flex: 1;">
                        <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #000;">${vaga.titulo || 'Vaga sem título'}</h2>
                        <p style="color: #666; font-size: 16px; margin-bottom: 4px;"><strong>Empresa:</strong> ${vaga.empresa || 'Não informado'}</p>
                        ${vaga.localizacao ? `<p style="color: #666; font-size: 14px; margin-bottom: 4px;"><strong>Localização:</strong> ${vaga.localizacao}</p>` : ''}
                        ${vaga.tipo_emprego ? `<p style="color: #666; font-size: 14px; margin-bottom: 4px;"><strong>Tipo:</strong> ${vaga.tipo_emprego}</p>` : ''}
                        <p style="color: #0066FF; font-size: 16px; font-weight: 600; margin-top: 8px;">${salario}</p>
                    </div>
                    <button class="btn-view" onclick="visualizarVaga(${vaga.id})">Visualisar</button>
                </div>
                ${vaga.descricao ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0;"><p style="color: #333;">${vaga.descricao}</p></div>` : ''}
                ${vaga.requisitos ? `<div style="margin-top: 12px;"><strong>Requisitos:</strong><p style="color: #666; margin-top: 4px;">${vaga.requisitos}</p></div>` : ''}
            `;
            
            vagasContent.appendChild(vagaCard);
        });
    } catch (error) {
        console.error('Erro ao carregar vagas:', error);
        const vagasContent = document.getElementById('vagasContent');
        if (vagasContent) {
            vagasContent.innerHTML = `
                <div class="card" style="max-width: 800px;">
                    <p style="text-align: center; color: #ff4444; padding: 40px;">Erro ao carregar vagas.</p>
                </div>
            `;
        }
    }
}

function visualizarVaga(id) {
    // Por enquanto apenas mostra um alert, pode ser expandido para uma página de detalhes
    alert(`Visualizando vaga ID: ${id}\n\nFuncionalidade de detalhes será implementada em breve!`);
}

