// Sistema de banco de dados usando IndexedDB para funcionar sem servidor

const DB_NAME = 'allumni_db';
const DB_VERSION = 1;

let db = null;

// Inicializar banco de dados
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Tabela usuarios
            if (!db.objectStoreNames.contains('usuarios')) {
                const usuariosStore = db.createObjectStore('usuarios', { keyPath: 'id', autoIncrement: true });
                usuariosStore.createIndex('email', 'email', { unique: true });
            }
            
            // Tabela perfis
            if (!db.objectStoreNames.contains('perfis')) {
                const perfisStore = db.createObjectStore('perfis', { keyPath: 'id', autoIncrement: true });
                perfisStore.createIndex('usuario_id', 'usuario_id', { unique: true });
            }
            
            // Tabela vagas
            if (!db.objectStoreNames.contains('vagas')) {
                const vagasStore = db.createObjectStore('vagas', { keyPath: 'id', autoIncrement: true });
                vagasStore.createIndex('criado_por', 'criado_por');
            }
            
            // Tabela grupos
            if (!db.objectStoreNames.contains('grupos')) {
                const gruposStore = db.createObjectStore('grupos', { keyPath: 'id', autoIncrement: true });
                gruposStore.createIndex('criado_por', 'criado_por');
            }
            
            // Tabela grupo_membros
            if (!db.objectStoreNames.contains('grupo_membros')) {
                const grupoMembrosStore = db.createObjectStore('grupo_membros', { keyPath: 'id', autoIncrement: true });
                grupoMembrosStore.createIndex('grupo_id', 'grupo_id');
                grupoMembrosStore.createIndex('usuario_id', 'usuario_id');
                grupoMembrosStore.createIndex('grupo_usuario', ['grupo_id', 'usuario_id'], { unique: true });
            }
            
            // Tabela mensagens
            if (!db.objectStoreNames.contains('mensagens')) {
                const mensagensStore = db.createObjectStore('mensagens', { keyPath: 'id', autoIncrement: true });
                mensagensStore.createIndex('grupo_id', 'grupo_id');
                mensagensStore.createIndex('remetente_id', 'remetente_id');
                mensagensStore.createIndex('destinatario_id', 'destinatario_id');
            }
            
            // Tabela candidaturas
            if (!db.objectStoreNames.contains('candidaturas')) {
                const candidaturasStore = db.createObjectStore('candidaturas', { keyPath: 'id', autoIncrement: true });
                candidaturasStore.createIndex('vaga_id', 'vaga_id');
                candidaturasStore.createIndex('usuario_id', 'usuario_id');
            }
        };
    });
}

// Função auxiliar para hash de senha (simples para uso local)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Função auxiliar para comparar senha
async function comparePassword(password, hash) {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

// Operações CRUD genéricas
function dbGet(storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function dbGetByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.get(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function dbGetAll(storeName, indexName = null, value = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        let request;
        
        if (indexName && value !== null) {
            const index = store.index(indexName);
            request = index.getAll(value);
        } else {
            request = store.getAll();
        }
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function dbAdd(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);
        request.onsuccess = () => resolve({ id: request.result, changes: 1 });
        request.onerror = () => reject(request.error);
    });
}

function dbPut(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        request.onsuccess = () => resolve({ id: request.result, changes: 1 });
        request.onerror = () => reject(request.error);
    });
}

function dbUpdate(storeName, key, updates) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
            const data = getRequest.result;
            if (!data) {
                reject(new Error('Registro não encontrado'));
                return;
            }
            
            Object.assign(data, updates);
            const putRequest = store.put(data);
            putRequest.onsuccess = () => resolve({ id: key, changes: 1 });
            putRequest.onerror = () => reject(putRequest.error);
        };
        
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Inicializar dados padrão
async function initDefaultData() {
    // Verificar se já existe admin
    const adminExists = await dbGetByIndex('usuarios', 'email', 'admin');
    
    if (!adminExists) {
        const adminPassword = await hashPassword('123456');
        const adminUser = {
            nome: 'Administrador',
            email: 'admin',
            senha: adminPassword,
            tipo: 'admin',
            is_admin: 1,
            status_conta: 'ativa',
            created_at: new Date().toISOString()
        };
        
        const result = await dbAdd('usuarios', adminUser);
        
        // Criar perfil para admin
        await dbAdd('perfis', {
            usuario_id: result.id,
            created_at: new Date().toISOString()
        });
        
        console.log('Admin criado:', result.id);
    }
}

// Exportar funções
window.initDB = initDB;
window.initDefaultData = initDefaultData;
window.dbGet = dbGet;
window.dbGetByIndex = dbGetByIndex;
window.dbGetAll = dbGetAll;
window.dbAdd = dbAdd;
window.dbPut = dbPut;
window.dbUpdate = dbUpdate;
window.hashPassword = hashPassword;
window.comparePassword = comparePassword;

