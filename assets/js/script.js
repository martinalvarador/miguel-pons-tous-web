/**
 * ============================================================
 * MIGUEL PONS TOUS — HOMENAJE ARTÍSTICO
 * script.js — Interactividad del sitio
 * ============================================================
 */

'use strict';

/* ============================================================
   CONFIGURACIÓN GLOBAL
   ============================================================ */

const CONFIG = {
  navbarScrollThreshold: 20,          // px de scroll para activar el fondo del navbar
  revealThreshold:       0.15,        // porcentaje visible para activar .reveal
  revealRootMargin:      '0px 0px -60px 0px',
  themeStorageKey:       'mpt-theme', // clave en localStorage para la preferencia
};


/* ============================================================
   UTILIDADES
   ============================================================ */

/**
 * Selecciona un elemento del DOM.
 * @param {string} selector
 * @param {Element} [parent=document]
 * @returns {Element|null}
 */
const $ = (selector, parent = document) => parent.querySelector(selector);

/**
 * Selecciona múltiples elementos del DOM.
 * @param {string} selector
 * @param {Element} [parent=document]
 * @returns {NodeList}
 */
const $$ = (selector, parent = document) => parent.querySelectorAll(selector);


/* ============================================================
   1. DARK MODE / LIGHT MODE
   ============================================================ */

const ThemeManager = (() => {
  const html    = document.documentElement;
  const STORAGE = CONFIG.themeStorageKey;

  /**
   * Obtiene el tema guardado en localStorage,
   * o detecta la preferencia del sistema operativo.
   */
  function getSavedTheme() {
    const saved = localStorage.getItem(STORAGE);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  /**
   * Aplica el tema al <html> y actualiza el aria-label del botón.
   * @param {string} theme — 'dark' | 'light'
   */
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);

    const btn = $('.btn-theme');
    if (btn) {
      btn.setAttribute(
        'aria-label',
        theme === 'dark'
          ? 'Cambiar a modo claro'
          : 'Cambiar a modo oscuro'
      );
    }

    localStorage.setItem(STORAGE, theme);
  }

  /**
   * Alterna entre dark y light mode.
   */
  function toggle() {
    const current = html.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  /**
   * Inicializa el sistema de temas.
   */
  function init() {
    // Aplicar tema sin animación en la carga inicial
    html.style.transition = 'none';
    applyTheme(getSavedTheme());

    // Re-habilitar transiciones en el siguiente frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        html.style.transition = '';
      });
    });

    // Escuchar cambios en la preferencia del sistema
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', e => {
        if (!localStorage.getItem(STORAGE)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });

    // Botón de toggle
    const btn = $('.btn-theme');
    if (btn) {
      btn.addEventListener('click', toggle);
    }
  }

  return { init, toggle, applyTheme };
})();


/* ============================================================
   2. NAVBAR — STICKY + SCROLL EFFECT + ACTIVE LINK
   ============================================================ */

const NavbarManager = (() => {
  const navbar  = $('.navbar');
  const btnMenu = $('.btn-menu');
  const drawer  = $('.navbar__drawer');
  const drawerLinks = $$('.navbar__drawer-link');
  let   isOpen  = false;

  /**
   * Marca el enlace de navegación activo según la sección visible.
   * Usa IntersectionObserver para performance.
   */
  function initActiveLink() {
    const sections = $$('section[id]');
    if (!sections.length) return;

    const navLinks     = $$('.navbar__link');
    const drawerLinks  = $$('.navbar__drawer-link');

    const allLinks = [...navLinks, ...drawerLinks];

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const id = entry.target.getAttribute('id');
        allLinks.forEach(link => {
          const href = link.getAttribute('href');
          const isActive = href === `#${id}`;
          link.classList.toggle('is-active', isActive);
        });
      });
    }, {
      rootMargin: '-40% 0px -55% 0px',
    });

    sections.forEach(section => observer.observe(section));
  }

  /**
   * Aplica el efecto de fondo al navbar al hacer scroll.
   */
  function initScrollEffect() {
    if (!navbar) return;

    const update = () => {
      const scrolled = window.scrollY > CONFIG.navbarScrollThreshold;
      navbar.classList.toggle('is-scrolled', scrolled);
    };

    // Ejecutar al cargar (por si la página ya tiene scroll)
    update();

    window.addEventListener('scroll', update, { passive: true });
  }

  /**
   * Inicializa el menú hamburguesa para mobile.
   */
  function initMobileMenu() {
    if (!btnMenu || !drawer) return;

    function openMenu() {
      isOpen = true;
      btnMenu.classList.add('is-open');
      drawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      btnMenu.setAttribute('aria-expanded', 'true');
      btnMenu.setAttribute('aria-label', 'Cerrar menú');
    }

    function closeMenu() {
      isOpen = false;
      btnMenu.classList.remove('is-open');
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
      btnMenu.setAttribute('aria-expanded', 'false');
      btnMenu.setAttribute('aria-label', 'Abrir menú');
    }

    function toggleMenu() {
      isOpen ? closeMenu() : openMenu();
    }

    btnMenu.addEventListener('click', toggleMenu);

    // Cerrar al hacer clic en un enlace del drawer
    drawerLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Cerrar con la tecla Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    // Cerrar si se hace resize a desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && isOpen) closeMenu();
    }, { passive: true });
  }

  function init() {
    initScrollEffect();
    initMobileMenu();
    initActiveLink();
  }

  return { init };
})();


/* ============================================================
   3. ANIMACIONES DE ENTRADA (REVEAL ON SCROLL)
   ============================================================ */

const RevealManager = (() => {
  /**
   * Usa IntersectionObserver para revelar elementos
   * con clase .reveal cuando entran en el viewport.
   */
  function init() {
    const elements = $$('.reveal');
    if (!elements.length) return;

    // Evitar animaciones si el usuario prefiere movimiento reducido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Dejar de observar una vez revelado (performance)
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold:  CONFIG.revealThreshold,
      rootMargin: CONFIG.revealRootMargin,
    });

    elements.forEach(el => observer.observe(el));
  }

  return { init };
})();


/* ============================================================
   4. SMOOTH SCROLL — NAVEGACIÓN INTERNA
   ============================================================ */

const SmoothScroll = (() => {
  function init() {
    const navbarH = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--navbar-h')
    ) || 72;

    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const top = target.getBoundingClientRect().top
                  + window.scrollY
                  - navbarH;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  return { init };
})();


/* ============================================================
   5. HERO — EFECTO PARALLAX SUTIL (opcional, desktop only)
   ============================================================ */

const HeroParallax = (() => {
  const hero = $('.hero');
  const bg   = $('.hero__bg');

  function init() {
    if (!hero || !bg) return;

    // Solo en desktop con preferencia de movimiento normal
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 768px)').matches) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (ticking) return;

      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroH   = hero.offsetHeight;

        // Solo aplica mientras el hero sea visible
        if (scrollY < heroH) {
          const shift = scrollY * 0.25; // factor de parallax
          bg.style.transform = `translateY(${shift}px)`;
        }

        ticking = false;
      });

      ticking = true;
    }, { passive: true });
  }

  return { init };
})();


/* ============================================================
   6. ANIMACIÓN DE TEXTO DEL HERO — ENTRADA ESCALONADA
   ============================================================ */

const HeroEntrance = (() => {
  function init() {
    const elements = [
      '.hero__eyebrow',
      '.hero__title-first',
      '.hero__title-last',
      '.hero__subtitle',
      '.hero__actions',
      '.hero__scroll',
    ];

    // Si el usuario prefiere movimiento reducido, mostrar todo directamente
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Ocultar inicialmente
    elements.forEach(sel => {
      const el = $(sel);
      if (el) {
        el.style.opacity   = '0';
        el.style.transform = 'translateY(20px)';
      }
    });

    // Revelar con retraso escalonado
    const BASE_DELAY = 200;  // ms
    const STEP       = 140;  // ms entre cada elemento

    elements.forEach((sel, i) => {
      const el = $(sel);
      if (!el) return;

      setTimeout(() => {
        el.style.transition = 'opacity 900ms cubic-bezier(0.16, 1, 0.3, 1), transform 900ms cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.opacity    = '1';
        el.style.transform  = 'translateY(0)';
      }, BASE_DELAY + i * STEP);
    });
  }

  return { init };
})();


/* ============================================================
   7. INICIALIZACIÓN GENERAL
   ============================================================ */

/**
 * Punto de entrada principal.
 * Se ejecuta cuando el DOM está completamente cargado.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Tema (lo primero para evitar flash)
  ThemeManager.init();

  // Navbar
  NavbarManager.init();

  // Animaciones de scroll
  RevealManager.init();

  // Scroll suave para anclas
  SmoothScroll.init();

  // Parallax del hero
  HeroParallax.init();

  // Entrada animada del hero
  HeroEntrance.init();

  // Log de bienvenida artístico en consola
  console.log(
    '%c✦ Miguel Pons Tous — Homenaje Artístico ✦',
    'font-family: Georgia, serif; font-size: 14px; color: #B8893A; padding: 8px 0;'
  );
});
