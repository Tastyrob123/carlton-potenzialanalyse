// Auftritt (Weg am Scrollen, Puls nach dem Auslöser), Überschriften aus dem Schlitz, Zahlen zählen, Dock zeigt den Bereich, Fortschritt.
(function () {
  var wurzel = document.documentElement;
  var reduziert = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]nomotion/.test(location.search);
  if (reduziert) wurzel.classList.add('ce-ruhig');

  // Überschriften in Wörter teilen: jedes steigt einzeln aus einem Schlitz
  [].slice.call(document.querySelectorAll('[data-zeilen]')).forEach(function (h) {
    var k = 0;
    (function walk(n) {
      [].slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var teile = c.textContent.split(/(\s+)/), f = document.createDocumentFragment();
          teile.forEach(function (w) { if (!w) return; if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'); o.className = 'zw'; var i = document.createElement('span'); i.textContent = w; i.style.setProperty('--k', k++); o.appendChild(i); f.appendChild(o); });
          n.replaceChild(f, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(h);
    h.setAttribute('data-r', 'zeilen');
  });


  // Im Auftakt trägt die Platte die Bereiche, das Dock kommt erst danach
  var ha = document.getElementById('oben');
  if (ha && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { document.body.classList.toggle('im-auftakt', e.intersectionRatio > .35); }); }, { threshold: [0, .35, .5, 1] }).observe(ha);
    document.body.classList.add('im-auftakt');
  }

  // Auftritt
  var r = [].slice.call(document.querySelectorAll('[data-r]'));
  function fertig(e) { if (e.animationName === 'puls') e.currentTarget.classList.add('fertig'); }
  r.forEach(function (el) { el.addEventListener('animationend', fertig); });
  if ('IntersectionObserver' in window && !reduziert) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px' });
    r.forEach(function (el) { io.observe(el); });
  } else r.forEach(function (el) { el.classList.add('da'); });

  // Zahlen zählen einmal hoch
  var nz = [].slice.call(document.querySelectorAll('[data-zahl]'));
  if ('IntersectionObserver' in window && !reduziert) {
    var zo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; var el = e.target; zo.unobserve(el);
        var txt = el.textContent, m = txt.match(/^(\d+)([,.]\d+)?(.*)$/); if (!m) return;
        var komma = m[2] ? m[2].slice(1) : null, rest = m[3], ziel = komma ? parseFloat(m[1] + '.' + komma) : parseInt(m[1], 10), t0 = null;
        if (ziel === 0) return;
        function schritt(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1300), v = ziel * (1 - Math.pow(1 - p, 3));
          el.textContent = (komma ? v.toFixed(komma.length).replace('.', ',') : String(Math.round(v))) + rest; if (p < 1) requestAnimationFrame(schritt); }
        requestAnimationFrame(schritt);
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    nz.forEach(function (el) { zo.observe(el); });
  }

  // Fortschritt oben und Dock
  var band = document.querySelector('.fortschritt'), tick = false;
  function fort() { var h = wurzel.scrollHeight - innerHeight; band.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; tick = false; }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(fort); } }, { passive: true }); fort();
  var links = [].slice.call(document.querySelectorAll('.dock [data-k]'));
  if ('IntersectionObserver' in window && links.length) {
    var so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('an', a.getAttribute('data-k') === e.target.id); }); }); }, { rootMargin: '-45% 0px -50% 0px' });
    [].slice.call(document.querySelectorAll('.kap')).forEach(function (s) { so.observe(s); });
  }

  // Handy-Stapel: ein grosses Handy vorn, die anderen dahinter; Pfeile (und Tippen auf ein hinteres) holen das nächste nach vorn
  [].slice.call(document.querySelectorAll('[data-stapel]')).forEach(function (st) {
    var figs = [].slice.call(st.querySelectorAll('.beweis')), cur = st.hasAttribute('data-start') ? +st.getAttribute('data-start') : Math.floor((figs.length - 1) / 2);
    var l = st.querySelector('.stapel__pfeil--l'), r = st.querySelector('.stapel__pfeil--r');
    var n = figs.length, vor = [];
    function rund(i) { var d = ((i - cur) % n + n) % n; return d > n / 2 ? d - n : d; }
    function zeig() {
      figs.forEach(function (f, i) {
        var d = rund(i), a = Math.abs(d);
        var spring = vor[i] !== undefined && Math.abs(d - vor[i]) > 1;
        if (spring) { f.classList.add('springt'); void f.offsetWidth; }
        f.style.setProperty('--x', (d * 60) + '%'); f.style.setProperty('--ry', (d === 0 ? 0 : (d < 0 ? 1 : -1) * (24 + (a - 1) * 8)) + 'deg'); f.style.setProperty('--zz', (-a * 140) + 'px'); f.style.setProperty('--s', a === 0 ? 1 : Math.max(.6, 1 - a * .17));
        f.style.setProperty('--z', 10 - a); f.style.setProperty('--o', a > 1 ? 0 : 1); f.style.setProperty('--k', d === 0 ? 0 : 1);
        f.classList.toggle('ist-vorn', d === 0); f.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
        if (spring) { void f.offsetWidth; f.classList.remove('springt'); }
        vor[i] = d;
      });
    }
    function weiter(s) { st.classList.add('bedient'); cur = (cur + s + n) % n; zeig(); }
    l.addEventListener('click', function () { weiter(-1); });
    r.addEventListener('click', function () { weiter(1); });
    var tx = null;
    st.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    st.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 40) weiter(dx < 0 ? 1 : -1); }, { passive: true });
    figs.forEach(function (f, i) { f.addEventListener('click', function (e) { if (i !== cur && !e.target.closest('a')) { st.classList.add('bedient'); cur = i; zeig(); } }); });
    st.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') l.click(); if (e.key === 'ArrowRight') r.click(); });
    zeig();
    if ('IntersectionObserver' in window && !reduziert) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { st.classList.add('ein'); io.disconnect(); } }); }, { threshold: .4 });
      io.observe(st);
    } else st.classList.add('ein');
  });


  // Sieben Verweise: Zahlen wählen, Stelle und Ziel wechseln
  [].slice.call(document.querySelectorAll('[data-vw]')).forEach(function (v) {
    var ks = [].slice.call(v.querySelectorAll('.vw__k')), ps = [].slice.call(v.querySelectorAll('.vw__paar')), nz = v.querySelector('[data-vw-n]');
    function an(i) {
      ks.forEach(function (k, n) { k.classList.toggle('ist', n === i); k.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
      ps.forEach(function (p, n) { p.classList.toggle('ist', n === i); });
      if (nz) nz.textContent = i + 1;
      var tt = v.querySelector('[data-vw-t]'); if (tt && ks[i].getAttribute('data-t')) tt.textContent = ks[i].getAttribute('data-t');
    }
    function vor(i) { ps[i] && [].slice.call(ps[i].querySelectorAll('img')).forEach(function (im) { var x = new Image(); x.src = im.currentSrc || im.src; }); }
    ks.forEach(function (k, i) {
      k.addEventListener('click', function () { an(i); });
      k.addEventListener('mouseenter', function () { vor(i); }); k.addEventListener('focus', function () { vor(i); });
      k.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { var n = (i + d + ks.length) % ks.length; an(n); ks[n].focus(); e.preventDefault(); } });
    });
    ps.forEach(function (p) { [].slice.call(p.querySelectorAll('img[loading=lazy]')).forEach(function (im) { im.loading = 'eager'; }); });
  });


  // Was das bedeutet: Schalter wechseln die Aussage
  [].slice.call(document.querySelectorAll('[data-bed]')).forEach(function (v) {
    var ks = [].slice.call(v.querySelectorAll('.bed4__k')), ts = [].slice.call(v.querySelectorAll('.bed4__t'));
    function an(i) { ks.forEach(function (k, n) { k.classList.toggle('ist', n === i); k.setAttribute('aria-selected', n === i ? 'true' : 'false'); }); ts.forEach(function (t, n) { t.classList.toggle('ist', n === i); }); }
    ks.forEach(function (k, i) {
      k.addEventListener('click', function () { an(i); });
      k.addEventListener('keydown', function (e) { var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0; if (d) { var n = (i + d + ks.length) % ks.length; an(n); ks[n].focus(); e.preventDefault(); } });
    });
  });


  // Bilder der Aufnahmen nach dem Laden vorholen, damit Kreis und Bild gemeinsam da sind
  window.addEventListener('load', function () {
    setTimeout(function () { [].slice.call(document.querySelectorAll('.szene img[loading=lazy]')).forEach(function (im) { im.loading = 'eager'; }); }, 900);
  });

  // Einzelnes Handy schwebt von unten herein, sobald es im Bild ist
  [].slice.call(document.querySelectorAll('[data-schweb]')).forEach(function (el) {
    if (!('IntersectionObserver' in window) || reduziert) { el.classList.add('ein'); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { el.classList.add('ein'); io.disconnect(); } }); }, { threshold: .3 });
    io.observe(el);
  });

  // Dokumentbühne: Reiter wechseln die Ansicht, die Dokumente fliegen beim ersten Sehen herein
  [].slice.call(document.querySelectorAll('[data-doppel]')).forEach(function (d) {
    var tabs = [].slice.call(d.querySelectorAll('.tabs button')), an = [].slice.call(d.querySelectorAll('.ansicht'));
    tabs.forEach(function (t) { t.addEventListener('click', function () {
      var i = t.getAttribute('data-i'); tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
      an.forEach(function (a) { a.classList.toggle('ist', a.getAttribute('data-i') === i); });
    }); });
    if ('IntersectionObserver' in window && !reduziert) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { d.classList.add('ein'); io.disconnect(); } }); }, { threshold: .25 });
      io.observe(d);
    } else d.classList.add('ein');
  });
})();
