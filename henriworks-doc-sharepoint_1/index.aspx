<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>HenriWorks Engineering Harness</title>
  <meta name="claude:viewport-fit-sides" content="cover">
  <link rel="stylesheet" href="style.css">
  <script src="vendor/motion-lite.js" defer></script>
  <script src="app.js" defer></script>
</head>
<body>
  <div class="progress" aria-hidden="true"><span class="progress__bar"></span></div>

  <header class="topo">
    <div class="topo__in">
      <a class="topo__marca" href="#inicio" aria-label="HenriWorks, início">
        <svg viewBox="0 0 120 120" width="28" height="28" aria-hidden="true" class="marca">
          <rect class="m-haste" x="20" y="17.5" width="22" height="85"/><rect class="m-ponte" x="42" y="53.5" width="31" height="13"/>
          <rect class="m-fatia" x="78" y="17.5" width="22" height="13"/><rect class="m-fatia" x="78" y="35.5" width="22" height="13"/>
          <rect class="m-fatia m-fatia--sinal" x="78" y="53.5" width="22" height="13"/><rect class="m-fatia" x="78" y="71.5" width="22" height="13"/>
          <rect class="m-fatia" x="78" y="89.5" width="22" height="13"/>
        </svg>
        <span>HenriWorks</span>
      </a>
      <nav class="topo__nav" aria-label="Seções">
        <a href="#fluxo">Fluxo</a><a href="#revisao">Revisão isolada</a><a href="#fatias">Fatias</a><a href="#mapa">Mapa</a><a href="#uso">Uso e custo</a><a href="#pacote">Pacote</a><a href="#casos">Casos de uso</a><a href="#instalar">Instalar</a>
      </nav>
    </div>
  </header>

  <div class="hero" id="inicio">
    <div class="hero__chao" aria-hidden="true"><span></span></div>
    <div class="hero__in">
      <div class="hero__texto">
        <p class="eyebrow hero__ctx">v0.1.2 · GitHub Copilot no VS Code · 09/11/2026</p>
        <h1 class="hero__titulo" data-split>HenriWorks Engineering Harness</h1>
        <p class="hero__lede">Leva uma intenção até a PR em backend, BFF ou frontend, de qualquer stack. Quem escreve não revisa, o plano vira fatias que um executor limpo entrega, e um mapa do projeto responde antes de qualquer busca.</p>
        <p class="hero__sub">Sucede o HenriSpec 0.4.5 e o HenriSpec Discovery 0.3.1, num pacote só.</p>
      </div>
      <figure class="hero__marca" aria-hidden="true">
        <div class="cena">
          <div class="m3d">
            <span class="m3d__sombra"></span>
            <span class="m3d__p m3d__haste"></span>
            <span class="m3d__p m3d__ponte"></span>
            <span class="m3d__p m3d__fatia" style="--i:0"></span>
            <span class="m3d__p m3d__fatia" style="--i:1"></span>
            <span class="m3d__p m3d__fatia m3d__fatia--sinal" style="--i:2"></span>
            <span class="m3d__p m3d__fatia" style="--i:3"></span>
            <span class="m3d__p m3d__fatia" style="--i:4"></span>
          </div>
        </div>
        <figcaption class="hero__legenda">haste · ponte · cinco fatias</figcaption>
      </figure>
    </div>
    <dl class="numeros">
      <div class="numero"><dt>agentes: 9 de fase e 7 revisores</dt><dd><span data-count data-to="16">16</span></dd></div>
      <div class="numero"><dt>atalhos <code>/hwk-*</code></dt><dd><span data-count data-to="15">15</span></dd></div>
      <div class="numero"><dt>dependências de npm</dt><dd><span>0</span></dd></div>
      <div class="numero"><dt>arquivo vai para o Git por mudança</dt><dd><span class="sinal">1</span></dd></div>
      <div class="numero"><dt>passos ok no teste de fumaça</dt><dd><span data-count data-to="20" data-suffix="/20">20/20</span></dd></div>
    </dl>
    <div class="ticker" aria-hidden="true"><div class="ticker__trilho"><span><b>$</b> hwk estado</span><span><b>$</b> henrimap query "saldo projetado"</span><span><b>$</b> hwk validar mostrar-saldo-projetado</span><span><b>$</b> hwk fatias mostrar-saldo-projetado --gravar</span><span><b>$</b> hwk pacote-revisao mostrar-saldo-projetado design</span><span><b>$</b> hwk conferir-toca mostrar-saldo-projetado</span><span><b>$</b> verificar.mjs mostrar-saldo-projetado --salvar</span><span><b>$</b> henrimap affected src/app/core/api/saldo-api.ts</span><span><b>$</b> hwk arquivar mostrar-saldo-projetado</span><span><b>$</b> uso.mjs painel</span><span><b>$</b> hwk estado</span><span><b>$</b> henrimap query "saldo projetado"</span><span><b>$</b> hwk validar mostrar-saldo-projetado</span><span><b>$</b> hwk fatias mostrar-saldo-projetado --gravar</span><span><b>$</b> hwk pacote-revisao mostrar-saldo-projetado design</span><span><b>$</b> hwk conferir-toca mostrar-saldo-projetado</span><span><b>$</b> verificar.mjs mostrar-saldo-projetado --salvar</span><span><b>$</b> henrimap affected src/app/core/api/saldo-api.ts</span><span><b>$</b> hwk arquivar mostrar-saldo-projetado</span><span><b>$</b> uso.mjs painel</span></div></div>
  </div>

  <main>
    <!-- ============================================================ DIFERENÇAS -->
    <section class="secao" aria-labelledby="dif-t">
      <div class="secao__cab">
        <p class="eyebrow">O que muda</p>
        <h2 id="dif-t">Seis ideias, uma frase cada</h2>
      </div>
      <ul class="ideias">
        <li><h3>Quem escreve não revisa</h3><p>Toda revisão roda num subagente sem a conversa do autor, com um prompt gerado por script.</p></li>
        <li><h3>Uma fatia por arquivo</h3><p>O plano vira fatias verticais em <code>tarefas/NN-*.md</code>; cada uma vai para um executor num contexto limpo.</p></li>
        <li><h3>Mapa antes de busca</h3><p>Um grafo local do projeto diz onde algo está e o que quebra se mexer, sem varrer arquivos.</p></li>
        <li><h3>Executores externos</h3><p>Um agente de terceiros, como o design-to-code, executa fatias por contrato em <code>executores.json</code>.</p></li>
        <li><h3>Uso e custo por task</h3><p>Token, modelo e custo vêm do OpenTelemetry do Copilot, ligados ao ticket do Jira, fora do repositório.</p></li>
        <li><h3>Só um arquivo no Git</h3><p>O registro em <code>conhecimento/</code>. O resto fica em <code>.git/info/exclude</code>.</p></li>
      </ul>
    </section>

    <!-- ============================================================ FLUXO -->
    <section class="secao" id="fluxo" aria-labelledby="fluxo-t">
      <div class="secao__cab">
        <p class="eyebrow">Fluxo</p>
        <h2 id="fluxo-t">Uma fase por chat, um portão por fase</h2>
        <p>Cada fase tem um agente. O portão que fecha a fase é de script ou de uma pessoa, nunca a opinião do próprio agente. O fluxo lê Git e não escreve Git: commit, branch e PR são seus.</p>
      </div>

      <div class="demo" data-demo="fluxo">
        <div class="demo__barra">
          <button class="botao" type="button" id="fluxo-play">Reproduzir um caso</button>
          <span class="demo__nota">Exemplo: <code>mostrar-saldo-projetado</code>, rigor Full</span>
        </div>
        <div class="trilho" aria-hidden="true"><span class="trilho__fill"></span></div>
        <ol class="fases">
          <li class="fase"><span class="fase__n">Intenção</span><code>hwk</code><span class="fase__p">o dev confirma a rota</span></li>
          <li class="fase"><span class="fase__n">Discovery</span><code>hwk-grill</code><span class="fase__p">sem lacuna bloqueante</span></li>
          <li class="fase"><span class="fase__n">Plano</span><code>hwk-plan</code><span class="fase__p"><code>hwk validar</code> sem erro</span></li>
          <li class="fase"><span class="fase__n">Revisão da spec</span><code>hwk-review</code><span class="fase__p">humano: <code>aprovar-spec</code></span></li>
          <li class="fase"><span class="fase__n">Implementação</span><code>hwk-implement</code><span class="fase__p">você commita cada sessão</span></li>
          <li class="fase"><span class="fase__n">Revisão de código</span><code>hwk-review</code><span class="fase__p">3 eixos APROVADO no HEAD</span></li>
          <li class="fase"><span class="fase__n">Archive</span><code>hwk-archive</code><span class="fase__p">você abre a PR com o resumo</span></li>
          <li class="fase"><span class="fase__n">Conhecimento</span><code>/hwk-fechar</code><span class="fase__p">você commita o registro</span></li>
        </ol>
        <div class="vs vs--chat" role="group" aria-label="Exemplo no painel de chat do VS Code">
          <div class="vs__barra"><span class="vs__pontos" aria-hidden="true"><i></i><i></i><i></i></span><span class="vs__titulo">extrato-mfe</span></div>
          <div class="vs__cab"><span>CHAT</span><span class="vs__cab-d">uma fase por chat</span></div>
          <div class="chat" role="log" aria-live="polite">
            <div class="troca">
              <p class="chat__div">chat novo · <b>hwk</b></p>
              <div class="msg msg--eu"><span class="msg__quem">Você</span><p>quero que o extrato mostre o saldo projetado do mês</p></div>
              <div class="msg msg--ag"><span class="msg__quem"><i class="msg__av" aria-hidden="true"></i>hwk</span><p>Comportamento novo visível e mexe no BFF: vale o fluxo. Rota: discovery. Abra um chat novo com o agente <code>hwk-grill</code>.</p></div>
            </div>
            <div class="troca">
              <p class="chat__div">chat novo · <b>hwk-grill</b></p>
              <div class="msg msg--eu"><span class="msg__quem">Você</span><p><code>/hwk-grill</code> saldo projetado no extrato</p></div>
              <div class="msg msg--ag"><span class="msg__quem"><i class="msg__av" aria-hidden="true"></i>hwk-grill</span><p>3 rodadas de perguntas, 0 lacunas bloqueantes, 1 de borda marcada. Gravei <code>.henriworks/briefings/saldo-projetado/briefing.md</code>.</p></div>
            </div>
            <div class="troca">
              <p class="chat__div">chat novo · <b>hwk-plan</b></p>
              <div class="msg msg--eu"><span class="msg__quem">Você</span><p><code>/hwk-plan</code> .henriworks/briefings/saldo-projetado/briefing.md</p></div>
              <div class="msg msg--ag"><span class="msg__quem"><i class="msg__av" aria-hidden="true"></i>hwk-plan</span><p>Rigor Full: muda o contrato MFE ↔ BFF e toca dois repositórios. 5 fatias. <code>hwk validar</code>: 0 erros.</p></div>
            </div>
            <div class="troca">
              <p class="chat__div">chat novo · <b>hwk-review</b></p>
              <div class="msg msg--eu"><span class="msg__quem">Você</span><p><code>/hwk-review spec</code> mostrar-saldo-projetado</p></div>
              <div class="msg msg--ag"><span class="msg__quem"><i class="msg__av" aria-hidden="true"></i>hwk-review</span><p>5 estágios APROVADO. Falta o portão humano: <code>hwk aprovar-spec mostrar-saldo-projetado --por "Seu Nome"</code>.</p></div>
            </div>
            <div class="troca">
              <p class="chat__div">chat novo · <b>hwk-implement</b></p>
              <div class="msg msg--eu"><span class="msg__quem">Você</span><p><code>/hwk-implement</code> mostrar-saldo-projetado paralelo</p></div>
              <div class="msg msg--ag"><span class="msg__quem"><i class="msg__av" aria-hidden="true"></i>hwk-implement</span><p>Fatias 02 e 03 rodaram juntas: sem aresta e <code>Toca:</code> disjunto. 1 cartão de decisão aberto. Revise o diff e commite.</p></div>
            </div>
            <div class="troca">
              <p class="chat__div">chat novo · <b>hwk-review</b></p>
              <div class="msg msg--eu"><span class="msg__quem">Você</span><p><code>/hwk-review</code> mostrar-saldo-projetado</p></div>
              <div class="msg msg--ag"><span class="msg__quem"><i class="msg__av" aria-hidden="true"></i>hwk-review</span><p>spec APROVADO · padrões APROVADO · plantão APROVADO, no HEAD <code>4f1c9e2</code>.</p></div>
            </div>
            <div class="troca">
              <p class="chat__div">chat novo · <b>hwk-archive</b></p>
              <div class="msg msg--eu"><span class="msg__quem">Você</span><p><code>/hwk-archive</code> mostrar-saldo-projetado</p></div>
              <div class="msg msg--ag"><span class="msg__quem"><i class="msg__av" aria-hidden="true"></i>hwk-archive</span><p><code>resumo.md</code> pronto para o corpo da PR. Mudança movida para <code>archive/</code>.</p></div>
            </div>
            <div class="troca">
              <p class="chat__div">chat novo · <b>hwk-archive</b></p>
              <div class="msg msg--eu"><span class="msg__quem">Você</span><p><code>/hwk-fechar</code> 2026-11-06-mostrar-saldo-projetado 1234</p></div>
              <div class="msg msg--ag"><span class="msg__quem"><i class="msg__av" aria-hidden="true"></i>hwk-archive</span><p>Criei <code class="sinal-t">conhecimento/2026-11-06-mostrar-saldo-projetado.md</code>. É o único arquivo para commitar, na branch da PR.</p></div>
            </div>
          </div>
          <div class="chat__entrada"><span class="chat__ph">Pergunte ou digite <code>/</code> para atalhos<i class="cursor" aria-hidden="true"></i></span><span class="chat__ag" id="chat-ag">hwk-archive</span></div>
        </div>
      </div>

      <div class="duas">
        <div>
          <h3>Rigor Lite</h3>
          <p>Padrão. Proposta e fatias, sem <code>design.md</code>. A spec é revisada por dois peixinhos: design e prontidão.</p>
        </div>
        <div>
          <h3>Rigor Full</h3>
          <p>Obrigatório quando muda contrato entre camadas, há operação irreversível, requisito regulatório ou de segurança, mais de um repositório ou decisão durável. Com <code>design.md</code> e cinco estágios de revisão.</p>
        </div>
      </div>
    </section>

    <!-- ============================================================ REVISÃO -->
    <section class="secao" id="revisao" aria-labelledby="rev-t">
      <div class="secao__cab">
        <p class="eyebrow">Revisão isolada</p>
        <h2 id="rev-t">O revisor não leu a conversa, de propósito</h2>
        <p>Quem escreveu um documento lê o que quis dizer, não o que escreveu. O revisor que leu a conversa herda o mesmo ponto cego. Por isso a revisão segue o modelo Elefante e Peixinho.</p>
      </div>

      <ul class="papeis">
        <li><span class="papel__tag">Elefante</span><h3>O agente da fase</h3><p>Tem o projeto, o briefing e a conversa. Planeja, coordena e implementa.</p></li>
        <li><span class="papel__tag papel__tag--gf">Peixinho</span><h3>Um <code>hwk-gf-*</code></h3><p>Só <code>read</code> e <code>search</code>. Lê o pacote de revisão e o que ele lista. Nada mais.</p></li>
        <li><span class="papel__tag papel__tag--h">Humano</span><h3>Você</h3><p>Resolve trade-off, aprova a spec, commita e abre a PR.</p></li>
      </ul>

      <div class="demo" data-demo="revisao">
        <div class="demo__barra">
          <button class="botao" type="button" id="rev-play">Ver o caminho de uma revisão</button>
          <span class="demo__nota">Estágio de design, rigor Full</span>
        </div>
        <div class="rota-wrap">
          <svg class="rota" viewBox="0 0 760 210" role="img" aria-labelledby="rota-t">
            <title id="rota-t">O pacote sai do elefante, passa pela conferência do hook, chega ao peixinho e volta como veredito gravado por script.</title>
            <line class="rota__linha" x1="80" y1="96" x2="680" y2="96"/>
            <g class="estacao" data-i="0"><circle cx="80" cy="96" r="30"/><text x="80" y="160" text-anchor="middle">Elefante</text><text class="estacao__s" x="80" y="180" text-anchor="middle">pacote-revisao</text></g>
            <g class="estacao" data-i="1"><circle cx="280" cy="96" r="30"/><text x="280" y="160" text-anchor="middle">Hook</text><text class="estacao__s" x="280" y="180" text-anchor="middle">prompt literal?</text></g>
            <g class="estacao" data-i="2"><circle cx="480" cy="96" r="30"/><text x="480" y="160" text-anchor="middle">Peixinho</text><text class="estacao__s" x="480" y="180" text-anchor="middle">lê só a lista</text></g>
            <g class="estacao" data-i="3"><circle cx="680" cy="96" r="30"/><text x="680" y="160" text-anchor="middle">Registro</text><text class="estacao__s" x="680" y="180" text-anchor="middle">gravar-veredito</text></g>
            <g class="pacote"><rect x="56" y="22" width="48" height="32" rx="3"/><text x="80" y="43" text-anchor="middle">pacote</text></g>
            <g class="vazamento"><rect x="196" y="22" width="68" height="32" rx="3"/><text x="230" y="43" text-anchor="middle">conversa</text><line x1="200" y1="24" x2="260" y2="52"/></g>
          </svg>
        </div>
        <ol class="rev-passos">
          <li><code>hwk pacote-revisao &lt;id&gt; design</code> gera o pacote e imprime o prompt literal.</li>
          <li>O elefante delega com exatamente esse prompt. Com a conferência ligada, o hook nega qualquer outro texto.</li>
          <li>O peixinho lê o pacote e só os arquivos listados. Responde no formato pedido.</li>
          <li><code>hwk gravar-veredito</code> grava. Nunca sobrescreve: uma nova rodada vira <code>-2</code>, <code>-3</code>.</li>
        </ol>
      </div>

      <div class="duas-janelas">
        <div class="vs vs--editor" role="group" aria-label="Pacote de revisão aberto no editor">
          <div class="vs__barra"><span class="vs__pontos" aria-hidden="true"><i></i><i></i><i></i></span><span class="vs__titulo">extrato-mfe</span></div>
          <div class="vs__abas"><span class="vs__aba is-on">design-6144482.md</span><span class="vs__aba">proposta.md</span></div>
          <div class="vs__trilha">.henriworks › changes › mostrar-saldo-projetado › pacotes › design-6144482.md</div>
          <pre class="vs__cod"><code><span class="l"><span class="h"># Pacote de revisão · design</span></span><span class="l"></span><span class="l"><span class="m">Gerado por script em 2026-11-02T14:03:11Z. Persona: hwk-gf-design.</span></span><span class="l"></span><span class="l"><span class="h">## Pedido</span></span><span class="l"></span><span class="l">Estágio "design" da revisão da spec da mudança mostrar-saldo-projetado (rigor Full).</span><span class="l"></span><span class="l"><span class="h">## Leia, e só isto</span></span><span class="l"></span><span class="l">- <span class="c">`.henriworks/changes/mostrar-saldo-projetado/proposta.md`</span>: documento revisado</span><span class="l">- <span class="c">`.henriworks/changes/mostrar-saldo-projetado/design.md`</span>: documento revisado</span><span class="l">- <span class="c">`.henriworks/changes/mostrar-saldo-projetado/deltas.md`</span>: documento revisado</span><span class="l">- <span class="c">`.henriworks/changes/mostrar-saldo-projetado/tarefas/01-contrato-saldo.md`</span>: fatia</span><span class="l">- <span class="c">`.henriworks/glossario.md`</span>: vocabulário do domínio</span><span class="l">- <span class="c">`.henriworks/decisoes/index.md`</span>: decisões vigentes</span><span class="l"></span><span class="l"><span class="h">## Formato da resposta</span></span><span class="l"></span><span class="l"><span class="k"># spec-design - APROVADO | REPROVADO</span></span><span class="l"><span class="k">Spec revisada:</span> 6144482</span><span class="l"><span class="k">Achados:</span> &lt;número&gt;</span></code></pre>
        </div>
        <div class="vs vs--chat" role="group" aria-label="Chamada do subagente no chat">
          <div class="vs__barra"><span class="vs__pontos" aria-hidden="true"><i></i><i></i><i></i></span><span class="vs__titulo">extrato-mfe</span></div>
          <div class="vs__cab"><span>CHAT</span><span class="vs__cab-d">hwk-review</span></div>
          <div class="chat chat--fixo">
            <div class="msg msg--eu"><span class="msg__quem">Você</span><p><code>/hwk-review spec</code> mostrar-saldo-projetado</p></div>
            <div class="msg msg--ag"><span class="msg__quem"><i class="msg__av" aria-hidden="true"></i>hwk-review</span>
              <div class="ferr"><span class="ferr__t">Executou no terminal</span><code>node .henriworks/bin/hwk.mjs pacote-revisao mostrar-saldo-projetado design</code></div>
              <div class="ferr ferr--sub"><span class="ferr__t">Subagente · hwk-gf-design</span><code>Pacote de revisão: .henriworks/changes/mostrar-saldo-projetado/pacotes/design-6144482.md. Leia esse arquivo e apenas os arquivos que ele lista. Responda só no formato que ele pede.</code><span class="ferr__ok">hook: prompt literal conferido</span></div>
              <div class="ferr"><span class="ferr__t">Executou no terminal</span><code>node .henriworks/bin/hwk.mjs gravar-veredito mostrar-saldo-projetado design --de .henriworks/changes/mostrar-saldo-projetado/rascunhos/design.md</code></div>
              <p><b>spec-design APROVADO</b> · Achados: 0. Próximo estágio: <code>zoom-out-2</code>.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="tabela-wrap">
        <table class="tabela">
          <caption>Quem revisa o quê</caption>
          <thead><tr><th scope="col">Revisão</th><th scope="col">Peixinhos</th><th scope="col">Veredito preso a</th></tr></thead>
          <tbody>
            <tr><td>Spec, Lite</td><td>design, prontidão</td><td>hash da spec</td></tr>
            <tr><td>Spec, Full</td><td>zoom-out, compreensão, design, zoom-out-2, prontidão</td><td>hash da spec</td></tr>
            <tr><td>Código</td><td>spec, padrões, plantão</td><td>commit (HEAD)</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ============================================================ FATIAS -->
    <section class="secao" id="fatias" aria-labelledby="fat-t">
      <div class="secao__cab">
        <p class="eyebrow">Fatias</p>
        <h2 id="fat-t">Vertical, uma por arquivo, com o que pode tocar declarado</h2>
        <p>Cada fatia demonstra um comportamento, declara o que bloqueia e o que pode alterar. O executor recebe o caminho da fatia e os ponteiros dela, nunca a conversa do plano. Fatias sem dependência e com <code>Toca:</code> disjunto podem rodar juntas.</p>
      </div>

      <div class="camadas">
        <figure class="pilha" aria-label="A mudança em camadas: proposta, design, deltas e cinco fatias. A fatia 03 sobe sozinha: é o que o executor recebe.">
          <div class="pilha__cena"><div class="folha " style="--z:0"><span>proposta.md</span></div><div class="folha " style="--z:1"><span>design.md</span></div><div class="folha " style="--z:2"><span>deltas.md</span></div><div class="folha folha--f" style="--z:3"><span>01 · contrato</span></div><div class="folha folha--f" style="--z:4"><span>02 · BFF calcula</span></div><div class="folha folha--f folha--s" style="--z:5"><span>03 · MFE consome</span></div><div class="folha folha--f" style="--z:6"><span>04 · tela</span></div><div class="folha folha--f" style="--z:7"><span>05 · verificação</span></div></div>
          <figcaption>A mudança em camadas. O executor recebe só a fatia que sobe, e os ponteiros dela.</figcaption>
        </figure>
        <div class="vs vs--editor" role="group" aria-label="Fatia 03 aberta no editor">
          <div class="vs__barra"><span class="vs__pontos" aria-hidden="true"><i></i><i></i><i></i></span><span class="vs__titulo">extrato-mfe</span></div>
          <div class="vs__abas"><span class="vs__aba is-on">03-mfe-consome-saldo.md</span><span class="vs__aba">index.md</span></div>
          <div class="vs__trilha">.henriworks › changes › mostrar-saldo-projetado › tarefas › 03-mfe-consome-saldo.md</div>
          <pre class="vs__cod"><code><span class="l"><span class="h"># 03. MFE consome o saldo projetado</span></span><span class="l"><span class="k">Demonstra:</span> o serviço do extrato traz o saldo projetado do BFF</span><span class="l"><span class="k">Bloqueado por:</span> 01</span><span class="l"><span class="k">Toca:</span> src/app/core/api/, src/app/domain/saldo/</span><span class="l"><span class="k">Executor:</span> hwk-implementador</span><span class="l"></span><span class="l"><span class="h">## Ponteiros</span></span><span class="l">- proposta.md, critérios 1 e 2</span><span class="l">- design.md, decisão "cliente gerado da cópia do contrato no MFE"</span><span class="l">- <span class="c">contracts/saldo.openapi.yaml</span> (cópia do MFE)</span><span class="l"></span><span class="l"><span class="x">- [ ]</span> 3.1 Gerar o cliente a partir da cópia do contrato em <span class="c">`contracts/`</span></span><span class="l"><span class="x">- [ ]</span> 3.2 SaldoService expõe o saldo projetado como signal</span><span class="l"><span class="x">- [ ]</span> 3.3 Teste do serviço com o stub da fatia 01</span></code></pre>
        </div>
      </div>

      <div class="demo" data-demo="fatias">
        <div class="demo__barra">
          <div class="alternar" role="group" aria-label="Modo de execução">
            <button class="alternar__b is-on" type="button" data-modo="seq" aria-pressed="true">Uma por sessão</button>
            <button class="alternar__b" type="button" data-modo="par" aria-pressed="false">Paralelo</button>
          </div>
          <button class="botao" type="button" id="fat-play">Executar</button>
          <span class="demo__nota" id="fat-sessoes">Sessões: 5</span>
        </div>
        <div class="ondas">
          <div class="onda"><p class="onda__t">Frontier 1</p>
            <article class="fatia" data-f="01"><h3><span>01</span> Contrato do saldo projetado</h3><p class="fatia__d">Demonstra: o BFF responde o stub de <code>GET /saldo/projetado</code></p><p class="fatia__m">Toca: <code>bff/contracts/</code> · Bloqueado por: nenhum</p></article>
          </div>
          <div class="onda"><p class="onda__t">Frontier 2</p>
            <article class="fatia" data-f="02"><h3><span>02</span> BFF calcula o saldo</h3><p class="fatia__d">Demonstra: o endpoint devolve o valor projetado</p><p class="fatia__m">Toca: <code>bff/src/…/saldo/</code> · Bloqueado por: 01</p></article>
            <article class="fatia" data-f="03"><h3><span>03</span> MFE consome o endpoint</h3><p class="fatia__d">Demonstra: o serviço do extrato traz o saldo</p><p class="fatia__m">Toca: <code>src/app/core/api/</code>, <code>src/app/domain/saldo/</code> · Bloqueado por: 01</p></article>
          </div>
          <div class="onda"><p class="onda__t">Frontier 3</p>
            <article class="fatia" data-f="04"><h3><span>04</span> Tela mostra o saldo</h3><p class="fatia__d">Demonstra: o extrato exibe o saldo do mês</p><p class="fatia__m">Executor: <code>design-to-code</code> · Bloqueado por: 03</p></article>
          </div>
          <div class="onda"><p class="onda__t">Por último</p>
            <article class="fatia" data-f="05"><h3><span>05</span> Verificação</h3><p class="fatia__d">Demonstra: <code>verificar.mjs</code> sem BLOQUEANTE</p><p class="fatia__m">Escopo: core, feature, bff · Bloqueado por: todos</p></article>
          </div>
        </div>

        <div class="gantt" aria-label="Sessões por modo de execução">
          <div class="gantt__linha"><span class="gantt__r">Uma por sessão</span><div class="gantt__trilho"><span class="gantt__b" style="--i:0">01</span><span class="gantt__b" style="--i:1">02</span><span class="gantt__b" style="--i:2">03</span><span class="gantt__b" style="--i:3">04</span><span class="gantt__b" style="--i:4">05</span></div><span class="gantt__v">5 sessões</span></div>
          <div class="gantt__linha"><span class="gantt__r">Paralelo</span><div class="gantt__trilho"><span class="gantt__b" style="--i:0">01</span><span class="gantt__b gantt__b--duplo" style="--i:1">02 + 03</span><span class="gantt__b" style="--i:2">04</span><span class="gantt__b" style="--i:3">05</span></div><span class="gantt__v">4 sessões</span></div>
        </div>

        <aside class="cartao" id="cartao">
          <p class="eyebrow">Cartão de decisão · <code>tarefas/sobreposicoes.md</code></p>
          <p><b><code>package.json</code></b> alterado fora do <code>Toca:</code> das fatias 02 e 03.</p>
          <p>Saídas: commitar junto · separar com <code>git add -p</code> · replanejar. <span class="pill pill--warn">Decisão: pendente</span></p>
          <p class="cartao__n">Não bloqueia a entrega. Cartão em aberto vai para a PR, em "Pontos para o revisor humano".</p>
        </aside>
      </div>
    </section>

    <!-- ============================================================ MAPA -->
    <section class="secao" id="mapa" aria-labelledby="mapa-t">
      <div class="secao__cab">
        <p class="eyebrow">Mapa do projeto</p>
        <h2 id="mapa-t">Da tela ao serviço do BFF em uma consulta</h2>
        <p>O <code>henrimap</code> responde antes de qualquer busca: o que já existe para reusar, onde fica e o que quebra se mexer. Ele confere o hash dos arquivos a cada consulta e corta a resposta em 2.000 caracteres. As saídas abaixo são reais, do repositório de exemplo usado nos testes.</p>
      </div>

      <div class="demo" data-demo="mapa">
        <div class="demo__barra comandos" role="group" aria-label="Consultas">
          <button class="cmd is-on" type="button" data-cmd="path" aria-pressed="true">path</button>
          <button class="cmd" type="button" data-cmd="explain" aria-pressed="false">explain</button>
          <button class="cmd" type="button" data-cmd="affected" aria-pressed="false">affected</button>
          <button class="cmd" type="button" data-cmd="query" aria-pressed="false">query</button>
        </div>
        <div class="grafo-wrap">
          <svg class="grafo" viewBox="0 0 900 330" role="img" aria-labelledby="grafo-t">
            <title id="grafo-t">Grafo do exemplo: ConfirmacaoComponent usa AcordoService, que usa AcordoApi; o arquivo acordo-api.ts chama o endpoint POST /api/acordos/{}/confirmacao, exposto por AcordoController e declarado no openapi.yaml; AcordoController usa AcordoServico, que implementa Confirmador.</title>
            <g class="arestas">
              <path id="ar1" class="aresta" data-a="ConfirmacaoComponent AcordoService" d="M170 70 H250"/>
              <path id="ar2" class="aresta" data-a="AcordoService AcordoApi" d="M380 70 H470"/>
              <path id="ar3" class="aresta aresta--inf" data-a="AcordoApi Endpoint" d="M500 92 V148"/>
              <path id="ar4" class="aresta aresta--inf" data-a="AcordoController Endpoint" d="M720 172 H520"/>
              <path id="ar5" class="aresta aresta--inf" data-a="openapi Endpoint" d="M440 280 V200"/>
              <path id="ar6" class="aresta" data-a="AcordoController AcordoServico" d="M800 192 V250"/>
              <path id="ar7" class="aresta" data-a="AcordoServico Confirmador" d="M720 272 H640"/>
            </g>
            <g class="pulsos" aria-hidden="true"><circle class="pulso" r="3.5"><animateMotion dur="2.2s" begin="0.00s" repeatCount="indefinite"><mpath href="#ar1"/></animateMotion></circle><circle class="pulso" r="3.5"><animateMotion dur="2.5s" begin="0.35s" repeatCount="indefinite"><mpath href="#ar2"/></animateMotion></circle><circle class="pulso" r="3.5"><animateMotion dur="2.8s" begin="0.70s" repeatCount="indefinite"><mpath href="#ar3"/></animateMotion></circle><circle class="pulso" r="3.5"><animateMotion dur="2.2s" begin="1.05s" repeatCount="indefinite"><mpath href="#ar4"/></animateMotion></circle><circle class="pulso" r="3.5"><animateMotion dur="2.5s" begin="1.40s" repeatCount="indefinite"><mpath href="#ar5"/></animateMotion></circle><circle class="pulso" r="3.5"><animateMotion dur="2.8s" begin="1.75s" repeatCount="indefinite"><mpath href="#ar6"/></animateMotion></circle><circle class="pulso" r="3.5"><animateMotion dur="2.2s" begin="2.10s" repeatCount="indefinite"><mpath href="#ar7"/></animateMotion></circle></g>
            <g class="rotulos-a">
              <text x="210" y="62" text-anchor="middle">uses</text>
              <text x="425" y="62" text-anchor="middle">uses</text>
              <text x="508" y="125">calls_http</text>
              <text x="620" y="164" text-anchor="middle">exposes</text>
              <text x="450" y="245">declares</text>
              <text x="810" y="225">uses</text>
              <text x="680" y="264" text-anchor="middle">implements</text>
            </g>
            <g class="no" data-n="ConfirmacaoComponent"><rect x="10" y="48" width="160" height="44" rx="4"/><text x="90" y="68" text-anchor="middle">ConfirmacaoComponent</text><text class="no__s" x="90" y="84" text-anchor="middle">feature · TS</text></g>
            <g class="no" data-n="AcordoService"><rect x="250" y="48" width="130" height="44" rx="4"/><text x="315" y="68" text-anchor="middle">AcordoService</text><text class="no__s" x="315" y="84" text-anchor="middle">domain · TS</text></g>
            <g class="no" data-n="AcordoApi"><rect x="470" y="48" width="130" height="44" rx="4"/><text x="535" y="68" text-anchor="middle">AcordoApi</text><text class="no__s" x="535" y="84" text-anchor="middle">core · TS</text></g>
            <g class="no no--ep" data-n="Endpoint"><rect x="330" y="148" width="190" height="48" rx="24"/><text x="425" y="170" text-anchor="middle">POST /api/acordos/{}</text><text class="no__s" x="425" y="186" text-anchor="middle">/confirmacao · L3</text></g>
            <g class="no" data-n="AcordoController"><rect x="720" y="148" width="160" height="44" rx="4"/><text x="800" y="168" text-anchor="middle">AcordoController</text><text class="no__s" x="800" y="184" text-anchor="middle">BFF · Java</text></g>
            <g class="no" data-n="openapi"><rect x="370" y="280" width="140" height="40" rx="4"/><text x="440" y="300" text-anchor="middle">openapi.yaml</text><text class="no__s" x="440" y="314" text-anchor="middle">contrato</text></g>
            <g class="no" data-n="AcordoServico"><rect x="720" y="250" width="160" height="44" rx="4"/><text x="800" y="270" text-anchor="middle">AcordoServico</text><text class="no__s" x="800" y="286" text-anchor="middle">BFF · Java</text></g>
            <g class="no" data-n="Confirmador"><rect x="510" y="250" width="130" height="44" rx="4"/><text x="575" y="270" text-anchor="middle">Confirmador</text><text class="no__s" x="575" y="286" text-anchor="middle">interface · Java</text></g>
          </svg>
        </div>
        <div class="legenda-grafo">
          <span><i class="lg lg--ext"></i> EXTRACTED: lido do código ou do compilador</span>
          <span><i class="lg lg--inf"></i> INFERRED: convenção de framework ou caminho de endpoint, confira no código</span>
        </div>
        <div class="vs vs--term" role="group" aria-label="Terminal integrado">
          <div class="vs__painel-abas"><span>PROBLEMAS</span><span>SAÍDA</span><span class="is-on">TERMINAL</span><span class="vs__painel-d">powershell</span></div>
          <pre class="saida" id="mapa-saida" aria-live="polite"><code><span class="saida__cmd">PS C:\src\extrato-mfe&gt; node .henriworks/bin/henrimap.mjs path ConfirmacaoComponent AcordoController</span>
caminho (5 salto(s)):
  ConfirmacaoComponent (src/app/feature/renegociacao/confirmacao/confirmacao.component.ts:3)
  -->uses--> AcordoService (src/app/domain/acordo/acordo.service.ts:3)
  -->uses--> AcordoApi (src/app/core/api/acordo-api.ts:3)
  &lt;--contains-- acordo-api.ts (src/app/core/api/acordo-api.ts)
  -->calls_http--> POST /api/acordos/{}/confirmacao
  &lt;--exposes-- AcordoController (bff/src/main/java/br/com/x/acordo/AcordoController.java:3)</code></pre>
        </div>
      </div>

      <div class="tabela-wrap">
        <table class="tabela">
          <caption>Camadas de precisão, sem instalar nada</caption>
          <thead><tr><th scope="col">Camada</th><th scope="col">Como</th><th scope="col">Quando</th></tr></thead>
          <tbody>
            <tr><td>L1</td><td>regex por linguagem: TS/JS, Java, Kotlin, C#, Python, Go, OpenAPI</td><td>sempre</td></tr>
            <tr><td>L2</td><td>compilador TypeScript do <code>node_modules</code> do projeto; <code>jdeps</code> do JDK</td><td>quando existem</td></tr>
            <tr><td>L3</td><td>rotas lazy, remotes do Native Federation, endpoints Spring, Feign, OpenAPI, chamadas HTTP do front</td><td>sempre, marcado INFERRED</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ============================================================ USO E CUSTO -->
    <section class="secao" id="uso" aria-labelledby="uso-t">
      <div class="secao__cab">
        <p class="eyebrow">Uso e custo · experimental</p>
        <h2 id="uso-t">O painel de uma mudança</h2>
        <p>O <code>uso.mjs painel</code> junta o OpenTelemetry do Copilot (token, modelo, tempo) com os eventos dos hooks (agente, ticket, mudança). Os dados ficam em <code>~/.henriworks/uso/</code>, nunca no repositório, e nunca incluem prompt, resposta ou comando.</p>
      </div>

      <p class="aviso-sim" role="note"><b>Simulação.</b> O painel abaixo foi gerado pelo <code>uso.mjs painel</code> desta versão, a partir de 36 sessões simuladas em três mudanças e de uma lista de política de exemplo. Layout e cálculos são os reais; os números são de exemplo.</p>

      <div class="vs vs--term vs--curto" role="group" aria-label="Gerar o painel">
        <div class="vs__painel-abas"><span class="is-on">TERMINAL</span><span class="vs__painel-d">powershell</span></div>
        <pre class="saida"><code><span class="saida__cmd">PS C:\src\extrato-mfe&gt; node .henriworks/bin/uso.mjs painel</span>
painel: C:\Users\voce\.henriworks\uso\painel\index.html (214 registro(s) novo(s) do OTel)</code></pre>
      </div>

      <div class="nav" role="group" aria-label="Painel de uso e custo aberto no navegador">
        <div class="nav__barra"><span class="vs__pontos" aria-hidden="true"><i></i><i></i><i></i></span><span class="nav__aba">HenriWorks · uso e custo</span></div>
        <div class="nav__url"><span>file:///C:/Users/voce/.henriworks/uso/painel/index.html</span></div>
        <div class="nav__corpo"><div class="hp hp--parado">
<header class="hp-cab"><div><h1>HenriWorks · uso e custo</h1><p class="hp-sub">Gerado em 09/11/2026, 06:10:56 · período 13/10/2026 a 06/11/2026 · dados locais em <code>C:\Users\voce\.henriworks\uso</code> · preços de lista de 2026-09-11</p></div><span class="hp-vivo">só nesta máquina</span></header>

<div class="hp-ks"><div class="hp-k"><span>Sessões</span><b>36</b><small>29 no fluxo HenriWorks</small></div><div class="hp-k"><span>Créditos (valor de lista)</span><b>756</b><small>US$ 7,56</small></div><div class="hp-k"><span>Tokens de entrada</span><b>4.855.064</b><small>60% lidos de cache</small></div><div class="hp-k"><span>Tokens de saída</span><b>298.238</b></div><div class="hp-k"><span>Mapa antes de busca</span><b>93%</b><small>sessões do fluxo com busca</small></div><div class="hp-k"><span>Sessões sem ticket</span><b>8%</b><small>custo sem task para ligar</small></div></div>
<section><h2>Orçamentos por mudança · aviso em 50%, 80%, 100%</h2><div class="hp-c"><div class="hp-orc"><div class="hp-o"><div class="hp-o__n"><b>mostrar-saldo-projetado</b><small>EXT-2041</small></div>
<div class="hp-o__t"><i class="hp-warn" style="width:62.8%;--d:0.00s"></i><u style="left:40.0%" title="50%"></u><u style="left:64.0%" title="80%"></u><u style="left:80.0%" title="100%"></u></div>
<div class="hp-o__v">314 / 400 cr<span class="hp-pill hp-pill--warn">79% · acima de 50%</span></div></div><div class="hp-o"><div class="hp-o__n"><b>corrigir-filtro-periodo</b><small>EXT-2033</small></div>
<div class="hp-o__t"><i class="hp-warn" style="width:68.7%;--d:0.08s"></i><u style="left:40.0%" title="50%"></u><u style="left:64.0%" title="80%"></u><u style="left:80.0%" title="100%"></u></div>
<div class="hp-o__v">129 / 150 cr<span class="hp-pill hp-pill--warn">86% · acima de 80%</span></div></div><div class="hp-o"><div class="hp-o__n"><b>migrar-cliente-http</b><small>EXT-1987</small></div>
<div class="hp-o__t"><i class="hp-crit" style="width:86.6%;--d:0.16s"></i><u style="left:40.0%" title="50%"></u><u style="left:64.0%" title="80%"></u><u style="left:80.0%" title="100%"></u></div>
<div class="hp-o__v">271 / 250 cr<span class="hp-pill hp-pill--crit">108% · estourado</span></div></div></div></div></section>
<div class="hp-g2"><section><h2>Créditos por dia</h2><div class="hp-c"><svg class="hp-svg" viewBox="0 0 640 190" role="img" aria-label="Créditos por dia, máximo de 79,0 em 23/10">
<line class="hp-eixo" x1="26" y1="160" x2="634" y2="160"/><rect class="hp-col" x="30.0" y="127.6" width="27.1" height="32.4" rx="1.5" style="--d:0.000s"><title>2026-10-13: 18 créditos, 126.954 tokens</title></rect><rect class="hp-col" x="60.1" y="88.1" width="27.1" height="71.9" rx="1.5" style="--d:0.025s"><title>2026-10-14: 40 créditos, 144.104 tokens</title></rect><rect class="hp-col" x="90.3" y="120.5" width="27.1" height="39.5" rx="1.5" style="--d:0.050s"><title>2026-10-15: 22 créditos, 55.411 tokens</title></rect><rect class="hp-col" x="120.4" y="86.3" width="27.1" height="73.7" rx="1.5" style="--d:0.075s"><title>2026-10-16: 41 créditos, 296.773 tokens</title></rect><rect class="hp-col" x="150.6" y="142.9" width="27.1" height="17.1" rx="1.5" style="--d:0.100s"><title>2026-10-17: 10 créditos, 420.962 tokens</title></rect><rect class="hp-col" x="180.8" y="77.3" width="27.1" height="82.7" rx="1.5" style="--d:0.125s"><title>2026-10-19: 46 créditos, 343.352 tokens</title></rect><rect class="hp-col" x="210.9" y="63.3" width="27.1" height="96.7" rx="1.5" style="--d:0.150s"><title>2026-10-20: 54 créditos, 360.851 tokens</title></rect><rect class="hp-col" x="241.0" y="88.1" width="27.1" height="71.9" rx="1.5" style="--d:0.175s"><title>2026-10-21: 40 créditos, 171.334 tokens</title></rect><rect class="hp-col" x="271.2" y="68.9" width="27.1" height="91.1" rx="1.5" style="--d:0.200s"><title>2026-10-22: 51 créditos, 311.391 tokens</title></rect><rect class="hp-col hp-sinal" x="301.3" y="18.0" width="27.1" height="142.0" rx="1.5" style="--d:0.225s"><title>2026-10-23: 79 créditos, 420.224 tokens</title></rect><rect class="hp-col" x="331.5" y="82.7" width="27.1" height="77.3" rx="1.5" style="--d:0.250s"><title>2026-10-26: 43 créditos, 135.324 tokens</title></rect><rect class="hp-col" x="361.6" y="89.9" width="27.1" height="70.1" rx="1.5" style="--d:0.275s"><title>2026-10-27: 39 créditos, 192.005 tokens</title></rect><rect class="hp-col" x="391.8" y="116.4" width="27.1" height="43.6" rx="1.5" style="--d:0.300s"><title>2026-10-28: 24 créditos, 369.418 tokens</title></rect><rect class="hp-col" x="421.9" y="66.1" width="27.1" height="93.9" rx="1.5" style="--d:0.325s"><title>2026-10-29: 52 créditos, 223.741 tokens</title></rect><rect class="hp-col" x="452.1" y="102.5" width="27.1" height="57.5" rx="1.5" style="--d:0.350s"><title>2026-10-30: 32 créditos, 225.509 tokens</title></rect><rect class="hp-col" x="482.3" y="75.5" width="27.1" height="84.5" rx="1.5" style="--d:0.375s"><title>2026-11-02: 47 créditos, 343.148 tokens</title></rect><rect class="hp-col" x="512.4" y="113.3" width="27.1" height="46.7" rx="1.5" style="--d:0.400s"><title>2026-11-03: 26 créditos, 206.424 tokens</title></rect><rect class="hp-col" x="542.5" y="68.3" width="27.1" height="91.7" rx="1.5" style="--d:0.425s"><title>2026-11-04: 51 créditos, 525.321 tokens</title></rect><rect class="hp-col" x="572.7" y="115.1" width="27.1" height="44.9" rx="1.5" style="--d:0.450s"><title>2026-11-05: 25 créditos, 179.038 tokens</title></rect><rect class="hp-col" x="602.9" y="129.6" width="27.1" height="30.4" rx="1.5" style="--d:0.475s"><title>2026-11-06: 17 créditos, 102.018 tokens</title></rect>
<text x="314.9" y="12.0" text-anchor="middle" class="hp-rot">79 cr</text>
<text x="43.6" y="178" text-anchor="middle">13/10</text><text x="616.4" y="178" text-anchor="middle">06/11</text></svg></div></section><section><h2>Acumulado · mostrar-saldo-projetado</h2><div class="hp-c"><svg class="hp-svg" viewBox="0 0 640 230" role="img" aria-label="mostrar-saldo-projetado: 314 créditos em 14 sessões de um orçamento de 400">
<line class="hp-eixo" x1="44" y1="190" x2="624" y2="190"/><text x="38" y="194" text-anchor="end">0</text>
<text x="44" y="210" text-anchor="middle">1</text><text x="624" y="210" text-anchor="middle">14</text><text x="334" y="226" text-anchor="middle">sessão</text>
<g class="hp-lim hp-lim--ok"><line x1="44" y1="107.1" x2="624" y2="107.1"/><text x="624" y="102.1" text-anchor="end">50% · 200</text></g><g class="hp-lim"><line x1="44" y1="57.4" x2="624" y2="57.4"/><text x="624" y="52.4" text-anchor="end">80% · 320</text></g><g class="hp-lim"><line x1="44" y1="24.3" x2="624" y2="24.3"/><text x="624" y="19.3" text-anchor="end">100% · 400</text></g><path class="hp-area" d="M44.0 186.7 L88.6 180.9 L133.2 173.0 L177.8 163.9 L222.5 156.9 L267.1 145.2 L311.7 135.2 L356.3 124.0 L400.9 104.6 L445.5 93.8 L490.2 85.1 L534.8 76.0 L579.4 66.9 L624.0 59.8 L624.0 190 L44.0 190 Z"/><path class="hp-linha" pathLength="1" d="M44.0 186.7 L88.6 180.9 L133.2 173.0 L177.8 163.9 L222.5 156.9 L267.1 145.2 L311.7 135.2 L356.3 124.0 L400.9 104.6 L445.5 93.8 L490.2 85.1 L534.8 76.0 L579.4 66.9 L624.0 59.8"/><g class="hp-marco"><circle cx="400.9" cy="104.6" r="5"/><text x="392.9" y="124.6" text-anchor="end">aviso 50% · sessão 9</text></g><circle class="hp-fim" cx="624.0" cy="59.8" r="5"/><text class="hp-rot" x="616.0" y="81.8" text-anchor="end">314 cr</text></svg></div></section></div>
<div class="hp-g3"><section><h2>Tokens por fase do fluxo</h2><div class="hp-c"><div class="hp-b"><span class="hp-r" title="Intenção">Intenção</span><span class="hp-t"><i class="hp-ax" style="width:1.9%;--d:0.00s"></i></span><span class="hp-v">45.034</span></div><div class="hp-b"><span class="hp-r" title="Discovery">Discovery</span><span class="hp-t"><i class="hp-ax" style="width:12.4%;--d:0.05s"></i></span><span class="hp-v">301.176</span></div><div class="hp-b"><span class="hp-r" title="Plano">Plano</span><span class="hp-t"><i class="hp-ax" style="width:17.8%;--d:0.10s"></i></span><span class="hp-v">432.049</span></div><div class="hp-b"><span class="hp-r" title="Revisão">Revisão</span><span class="hp-t"><i class="hp-ax" style="width:14.2%;--d:0.15s"></i></span><span class="hp-v">344.615</span></div><div class="hp-b"><span class="hp-r" title="Implementação">Implementação</span><span class="hp-t"><i class="hp-ax" style="width:100.0%;--d:0.20s"></i></span><span class="hp-v">2.422.123</span></div><div class="hp-b"><span class="hp-r" title="Archive">Archive</span><span class="hp-t"><i class="hp-ax" style="width:16.2%;--d:0.25s"></i></span><span class="hp-v">391.204</span></div><div class="hp-b"><span class="hp-r" title="fora do fluxo">fora do fluxo</span><span class="hp-t"><i class="hp-ax" style="width:50.2%;--d:0.30s"></i></span><span class="hp-v">1.217.101</span></div></div></section><section><h2>Créditos por modelo</h2><div class="hp-c"><div class="hp-b"><span class="hp-r" title="claude-sonnet-5">claude-sonnet-5</span><span class="hp-t"><i class="hp-ax hp-sinal" style="width:100.0%;--d:0.00s"></i></span><span class="hp-v">491 cr</span></div><div class="hp-b"><span class="hp-r" title="claude-opus-5">claude-opus-5</span><span class="hp-t"><i class="hp-ax" style="width:49.0%;--d:0.05s"></i></span><span class="hp-v">241 cr</span></div><div class="hp-b"><span class="hp-r" title="gpt-5-mini">gpt-5-mini</span><span class="hp-t"><i class="hp-ax" style="width:5.0%;--d:0.10s"></i></span><span class="hp-v">25 cr</span></div></div></section><section><h2>Créditos por ticket</h2><div class="hp-c"><div class="hp-b"><span class="hp-r" title="EXT-2041">EXT-2041</span><span class="hp-t"><i class="hp-ax" style="width:100.0%;--d:0.00s"></i></span><span class="hp-v">321 cr</span></div><div class="hp-b"><span class="hp-r" title="EXT-1987">EXT-1987</span><span class="hp-t"><i class="hp-ax" style="width:84.2%;--d:0.05s"></i></span><span class="hp-v">271 cr</span></div><div class="hp-b"><span class="hp-r" title="EXT-2033">EXT-2033</span><span class="hp-t"><i class="hp-ax" style="width:40.1%;--d:0.10s"></i></span><span class="hp-v">129 cr</span></div><div class="hp-b"><span class="hp-r" title="(sem)">(sem)</span><span class="hp-t"><i class="hp-ax" style="width:4.7%;--d:0.15s"></i></span><span class="hp-v">15 cr</span></div><div class="hp-b"><span class="hp-r" title="EXT-2050">EXT-2050</span><span class="hp-t"><i class="hp-ax" style="width:3.4%;--d:0.20s"></i></span><span class="hp-v">11 cr</span></div><div class="hp-b"><span class="hp-r" title="EXT-1990">EXT-1990</span><span class="hp-t"><i class="hp-ax" style="width:3.0%;--d:0.25s"></i></span><span class="hp-v">10 cr</span></div></div></section><section><h2>Créditos por mudança</h2><div class="hp-c"><div class="hp-b"><span class="hp-r" title="mostrar-saldo-projetado">mostrar-saldo-projetado</span><span class="hp-t"><i class="hp-ax" style="width:100.0%;--d:0.00s"></i></span><span class="hp-v">314 cr</span></div><div class="hp-b"><span class="hp-r" title="migrar-cliente-http">migrar-cliente-http</span><span class="hp-t"><i class="hp-ax" style="width:86.1%;--d:0.05s"></i></span><span class="hp-v">271 cr</span></div><div class="hp-b"><span class="hp-r" title="corrigir-filtro-periodo">corrigir-filtro-periodo</span><span class="hp-t"><i class="hp-ax" style="width:41.0%;--d:0.10s"></i></span><span class="hp-v">129 cr</span></div><div class="hp-b"><span class="hp-r" title="(sem)">(sem)</span><span class="hp-t"><i class="hp-ax" style="width:13.6%;--d:0.15s"></i></span><span class="hp-v">43 cr</span></div></div></section><section><h2>Agentes por sessão</h2><div class="hp-c"><div class="hp-b"><span class="hp-r" title="hwk-implement">hwk-implement</span><span class="hp-t"><i class="hp-ax" style="width:100.0%;--d:0.00s"></i></span><span class="hp-v">10</span></div><div class="hp-b"><span class="hp-r" title="hwk-implementador">hwk-implementador</span><span class="hp-t"><i class="hp-ax" style="width:90.0%;--d:0.05s"></i></span><span class="hp-v">9</span></div><div class="hp-b"><span class="hp-r" title="hwk-plan">hwk-plan</span><span class="hp-t"><i class="hp-ax" style="width:60.0%;--d:0.10s"></i></span><span class="hp-v">6</span></div><div class="hp-b"><span class="hp-r" title="hwk-review">hwk-review</span><span class="hp-t"><i class="hp-ax" style="width:60.0%;--d:0.15s"></i></span><span class="hp-v">6</span></div><div class="hp-b"><span class="hp-r" title="hwk-gf-design">hwk-gf-design</span><span class="hp-t"><i class="hp-ax" style="width:30.0%;--d:0.20s"></i></span><span class="hp-v">3</span></div><div class="hp-b"><span class="hp-r" title="hwk-gf-prontidao">hwk-gf-prontidao</span><span class="hp-t"><i class="hp-ax" style="width:30.0%;--d:0.25s"></i></span><span class="hp-v">3</span></div><div class="hp-b"><span class="hp-r" title="hwk-gf-spec">hwk-gf-spec</span><span class="hp-t"><i class="hp-ax" style="width:30.0%;--d:0.30s"></i></span><span class="hp-v">3</span></div><div class="hp-b"><span class="hp-r" title="hwk-gf-padroes">hwk-gf-padroes</span><span class="hp-t"><i class="hp-ax" style="width:30.0%;--d:0.35s"></i></span><span class="hp-v">3</span></div><div class="hp-b"><span class="hp-r" title="hwk-gf-plantao">hwk-gf-plantao</span><span class="hp-t"><i class="hp-ax" style="width:30.0%;--d:0.40s"></i></span><span class="hp-v">3</span></div><div class="hp-b"><span class="hp-r" title="hwk-archive">hwk-archive</span><span class="hp-t"><i class="hp-ax" style="width:30.0%;--d:0.45s"></i></span><span class="hp-v">3</span></div></div></section><section><h2>Guardas que negaram</h2><div class="hp-c"><div class="hp-b"><span class="hp-r" title="mapa antes de busca">mapa antes de busca</span><span class="hp-t"><i class="hp-ax" style="width:100.0%;--d:0.00s"></i></span><span class="hp-v">3</span></div><div class="hp-b"><span class="hp-r" title="veredito ou archive imutável">veredito ou archive imutável</span><span class="hp-t"><i class="hp-ax" style="width:33.3%;--d:0.05s"></i></span><span class="hp-v">1</span></div><div class="hp-b"><span class="hp-r" title="prompt do peixinho fora do pacote">prompt do peixinho fora do pacote</span><span class="hp-t"><i class="hp-ax" style="width:33.3%;--d:0.10s"></i></span><span class="hp-v">1</span></div></div></section></div>
<section><h2>Modelos · política × uso × preço</h2><div class="hp-c"><p class="hp-mcab"><span>Política de org:banco-exemplo, obtida em 08/11/2026 · uso dos últimos 30 dias</span>
<span class="hp-chips"><span class="hp-pill hp-pill--ok">4 liberado(s)</span><span class="hp-pill hp-pill--info">3 usado(s)</span><span class="hp-pill hp-pill--crit">1 com alerta grave</span></span></p><div class="hp-tab"><table><thead><tr><th>Modelo</th><th>Política</th><th class="n">Sessões</th><th class="n">Créditos</th><th>Preço</th><th>Atenção</th></tr></thead><tbody><tr><td><code>gpt-5-mini</code><br><small class="hp-sub">GPT-5 mini</small></td><td><span class="hp-pill hp-pill--off">bloqueado</span></td><td class="n">3</td><td class="n">24,8</td><td>gpt-5-mini</td><td class="hp-al"><span><span class="hp-pill hp-pill--crit">grave</span> usado, mas bloqueado na política (lista desatualizada ou acesso por time)</span></td></tr><tr><td><code>grok-code-fast-2</code><br><small class="hp-sub">Grok Code Fast 2</small></td><td><span class="hp-pill hp-pill--ok">liberado</span></td><td class="n">0</td><td class="n">0,0</td><td><span class="hp-pill hp-pill--warn">sem preço</span></td><td class="hp-al"><span><span class="hp-pill hp-pill--warn">atenção</span> liberado sem preço na tabela</span><span><span class="hp-pill hp-pill--info">info</span> liberado, sem uso no período</span></td></tr><tr><td><code>claude-sonnet-5</code><br><small class="hp-sub">Claude Sonnet 5</small></td><td><span class="hp-pill hp-pill--ok">liberado</span></td><td class="n">22</td><td class="n">490,9</td><td>claude-sonnet-5</td><td class="hp-al">—</td></tr><tr><td><code>claude-opus-5</code><br><small class="hp-sub">Claude Opus 5</small></td><td><span class="hp-pill hp-pill--ok">liberado</span></td><td class="n">11</td><td class="n">240,7</td><td>claude-opus-5</td><td class="hp-al">—</td></tr><tr><td><code>gpt-5.5</code><br><small class="hp-sub">GPT-5.5</small></td><td><span class="hp-pill hp-pill--ok">liberado</span></td><td class="n">0</td><td class="n">0,0</td><td>gpt-5.5</td><td class="hp-al"><span><span class="hp-pill hp-pill--info">info</span> liberado, sem uso no período</span></td></tr><tr><td><code>claude-haiku-4.5</code><br><small class="hp-sub">Claude Haiku 4.5</small></td><td><span class="hp-pill hp-pill--off">bloqueado</span></td><td class="n">0</td><td class="n">0,0</td><td>claude-haiku-4.5</td><td class="hp-al">—</td></tr><tr><td><code>gemini-3.6-flash</code><br><small class="hp-sub">Gemini 3.6 Flash</small></td><td><span class="hp-pill hp-pill--warn">opcional</span></td><td class="n">0</td><td class="n">0,0</td><td>gemini-3.6-flash</td><td class="hp-al">—</td></tr></tbody></table></div></div></section>
<section><h2>Sessões recentes</h2><div class="hp-c"><div class="hp-tab"><table><thead><tr><th>Início</th><th>Repo</th><th>Branch</th><th>Ticket</th><th>Mudança</th><th>Fase</th><th class="n">Tokens</th><th class="n">Créditos</th><th>Mapa antes</th></tr></thead><tbody><tr><td>06/11 14:03</td><td>extrato-mfe</td><td><code>feature/EXT-2041-saldo-projetado</code></td><td>EXT-2041</td><td>mostrar-saldo-projetado</td><td>Archive</td><td class="n">102.018</td><td class="n">16,9</td><td>sim</td></tr><tr><td>05/11 17:05</td><td>extrato-mfe</td><td><code>fix/EXT-2050</code></td><td>EXT-2050</td><td>—</td><td>fora do fluxo</td><td class="n">20.306</td><td class="n">3,0</td><td>—</td></tr><tr><td>05/11 09:32</td><td>extrato-mfe</td><td><code>feature/EXT-2041-saldo-projetado</code></td><td>EXT-2041</td><td>mostrar-saldo-projetado</td><td>Archive</td><td class="n">158.732</td><td class="n">22,0</td><td>sim</td></tr><tr><td>04/11 17:05</td><td>extrato-mfe</td><td><code>fix/EXT-2050</code></td><td>EXT-2050</td><td>—</td><td>fora do fluxo</td><td class="n">334.679</td><td class="n">8,0</td><td>—</td></tr><tr><td>04/11 14:01</td><td>extrato-mfe</td><td><code>feature/EXT-2041-saldo-projetado</code></td><td>EXT-2041</td><td>mostrar-saldo-projetado</td><td>Revisão</td><td class="n">43.570</td><td class="n">22,0</td><td>sim</td></tr><tr><td>04/11 09:30</td><td>extrato-mfe</td><td><code>feature/EXT-2041-saldo-projetado</code></td><td>EXT-2041</td><td>mostrar-saldo-projetado</td><td>Implementação</td><td class="n">147.072</td><td class="n">21,0</td><td>sim</td></tr><tr><td>03/11 14:09</td><td>extrato-mfe</td><td><code>feature/EXT-2041-saldo-projetado</code></td><td>EXT-2041</td><td>mostrar-saldo-projetado</td><td>Implementação</td><td class="n">206.424</td><td class="n">26,0</td><td>sim</td></tr><tr><td>02/11 09:38</td><td>extrato-mfe</td><td><code>feature/EXT-2041-saldo-projetado</code></td><td>EXT-2041</td><td>mostrar-saldo-projetado</td><td>Implementação</td><td class="n">343.148</td><td class="n">47,0</td><td>sim</td></tr><tr><td>30/10 17:05</td><td>extrato-mfe</td><td><code>main</code></td><td>—</td><td>—</td><td>fora do fluxo</td><td class="n">41.241</td><td class="n">5,0</td><td>—</td></tr><tr><td>30/10 14:07</td><td>extrato-bff</td><td><code>feature/EXT-2041-saldo-projetado</code></td><td>EXT-2041</td><td>mostrar-saldo-projetado</td><td>Implementação</td><td class="n">184.268</td><td class="n">27,0</td><td>sim</td></tr><tr><td>29/10 14:05</td><td>extrato-mfe</td><td><code>feature/EXT-2041-saldo-projetado</code></td><td>EXT-2041</td><td>mostrar-saldo-projetado</td><td>Plano</td><td class="n">62.900</td><td class="n">24,0</td><td>sim</td></tr><tr><td>29/10 09:36</td><td>extrato-bff</td><td><code>feature/EXT-2041-saldo-projetado</code></td><td>EXT-2041</td><td>mostrar-saldo-projetado</td><td>Implementação</td><td class="n">160.841</td><td class="n">28,3</td><td>não</td></tr></tbody></table></div></div></section>
<p class="hp-rod">Tendência de uso, não ranking de pessoas. Nenhum prompt, resposta ou comando é gravado. Custo é valor de lista: o plano do Copilot inclui créditos, então não é desembolso.</p>
</div></div>
      </div>

      <div class="leitura">
        <h3>Como ler o painel</h3>
        <dl class="leitura__dl">
          <div><dt>Números do topo</dt><dd>Sessões, créditos a valor de lista, tokens com a parcela lida de cache, quanto do fluxo consultou o mapa antes de buscar e quanto custo ficou sem ticket.</dd></div>
          <div><dt>Orçamentos</dt><dd>A trilha vai até 125% do orçamento, para o estouro aparecer. Os tracejados marcam 50%, 80% e 100%. O aviso sai no início da sessão; nada é bloqueado.</dd></div>
          <div><dt>Por dia e acumulado</dt><dd>O dia de maior consumo fica em laranja. O acumulado mostra a mudança com orçamento e atividade mais recente, sessão a sessão, com o ponto em que cada aviso disparou.</dd></div>
          <div><dt>Modelos</dt><dd>Política do Copilot × uso dos últimos 30 dias × preço. Grave: modelo usado sem preço (custo zero) ou usado mas bloqueado. A lista vem de <code>hwk modelos atualizar</code>.</dd></div>
          <div><dt>Por fase, modelo, ticket e mudança</dt><dd>A fase vem do agente selecionado na sessão, registrado pelo hook do agente, porque o OpenTelemetry não grava o nome de custom agent.</dd></div>
          <div><dt>Guardas e sessões</dt><dd>Quantas vezes cada guarda negou, e as últimas sessões. "Mapa antes" só vale para sessões do fluxo.</dd></div>
        </dl>
      </div>
    </section>

    <!-- ============================================================ PACOTE (REAL) -->
    <section class="secao" id="pacote" aria-labelledby="pac-t">
      <div class="secao__cab">
        <p class="eyebrow">O pacote v0.1.2 · dados reais</p>
        <h2 id="pac-t">O que vai na máquina e o que vai para o Git</h2>
        <p>Regra em markdown custa token toda vez que carrega; regra em código custa zero. Por isso os portões mecânicos estão em scripts, e os agentes ficam curtos.</p>
      </div>

      <div class="graficos">
        <figure class="grafico">
          <figcaption>Linhas por script (Node 20+, sem dependência)</figcaption>
          <div class="hbarras">
            <div class="hbarra" style="--v:100.0"><span class="hbarra__r"><code>hwk.mjs</code> núcleo</span><span class="hbarra__b"></span><span class="hbarra__v">822</span></div>
            <div class="hbarra" style="--v:86.6"><span class="hbarra__r"><code>henrimap.mjs</code> mapa</span><span class="hbarra__b"></span><span class="hbarra__v">712</span></div>
            <div class="hbarra" style="--v:75.2"><span class="hbarra__r"><code>verificar.mjs</code></span><span class="hbarra__b"></span><span class="hbarra__v">618</span></div>
            <div class="hbarra" style="--v:62.0"><span class="hbarra__r"><code>instalar.mjs</code></span><span class="hbarra__b"></span><span class="hbarra__v">510</span></div>
            <div class="hbarra" style="--v:58.8"><span class="hbarra__r"><code>uso.mjs</code> painel</span><span class="hbarra__b"></span><span class="hbarra__v">483</span></div>
            <div class="hbarra" style="--v:37.2"><span class="hbarra__r"><code>lib/comum.mjs</code></span><span class="hbarra__b"></span><span class="hbarra__v">306</span></div>
            <div class="hbarra" style="--v:32.6"><span class="hbarra__r"><code>lib/validar.mjs</code></span><span class="hbarra__b"></span><span class="hbarra__v">268</span></div>
            <div class="hbarra" style="--v:28.2"><span class="hbarra__r"><code>hook.mjs</code></span><span class="hbarra__b"></span><span class="hbarra__v">232</span></div>
            <div class="hbarra" style="--v:22.4"><span class="hbarra__r"><code>modelos.mjs</code> política</span><span class="hbarra__b"></span><span class="hbarra__v">184</span></div>
            <div class="hbarra" style="--v:21.2"><span class="hbarra__r"><code>lib/modelos.mjs</code></span><span class="hbarra__b"></span><span class="hbarra__v">174</span></div>
          </div>
        </figure>

        <figure class="grafico">
          <figcaption>73 arquivos no pacote · 1 vai para o Git a cada mudança</figcaption>
          <div class="quadros" role="img" aria-label="72 quadrados cinza e 1 laranja: só o registro em conhecimento/ é commitado.">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i class="q--git"></i>
          </div>
          <ul class="quadros__leg">
            <li><i class="q q--local"></i> local, em <code>.git/info/exclude</code>: <code>.henriworks/</code>, agentes, skills, hook, bloco do AGENTS.md</li>
            <li><i class="q q--git"></i> <code>conhecimento/&lt;data&gt;-&lt;slug&gt;.md</code>, commitado por você na branch da PR</li>
          </ul>
        </figure>
      </div>

      <div class="tabela-wrap">
        <table class="tabela">
          <caption>Estado de cada parte</caption>
          <thead><tr><th scope="col">Parte</th><th scope="col">Estado</th><th scope="col">Por quê</th></tr></thead>
          <tbody>
            <tr><td>Agentes, fases, portões, validador, verificador</td><td><span class="pill pill--ok">estável</span></td><td>portado do HenriSpec 0.4.5, testado ponta a ponta</td></tr>
            <tr><td>Revisão isolada por subagente</td><td><span class="pill pill--ok">estável</span></td><td>confirme na sua máquina com o canário</td></tr>
            <tr><td>Mapa L1, L2 e L3</td><td><span class="pill pill--ok">estável</span></td><td>usa o compilador do próprio projeto quando existe</td></tr>
            <tr><td>Uso e custo</td><td><span class="pill pill--warn">experimental</span></td><td>o formato do OTel do Copilot ainda muda entre versões</td></tr>
            <tr><td>Hooks e guardas</td><td><span class="pill pill--warn">experimental</span></td><td>falham abertos: erro ou ausência não trava a sessão</td></tr>
            <tr><td>Conferência do prompt literal</td><td><span class="pill pill--off">desligada</span></td><td>liga com <code>hwk canario aplicar</code></td></tr>
            <tr><td>Trava de arquivo entre fatias</td><td><span class="pill pill--off">desligada</span></td><td>o padrão é cartão de decisão, nunca bloqueio</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ============================================================ CASOS -->
    <section class="secao" id="casos" aria-labelledby="casos-t">
      <div class="secao__cab">
        <p class="eyebrow">Casos de uso</p>
        <h2 id="casos-t">Que rota cada pedido toma</h2>
      </div>

      <div class="casos">
        <nav class="casos__abas" aria-label="Casos de uso"><a class="aba" href="#caso-contrato">Contrato MFE ↔ BFF</a><a class="aba" href="#caso-bug">Bug do Jira</a><a class="aba" href="#caso-figma">Tela do Figma</a><a class="aba" href="#caso-refactor">Refactor amplo</a><a class="aba" href="#caso-simples">Pedido simples</a><a class="aba" href="#caso-henrispec">Repo com HenriSpec</a></nav>

        <article class="caso" id="caso-contrato" data-titulo="Contrato MFE ↔ BFF">
          <h3>Feature que muda o contrato entre MFE e BFF</h3>
          <p class="rota-chips"><span>hwk</span><span>hwk-grill</span><span>hwk-plan · Full</span><span>hwk-review spec · 5 estágios</span><span>hwk-implement</span><span>hwk-review</span><span>hwk-archive</span></p>
          <dl class="caso__dl">
            <div><dt>Por que Full</dt><dd>Mudança de contrato entre camadas é gatilho obrigatório de rigor Full, com <code>design.md</code>.</dd></div>
            <div><dt>Contrato</dt><dd>MFE e BFF mantêm cada um a sua cópia do OpenAPI e geram o próprio cliente. O peixinho de design aponta artefato compartilhado entre camadas como bloqueante.</dd></div>
            <div><dt>Sai</dt><dd>Fatia de contrato primeiro; depois BFF e MFE em paralelo, porque o <code>Toca:</code> é disjunto.</dd></div>
          </dl>
        </article>

        <article class="caso" id="caso-bug" data-titulo="Bug do Jira">
          <h3>Bug que chegou por ticket do Jira</h3>
          <p class="rota-chips"><span>hwk</span><span>hwk-triagem</span><span>hwk-plan · Lite</span><span>hwk-review spec · 2</span><span>hwk-implement</span><span>hwk-review</span><span>hwk-archive</span></p>
          <dl class="caso__dl">
            <div><dt>Entrada</dt><dd><code>/hwk-triagem</code> com caminho, <code>#file</code> ou o texto do ticket. O briefing descreve o sintoma, nunca a solução.</dd></div>
            <div><dt>Ticket</dt><dd>A chave vai em <code>Ticket:</code> na proposta, ou sai do nome da branch. É ela que liga uso e custo à task.</dd></div>
            <div><dt>Sai</dt><dd>Fatia com teste que reproduz o defeito; o eixo plantão confere o raio de impacto.</dd></div>
          </dl>
        </article>

        <article class="caso" id="caso-figma" data-titulo="Tela do Figma">
          <h3>Tela nova a partir de um frame do Figma</h3>
          <p class="rota-chips"><span>hwk-plan</span><span>fatia · Executor: design-to-code</span><span>hwk conferir-toca</span><span>hwk-review</span></p>
          <dl class="caso__dl">
            <div><dt>Contrato</dt><dd>O link do frame vai em <code>## Ponteiros</code> da fatia, como pede o <code>executores.json</code>. Nenhum prompt muda.</dd></div>
            <div><dt>Se faltar</dt><dd>Agente ou MCP do Figma ausente: o coordenador para e diz qual falta. Nunca troca em silêncio pelo executor padrão.</dd></div>
            <div><dt>Sai</dt><dd>A saída passa pelo mesmo <code>conferir-toca</code> e pela mesma revisão de código de qualquer fatia.</dd></div>
          </dl>
        </article>

        <article class="caso" id="caso-refactor" data-titulo="Refactor amplo">
          <h3>Refactor que quebra muitos chamadores</h3>
          <p class="rota-chips"><span>henrimap affected</span><span>hwk-plan</span><span>expandir</span><span>migrar em lotes</span><span>contrair</span></p>
          <dl class="caso__dl">
            <div><dt>Dimensão</dt><dd><code>henrimap affected</code> lista quem depende do que vai mudar, inclusive o front que chama o endpoint.</dd></div>
            <div><dt>Fatias</dt><dd>Prefactor na sua própria fatia; uma fatia por lote de migração; a contração por último.</dd></div>
            <div><dt>Sai</dt><dd>Cada lote demonstrável e revisável sozinho, sem um diff gigante.</dd></div>
          </dl>
        </article>

        <article class="caso" id="caso-simples" data-titulo="Pedido simples">
          <h3>Pedido simples</h3>
          <p class="rota-chips"><span>agente padrão</span><span>direto</span></p>
          <dl class="caso__dl">
            <div><dt>Quando</dt><dd>Teste quebrado, documentação, configuração, lint, texto, correção pequena em poucos arquivos.</dd></div>
            <div><dt>Como</dt><dd>Sem briefing nem mudança. O bloco do AGENTS.md sugere o HenriWorks uma vez, sem bloquear, só quando o pedido cresce.</dd></div>
            <div><dt>Sai</dt><dd>O trabalho, sem cerimônia.</dd></div>
          </dl>
        </article>

        <article class="caso" id="caso-henrispec" data-titulo="Repo com HenriSpec">
          <h3>Repositório que já usa o HenriSpec</h3>
          <p class="rota-chips"><span>uma branch, um harness</span><span>/hwk-adotar</span></p>
          <dl class="caso__dl">
            <div><dt>Regra</dt><dd>Branch com mudança aberta em <code>.sdd/changes/</code> continua no HenriSpec. Nenhum agente <code>hwk-*</code> cria mudança nela.</dd></div>
            <div><dt>Legado</dt><dd><code>.sdd/specs</code> e <code>.sdd/decisoes</code> são lidos só como consulta. <code>/hwk-adotar</code> copia uma vez, depois de mostrar o plano.</dd></div>
            <div><dt>Sai</dt><dd>Os dois instaladores convivem: locks, blocos do AGENTS.md e do exclude separados.</dd></div>
          </dl>
        </article>
      </div>
    </section>

    <!-- ============================================================ INSTALAR -->
    <section class="secao" id="instalar" aria-labelledby="inst-t">
      <div class="secao__cab">
        <p class="eyebrow">Instalar</p>
        <h2 id="inst-t">Três comandos, nesta ordem</h2>
        <p>Descompacte o <code>henriworks-v0.1.2.zip</code> fora do repositório. Nada é instalado por npm e nada usa rede.</p>
      </div>
      <ol class="passos">
        <li class="passo">
          <h3>Valide a máquina</h3>
          <p>Cria um repositório temporário, instala, percorre o fluxo inteiro e apaga tudo. Esperado: <code>20/20 passos ok</code>.</p>
          <div class="cod vs vs--term"><div class="vs__painel-abas"><span class="is-on">TERMINAL</span><span class="vs__painel-d">powershell</span></div><pre><span class="saida__cmd" aria-hidden="true">PS C:\src\extrato-mfe&gt; </span><code>node C:\caminho\henriworks-v0.1.2\testes\smoke.mjs</code></pre><button class="copiar" type="button">Copiar</button></div>
        </li>
        <li class="passo">
          <h3>Instale no repositório</h3>
          <p>Da raiz do repositório. Use <code>--dry-run</code> antes para ver o plano sem escrever nada.</p>
          <div class="cod vs vs--term"><div class="vs__painel-abas"><span class="is-on">TERMINAL</span><span class="vs__painel-d">powershell</span></div><pre><span class="saida__cmd" aria-hidden="true">PS C:\src\extrato-mfe&gt; </span><code>node C:\caminho\henriworks-v0.1.2\instalar.mjs repo .</code></pre><button class="copiar" type="button">Copiar</button></div>
        </li>
        <li class="passo">
          <h3>Rode o canário</h3>
          <p>Prova que o revisor não recebe a conversa e que os hooks rodam. Recarregue o VS Code, abra um chat novo no agente <code>hwk-review</code> e envie a palavra-código.</p>
          <div class="cod vs vs--term"><div class="vs__painel-abas"><span class="is-on">TERMINAL</span><span class="vs__painel-d">powershell</span></div><pre><span class="saida__cmd" aria-hidden="true">PS C:\src\extrato-mfe&gt; </span><code>node .henriworks/bin/hwk.mjs canario preparar</code></pre><button class="copiar" type="button">Copiar</button></div>
        </li>
      </ol>
      <p class="rodape-inst">Documentação completa em <code>.henriworks/docs/README.md</code> depois de instalar.</p>
    </section>
  </main>

  <footer class="rodape">
    <div class="rodape__in">
      <span>HenriWorks Engineering Harness 0.1.2</span>
      <span>Copilot no VS Code · Node 20+ · sem dependência</span>
    </div>
  </footer>
</body>
</html>
