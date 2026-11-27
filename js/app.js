/* MJ Rörteknik – tre fristående designer (ljus, mörk, blå).
   Varje byte bygger sidan på nytt från sin <template>, så allt
   (scroll, formulär, FAQ, animationer) börjar om från början. */

(() => {
  const PAGES = ['ljus', 'mork', 'bla'];
  const app = document.getElementById('app');
  const switcher = document.querySelector('.switcher');
  const buttons = [...switcher.querySelectorAll('button')];
  const glider = switcher.querySelector('.switcher__glider');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const FAQ = [
    ['Har du jour dygnet runt?', 'Nej, men akuta ärenden som läckage och stopp prioriterar jag under mina öppettider på vardagar.'],
    ['Hur fungerar ROT-avdraget?', 'ROT-avdraget dras direkt på fakturan, så du betalar bara din del av arbetskostnaden. Ansökan till Skatteverket sköter jag.'],
    ['Kostar det något att få en offert?', 'Nej. Jag tittar på jobbet och ger dig ett fast pris innan något arbete påbörjas.'],
    ['Vilka områden jobbar du i?', 'Matfors, Sundsvall, Stöde, Njurunda, Timrå med omnejd. Hör av dig om du bor en bit utanför – det brukar gå att lösa.'],
    ['Tar du uppdrag åt företag och BRF:er?', 'Ja, jag hjälper både privatpersoner, företag och bostadsrättsföreningar.'],
  ];

  /* ---------- Loggan (exakt efter Figma, utan bakgrund) ----------
     Färgen styrs med CSS (currentColor): .logo--black / .logo--white.
     "full" = MJ + RÖRTEKNIK AB + Est 2024, "mark" = bara MJ. */
  let logoId = 0;
  function logoSvg(variant) {
    const id = `logo-cut-${++logoId}`;
    const full = variant === 'full';
    const serif = "font-family=\"'Playfair Display', Georgia, serif\"";
    const sans = "font-family=\"Barlow, 'Inter', sans-serif\"";
    return `<svg class="logo-svg logo-svg--${variant}" viewBox="-2 -2 200 224" role="img" aria-label="MJ Rörteknik AB" fill="currentColor">
      ${full ? `<mask id="${id}" maskUnits="userSpaceOnUse" x="-2" y="-2" width="200" height="224">
        <rect x="-2" y="-2" width="200" height="224" fill="#fff"/><rect x="-2" y="110" width="200" height="40.7" fill="#000"/>
      </mask>` : ''}
      <text x="-4.65" y="110" font-size="155" ${serif}>M</text>
      <text x="135.8" y="185.1" font-size="178" ${serif}${full ? ` mask="url(#${id})"` : ''}>J</text>
      ${full ? `<text x="-1.3" y="143" font-size="28.8" ${sans}>RÖRTEKNIK AB</text>
      <text x="86.6" y="167" font-size="15.8" ${sans}>Est 2024</text>` : ''}
    </svg>`;
  }
  /* ---------- Inga fula radbyten ----------
     Telefonnummer, tider, e-postadresser och ord med bindestreck
     (t.ex. "ROT-avdraget") läggs i <span class="nw"> så att de aldrig
     delas på två rader. */
  const KEEP_TOGETHER = new RegExp([
    '[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+',            // e-post
    '\\d{3}-\\d{3}(?: \\d{2}){2}',                  // 072-200 81 77
    '\\d{2}:\\d{2}\\s?[–-]\\s?\\d{2}:\\d{2}',       // 07:00–16:00
    '\\d{2}[–-]\\d{2}',                             // 07–16
    '[A-Za-zÅÄÖåäöÉé]+(?:-[A-Za-zÅÄÖåäöÉé]+)+',     // ROT-avdraget, VVS-montör
    '[A-Za-zÅÄÖåäö]+:[a-zåäö]+',                    // sms:a, BRF:er
  ].join('|'), 'g');

  function keepTogether(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest('svg, script, style, textarea, .nw')
        ? NodeFilter.FILTER_REJECT
        : (n.nodeValue.search(KEEP_TOGETHER) !== -1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP)),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      let last = 0;
      node.nodeValue.replace(KEEP_TOGETHER, (match, offset) => {
        if (offset > last) frag.append(node.nodeValue.slice(last, offset));
        const span = document.createElement('span');
        span.className = 'nw';
        span.textContent = match;
        frag.append(span);
        last = offset + match.length;
      });
      if (last < node.nodeValue.length) frag.append(node.nodeValue.slice(last));
      // I flex/grid-rader skulle varje bit bli ett eget element med glapp emellan:
      // samla då hela texten i en span så den beter sig som vanlig text.
      const d = getComputedStyle(node.parentElement).display;
      if (d.includes('flex') || d.includes('grid')) {
        const wrap = document.createElement('span');
        wrap.append(frag);
        node.replaceWith(wrap);
      } else {
        node.replaceWith(frag);
      }
    });
  }

  function fillLogos(root) {
    root.querySelectorAll('[data-logo]').forEach((el) => { el.innerHTML = logoSvg(el.dataset.logo); });
  }

  let cleanup = [];
  let current = null;

  /* ---------- Bygg en sida ---------- */
  function render(name, { animate = true } = {}) {
    if (!PAGES.includes(name)) name = 'ljus';

    cleanup.forEach((fn) => fn());
    cleanup = [];

    const page = document.getElementById(`tpl-${name}`).content.firstElementChild.cloneNode(true);
    fillLogos(page);
    fillFaq(page);
    fillForms(page);

    app.replaceChildren(page);
    keepTogether(page); // efter att sidan ligger i dokumentet (behöver beräknad stil)
    document.body.dataset.page = name;
    window.scrollTo({ top: 0, behavior: 'instant' });

    setupReveal(page);
    setupHeader(page);
    setupMenu(page);
    setupScrollLinks(page);
    setupFaq(page);
    setupForms(page);
    setupParallax(page);

    if (animate && !reduceMotion) {
      page.classList.add('is-entering');
      requestAnimationFrame(() => requestAnimationFrame(() => page.classList.remove('is-entering')));
    }

    current = name;
    updateSwitcher();
    if (location.hash.slice(1) !== name) history.replaceState(null, '', `#${name}`);
  }

  // Snabba klick under övergången: den senast valda sidan vinner.
  let switching = false;
  let pending = null;
  function go(name) {
    if (switching) { pending = name; return; }
    if (reduceMotion || !app.firstElementChild) return render(name);
    switching = true;
    pending = name;
    app.classList.add('is-leaving');
    setTimeout(() => {
      app.classList.remove('is-leaving');
      render(pending);
      pending = null;
      switching = false;
    }, 260);
  }

  /* ---------- Menyn längst ned ---------- */
  function updateSwitcher() {
    buttons.forEach((b) => {
      const on = b.dataset.page === current;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on);
    });
    const active = buttons.find((b) => b.classList.contains('is-active'));
    if (active) {
      glider.style.width = `${active.offsetWidth}px`;
      glider.style.transform = `translateX(${active.offsetLeft}px)`;
    }
  }

  buttons.forEach((b) => b.addEventListener('click', () => go(b.dataset.page)));
  window.addEventListener('resize', updateSwitcher);

  /* ---------- Synlighets-animationer ---------- */
  function setupReveal(root) {
    const els = root.querySelectorAll('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
    cleanup.push(() => io.disconnect());
  }

  /* ---------- Sticky header får skugga när man scrollar ---------- */
  function setupHeader(root) {
    const header = root.querySelector('[data-sticky]');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanup.push(() => window.removeEventListener('scroll', onScroll));
  }

  /* ---------- Meny för mobil/surfplatta ---------- */
  function setupMenu(root) {
    const header = root.querySelector('[data-sticky]');
    const btn = root.querySelector('[data-menu]');
    if (!header || !btn) return;
    const setOpen = (open) => {
      header.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Stäng meny' : 'Öppna meny');
    };
    btn.addEventListener('click', () => setOpen(!header.classList.contains('menu-open')));
    header.querySelector('.nav').addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    const onDoc = (e) => { if (!header.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onResize = () => { if (window.innerWidth > 1080) setOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    cleanup.push(() => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    });
  }

  /* ---------- Mjuk scroll till sektioner (utan att ändra #-sidan) ---------- */
  function setupScrollLinks(root) {
    root.addEventListener('click', (e) => {
      const a = e.target.closest('[data-scroll]');
      if (!a) return;
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      const target = id === 'top' ? null : root.querySelector(`#${id}`);
      const header = root.querySelector('[data-sticky]');
      const offset = header ? header.offsetHeight + 12 : 0;
      const top = target ? target.getBoundingClientRect().top + window.scrollY - offset : 0;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Lätt parallax på hjältebilden ----------
     Bilden är 16 % högre än sin ram (8 % extra upptill och nedtill)
     och flyttas max 7 % av ramens höjd, så kanterna syns aldrig. */
  function setupParallax(root) {
    const img = root.querySelector('.hero__media img, .hero__bg img');
    if (!img || reduceMotion) return;
    const box = img.parentElement;
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const max = box.clientHeight * 0.07;
      const progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight; // ca -1..1
      const y = Math.max(-max, Math.min(max, progress * max * 1.4));
      img.style.setProperty('--py', `${y.toFixed(1)}px`);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    cleanup.push(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });
  }

  /* ---------- FAQ ---------- */
  function fillFaq(root) {
    root.querySelectorAll('[data-faq]').forEach((wrap) => {
      wrap.innerHTML = FAQ.map(([q, a], i) => `
        <div class="faq__item" data-reveal style="--d:${0.05 + i * 0.06}s">
          <button type="button" class="faq__q" aria-expanded="false">
            <span>${q}</span><span class="faq__sign" aria-hidden="true"></span>
          </button>
          <div class="faq__a"><div><p>${a}</p></div></div>
        </div>`).join('');
    });
  }

  function setupFaq(root) {
    root.querySelectorAll('[data-faq]').forEach((wrap) => {
      wrap.addEventListener('click', (e) => {
        const btn = e.target.closest('.faq__q');
        if (!btn) return;
        const item = btn.parentElement;
        const open = !item.classList.contains('is-open');
        wrap.querySelectorAll('.faq__item').forEach((it) => {
          it.classList.remove('is-open');
          it.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
        });
        if (open) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------- Formulär ---------- */
  function fillForms(root) {
    const tpl = document.getElementById('tpl-form');
    root.querySelectorAll('[data-form]').forEach((slot) => slot.appendChild(tpl.content.cloneNode(true)));
  }

  function setupForms(root) {
    root.querySelectorAll('.rform').forEach((form) => {
      form.querySelectorAll('[data-chips]').forEach((group) => {
        group.addEventListener('click', (e) => {
          const chip = e.target.closest('.chip');
          if (!chip) return;
          group.querySelectorAll('.chip').forEach((c) => {
            c.classList.toggle('is-on', c === chip);
            c.setAttribute('aria-pressed', c === chip);
          });
        });
      });
      const resetChips = () => form.querySelectorAll('[data-chips]').forEach((group) => {
        group.querySelectorAll('.chip').forEach((c, i) => {
          c.classList.toggle('is-on', i === 0);
          c.setAttribute('aria-pressed', i === 0);
        });
      });
      resetChips();

      const file = form.querySelector('.upload input');
      const fileText = form.querySelector('[data-upload-text]');
      const defaultText = fileText.innerHTML;
      file.addEventListener('change', () => {
        const n = file.files.length;
        if (n) fileText.textContent = n === 1 ? file.files[0].name : `${n} bilder valda`; else fileText.innerHTML = defaultText;
        form.querySelector('.upload').classList.toggle('has-files', n > 0);
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        let ok = true;
        form.querySelectorAll('[required]').forEach((f) => {
          const bad = !f.value.trim();
          f.closest('label').classList.toggle('is-invalid', bad);
          if (bad && ok) { f.focus(); ok = false; }
        });
        if (!ok) return;
        form.classList.add('is-sent');
        form.querySelector('.rform__done').hidden = false;
      });

      form.addEventListener('input', (e) => {
        const label = e.target.closest('label');
        if (label && e.target.value.trim()) label.classList.remove('is-invalid');
      });

      form.querySelector('.rform__again').addEventListener('click', () => {
        form.reset();
        resetChips();
        form.querySelectorAll('.is-invalid').forEach((l) => l.classList.remove('is-invalid'));
        fileText.innerHTML = defaultText;
        form.querySelector('.upload').classList.remove('has-files');
        form.classList.remove('is-sent');
        form.querySelector('.rform__done').hidden = true;
      });
    });
  }

  /* ---------- Start ---------- */
  window.addEventListener('hashchange', () => {
    const name = location.hash.slice(1);
    if (PAGES.includes(name) && name !== current) go(name);
  });

  render(location.hash.slice(1), { animate: true });
  document.fonts?.ready.then(updateSwitcher);
})();
