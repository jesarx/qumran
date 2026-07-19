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

  // --- Autores: autollenado desde el datalist y hint de "nuevo autor" ---------
  // Las opciones del datalist son "Apellido, Nombre". Al seleccionar una, se
  // separan en los dos campos; el hint muestra el nombre completo del autor
  // que se crearía (como en el diseño original).
  function datalistValues(id) {
    var dl = document.getElementById(id);
    if (!dl) return [];
    return Array.prototype.map.call(dl.options, function (o) { return (o.value || '').trim(); });
  }

  function wireAuthorPair(lastId, firstId, datalistId) {
    var lastInput = document.getElementById(lastId);
    var firstInput = document.getElementById(firstId);
    if (!lastInput || !firstInput) return;
    var hint = document.createElement('p');
    hint.className = 'text-xs text-red-500 mt-1 hidden';
    lastInput.parentNode.appendChild(hint);
    var names = null;
    function known() {
      if (names === null) names = datalistValues(datalistId);
      return names;
    }
    function existsDisplay(display) {
      var v = display.toLowerCase();
      return known().some(function (n) { return n.toLowerCase() === v; });
    }
    function refreshHint() {
      var last = lastInput.value.trim();
      var first = firstInput.value.trim();
      if (!last) { hint.classList.add('hidden'); return; }
      var display = first ? last + ', ' + first : last;
      if (existsDisplay(display)) {
        hint.classList.add('hidden');
        return;
      }
      hint.textContent = 'Se creará un nuevo autor: ' + (first ? first + ' ' + last : last);
      hint.classList.remove('hidden');
    }
    lastInput.addEventListener('input', function () {
      // Selección del datalist ("Apellido, Nombre"): separar en ambos campos
      var v = lastInput.value.trim();
      if (v.indexOf(',') !== -1 && existsDisplay(v)) {
        var i = v.indexOf(',');
        lastInput.value = v.slice(0, i).trim();
        firstInput.value = v.slice(i + 1).trim();
      }
      refreshHint();
    });
    firstInput.addEventListener('input', refreshHint);
  }
  wireAuthorPair('author1LastName', 'author1FirstName', 'authors-list');
  wireAuthorPair('author2LastName', 'author2FirstName', 'authors-list');

  // Editorial: hint simple con el nombre
  (function () {
    var input = document.getElementById('publisherName');
    if (!input) return;
    var hint = document.createElement('p');
    hint.className = 'text-xs text-red-500 mt-1 hidden';
    input.parentNode.appendChild(hint);
    var known = null;
    input.addEventListener('input', function () {
      if (known === null) known = datalistValues('publishers-list').map(function (n) { return n.toLowerCase(); });
      var v = input.value.trim();
      if (v && known.indexOf(v.toLowerCase()) === -1) {
        hint.textContent = 'Se creará una nueva editorial: ' + v;
        hint.classList.remove('hidden');
      } else {
        hint.classList.add('hidden');
      }
    });
  })();

  // --- Escáner de códigos de barras -------------------------------------------
  // Loop de captura propio: getUserMedia + canvas + MultiFormatReader.
  // (El BrowserCodeReader de zxing-js tiene una condición de carrera con las
  // dimensiones del video que hacía que nunca decodificara.)
  var scanBtn = document.getElementById('scan-isbn');
  var overlay = document.getElementById('scanner-overlay');
  if (!scanBtn || !overlay) return;

  var video = document.getElementById('scanner-video');
  var statusEl = document.getElementById('scanner-status');
  var zxingLoaded = false;
  var scanStream = null;
  var scanTimer = null;

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
    if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
    if (scanStream) {
      scanStream.getTracks().forEach(function (t) { t.stop(); });
      scanStream = null;
    }
    video.srcObject = null;
    overlay.classList.add('hidden');
  }

  function startScanner() {
    overlay.classList.remove('hidden');
    statusEl.textContent = 'Coloca el código de barras dentro del recuadro';
    loadZXing().then(function () {
      // Solo formatos 1D de libros: detección más rápida y fiable
      var hints = new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.EAN_13,
        ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.UPC_A,
        ZXing.BarcodeFormat.UPC_E
      ]);
      hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
      var reader = new ZXing.MultiFormatReader();
      reader.setHints(hints);

      // Cámara trasera por constraints (las etiquetas de dispositivos están
      // vacías antes del permiso; enumerar deviceIds elegía la frontal).
      return navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }).then(function (stream) {
        scanStream = stream;
        video.srcObject = stream;
        return video.play();
      }).then(function () {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        scanTimer = setInterval(function () {
          if (!video.videoWidth || !video.videoHeight) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          try {
            var source = new ZXing.HTMLCanvasElementLuminanceSource(canvas);
            var bitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(source));
            var result = reader.decodeWithState(bitmap);
            var digits = result.getText().replace(/\D/g, '');
            if (digits.length === 13 || digits.length === 10) {
              isbnInput.value = digits;
              isbnInput.dispatchEvent(new Event('input'));
              stopScanner();
            }
          } catch (e) {
            // NotFoundException en frames sin código: seguir intentando
            if (!(e instanceof ZXing.NotFoundException)) {
              console.error('Scanning error:', e);
            }
          }
        }, 250);
      });
    }).catch(function (err) {
      console.error('Failed to start scanner:', err);
      statusEl.textContent = 'No se pudo iniciar la cámara. Verifica los permisos y que la página use HTTPS.';
    });
  }

  scanBtn.addEventListener('click', startScanner);
  document.getElementById('scanner-close').addEventListener('click', stopScanner);
})();
