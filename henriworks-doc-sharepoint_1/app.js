/* HenriWorks · documentação animada. Engine: motion-lite (nativa).
   Um momento orquestrado na abertura (a marca se monta: haste, ponte, cinco fatias);
   o resto responde ao usuário: botões das demos e entrada dos gráficos na tela.
   O HTML já tem o estado final; o JS só aplica estados iniciais com from(). */
(function () {
  'use strict';
  var M = window.Motion;
  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduzido = function () { return M ? M.reducedMotion() : window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var espera = function (ms) { return new Promise(function (r) { setTimeout(r, reduzido() ? Math.min(ms, 120) : ms); }); };

  function aoVer(el, fn, limiar) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold: limiar == null ? 0.35 : limiar });
    io.observe(el);
  }

  // ---------------------------------------------------------------- independentes de engine
  // Atalhos dos casos de uso: links comuns (funcionam sem JS); com a engine, o caso escolhido acende.
  $$('.casos__abas .aba').forEach(function (a) {
    a.addEventListener('click', function () {
      var alvo = doc.getElementById(a.getAttribute('href').slice(1));
      $$('.caso').forEach(function (c) { c.classList.toggle('is-foco', c === alvo); });
      if (alvo && window.Motion) {
        window.Motion.from($$('.rota-chips span', alvo), { opacity: 0, x: -8, duration: 0.3, stagger: 0.05, delay: 0.35, ease: 'power2.out' });
      }
    });
  });

  // Copiar comandos. A escrita no clipboard precisa acontecer dentro do clique.
  $$('.copiar').forEach(function (b) {
    b.addEventListener('click', function () {
      var code = b.parentNode.querySelector('code');
      var texto = code.textContent;
      var ok = function () { b.textContent = 'Copiado'; setTimeout(function () { b.textContent = 'Copiar'; }, 1600); };
      var selecionar = function () {
        var r = doc.createRange(); r.selectNodeContents(code);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        b.textContent = 'Selecionado';
        setTimeout(function () { b.textContent = 'Copiar'; }, 1600);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, selecionar);
        else selecionar();
      } catch (e) { selecionar(); }
    });
  });

  if (!M) return;                                   // engine bloqueada: página legível e as abas funcionam

  // ---------------------------------------------------------------- 1. abertura
  (function abertura() {
    // A marca 3D se monta só com scale e opacity: o translate em Z é das camadas (CSS) e segue animando.
    var g = $('.m3d');
    var tl = M.timeline({ defaults: { ease: 'power3.out', duration: 0.55 } });
    if (g) {
      $('.m3d__haste', g).style.transformOrigin = '50% 100%';
      $('.m3d__ponte', g).style.transformOrigin = '0 50%';
      tl.from($('.m3d__haste', g), { scaleY: 0, duration: 0.5 })
        .from($('.m3d__ponte', g), { scaleX: 0, duration: 0.35 }, '>-0.1')
        .from($$('.m3d__fatia', g), { opacity: 0, scale: 0.4, stagger: 0.08, duration: 0.45, ease: 'back.out' }, '>-0.05');
    }
    // Paralaxe leve: a marca e o chão andam em sentidos opostos com o ponteiro.
    var hero = $('.hero');
    if (hero && !reduzido() && window.matchMedia('(pointer: fine)').matches) {
      var pend = false, ex = 0, ey = 0;
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        ex = ((e.clientX - r.left) / r.width - 0.5) * 2; ey = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (pend) return; pend = true;
        requestAnimationFrame(function () { pend = false; hero.style.setProperty('--px', ex.toFixed(3)); hero.style.setProperty('--py', ey.toFixed(3)); });
      });
      hero.addEventListener('pointerleave', function () { hero.style.setProperty('--px', 0); hero.style.setProperty('--py', 0); });
    }
    var split = M.splitText('[data-split]', { type: 'words,chars' });
    tl.from(split.chars, { y: 34, opacity: 0, stagger: 0.012, duration: 0.6 }, 0.15)
      .from('.hero__ctx', { opacity: 0, y: 8, duration: 0.45 }, 0.2)
      .from($$('.hero__lede, .hero__sub'), { opacity: 0, y: 14, stagger: 0.08 }, '>-0.3')
      .from($$('.numero'), { opacity: 0, y: 16, stagger: 0.06, duration: 0.5 }, '<0.1');
  })();

  // ---------------------------------------------------------------- 2. progresso e contadores
  M.scrub('.progress__bar', { scaleX: 0 }, { scaleX: 1 }, { source: 'page' });
  $$('[data-count]').forEach(function (el) {
    aoVer(el, function () { M.counter(el, { duration: 1.4, ease: 'power2.out', locale: 'pt-BR' }); }, 0.6);
  });

  // ---------------------------------------------------------------- 3. fluxo
  (function fluxo() {
    var demo = $('[data-demo="fluxo"]'); if (!demo) return;
    var btn = $('#fluxo-play'), fases = $$('.fase', demo), linhas = $$('.troca', demo), fill = $('.trilho__fill', demo);
    var chip = $('#chat-ag'), nomes = linhas.map(function (t) { return $('.chat__div b', t).textContent; });
    var rodando = false;
    async function tocar() {
      if (rodando) return; rodando = true; btn.disabled = true;
      fases.forEach(function (f) { f.classList.remove('is-ativo', 'is-feito'); });
      linhas.forEach(function (l) { l.classList.remove('is-atual'); M.set(l, { opacity: 0.22 }); });
      M.set(fill, { scaleX: 0 });
      for (var i = 0; i < fases.length; i++) {
        if (i) { fases[i - 1].classList.remove('is-ativo'); fases[i - 1].classList.add('is-feito'); linhas[i - 1].classList.remove('is-atual'); }
        fases[i].classList.add('is-ativo');
        M.from(fases[i], { y: -6, duration: 0.35, ease: 'back.out' });
        M.to(fill, { scaleX: (i + 1) / fases.length, duration: 0.6, ease: 'power2.inOut' });
        linhas[i].classList.add('is-atual');
        chip.textContent = nomes[i];
        M.fromTo(chip, { opacity: 0.3 }, { opacity: 1, duration: 0.3 });
        M.set(linhas[i], { opacity: 1 });
        M.from($('.msg--eu', linhas[i]), { opacity: 0, y: 10, duration: 0.35, ease: 'power2.out' });
        M.from($('.msg--ag', linhas[i]), { opacity: 0, y: 10, duration: 0.4, delay: 0.35, ease: 'power2.out' });
        await espera(950);
      }
      fases[fases.length - 1].classList.remove('is-ativo'); fases[fases.length - 1].classList.add('is-feito');
      linhas.forEach(function (l) { M.to(l, { opacity: 1, duration: 0.3 }); });
      btn.textContent = 'Reproduzir de novo'; btn.disabled = false; rodando = false;
    }
    btn.addEventListener('click', tocar);
    if (!reduzido()) aoVer(demo, tocar, 0.45);
  })();

  // ---------------------------------------------------------------- 4. revisão isolada
  (function revisao() {
    var demo = $('[data-demo="revisao"]'); if (!demo) return;
    var btn = $('#rev-play'), est = $$('.estacao', demo), passos = $$('.rev-passos li', demo);
    var pacote = $('.pacote', demo), vaz = $('.vazamento', demo), risco = $('.vazamento line', demo);
    var X = [0, 200, 400, 600], rodando = false;
    async function tocar() {
      if (rodando) return; rodando = true; btn.disabled = true;
      est.forEach(function (e) { e.classList.remove('is-on'); });
      passos.forEach(function (p) { p.classList.remove('is-on'); });
      M.set(pacote, { x: 0, opacity: 1 }); M.set(vaz, { opacity: 0 });
      for (var i = 0; i < X.length; i++) {
        if (i) await M.to(pacote, { x: X[i], duration: 0.7, ease: 'power2.inOut' });
        est[i].classList.add('is-on'); passos[i].classList.add('is-on');
        M.from(passos[i], { x: -8, duration: 0.3 });
        if (i === 1) {                               // a conversa tenta entrar e o hook nega
          M.fromTo(vaz, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.35 });
          await espera(380);
          M.drawSVG(risco, { duration: 0.35 });
          await espera(450);
          M.to(vaz, { opacity: 0.45, duration: 0.3 });
        }
        await espera(500);
      }
      M.to(pacote, { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1 });
      btn.textContent = 'Ver de novo'; btn.disabled = false; rodando = false;
    }
    btn.addEventListener('click', tocar);
    if (!reduzido()) aoVer(demo, tocar, 0.5);
  })();

  // ---------------------------------------------------------------- 5. fatias
  (function fatias() {
    var demo = $('[data-demo="fatias"]'); if (!demo) return;
    var modo = 'seq', rodando = false;
    var bts = $$('.alternar__b', demo), btn = $('#fat-play'), rotulo = $('#fat-sessoes');
    var f = function (id) { return $('.fatia[data-f="' + id + '"]', demo); };
    var ordem = { seq: [['01'], ['02'], ['03'], ['04'], ['05']], par: [['01'], ['02', '03'], ['04'], ['05']] };
    var linhasG = $$('.gantt__linha', demo);
    bts.forEach(function (b) {
      b.addEventListener('click', function () {
        if (rodando) return;
        modo = b.getAttribute('data-modo');
        bts.forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        rotulo.textContent = 'Sessões: ' + ordem[modo].length;
        animarGantt(modo === 'seq' ? 0 : 1);
      });
    });
    function animarGantt(k) {
      M.fromTo($$('.gantt__b', linhasG[k]), { scaleX: 0, opacity: 0.3 }, { scaleX: 1, opacity: 1, duration: 0.45, stagger: 0.12, ease: 'power2.out' });
    }
    async function executar() {
      if (rodando) return; rodando = true; btn.disabled = true;
      $$('.fatia', demo).forEach(function (x) { x.classList.remove('is-rodando', 'is-feita'); });
      animarGantt(modo === 'seq' ? 0 : 1);
      var passos = ordem[modo];
      for (var s = 0; s < passos.length; s++) {
        rotulo.textContent = 'Sessão ' + (s + 1) + ' de ' + passos.length;
        var els = passos[s].map(f);
        els.forEach(function (el) { el.classList.add('is-rodando'); });
        M.from(els, { y: -6, duration: 0.3, ease: 'back.out', stagger: 0.05 });
        await espera(900);
        els.forEach(function (el) { el.classList.remove('is-rodando'); el.classList.add('is-feita'); });
        if (passos[s].indexOf('03') > -1) {          // conferir-toca depois da sessão que tocou 02/03
          M.fromTo('#cartao', { opacity: 0.2, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
        }
      }
      rotulo.textContent = 'Sessões: ' + passos.length;
      btn.textContent = 'Executar de novo'; btn.disabled = false; rodando = false;
    }
    btn.addEventListener('click', executar);
    aoVer($('.gantt', demo), function () { animarGantt(0); M.fromTo($$('.gantt__b', linhasG[1]), { scaleX: 0 }, { scaleX: 1, duration: 0.45, stagger: 0.12, delay: 0.5 }); }, 0.6);
  })();

  // ---------------------------------------------------------------- 6. mapa
  (function mapa() {
    var demo = $('[data-demo="mapa"]'); if (!demo) return;
    var saida = $('#mapa-saida code'), bts = $$('.cmd', demo);
    var C = 'node .henriworks/bin/henrimap.mjs ';
    var D = {
      path: {
        cmd: C + 'path ConfirmacaoComponent AcordoController',
        out: ['caminho (5 salto(s)):',
          '  ConfirmacaoComponent (src/app/feature/renegociacao/confirmacao/confirmacao.component.ts:3)',
          '  -->uses--> AcordoService (src/app/domain/acordo/acordo.service.ts:3)',
          '  -->uses--> AcordoApi (src/app/core/api/acordo-api.ts:3)',
          '  <--contains-- acordo-api.ts (src/app/core/api/acordo-api.ts)',
          '  -->calls_http--> POST /api/acordos/{}/confirmacao',
          '  <--exposes-- AcordoController (bff/src/main/java/br/com/x/acordo/AcordoController.java:3)'],
        nos: ['ConfirmacaoComponent', 'AcordoService', 'AcordoApi', 'Endpoint', 'AcordoController'],
        arestas: ['ConfirmacaoComponent AcordoService', 'AcordoService AcordoApi', 'AcordoApi Endpoint', 'AcordoController Endpoint']
      },
      explain: {
        cmd: C + 'explain AcordoApi',
        out: ['nó: AcordoApi (src/app/core/api/acordo-api.ts:3) · classe', 'usa (0):', 'usado por (1):',
          '  <-- AcordoService (src/app/domain/acordo/acordo.service.ts:3) [uses] [EXTRACTED]'],
        nos: ['AcordoApi', 'AcordoService'], arestas: ['AcordoService AcordoApi']
      },
      affected: {
        cmd: C + 'affected bff/src/main/java/br/com/x/acordo/AcordoServico.java',
        out: ['raio de impacto de 1 arquivo(s): 1 dependente(s) até 3 saltos',
          '  1  bff/src/main/java/br/com/x/acordo/AcordoController.java  (uses AcordoServico EXTRACTED)'],
        nos: ['AcordoServico', 'AcordoController'], arestas: ['AcordoController AcordoServico']
      },
      query: {
        cmd: C + 'query "confirmar acordo"',
        out: ['- AcordoController (bff/src/main/java/br/com/x/acordo/AcordoController.java:3)',
          '    --> AcordoServico [uses]', '    --> POST /api/acordos/{}/confirmacao [exposes]',
          '- POST /api/acordos/{}/confirmacao', '    <-- AcordoController [exposes]', '    <-- openapi.yaml [declares]', '    <-- acordo-api.ts [calls_http]',
          '- AcordoServico (bff/src/main/java/br/com/x/acordo/AcordoServico.java:2)', '    --> Confirmador [implements]',
          '- acordo-api.ts (src/app/core/api/acordo-api.ts)', '    --> POST /api/acordos/{}/confirmacao [calls_http]', '…'],
        nos: ['AcordoController', 'Endpoint', 'AcordoServico', 'Confirmador', 'openapi', 'AcordoApi'],
        arestas: ['AcordoController Endpoint', 'AcordoController AcordoServico', 'openapi Endpoint', 'AcordoApi Endpoint', 'AcordoServico Confirmador']
      }
    };
    var vez = 0;
    function render(k) {
      var d = D[k], minha = ++vez;
      bts.forEach(function (b) { var on = b.getAttribute('data-cmd') === k; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      saida.textContent = '';
      var cab = doc.createElement('span'); cab.className = 'saida__cmd';
      var prompt = 'PS C:\\src\\extrato-mfe> ';
      saida.appendChild(cab);
      var spans = d.out.map(function (l) { var s = doc.createElement('span'); s.textContent = '\n' + l; s.style.opacity = '0'; saida.appendChild(s); return s; });
      var mostrar = function () { spans.forEach(function (s) { s.style.opacity = ''; }); M.from(spans, { opacity: 0, duration: 0.25, stagger: 0.05 }); };
      // O comando é digitado; a saída aparece depois, linha a linha.
      if (reduzido()) { cab.textContent = prompt + d.cmd; mostrar(); }
      else {
        var k = 0;
        cab.textContent = prompt;
        var t = setInterval(function () {
          if (minha !== vez) { clearInterval(t); return; }
          k += 2; cab.textContent = prompt + d.cmd.slice(0, k);
          if (k >= d.cmd.length) { clearInterval(t); setTimeout(function () { if (minha === vez) mostrar(); }, 160); }
        }, 18);
      }
      $$('.no, .aresta', demo).forEach(function (x) { x.classList.remove('is-on'); });
      d.nos.forEach(function (n, i) {
        setTimeout(function () {
          if (minha !== vez) return;
          var g = $('.no[data-n="' + n + '"]', demo); if (!g) return;
          g.classList.add('is-on');
          M.fromTo(g, { opacity: 0.35 }, { opacity: 1, duration: 0.35 });
          d.arestas.forEach(function (a) {
            if (a.split(' ').indexOf(n) > -1 && d.nos.slice(0, i + 1).filter(function (x) { return a.split(' ').indexOf(x) > -1; }).length === 2) {
              var p = $('.aresta[data-a="' + a + '"]', demo); if (p) p.classList.add('is-on');
            }
          });
        }, reduzido() ? 0 : 220 * i);
      });
    }
    bts.forEach(function (b) { b.addEventListener('click', function () { render(b.getAttribute('data-cmd')); }); });
    aoVer(demo, function () { render('path'); }, 0.4);
  })();

  // ---------------------------------------------------------------- 7. painel de uso (real, gerado pelo uso.mjs)
  // O painel vem parado (.hp--parado); a animação dele é só CSS e começa quando ele aparece.
  (function painel() {
    var hp = $('.nav .hp'); if (!hp) return;
    aoVer(hp, function () { hp.classList.remove('hp--parado'); }, 0.12);
  })();

  // ---------------------------------------------------------------- 8. pacote (dados reais)
  (function pacote() {
    var s = $('#pacote'); if (!s) return;
    aoVer($('.hbarras', s), function () {
      M.from($$('.hbarra__b', s), { scaleX: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' });
    }, 0.4);
    var q = $('.quadros', s);
    aoVer(q, function () {
      var locais = $$('i:not(.q--git)', q);   // o laranja pulsa sozinho, em CSS
      M.from(locais, { opacity: 0, scale: 0.3, duration: 0.3, stagger: { amount: 0.9 } });
    }, 0.5);
  })();
})();
