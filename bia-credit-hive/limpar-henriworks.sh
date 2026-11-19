#!/usr/bin/env bash
# Remove da máquina os restos das versões de teste (HenriWorks pelo zip, Bia Credit Atlas e a sondagem do
# plugin). Não toca no plugin bia-credit-hive instalado pelo marketplace, nem em .bchive/ (o init cuida).
#
# Git Bash, sem dependência:
#   bash limpar-henriworks.sh                          só mostra o que acharia na sua pasta de usuário
#   bash limpar-henriworks.sh ~/projetos/repo-a ...    inclui esses repositórios
#   bash limpar-henriworks.sh --procurar ~/projetos    acha os repositórios com restos dentro da pasta
#   ... --aplicar                                      apaga de verdade (sem --aplicar, nada muda)
#
# Nada aqui faz commit, push ou reset. Arquivo que o Git rastreia é só listado: remova pelo Git, com PR.
set -u
ORIG="$*"

APLICAR=0; REPOS=(); PROCURAR=()
while [ $# -gt 0 ]; do
  case "$1" in
    --aplicar) APLICAR=1 ;;
    --procurar) shift; [ $# -gt 0 ] && PROCURAR+=("$1") ;;
    -h|--help) sed -n 2,12p "$0"; exit 0 ;;
    *) REPOS+=("$1") ;;
  esac
  shift
done

ACHOU=0
acao() { ACHOU=$((ACHOU + 1)); if [ "$APLICAR" = 1 ]; then echo "  apagado   $1"; else echo "  apagaria  $1"; fi; }
apagar() { # apagar <caminho> : pasta ou arquivo
  [ -e "$1" ] || [ -L "$1" ] || return 0
  acao "$1"
  [ "$APLICAR" = 1 ] && rm -rf -- "$1"
}
rastreado() { git -C "$1" ls-files --error-unmatch -- "$2" >/dev/null 2>&1; }

# Tira um bloco entre marcadores de um arquivo; apaga o arquivo se sobrar vazio (ou só o shebang).
tirar_bloco() { # tirar_bloco <arquivo> <regex início> <regex fim> <descrição>
  local f="$1" ini="$2" fim="$3"
  [ -f "$f" ] && grep -Eq "$ini" "$f" || return 0
  acao "$f  ($4)"
  [ "$APLICAR" = 1 ] || return 0
  local tmp; tmp="$(mktemp)"
  awk -v a="$ini" -v b="$fim" '$0 ~ a {fora=1; next} fora && $0 ~ b {fora=0; next} !fora' "$f" | tr -d '\r' > "$tmp"
  if [ -z "$(grep -Ev '^[[:space:]]*$|^#!' "$tmp")" ]; then rm -f -- "$f" "$tmp"; else cat "$tmp" > "$f"; rm -f "$tmp"; fi
}

usuario() {
  echo "Pasta de usuário ($HOME)"
  local C="${COPILOT_HOME:-$HOME/.copilot}"
  apagar "$HOME/.henriworks"; apagar "$HOME/.bcatlas"; apagar "$HOME/.bchive-probe"
  for p in "$C"/agents/hwk*.agent.md "$C"/agents/bcatlas*.agent.md "$C"/skills/hwk-* "$C"/skills/bcatlas-* \
           "$C"/skills/henriworks-fluxo "$C"/skills/bcatlas-fluxo "$C"/henriworks.lock.json "$C"/bcatlas.lock.json \
           "$C"/.henriworks-backup "$C"/.bcatlas-backup; do
    [ -e "$p" ] && apagar "$p"
  done
  # Pasta de prompts do perfil do VS Code (harness Local). No Git Bash, APPDATA vem em formato Windows.
  if [ -n "${APPDATA:-}" ]; then
    local P; P="$(cygpath -u "$APPDATA" 2>/dev/null || echo "$APPDATA")/Code/User/prompts"
    for p in "$P"/hwk*.agent.md "$P"/hwk-*.prompt.md "$P"/bcatlas*.agent.md "$P"/bcatlas-*.prompt.md; do [ -e "$p" ] && apagar "$p"; done
    local S; S="$(dirname "$P")/settings.json"
    if [ -f "$S" ] && grep -q 'github.copilot.chat.otel' "$S"; then
      echo "  confira   $S: tem chaves github.copilot.chat.otel.* (se foram só para o teste, apague à mão)"
    fi
  fi
  env | grep -E '^(HENRIWORKS_|BCATLAS_|COPILOT_OTEL_)' | cut -d= -f1 | while read -r v; do
    echo "  confira   variável de ambiente $v (se foi só para o teste: Configurações do Windows › Variáveis de ambiente)"
  done
}

repositorio() {
  local R; R="$(cd "$1" 2>/dev/null && pwd)" || { echo "não achei $1"; return; }
  git -C "$R" rev-parse --git-dir >/dev/null 2>&1 || { echo "$R: não é repositório Git"; return; }
  R="$(git -C "$R" rev-parse --show-toplevel)"
  echo "Repositório $R"
  for p in .henriworks .bcatlas .bchive-probe .github/hooks/henriworks.json .github/hooks/bcatlas.json \
           .github/skills/henriworks-fluxo .github/skills/bcatlas-fluxo; do
    if rastreado "$R" "$p"; then echo "  NO GIT    $R/$p  (commitado: remova pelo Git numa PR)"; else apagar "$R/$p"; fi
  done
  for p in "$R"/.github/agents/hwk*.agent.md "$R"/.github/agents/bcatlas*.agent.md "$R"/.github/skills/hwk-* "$R"/.github/skills/bcatlas-*; do
    [ -e "$p" ] || continue
    if rastreado "$R" "${p#"$R"/}"; then echo "  NO GIT    $p  (commitado: remova pelo Git numa PR)"; else apagar "$p"; fi
  done
  for f in AGENTS.md .github/copilot-instructions.md; do
    for m in henriworks bcatlas; do
      if [ -f "$R/$f" ] && grep -q "<!-- $m:inicio -->" "$R/$f" && rastreado "$R" "$f"; then
        echo "  NO GIT    $R/$f  (bloco <!-- $m:inicio --> commitado: tire pelo Git numa PR)"
      else
        tirar_bloco "$R/$f" "<!-- $m:inicio -->" "<!-- $m:fim -->" "bloco <!-- $m:inicio -->"
      fi
    done
  done
  local G; G="$(git -C "$R" rev-parse --git-dir)"; case "$G" in /*) ;; *) G="$R/$G" ;; esac
  for m in henriworks bcatlas; do
    tirar_bloco "$G/info/exclude" "^# >>> $m" "^# <<< $m" "bloco # >>> $m"
    for h in post-checkout post-merge post-commit; do tirar_bloco "$G/hooks/$h" "^# >>> $m" "^# <<< $m" "hook do mapa"; done
  done
  local HP; HP="$(git -C "$R" config --get core.hooksPath || true)"
  if [ -n "$HP" ] && grep -rlsE 'henrimap|bcatlasmap' "$R/$HP" >/dev/null 2>&1; then
    echo "  confira   $R/$HP: hook do time (Husky?) chama henrimap/bcatlasmap; tire a linha à mão"
  fi
}

[ "$APLICAR" = 1 ] && echo "Modo: APAGANDO" || echo "Modo: prévia (nada é apagado; rode de novo com --aplicar)"
echo
usuario
for raiz in ${PROCURAR[@]+"${PROCURAR[@]}"}; do
  while IFS= read -r d; do REPOS+=("$(dirname "$d")"); done < <(find "$raiz" -maxdepth 5 \( -name node_modules -prune \) -o \( -type d \( -name .henriworks -o -name .bcatlas -o -name .bchive-probe \) -print \) 2>/dev/null)
done
VISTOS=" "
for r in ${REPOS[@]+"${REPOS[@]}"}; do
  case "$VISTOS" in *" $r "*) continue ;; esac
  VISTOS="$VISTOS$r "
  echo; repositorio "$r"
done
echo
if [ "$ACHOU" = 0 ]; then echo "Nada a limpar."
elif [ "$APLICAR" = 1 ]; then echo "$ACHOU item(ns) removido(s). Feche e abra o VS Code para ele esquecer agentes e skills antigos."
else echo "$ACHOU item(ns). Para apagar: bash $0 ${ORIG:+$ORIG }--aplicar"; fi
