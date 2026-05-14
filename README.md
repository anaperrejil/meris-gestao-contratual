# MERIS · Gestão Contratual — Protótipo navegável

Protótipo HTML/React+Babel do módulo Gestão Contratual do MERIS, vinculado ao card [PRO-52](https://linear.app/coodex-ai/issue/PRO-52/gestao-contratual-meris-monitoramento).

> Acesso ao protótipo: a `index.html` é a home do módulo. O protótipo roda inteiramente no browser (sem build) — basta abrir o link do GitHub Pages.

---

## Como rodar localmente

```bash
# qualquer servidor estático funciona; ex:
python3 -m http.server 3212
# acesse http://localhost:3212/
```

---

## Estrutura

- `index.html` — entrada do módulo (saudação, sidebar, screens)
- `shell.jsx` — App root, roteamento entre Feed / Acomp / Subchat / Resumos / Config, e orquestração dos modais
- `screen-feed.jsx` — Feed (HU-03, HU-04, HU-05)
- `screen-acomp.jsx` — Análises em aberto (HU-08, HU-09)
- `screen-resumos.jsx` — Resumos (HU-10, HU-19, HU-MR\*)
- `screen-subchat.jsx` — Chat de análise (HU-11, HU-12, HU-14, HU-15)
- `screen-config.jsx` — Configurações
- `modals.jsx` — todos os modais e painéis (HU-M\*)
- `components.jsx` — badges, status pill, dropdown, participant stack, etc.
- `data.jsx` — dados mock (`PARECERES`, `GROUPS`, `RECIPIENTS_POOL`, `PROJECT_DOCS`)
- `icons.jsx` — set de ícones Lucide-style inline
- `styles.css` — folha de estilo única
- `meris-tokens.css` — tokens de design (cores/spacing) compartilhados

Outros HTMLs (`resumos-v2.html`, `resumos-v3.html`, `resumos-v4.html`, `analises-v2.html`, etc.) são variações de exploração — não fazem parte do fluxo oficial; manter referenciados apenas como histórico de design.

---

## Mapeamento HU → onde está implementado

### Épico 1 — Onboarding e configuração
- **HU-01 · Onboarding** — `modals.jsx :: OnboardingModal` · disparado em `shell.jsx` (state `modal === 'onboarding'`)
- **HU-02 / HU-M05 · Frequência** — `screen-resumos.jsx` (ícone engrenagem no header) → modal `FreqModal` inline

### Épico 2 — Feed
- **HU-03 · Briefing** — `screen-feed.jsx` linha 86–102 (`.greet`)
- **HU-04 · Cards-filtro** — `screen-feed.jsx` linha 105–133 (`.kpis`)
- **HU-05 · Cards por área** — `screen-feed.jsx` linha 143+ (`area-card` + `.doc`)

### Épico 3 — Classificação
- **HU-06 · IA classifica** — dados mock já vêm classificados em `data.jsx`
- **HU-07 / HU-M02 · Reclassificar** — `modals.jsx :: ReclassifyModal`

### Épico 4 — Em aberto
- **HU-08 · Acompanhar (bookmark)** — `screen-feed.jsx` / `screen-acomp.jsx` ícone `Bookmark`
- **HU-09 · Ações nos cards** — em cada renderização de `.doc` (acompanhar/reclassificar/menu/abrir/concluir)

### Épico 5 — Resumos
- **HU-10 · Resumos** — `screen-resumos.jsx`
- **HU-19 · "Criadas por mim"** — `screen-resumos.jsx :: groupKey` + `data.jsx` (`isUserCreated` / `sharedWithMe`)

### Épico 6 — Análise (chat)
- **HU-11 · Abrir análise** — `screen-subchat.jsx`
- **HU-12 · Nova análise** — `shell.jsx :: startNewAnalysis` + `screen-subchat.jsx` (título editável)
- **HU-15 · Anexar GED** — `screen-subchat.jsx :: GedPickerModal` (modal compacto inline)

### Épico 7 — Compartilhamento
- **HU-13 · Compartilhar + bloqueio fora ADM** — `modals.jsx :: ShareAnalysisModal` (link, copy, bloqueio de não-ADM, modo dono/não-dono)
- **HU-14 · Chat colaborativo** — `screen-subchat.jsx` (avatar stack + popover de participantes)

### Épico 8 — Modais e painéis
- **HU-M01 · Onboarding** — `OnboardingModal`
- **HU-M02 · Reclassificação** — `ReclassifyModal`
- **HU-M03 · Compartilhar** — `ShareAnalysisModal` (com modo dono/não-dono)
- **HU-M04 · Notificar grupo** — `NotifyGroupModal` (drawer lateral direito)
- **HU-M05 · Frequência** — `FreqModal` em `screen-resumos.jsx`
- **HU-M06 · Confirmar conclusão** — `ConcludeConfirmModal`
- **HU-M07 · Reabrir** — `ReopenConfirmModal`
- **HU-M08 · Remover participante** — `RemoveParticipantConfirmModal`
- **HU-M09 · Acesso negado** — `RestrictedAccessModal` (trigger via URL `?restricted=1&sharedBy=...`)

### Épico 9 — Estados micro
- **HU-MC02 · Tags de estado** — `components.jsx :: StatusPill`
- **HU-MC03 · Indicador de concluído + "Concluído por [Nome] em DD/MM"** — `screen-resumos.jsx :: renderDocCard` + `.doc__concluded-by`
- **HU-MC04 · Faixa temporal** — `screen-resumos.jsx :: renderCritCard` (`--fresh` / `--stale`)
- **HU-MS01 · Toasts** — `shell.jsx :: showToast` (canto superior direito)
- **HU-MR01 · Recolher Críticos** — `screen-resumos.jsx` (estado `critCollapsed`)
- **HU-MR02 · Navegação meses** — `screen-resumos.jsx :: rv-year-nav`
- **HU-MR04 · Seleção de semana** — pills inline + chevron rotativo
- **HU-MR05 · Filtros (Classificação / Status / Área)** — toolbar
- **HU-MR07 · Busca global** — `searchResults` + tags "Criada por mim" / "Compartilhada comigo"

---

## Divergências entre o card e o protótipo

Mudanças solicitadas durante a sessão que divergem do texto original do PRO-52:

| Item | Spec | Protótipo |
| --- | --- | --- |
| Label de status "Aguardando" | "Aguardando" | "Em aberto" |
| Posição do grupo "Criadas por mim" | acima dos grupos por área | no final (após áreas) |
| Indicador de concluído em Resumos | faixa vertical verde + check no header + microtexto | sem faixa nem check no header, apenas microtexto "Concluído por …" |
| Filtros do cabeçalho de Resumos | Área, Classificação | Classificação, Status, Área |
| Estado vazio "Selecione uma semana" | atalhos Primeira/Última semana | removido (clique na pill já basta) |
| Nome do módulo na sidebar | "Monitoramento" | "Feed" |

Itens do card ainda pendentes ou parciais:

- **HU-M07 · Reabrir restrito ao criador** — hoje qualquer participante pode reabrir
- **HU-MC03 · faixa vertical verde + ícone de check** — removidos a pedido (só o microtexto ficou)
- **HU-15 · modal GED completo** — versão simplificada (busca + checkbox); filtros Prefixo/Tags/Local/Pasta raiz/Disciplina e paginação não implementados
- **HU-MS02 · skeletons de carregamento** — não há
- **HU-MS04 · estados de erro/indisponibilidade** — não há
- **HU-MS03 · estado vazio Resumos sem nenhum resumo** — não tratado

---

## Tokens visuais

`meris-tokens.css` define a paleta de cores, tipografia (Inter), sombras e espaçamentos. Tudo é light mode.

---

## Disparadores especiais

- `?restricted=1&sharedBy=Nome` — simula HU-M09 (acesso negado)
