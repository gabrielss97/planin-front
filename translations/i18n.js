// Sistema de internacionalização simples

// Variável global para armazenar a tradução ativa
let activeTranslation = null;
let defaultLanguage = 'pt'; // Idioma padrão caso a detecção não funcione

// Função para obter o idioma do navegador
function getBrowserLanguage() {
  // Obter o idioma preferido do navegador
  const language = navigator.language || navigator.userLanguage || defaultLanguage;
  return language.substring(0, 2).toLowerCase(); // Pegar apenas os dois primeiros caracteres (en-US -> en)
}

// Função para carregar a tradução com base no idioma do navegador
function loadTranslation() {
  const language = getBrowserLanguage();
  
  // Se for português ou inglês, usar essa tradução, caso contrário usar o inglês como fallback
  if (language === 'pt') {
    activeTranslation = pt;
  } else {
    activeTranslation = en;
  }
  
  // Atualizar todos os textos da página
  updatePageTexts();
  
  // Retornar o idioma detectado para informação
  return language;
}

// Função para mudar o idioma manualmente
function changeLanguage(language) {
  if (language === 'pt') {
    activeTranslation = pt;
  } else if (language === 'en') {
    activeTranslation = en;
  } else {
    // Fallback para inglês se o idioma não for suportado
    activeTranslation = en;
  }
  
  // Salvar preferência no localStorage
  localStorage.setItem('preferredLanguage', language);
  
  // Atualizar todos os textos da página
  updatePageTexts();
}

// Função para traduzir um texto específico
function translate(key) {
  // Se a tradução não estiver carregada, carregá-la
  if (!activeTranslation) {
    loadTranslation();
  }
  
  // Retornar o texto traduzido ou a chave se não encontrada
  return activeTranslation[key] || key;
}

// Função para atualizar todos os textos traduzíveis na página
function updatePageTexts() {
  // Atualizar o título da página
  document.title = translate('title');
  
  // Atualizar os elementos com data-i18n
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      // Verificar se o elemento possui value (inputs)
      if (element.hasAttribute('placeholder')) {
        element.setAttribute('placeholder', translate(key));
      } else if (element.tagName === 'INPUT' && element.type === 'button') {
        element.value = translate(key);
      } else {
        element.textContent = translate(key);
      }
    }
  });
  
  // Atualizar os atributos title para elementos com data-i18n-title
  const titleElements = document.querySelectorAll('[data-i18n-title]');
  titleElements.forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    if (key) {
      element.setAttribute('title', translate(key));
    }
  });
}

// Inicializar o sistema quando a página for carregada
document.addEventListener('DOMContentLoaded', () => {
  // Verificar se há uma preferência de idioma no localStorage
  const savedLanguage = localStorage.getItem('preferredLanguage');
  
  if (savedLanguage) {
    changeLanguage(savedLanguage);
  } else {
    loadTranslation();
  }
}); 