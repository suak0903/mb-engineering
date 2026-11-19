/* MBecker Engineering, Entwurf: Kopfleiste, Handymenü, Parallax, Einblenden, Kompetenzliste, Vortrieb-Regler, Galerie, Demo-Leiste. Vanilla. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Kopfleiste ab 24 px solid */
  var nav = $('#nav');
  function onScroll() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* Handymenü: Kopfleiste bleibt stehen (Logo deckungsgleich), der Burger morpht zum X und schliesst wieder; Glas, ESC, Link, Wischen nach rechts; kein Scroll-Lock */
  var burger = $('#burger'), mmenu = $('#mmenu');
  var labelAuf = burger ? burger.getAttribute('aria-label') : '', labelZu = burger ? burger.dataset.zu : '';
  function auf() { document.body.classList.add('menu-auf'); mmenu.classList.add('open'); nav.classList.add('menu-open'); mmenu.removeAttribute('inert'); burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', labelZu); }
  function zu() { document.body.classList.remove('menu-auf'); mmenu.classList.remove('open'); nav.classList.remove('menu-open'); mmenu.setAttribute('inert', ''); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', labelAuf); }
  if (burger && mmenu) {
    burger.addEventListener('click', function () { if (mmenu.classList.contains('open')) zu(); else auf(); });
    $$('a', mmenu).forEach(function (a) { a.addEventListener('click', zu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mmenu.classList.contains('open')) { zu(); burger.focus(); } });
    var sx = 0, sy = 0, mit = false;
    mmenu.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; mit = true; }, { passive: true });
    mmenu.addEventListener('touchmove', function (e) { if (!mit) return; var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy; if (dx > 58 && Math.abs(dx) > Math.abs(dy)) { mit = false; zu(); } }, { passive: true });
  }

  /* aria-current: Kopf ist auf allen Seiten gleich, das Skript markiert die aktuelle Seite */
  var hier = location.pathname.split('/').pop() || 'index.html';
  var gruppe = /^project-/.test(hier) ? 'references.html' : /^knowledge-/.test(hier) ? 'knowledge.html' : hier;
  $$('.nav__links a, .mmenu__links a').forEach(function (a) { if (a.getAttribute('href') === gruppe) a.setAttribute('aria-current', 'page'); });

  /* Parallax 50 Prozent auf dem Kopfbild, nur Verschiebung */
  var par = $('.hero__bg img, .kopf__bg img');
  if (par && !reduce) {
    var tick = false;
    window.addEventListener('scroll', function () { if (tick) return; tick = true; requestAnimationFrame(function () { var y = window.scrollY; if (y < window.innerHeight * 1.4) par.style.transform = 'translate3d(0,' + (y * 0.5).toFixed(1) + 'px,0)'; tick = false; }); }, { passive: true });
  }

  /* Einblenden, Schwelle 0, damit auch sehr lange Blöcke erscheinen */
  var rev = $$('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    rev.forEach(function (el) { io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add('in'); });

  /* Kennzahlen zählen beim ersten Sichtbarwerden hoch (Endwert steht im HTML, ohne JS bleibt er stehen) */
  var zahlen = $$('[data-zahl]');
  if (zahlen.length && !reduce && 'IntersectionObserver' in window) {
    var zaehle = function (el) {
      var ziel = +el.dataset.zahl, von = +(el.dataset.von || 0), t0 = null;
      var schritt = function (t) { if (!t0) t0 = t; var f = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - f, 3); el.textContent = Math.round(von + (ziel - von) * e); if (f < 1) requestAnimationFrame(schritt); };
      requestAnimationFrame(schritt);
    };
    var iz2 = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { zaehle(e.target); iz2.unobserve(e.target); } }); }, { threshold: 0.6 });
    zahlen.forEach(function (el) { el.textContent = el.dataset.von || '0'; iz2.observe(el); });
  }

  /* Kompetenzliste: die Zeile in der Mitte des Bildschirms (oder unter Maus und Fokus) wechselt das Bild */
  var zeilen = $$('.zeile'), bilder = $$('.split__bild img');
  function setze(i) { zeilen.forEach(function (z) { z.classList.toggle('an', z.dataset.i === String(i)); }); bilder.forEach(function (b) { b.classList.toggle('an', b.dataset.i === String(i)); }); }
  zeilen.forEach(function (z) { z.addEventListener('mouseenter', function () { setze(z.dataset.i); }); z.addEventListener('focusin', function () { setze(z.dataset.i); }); });
  if (zeilen.length && 'IntersectionObserver' in window) {
    var iz = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) setze(e.target.dataset.i); }); }, { rootMargin: '-45% 0px -50% 0px' });
    zeilen.forEach(function (z) { iz.observe(z); });
  }

  /* Vortrieb: Regler 1993 bis 2028 */
  var regler = $('#vtRegler'), datenEl = $('#vtDaten');
  if (regler && datenEl) {
    var d = JSON.parse(datenEl.textContent), jahrEl = $('#vtJahr'), stEl = $('#vtStation'), brust = $('#vtBrust');
    var li = $$('#vtListe li'), pk = $$('.pkt');
    var x = function (j) { return ((j - 1993) / 35) * 1000; };
    var zeige = function () {
      var j = parseInt(regler.value, 10);
      jahrEl.textContent = j;
      var st = d.stationen.filter(function (s) { return s[0] <= j; }).pop();
      stEl.textContent = st ? st[0] + ': ' + st[1] : '';
      var n = 0;
      li.forEach(function (l) { var an = +l.dataset.v <= j && +l.dataset.b >= j; l.hidden = !an; if (an) n++; });
      pk.forEach(function (p) { p.classList.toggle('an', +p.dataset.v <= j && +p.dataset.b >= j); });
      if (brust) { brust.setAttribute('x1', x(j)); brust.setAttribute('x2', x(j)); }
      var griff = $('#vtGriff'); if (griff) griff.style.setProperty('--p', ((x(j) + 10) / 1020).toFixed(4));
      $('#vtLeer').hidden = n > 0;
    };
    regler.addEventListener('input', zeige);
    zeige();
  }

  /* Fenster: alles ausser dem Fenster inert, damit der Fokus darin bleibt (aria-modal allein hält ihn nicht) */
  function sperre(fenster, an) {
    /* Was schon vorher inert war (verstecktes Handymenü), bleibt unberührt */
    var setze = function (el) { if (an) { if (el.inert) return; el.inert = true; el.dataset.gesperrt = '1'; } else if (el.dataset.gesperrt) { el.inert = false; delete el.dataset.gesperrt; } };
    $$('body > *').forEach(function (el) { if (el.tagName === 'SCRIPT') return; if (el.contains(fenster)) { $$(':scope > *', el).forEach(function (k) { if (k !== fenster && !k.contains(fenster)) setze(k); }); } else setze(el); });
  }

  /* Galerie mit Lightbox: Pfeile, Zähler, ESC, Wischen */
  var lb = $('#lb');
  if (lb) {
    var gal = $$('.galerie button'), idx = 0, lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbNr = $('#lbNr');
    var zeigeLb = function (i) { idx = (i + gal.length) % gal.length; var b = gal[idx], img = $('img', b); lbImg.src = b.dataset.gross; lbImg.alt = img.alt; lbCap.textContent = b.dataset.cap; lbNr.textContent = (idx + 1) + ' / ' + gal.length; };
    gal.forEach(function (b, i) { b.addEventListener('click', function () { zeigeLb(i); lb.hidden = false; sperre(lb, true); document.body.style.overflow = 'hidden'; $('#lbZu').focus(); }); });
    var schliessen = function () { lb.hidden = true; sperre(lb, false); document.body.style.overflow = ''; gal[idx].focus(); };
    $('#lbZu').addEventListener('click', schliessen);
    $('#lbVor').addEventListener('click', function () { zeigeLb(idx - 1); });
    $('#lbNach').addEventListener('click', function () { zeigeLb(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) schliessen(); });
    document.addEventListener('keydown', function (e) { if (lb.hidden) return; if (e.key === 'Escape') schliessen(); if (e.key === 'ArrowLeft') zeigeLb(idx - 1); if (e.key === 'ArrowRight') zeigeLb(idx + 1); });
    var lx = 0; lb.addEventListener('touchstart', function (e) { lx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - lx; if (Math.abs(dx) > 50) zeigeLb(idx + (dx < 0 ? 1 : -1)); });
  }

  /* Nach-oben-Knopf der Hinweisseite */
  var tocTop = $('#tocTop');
  if (tocTop) { var tt = function () { tocTop.classList.toggle('show', window.scrollY > 640); }; tt(); window.addEventListener('scroll', tt, { passive: true }); }

  /* Formular: im Entwurf öffnet Senden das E-Mail-Programm mit allen Angaben; der Knopf wird erst mit JS frei */
  $$('[data-js-an]').forEach(function (b) { b.disabled = false; });
  $$('form[data-mail]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.reportValidity()) return;
      var z = $$('input, textarea', f).map(function (el) { var l = $('label[for="' + el.id + '"]', f); return (l ? l.firstChild.textContent.trim() : el.name) + ': ' + el.value.trim(); });
      location.href = 'mailto:' + f.dataset.mail + '?subject=' + encodeURIComponent(f.dataset.betreff) + '&body=' + encodeURIComponent(z.join('\n'));
    });
  });

  /* Bildsteine der Mauer: Fenster mit grossem Bild, Projektname und Link; ESC, Hintergrund und X schliessen */
  var pop = $('#pop');
  if (pop) {
    var zuletzt = null, steine = $$('.stein--bild'), pi = 0;
    var popZu = function () { pop.hidden = true; sperre(pop, false); document.body.style.overflow = ''; if (steine[pi]) steine[pi].focus(); };
    var zeigePop = function (i) {
      pi = (i + steine.length) % steine.length; var b = steine[pi];
      $('#popImg').src = b.dataset.popImg; $('#popImg').alt = b.dataset.popC || b.dataset.popT;
      $('#popT').textContent = b.dataset.popT; $('#popM').textContent = b.dataset.popM; $('#popC').textContent = b.dataset.popC;
      $('#popLink').href = b.dataset.popHref; $('#popNr').textContent = (pi + 1) + ' / ' + steine.length;
    };
    steine.forEach(function (b, i) {
      b.addEventListener('click', function () {
        zuletzt = b; zeigePop(i);
        pop.hidden = false; sperre(pop, true); document.body.style.overflow = 'hidden'; $('#popZu').focus();
      });
    });
    $('#popVor').addEventListener('click', function () { zeigePop(pi - 1); });
    $('#popNach').addEventListener('click', function () { zeigePop(pi + 1); });
    document.addEventListener('keydown', function (e) { if (pop.hidden) return; if (e.key === 'ArrowLeft') zeigePop(pi - 1); if (e.key === 'ArrowRight') zeigePop(pi + 1); });
    var px = 0; pop.addEventListener('touchstart', function (e) { px = e.touches[0].clientX; }, { passive: true });
    pop.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - px; if (Math.abs(dx) > 50) zeigePop(pi + (dx < 0 ? 1 : -1)); });
    $('#popZu').addEventListener('click', popZu);
    pop.addEventListener('click', function (e) { if (e.target === pop) popZu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) popZu(); });
  }

  /* Demo-Leiste: erscheint bei jedem Laden, X blendet nur die aktuelle Ansicht aus */
  var demobar = $('#demobar'), dclose = $('#demoClose');
  /* Am Handy erst nach dem ersten Scrollen, damit sie die Knöpfe im ersten Bildschirm nicht verdeckt (echte Browserhöhen 553 bis 664 px) */
  if (demobar) {
    var weg = false;
    var zeige = function () { if (!weg) demobar.classList.add('show'); };
    if (window.matchMedia('(max-width:760px)').matches) {
      var beimScroll = function () { if (window.scrollY > 80) { zeige(); window.removeEventListener('scroll', beimScroll); } };
      window.addEventListener('scroll', beimScroll, { passive: true });
    } else setTimeout(zeige, 1200);
    if (dclose) dclose.addEventListener('click', function () { weg = true; demobar.classList.remove('show'); });
  }
})();
