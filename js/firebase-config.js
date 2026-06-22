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
        console.log('Storage inicializado');
    } else {
        console.log('Storage não disponível (não é necessário para o funcionamento)');
    }
} catch (error) {
    console.log('Erro ao inicializar storage:', error.message);
}

// Exportar referências
window.firebaseApp = {
    auth: auth,
    db: db,
    storage: storage
};

console.log('Firebase configurado com sucesso!');

function initResponsiveMenuDrawer() {
    const header = document.querySelector('.main-header');
    const nav = header?.querySelector('.main-nav');

    if (!header || !nav || header.querySelector('.app-menu-toggle')) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'app-menu-toggle';
    toggle.setAttribute('aria-label', 'Abrir menu');
    toggle.setAttribute('aria-expanded', 'false');

    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'app-menu-backdrop';
    backdrop.setAttribute('aria-label', 'Fechar menu');

    const closeMenu = () => {
        document.body.classList.remove('menu-drawer-open');
        toggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
        document.body.classList.add('menu-drawer-open');
        toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', () => {
        if (document.body.classList.contains('menu-drawer-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    backdrop.addEventListener('click', closeMenu);

    nav.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href') || '';
        closeMenu();

        if (!href || href === '#') return;
        if (href.startsWith('javascript:')) return;
        if (link.target && link.target !== '_self') return;

        event.preventDefault();
        window.location.href = link.href;
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
    });

    const logo = header.querySelector('.logo');
    if (logo) {
        logo.insertAdjacentElement('afterend', toggle);
    } else {
        header.insertAdjacentElement('afterbegin', toggle);
    }

    document.body.appendChild(backdrop);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResponsiveMenuDrawer);
} else {
    initResponsiveMenuDrawer();
}
