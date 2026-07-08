// JS mínimo compartido: tema y sidebar móvil.
(function () {
  // --- Tema (persistido en localStorage, igual que la app Next) ---
  function currentTheme() {
    try { return localStorage.getItem('theme') || 'dark'; } catch (e) { return 'dark'; }
  }
  function applyTheme(theme) {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
    try { localStorage.setItem('theme', theme); } catch (e) { }
    updateToggleIcon(theme);
  }
  function updateToggleIcon(theme) {
    document.querySelectorAll('.theme-icon-sun').forEach(function (el) {
      el.classList.toggle('hidden', theme !== 'dark');
    });
    document.querySelectorAll('.theme-icon-moon').forEach(function (el) {
      el.classList.toggle('hidden', theme === 'dark');
    });
  }
  updateToggleIcon(currentTheme());

  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // --- Sidebar móvil ---
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  var sidebarToggle = document.getElementById('sidebar-toggle');

  function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
  }
  function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  }
  if (sidebarToggle && sidebar && overlay) {
    sidebarToggle.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);
  }

  // --- Filtros: selects auto-submit y búsqueda con debounce ---
  // Al enviar, se limpian los campos vacíos para que la URL quede corta y el
  // parámetro page se reinicia (igual que hacía la versión React).
  function submitFilterForm(form) {
    form.querySelectorAll('input[name], select[name]').forEach(function (el) {
      if (!el.value) el.removeAttribute('name');
    });
    showLoader(); // form.submit() no dispara el evento submit
    form.submit();
  }

  // --- Loader de navegación (barra de progreso superior) ---
  var pageLoader = document.getElementById('page-loader');
  function showLoader() {
    if (pageLoader) pageLoader.classList.add('active');
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    // Las anclas dentro de la misma página no navegan
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    showLoader();
  });
  document.addEventListener('submit', function (e) {
    // data-confirm puede cancelar el envío; ese listener corre antes por
    // estar registrado en el propio form (fase de captura del target).
    if (!e.defaultPrevented) showLoader();
  });
  // Al volver con el botón atrás (bfcache) la página revive: ocultar la barra
  window.addEventListener('pageshow', function () {
    if (pageLoader) pageLoader.classList.remove('active');
  });

  // --- Confirmación en formularios destructivos ---
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm(form.getAttribute('data-confirm'))) {
        e.preventDefault();
      }
    });
  });

  document.querySelectorAll('form[data-filter-form]').forEach(function (form) {
    form.addEventListener('submit', function () {
      form.querySelectorAll('input[name], select[name]').forEach(function (el) {
        if (!el.value) el.removeAttribute('name');
      });
    });

    form.querySelectorAll('select[data-autosubmit]').forEach(function (sel) {
      sel.addEventListener('change', function () { submitFilterForm(form); });
    });

    form.querySelectorAll('input[data-debounce]').forEach(function (input) {
      var timer = null;
      input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { submitFilterForm(form); }, 400);
      });
      // Evitar que Enter dispare doble envío con el debounce pendiente
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          clearTimeout(timer);
          submitFilterForm(form);
        }
      });
    });
  });
})();
