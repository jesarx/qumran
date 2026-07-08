// JS del formulario de libro: búsqueda por ISBN (Google Books vía el
// servidor), hints de "se creará nuevo autor/editorial" y escáner de
// códigos de barras (zxing vendoreado, carga perezosa).
(function () {
  var isbnInput = document.getElementById('isbn');
  if (!isbnInput) return;

  // Solo dígitos en el ISBN, máximo 13 (como la versión React)
  isbnInput.addEventListener('input', function () {
    var v = isbnInput.value.replace(/\D/g, '').slice(0, 13);
    if (v !== isbnInput.value) isbnInput.value = v;
  });

  // --- Búsqueda por ISBN -----------------------------------------------------
  function parseAuthorName(fullName) {
    var parts = fullName.trim().split(' ');
    if (parts.length === 1) return { first: '', last: parts[0] };
    return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
  }

  function setValue(id, value) {
    var el = document.getElementById(id);
    if (el && value) { el.value = value; el.dispatchEvent(new Event('input')); }
  }

  var searchBtn = document.getElementById('search-isbn');
  if (searchBtn) {
    var searchLabel = searchBtn.innerHTML;
    searchBtn.addEventListener('click', function () {
      var isbn = isbnInput.value.replace(/\D/g, '');
      if (isbn.length !== 10 && isbn.length !== 13) {
        alert('Por favor ingresa un ISBN válido (10 o 13 dígitos)');
        return;
      }
      searchBtn.disabled = true;
      searchBtn.textContent = 'Buscando...';
      fetch('/dashboard/api/isbn?isbn=' + encodeURIComponent(isbn), { headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.found) {
            alert('No se encontró información para este ISBN');
            return;
          }
          setValue('title', data.title);
          if (data.authors && data.authors.length > 0) {
            var a1 = parseAuthorName(data.authors[0]);
            setValue('author1LastName', a1.last);
            setValue('author1FirstName', a1.first);
            if (data.authors.length > 1) {
              var a2 = parseAuthorName(data.authors[1]);
              setValue('author2LastName', a2.last);
              setValue('author2FirstName', a2.first);
            }
          }
          if (data.publisher) setValue('publisherName', data.publisher);
          // Intentar match de categoría por subject (igual que la versión React)
          if (data.subjects && data.subjects.length > 0) {
            var subject = data.subjects[0].toLowerCase();
            var select = document.getElementById('categoryId');
            if (select) {
              for (var i = 0; i < select.options.length; i++) {
                var opt = select.options[i];
                if (opt.value && subject.indexOf(opt.text.toLowerCase()) !== -1) {
                  select.value = opt.value;
                  break;
                }
              }
            }
          }
        })
        .catch(function () { alert('Error al buscar el ISBN. Por favor intenta de nuevo.'); })
        .finally(function () {
          searchBtn.disabled = false;
          searchBtn.innerHTML = searchLabel;
        });
    });
  }

  // --- Hint "se creará un nuevo autor/editorial" ------------------------------
  function datalistValues(id) {
    var dl = document.getElementById(id);
    if (!dl) return [];
    return Array.prototype.map.call(dl.options, function (o) { return o.value.toLowerCase().trim(); });
  }

  function wireNewHint(inputId, datalistId, message) {
    var input = document.getElementById(inputId);
    if (!input) return;
    var hint = document.createElement('p');
    hint.className = 'text-xs text-red-500 mt-1 hidden';
    input.parentNode.appendChild(hint);
    var known = null;
    input.addEventListener('input', function () {
      if (known === null) known = datalistValues(datalistId);
      var v = input.value.toLowerCase().trim();
      if (v && known.indexOf(v) === -1) {
        hint.textContent = message + ': ' + input.value.trim();
        hint.classList.remove('hidden');
      } else {
        hint.classList.add('hidden');
      }
    });
  }
  wireNewHint('author1LastName', 'authors-list', 'Se creará un nuevo autor');
  wireNewHint('author2LastName', 'authors-list', 'Se creará un nuevo autor');
  wireNewHint('publisherName', 'publishers-list', 'Se creará una nueva editorial');

  // --- Escáner de códigos de barras -------------------------------------------
  var scanBtn = document.getElementById('scan-isbn');
  var overlay = document.getElementById('scanner-overlay');
  if (!scanBtn || !overlay) return;

  var video = document.getElementById('scanner-video');
  var statusEl = document.getElementById('scanner-status');
  var reader = null;
  var zxingLoaded = false;

  function loadZXing() {
    return new Promise(function (resolve, reject) {
      if (zxingLoaded) return resolve();
      var s = document.createElement('script');
      s.src = '/static/js/vendor/zxing.min.js';
      s.onload = function () { zxingLoaded = true; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function stopScanner() {
    if (reader) { try { reader.reset(); } catch (e) { } reader = null; }
    overlay.classList.add('hidden');
  }

  function startScanner() {
    overlay.classList.remove('hidden');
    statusEl.textContent = 'Coloca el código de barras dentro del recuadro';
    loadZXing().then(function () {
      // Solo formatos 1D de libros: detección más rápida y fiable en móvil
      var hints = new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.EAN_13,
        ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.UPC_A,
        ZXing.BarcodeFormat.UPC_E
      ]);
      hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
      reader = new ZXing.BrowserMultiFormatReader(hints);

      // Cámara trasera forzada por constraints (las etiquetas de dispositivos
      // están vacías antes del permiso; enumerar deviceIds elige la frontal).
      var constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      reader.decodeFromConstraints(constraints, video, function (result, err) {
        if (result) {
          var digits = result.getText().replace(/\D/g, '');
          if (digits.length === 13 || digits.length === 10) {
            isbnInput.value = digits;
            stopScanner();
          }
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
          console.error('Scanning error:', err);
        }
      }).catch(function (err) {
        console.error('Failed to start scanner:', err);
        statusEl.textContent = 'No se pudo iniciar la cámara. Verifica los permisos y que la página use HTTPS.';
      });
    }).catch(function () {
      statusEl.textContent = 'No se pudo cargar el lector de códigos.';
    });
  }

  scanBtn.addEventListener('click', startScanner);
  document.getElementById('scanner-close').addEventListener('click', stopScanner);
})();
