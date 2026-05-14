// Tela 2: Pareceres do @meris — saudação + KPIs + grupos como cards (com cards internos detalhados)
const { useState: useStateFeed, useMemo: useMemoFeed } = React;

function FeedScreen({ pareceres, setPareceres, onOpenParecer, onReclassify, onShareAnalysis, onNotifyGroup, participantsByParecer = {}, resumoFrequency }) {
  const [kpiFilter, setKpiFilter] = useStateFeed(null);   // null | 'all' | 'path' | 'critical' | 'starred'
  const [collapsed, setCollapsed] = useStateFeed({});      // { [groupId]: boolean }

  const toggleStar = (p) => {
    setPareceres(prev => prev.map(x =>
      x.id === p.id ? { ...x, starred: !x.starred, status: !x.starred && x.status === 'aguardando' ? 'em_analise' : x.status } : x
    ));
  };
  const markSeen = (p) => {
    setPareceres(prev => prev.map(x => x.id === p.id ? { ...x, seen: !x.seen } : x));
  };
  const setFilter = (id) => setKpiFilter(prev => prev === id ? null : id);
  const toggleCollapse = (id) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  // Counts (sempre sobre o total, independente do filtro)
  const total = pareceres.length;
  const onPath = pareceres.filter(p => p.pathRisk).length;
  const critical = pareceres.filter(p => !p.pathRisk && p.criticality === 'critical').length;
  const starred = pareceres.filter(p => p.starred).length;

  // Lista filtrada conforme KPI ativo
  const filtered = useMemoFeed(() => {
    if (!kpiFilter || kpiFilter === 'all') return pareceres;
    if (kpiFilter === 'path') return pareceres.filter(p => p.pathRisk);
    if (kpiFilter === 'critical') return pareceres.filter(p => !p.pathRisk && p.criticality === 'critical');
    if (kpiFilter === 'starred') return pareceres.filter(p => p.starred);
    return pareceres;
  }, [pareceres, kpiFilter]);

  // Agrupada por área, ordenada por urgência interna
  const grouped = useMemoFeed(() => {
    const map = {};
    filtered.forEach(p => { (map[p.group] = map[p.group] || []).push(p); });
    Object.values(map).forEach(arr => arr.sort((a, b) => {
      const w = (p) => (p.pathRisk ? 0 : p.criticality === 'critical' ? 1 : 2);
      return w(a) - w(b);
    }));
    return Object.entries(map).sort(([,a],[,b]) => {
      const ca = a.filter(p => p.pathRisk || p.criticality === 'critical').length;
      const cb = b.filter(p => p.pathRisk || p.criticality === 'critical').length;
      return cb - ca;
    });
  }, [filtered]);

  // Saudação
  const frequency = resumoFrequency === 'diario' ? 'diario' : 'semanal';
  const periodLabel = frequency === 'diario' ? 'diário' : 'semanal';
  const periodSpan = frequency === 'diario' ? 'nas últimas 24h' : 'nos últimos 7 dias';
  const nextSummary = frequency === 'diario' ? 'amanhã às 8h' : 'segunda-feira';
  const firstName = 'Ana';

  const FILTER_LABELS = {
    all: 'todos os pareceres',
    path: 'em caminho crítico',
    critical: 'críticos',
    starred: 'em acompanhamento',
  };

  // Estado vazio (sem nenhum parecer ainda)
  if (total === 0) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty__icon"><I.Sparkles size={28}/></div>
          <div className="empty__title">O @meris está observando</div>
          <div className="empty__sub">
            Estou monitorando a matriz de comunicação do projeto à luz dos documentos contratuais.
            O primeiro resumo chega {frequency === 'diario' ? 'amanhã pela manhã' : 'na próxima segunda-feira'}.
          </div>
          <div className="empty__hint empty__hint--meris">
            <I.Activity size={11}/>
            Sincronizando 247 e-mails da matriz
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Saudação */}
      <div className="greet">
        <MerisAvatar size={40}/>
        <div className="greet__main">
          <div className="greet__eyebrow">Feed {periodLabel}</div>
          <div className="greet__title">Oi, {firstName}. Aqui está o que o @meris trouxe {periodSpan}.</div>
          <div className="greet__body">
            Analisei <strong>247 e-mails</strong> da matriz de comunicação e levantei <strong>{total} pareceres</strong>
            {onPath > 0 && <> · <strong>{onPath} em caminho crítico</strong></>}
            {critical > 0 && <> · <strong>{critical} crítico{critical > 1 ? 's' : ''}</strong></>}
            {(onPath > 0 || critical > 0) ? '. Sugiro começar pelos itens em destaque.' : '. Nada urgente no horizonte.'}
          </div>
          <div className="greet__period">
            <I.Calendar size={12}/>
            <span>Período: {periodSpan} · próximo resumo {nextSummary}</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        {[
          { id: 'all',      tone: 'blue',   icon: 'Inbox',         label: 'Pareceres na fila',     value: total,    chip: 'últimos 7 dias' },
          { id: 'path',     tone: 'yellow', icon: 'AlertTriangle', label: 'Em caminho crítico',    value: onPath,   chip: `de ${total}` },
          { id: 'critical', tone: 'red',    icon: 'AlertOctagon',  label: 'Críticos',              value: critical, chip: 'não atendidos' },
          { id: 'starred',  tone: 'blue',   icon: 'BookmarkFilled',label: 'Em aberto',             value: starred,  chip: 'marcados' },
        ].map(k => {
          const Icon = I[k.icon];
          const isActive = kpiFilter === k.id;
          return (
            <button
              key={k.id}
              type="button"
              className={`kpi kpi--${k.tone} ${isActive ? 'kpi--active' : ''}`}
              onClick={() => setFilter(k.id)}
              title={isActive ? 'Limpar filtro' : `Filtrar por ${k.label.toLowerCase()}`}>
              <div className="kpi__head">
                <span className="kpi__icon"><Icon size={18}/></span>
                <span className="kpi__label">{k.label}</span>
                {isActive && <I.X size={14} className="kpi__clear-icon"/>}
              </div>
              <div className="kpi__row">
                <span className="kpi__value">{k.value}</span>
                <span className="kpi__chip">{k.chip}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Grupos como cards */}
      {grouped.length === 0 && (
        <div className="empty empty--compact empty--muted" style={{marginTop:8}}>
          <div className="empty__icon"><I.Filter size={24}/></div>
          <div className="empty__title">Nenhum parecer com este filtro</div>
          <div className="empty__sub">Tente outro KPI ou limpe o filtro para ver todos os pareceres do período.</div>
        </div>
      )}
      {grouped.map(([groupId, items]) => {
        const group = window.GROUPS[groupId];
        const Icon = I[group.icon] || I.Folders;
        const groupOnPath = items.filter(p => p.pathRisk).length;
        const groupCrit = items.filter(p => !p.pathRisk && p.criticality === 'critical').length;
        const isCollapsed = !!collapsed[groupId];
        return (
          <div key={groupId} className={`area-card ${isCollapsed ? 'area-card--collapsed' : ''}`}>
            <div className="area-card__head">
              <div className="area-card__left">
                <span className="area-card__avatar"><Icon size={18}/></span>
                <div className="area-card__main">
                  <div className="area-card__name">{group.label}</div>
                  <div className="area-card__sub"><span className="area-card__sub--mono">{group.email}</span></div>
                </div>
              </div>
              <div className="area-card__stats">
                <span className="area-stat">
                  <strong>{items.length}</strong> pareceres
                </span>
                <span className="area-stat__sep">·</span>
                <span className={`area-stat ${groupOnPath > 0 ? 'area-stat--path' : 'area-stat--muted'}`}>
                  <strong>{groupOnPath}</strong> em caminho crítico
                </span>
                <span className="area-stat__sep">·</span>
                <span className={`area-stat ${groupCrit > 0 ? 'area-stat--critical' : 'area-stat--muted'}`}>
                  <strong>{groupCrit}</strong> crítico{groupCrit !== 1 ? 's' : ''}
                </span>
              </div>
              <button className={`area-card__toggle ${!isCollapsed ? 'area-card__toggle--open' : ''}`}
                onClick={() => toggleCollapse(groupId)}
                aria-expanded={!isCollapsed}
                aria-label={isCollapsed ? 'Expandir' : 'Recolher'}>
                <I.ChevronDown size={14}/>
              </button>
            </div>
            <div className="area-card__list">
              {items.map(p => (
                <div key={p.id} className={`doc ${p.seen ? 'doc--seen' : ''}`}>
                  <div className="doc__head">
                    <div className="doc__subject">{p.subject}</div>
                    <div className="doc__head-right">
                      {p.pathRisk ? <window.PathBadge/> : <CritBadge kind={p.criticality}/>}
                      {p.starred && <window.StatusPill status={p.status}/>}
                      <window.ParticipantStack participants={participantsByParecer[p.id]} shared={(participantsByParecer[p.id]||[]).length > 0}/>
                      <span className="doc__time">{p.date}</span>
                    </div>
                  </div>
                  <div className="doc__meta">
                    <I.Mail size={12}/>
                    <span className="doc__meta-strong">{p.senderName}</span>
                    <span className="doc__meta-sep">·</span>
                    <span>{p.sender}</span>
                  </div>
                  <div className="doc__summary">{p.summary}</div>
                  {p.justification && (
                    <div className="doc__just">
                      <span className="doc__just-label">Justificativa</span>
                      <span>{p.justification}</span>
                    </div>
                  )}
                  <div className="doc__actions">
                    <button className={`icon-btn ${p.starred ? 'icon-btn--starred' : ''}`}
                      title={p.starred ? 'Remover dos acompanhados' : 'Acompanhar'}
                      onClick={() => toggleStar(p)}>
                      {p.starred ? <I.BookmarkFilled size={14}/> : <I.Bookmark size={14}/>}
                    </button>
                    <button className="icon-btn" title="Reclassificar" onClick={() => onReclassify && onReclassify(p)}>
                      <I.Refresh size={14}/>
                    </button>
                    <window.Dropdown
                      trigger={<button className="icon-btn" title="Mais"><I.MoreHorizontal size={14}/></button>}
                      items={[
                        { icon: <I.Users size={14}/>, label: 'Compartilhar análise', onClick: () => onShareAnalysis && onShareAnalysis(p) },
                        { icon: <I.Send size={14}/>, label: 'Notificar grupo', onClick: () => onNotifyGroup && onNotifyGroup(p) },
                      ]}/>
                    <span className="doc__actions-spacer"></span>
                    <button className="doc__open" onClick={() => onOpenParecer(p)}>
                      Abrir análise <I.ChevronRight size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

window.FeedScreen = FeedScreen;
