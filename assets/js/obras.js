/**
 * ================================================================
 * MIGUEL PONS TOUS — GALERÍA DE OBRAS
 * assets/js/obras.js — Lógica de la galería dinámica
 * ================================================================
 *
 * Módulos:
 *  1. CONFIG          — Configuración centralizada
 *  2. $ / $$          — Utilidades de DOM (coherentes con script.js)
 *  3. GalleryLoader   — Fetch del JSON + render del grid
 *  4. FilterManager   — Sistema de filtros por técnica
 *  5. Lightbox        — Visualizador de obra ampliada
 *  6. RevealObserver  — Animaciones de entrada al hacer scroll
 *  7. PageEntrance    — Animación de entrada del hero de galería
 *  8. Inicialización
 *
 * Requiere: script.js (ThemeManager, NavbarManager, RevealManager)
 * ================================================================
 */

'use strict';

/* ================================================================
   1. CONFIGURACIÓN
   ================================================================ */

const OBRAS_CONFIG = {
  jsonPath:         '../data/obras.json',
  loadingEl:        '#gallery-loading',
  errorEl:          '#gallery-error',
  emptyEl:          '#gallery-empty',
  gridEl:           '#gallery-grid',
  filterPillsEl:    '#filter-pills',
  obrasCountEl:     '#obras-count',
  lightboxId:       'lightbox',

  /* Etiquetas amigables para los valores de "categoria" en el JSON */
  categoriaLabels: {
    'oleo':      'Óleo',
    'acuarela':  'Acuarela',
    'dibujo':    'Dibujo',
    'pastel':    'Pastel',
    'grabado':   'Grabado',
    'escultura': 'Escultura',
  },

  /* Paleta de colores para el placeholder SVG (sin imagen) */
  placeholderColors: [
    ['#C9994A', '#8A6325'],
    ['#7A8A6A', '#4A5A3A'],
    ['#8A7A9A', '#5A4A6A'],
    ['#A07060', '#6A4030'],
    ['#608070', '#304A40'],
  ],
};


/* ================================================================
   2. UTILIDADES DOM
   Reutilizamos el mismo patrón que script.js
   ================================================================ */

//const $$ = (sel, parent = document) => parent.querySelectorAll(sel);
//const $  = (sel, parent = document) => parent.querySelector(sel);


/* ================================================================
   3. GALLERY LOADER
   Fetch del JSON y renderizado de las tarjetas en el grid
   ================================================================ */

const GalleryLoader = (() => {

  /** Colección de obras cargada desde JSON */
  let obras = [];

  /**
   * Genera las iniciales de un título para el placeholder.
   * "Bodegón con cerámica" → "BC"
   */
  function getInitials(titulo) {
    return titulo
      .split(' ')
      .filter(w => w.length > 2)  // Ignorar artículos cortos
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  /**
   * Crea el SVG placeholder que aparece cuando la imagen no carga.
   * @param {Object} obra
   * @param {number} index — para elegir el color
   */
  function createPlaceholderHTML(obra, index) {
    const [colorA, colorB] = OBRAS_CONFIG.placeholderColors[
      index % OBRAS_CONFIG.placeholderColors.length
    ];

    return `
      <div class="obra-card__placeholder" aria-hidden="true">
        <span class="obra-card__placeholder-initials">${getInitials(obra.titulo)}</span>
        <span class="obra-card__placeholder-label">${obra.anio}</span>
      </div>`;
  }

  /**
   * Construye el HTML de una tarjeta de obra.
   * @param {Object} obra
   * @param {number} index — posición en el array
   */
  function createCardHTML(obra, index) {
    const isDestacada   = obra.destacada === true;
    const cardClass     = `obra-card${isDestacada ? ' obra-card--featured' : ''}`;
    const categoriaLabel = OBRAS_CONFIG.categoriaLabels[obra.categoria] || obra.tecnica;
    const placeholder   = createPlaceholderHTML(obra, index);

    // Construimos la tarjeta como string HTML
    // Nota: usamos data-obra-id para que el Lightbox pueda recuperar la obra
    return `
      <article
        class="${cardClass} reveal"
        data-obra-id="${obra.id}"
        data-categoria="${obra.categoria || 'todas'}"
        tabindex="0"
        role="button"
        aria-label="Ver obra: ${obra.titulo}, ${obra.anio}"
        style="--reveal-delay: ${index * 60}ms"
      >
        <!-- Marco de imagen -->
        <div class="obra-card__frame">

          <!-- Placeholder (visible mientras la imagen carga o si falla) -->
          ${placeholder}

          <!-- Imagen real -->
          <img
            class="obra-card__img"
            src="${obra.imagen}"
            alt="${obra.titulo}, ${obra.anio}. ${obra.tecnica}."
            loading="lazy"
            decoding="async"
            data-loaded="false"
          />

          <!-- Overlay con info en hover -->
          <div class="obra-card__overlay" aria-hidden="true">
            <div class="obra-card__overlay-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                   stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8"  x2="11" y2="14"/>
                <line x1="8"  y1="11" x2="14"  y2="11"/>
              </svg>
            </div>
            <p class="obra-card__overlay-tecnica">${obra.tecnica}</p>
            <p class="obra-card__overlay-titulo">${obra.titulo}</p>
            <p class="obra-card__overlay-anio">${obra.anio}</p>
          </div>

        </div><!-- /obra-card__frame -->

        <!-- Etiqueta estilo catálogo de museo -->
        <div class="obra-card__label">
          <p class="obra-card__label-titulo">${obra.titulo}</p>
          <div class="obra-card__label-meta">
            <span>${obra.anio}</span>
            <span class="obra-card__label-dot" aria-hidden="true"></span>
            <span>${categoriaLabel}</span>
          </div>
        </div>

      </article>`;
  }

  /**
   * Inicializa los listeners de carga de imagen para cada card.
   * - Marca data-loaded="true" cuando la imagen carga (fade in)
   * - Deja el placeholder visible si la imagen falla
   */
  function initImageLoaders(grid) {
    const images = $$('.obra-card__img', grid);

    images.forEach(img => {
      // Imagen ya en caché (puede ya estar cargada)
      if (img.complete && img.naturalWidth > 0) {
        img.setAttribute('data-loaded', 'true');
        return;
      }

      img.addEventListener('load', () => {
        img.setAttribute('data-loaded', 'true');
      });

      img.addEventListener('error', () => {
        // Si la imagen falla, la ocultamos para que se vea el placeholder
        img.style.display = 'none';
      });
    });
  }

  /**
   * Renderiza todas las obras en el grid.
   * @param {Array} data — array de obras desde el JSON
   */
  function render(data) {
    const grid    = $(OBRAS_CONFIG.gridEl);
    const loading = $(OBRAS_CONFIG.loadingEl);
    const counter = $(OBRAS_CONFIG.obrasCountEl);

    if (!grid) return;

    // Ocultar el spinner de carga
    if (loading) loading.remove();

    // Insertar todas las cards
    grid.insertAdjacentHTML(
      'beforeend',
      data.map((obra, i) => createCardHTML(obra, i)).join('')
    );

    // Inicializar loaders de imagen
    initImageLoaders(grid);

    // Actualizar contador de obras en el hero
    if (counter) {
      const n = data.length;
      counter.textContent = `${n} obra${n !== 1 ? 's' : ''} en la colección`;
    }

    // Guardar referencia global para el Lightbox y los filtros
    obras = data;
  }

  /**
   * Muestra el estado de error.
   */
  function showError() {
    const loading = $(OBRAS_CONFIG.loadingEl);
    const error   = $(OBRAS_CONFIG.errorEl);

    if (loading) loading.remove();
    if (error)   error.hidden = false;
  }

  /**
   * Carga el JSON y ejecuta el render.
   * Método público principal de este módulo.
   */
  async function load() {
    try {
      const response = await fetch(OBRAS_CONFIG.jsonPath);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('El JSON está vacío o no es un array válido.');
      }

      render(data);

      // Después de renderizar: inicializar filtros y reveal
      FilterManager.init(data);
      RevealObserver.init();

    } catch (err) {
      console.error('[GalleryLoader] Error al cargar obras.json:', err);
      showError();
    }
  }

  return { load, getObras: () => obras };

})();


/* ================================================================
   4. FILTER MANAGER
   Sistema de filtros por categoría/técnica
   ================================================================ */

const FilterManager = (() => {

  let currentFilter = 'todas';

  /**
   * Extrae las categorías únicas del array de obras
   * y construye los botones de filtro dinámicamente.
   * @param {Array} obras
   */
  function buildFilterPills(obras) {
    const pillsContainer = $(OBRAS_CONFIG.filterPillsEl);
    if (!pillsContainer) return;

    // Extraer categorías únicas
    const categorias = [...new Set(obras.map(o => o.categoria).filter(Boolean))];

    // Limpiar el botón "Todas" que ya está en el HTML
    // y reconstruirlo todo dinámicamente
    pillsContainer.innerHTML = '';

    // Botón "Todas"
    const todaBtn = createPill('todas', 'Todas las obras', true);
    pillsContainer.appendChild(todaBtn);

    // Un botón por cada categoría
    categorias.forEach(cat => {
      const label = OBRAS_CONFIG.categoriaLabels[cat] || cap(cat);
      const btn   = createPill(cat, label, false);
      pillsContainer.appendChild(btn);
    });
  }

  /**
   * Crea un elemento de botón de filtro.
   */
  function createPill(value, label, isActive) {
    const btn = document.createElement('button');
    btn.className    = `filter-pill${isActive ? ' filter-pill--active' : ''}`;
    btn.dataset.filter = value;
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    btn.setAttribute('role', 'listitem');
    btn.textContent  = label;
    return btn;
  }

  /**
   * Capitaliza la primera letra de un string.
   */
  function cap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Aplica el filtro activo ocultando/mostrando tarjetas.
   * @param {string} filter — 'todas' o la categoría
   */
  function applyFilter(filter) {
    currentFilter = filter;

    const cards = $$('.obra-card');
    const empty = $(OBRAS_CONFIG.emptyEl);
    let visibles = 0;

    cards.forEach(card => {
      const cat = card.dataset.categoria;

      if (filter === 'todas' || cat === filter) {
        card.classList.remove('obra-card--hidden');
        visibles++;
      } else {
        card.classList.add('obra-card--hidden');
      }
    });

    // Mostrar mensaje vacío si no hay resultados
    if (empty) {
      empty.hidden = visibles > 0;
    }

    // Actualizar el contador
    const counter = $(OBRAS_CONFIG.obrasCountEl);
    if (counter) {
      if (filter === 'todas') {
        const total = cards.length;
        counter.textContent = `${total} obra${total !== 1 ? 's' : ''} en la colección`;
      } else {
        const label = OBRAS_CONFIG.categoriaLabels[filter] || cap(filter);
        counter.textContent = `${visibles} obra${visibles !== 1 ? 's' : ''} · ${label}`;
      }
    }
  }

  /**
   * Actualiza el estado visual de los botones de filtro.
   * @param {string} activeFilter
   */
  function updatePillStates(activeFilter) {
    $$('.filter-pill').forEach(pill => {
      const isActive = pill.dataset.filter === activeFilter;
      pill.classList.toggle('filter-pill--active', isActive);
      pill.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  /**
   * Inicializa los filtros una vez que las obras están renderizadas.
   * @param {Array} obras
   */
  function init(obras) {
    buildFilterPills(obras);

    // Delegación de eventos en el contenedor
    const pillsContainer = $(OBRAS_CONFIG.filterPillsEl);
    if (!pillsContainer) return;

    pillsContainer.addEventListener('click', e => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;

      const filter = pill.dataset.filter;
      if (filter === currentFilter) return; // No hacer nada si ya es el activo

      updatePillStates(filter);
      applyFilter(filter);
    });
  }

  return { init };

})();


/* ================================================================
   5. LIGHTBOX
   Visualizador de obra a pantalla completa
   ================================================================ */

const Lightbox = (() => {

  /* Referencias al DOM del lightbox */
  const lightbox   = $('#lightbox');
  const backdrop   = $('#lightbox-backdrop');
  const closeBtn   = $('#lightbox-close');
  const prevBtn    = $('#lightbox-prev');
  const nextBtn    = $('#lightbox-next');
  const imgEl      = $('#lightbox-img');
  const placeholder= $('#lightbox-placeholder');

  /* IDs de los campos de info */
  const fields = {
    titulo:  $('#lightbox-titulo'),
    tecnica: $('#lightbox-tecnica'),
    anio:    $('#lightbox-anio'),
    medidas: $('#lightbox-medidas'),
    desc:    $('#lightbox-desc'),
    counter: $('#lightbox-counter'),
  };

  /* Estado del lightbox */
  let currentIndex     = 0;
  let filteredObras    = [];   // Obras visibles según el filtro activo
  let previousFocus    = null; // Para devolver el foco al cerrar

  /**
   * Devuelve las obras actualmente visibles (no ocultas por el filtro).
   */
  function getVisibleObras() {
    const allObras  = GalleryLoader.getObras();
    const hiddenIds = new Set(
      [...$$('.obra-card--hidden')].map(el => el.dataset.obraId)
    );
    return allObras.filter(o => !hiddenIds.has(o.id));
  }

  /**
   * Rellena el panel de información con los datos de una obra.
   * @param {Object} obra
   */
  function renderInfo(obra) {
    if (!lightbox) return;

    const categoriaLabel =
      OBRAS_CONFIG.categoriaLabels[obra.categoria] || obra.tecnica;

    if (fields.titulo)  fields.titulo.textContent  = obra.titulo;
    if (fields.tecnica) fields.tecnica.textContent = obra.tecnica;
    if (fields.anio)    fields.anio.textContent    = obra.anio;
    if (fields.medidas) fields.medidas.textContent = obra.medidas;
    if (fields.desc)    fields.desc.textContent    = obra.descripcion;

    if (fields.counter) {
      fields.counter.textContent =
        `${currentIndex + 1} de ${filteredObras.length}`;
    }

    // Actualizar aria-label del diálogo
    lightbox.setAttribute(
      'aria-label',
      `Obra: ${obra.titulo} (${obra.anio})`
    );
  }

  /**
   * Carga la imagen en el lightbox con transición suave.
   * @param {Object} obra
   */
  function loadImage(obra) {
    if (!imgEl) return;

    // Ocultar imagen actual mientras carga la nueva
    imgEl.classList.remove('is-loaded');
    imgEl.alt = `${obra.titulo}, ${obra.anio}`;

    // Mostrar placeholder mientras carga
    if (placeholder) {
      placeholder.textContent = obra.titulo.charAt(0);
    }

    // Crear imagen temporal para precargar
    const tempImg = new Image();

    tempImg.onload = () => {
      imgEl.src = obra.imagen;
      // Pequeño retraso para que la transición se vea suave
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          imgEl.classList.add('is-loaded');
          if (placeholder) placeholder.textContent = '';
        });
      });
    };

    tempImg.onerror = () => {
      // Si falla, mostramos un placeholder con las iniciales
      imgEl.src = '';
      imgEl.classList.remove('is-loaded');
      if (placeholder) {
        placeholder.textContent = obra.titulo
          .split(' ')
          .filter(w => w.length > 2)
          .slice(0, 2)
          .map(w => w[0].toUpperCase())
          .join('');
      }
    };

    tempImg.src = obra.imagen;
  }

  /**
   * Actualiza el estado de los botones prev/next.
   */
  function updateNavButtons() {
    if (prevBtn) {
      prevBtn.disabled = currentIndex === 0;
      prevBtn.style.opacity = currentIndex === 0 ? '0.3' : '';
    }
    if (nextBtn) {
      nextBtn.disabled = currentIndex === filteredObras.length - 1;
      nextBtn.style.opacity = currentIndex === filteredObras.length - 1 ? '0.3' : '';
    }
  }

  /**
   * Abre el lightbox mostrando la obra en el índice dado.
   * @param {number} index
   */
  function open(index) {
    filteredObras = getVisibleObras();
    if (!filteredObras.length || !lightbox) return;

    currentIndex  = Math.max(0, Math.min(index, filteredObras.length - 1));
    previousFocus = document.activeElement;

    const obra = filteredObras[currentIndex];

    renderInfo(obra);
    loadImage(obra);
    updateNavButtons();

    // Mostrar el lightbox
    lightbox.hidden = false;
    requestAnimationFrame(() => {
      lightbox.classList.add('is-open');
      lightbox.removeAttribute('aria-hidden');
    });

    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';

    // Mover el foco al botón de cerrar (accesibilidad)
    requestAnimationFrame(() => {
      if (closeBtn) closeBtn.focus();
    });
  }

  /**
   * Cierra el lightbox.
   */
  function close() {
    if (!lightbox) return;

    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Esperar a que termine la transición para ocultar el DOM
    const onTransitionEnd = () => {
      lightbox.hidden = true;
      if (imgEl) {
        imgEl.classList.remove('is-loaded');
        imgEl.src = '';
      }
      lightbox.removeEventListener('transitionend', onTransitionEnd);
    };

    lightbox.addEventListener('transitionend', onTransitionEnd, { once: true });

    // Devolver el foco al elemento que lo tenía antes
    if (previousFocus) {
      requestAnimationFrame(() => previousFocus.focus());
    }
  }

  /**
   * Navega a la siguiente u obra anterior.
   * @param {'prev'|'next'} direction
   */
  function navigate(direction) {
    if (direction === 'prev' && currentIndex > 0) {
      currentIndex--;
    } else if (direction === 'next' && currentIndex < filteredObras.length - 1) {
      currentIndex++;
    } else {
      return; // Sin movimiento
    }

    const obra = filteredObras[currentIndex];
    renderInfo(obra);
    loadImage(obra);
    updateNavButtons();
  }

  /**
   * Maneja los eventos de teclado dentro del lightbox.
   * @param {KeyboardEvent} e
   */
  function handleKeydown(e) {
    if (!lightbox || lightbox.hidden) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;

      case 'ArrowLeft':
        e.preventDefault();
        navigate('prev');
        break;

      case 'ArrowRight':
        e.preventDefault();
        navigate('next');
        break;
    }
  }

  /**
   * Soporte básico de swipe táctil para mobile.
   */
  function initTouch() {
    if (!lightbox) return;

    let touchStartX = 0;
    const SWIPE_THRESHOLD = 60;   // px mínimos para considerar swipe

    lightbox.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      navigate(dx < 0 ? 'next' : 'prev');
    }, { passive: true });
  }

  /**
   * Inicializa el lightbox (eventos de apertura delegados en el grid).
   */
  function init() {
    if (!lightbox) return;

    /* ---  Cerrar con el botón × --- */
    if (closeBtn)  closeBtn.addEventListener('click', close);

    /* --- Cerrar al clicar el fondo --- */
    if (backdrop)  backdrop.addEventListener('click', close);

    /* --- Navegación prev / next --- */
    if (prevBtn)   prevBtn.addEventListener('click', () => navigate('prev'));
    if (nextBtn)   nextBtn.addEventListener('click', () => navigate('next'));

    /* --- Teclado global --- */
    document.addEventListener('keydown', handleKeydown);

    /* --- Touch / swipe --- */
    initTouch();

    /* ---
       Delegación de eventos en el grid completo.
       Se hace aquí (en Lightbox.init) para centralizar la interacción:
       - Clic en una tarjeta → abrir lightbox
       - Enter/Space en una tarjeta (accesibilidad teclado) → abrir lightbox
    --- */
    const grid = $(OBRAS_CONFIG.gridEl);
    if (!grid) return;

    grid.addEventListener('click', e => {
      const card = e.target.closest('.obra-card');
      if (!card) return;

      const obraId    = card.dataset.obraId;
      const allObras  = GalleryLoader.getObras();
      const visibles  = getVisibleObras();
      const idx       = visibles.findIndex(o => o.id === obraId);

      if (idx !== -1) open(idx);
    });

    grid.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.obra-card');
      if (!card) return;

      e.preventDefault();

      const obraId  = card.dataset.obraId;
      const visibles = getVisibleObras();
      const idx     = visibles.findIndex(o => o.id === obraId);

      if (idx !== -1) open(idx);
    });
  }

  return { init, open, close, navigate };

})();


/* ================================================================
   6. REVEAL OBSERVER
   Anima las tarjetas al entrar en el viewport.
   Se ejecuta DESPUÉS de que las tarjetas sean renderizadas.
   ================================================================ */

const RevealObserver = (() => {

  function init() {
    const cards = $$('.obra-card.reveal');
    if (!cards.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cards.forEach(card => card.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          /* Respeta el delay individual de cada tarjeta (--reveal-delay) */
          const delay = entry.target.style.getPropertyValue('--reveal-delay') || '0ms';
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, parseInt(delay) || 0);

          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold:  0.08,
      rootMargin: '0px 0px -30px 0px',
    });

    cards.forEach(card => observer.observe(card));
  }

  return { init };

})();


/* ================================================================
   7. PAGE ENTRANCE — Anima el reveal.
   Los elementos del gallery-hero ya usan CSS animation puro,
   pero las tarjetas del footer sí usan la clase .reveal del JS.
   ================================================================ */

const FooterReveal = (() => {
  function init() {
    /* Activar los .reveal del footer (brand, nav, quote) */
    const footerReveals = $$('.footer .reveal');
    if (!footerReveals.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      footerReveals.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    footerReveals.forEach(el => observer.observe(el));
  }

  return { init };

})();


/* ================================================================
   8. INICIALIZACIÓN
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  console.log('1 - DOM cargado');

  try {
    console.log('2 - Inicializando Lightbox');
    Lightbox.init();
    console.log('3 - Lightbox OK');
  } catch(err) {
    console.error('ERROR EN LIGHTBOX:', err);
  }

  try {
    console.log('4 - Inicializando FooterReveal');
    FooterReveal.init();
    console.log('5 - FooterReveal OK');
  } catch(err) {
    console.error('ERROR EN FOOTERREVEAL:', err);
  }

  try {
    console.log('6 - Cargando GalleryLoader');
    GalleryLoader.load();
    console.log('7 - GalleryLoader OK');
  } catch(err) {
    console.error('ERROR EN GALLERYLOADER:', err);
  }

  console.log('8 - Fin inicialización');

});
