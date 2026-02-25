// Configuração do Firebase - SUAS CREDENCIAIS
const firebaseConfig = {
  apiKey: "AIzaSyATN0OAPcHZd4sxHQsvpRNHWoYxailF1ko",
  authDomain: "autoflow-b8948.firebaseapp.com",
  projectId: "autoflow-b8948",
  storageBucket: "autoflow-b8948.firebasestorage.app",
  messagingSenderId: "579491006118",
  appId: "1:579491006118:web:d3dcd68561ed12ab3b5667"
};

// Inicializar Firebase (versão compatibilidade)
firebase.initializeApp(firebaseConfig);

// Referências aos serviços do Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// CORREÇÃO: Verificar se storage existe antes de usar
let storage = null;
try {
    if (firebase.storage) {
        storage = firebase.storage();
        console.log('✅ Storage inicializado');
    } else {
        console.log('⚠️ Storage não disponível (não é necessário para o funcionamento)');
    }
} catch (error) {
    console.log('⚠️ Erro ao inicializar storage:', error.message);
}

// Exportar referências
window.firebaseApp = {
    auth: auth,
    db: db,
    storage: storage
};

console.log('✅ Firebase configurado com sucesso!');