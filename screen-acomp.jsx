// Tela "Em acompanhamento": pareceres favoritados (rota dedicada)
const { useState: useStateAcomp, useMemo: useMemoAcomp } = React;

function AcompScreen({ pareceres, setPareceres, onOpenParecer, onNewAnalysis, onReclassify, onShareAnalysis, onNotifyGroup, onConcludeRequest, onReopenRequest, participantsByParecer = {} }) {
  const [tab, setTab] = useStateAcomp('open'); // open | completed
  const [kpiFilter, setKpiFilter] = useStateAcomp(null);
  const [filterCrit, setFilterCrit] = useStateAcomp('all');
  const [filterStatus, setFilterStatus] = useStateAcomp('all');
  const [filterGroup, setFilterGroup] = useStateAcomp('all');
  const [filterPeriod, setFilterPeriod] = useStateAcomp(null);
  const [selected, setSelected] = useStateAcomp({});

  // Mantém parecer marcado mesmo após conclusão para histórico
  const allFollowed = pareceres.filter(p => p.starred);
  const starred = tab === 'open'
    ? allFollowed.filter(p => p.status !== 'concluida')
    : allFollowed.filter(p => p.status === 'concluida');
  const openCount = allFollowed.filter(p => p.status !== 'concluida').length;
  const completedCount = allFollowed.filter(p => p.status === 'concluida').length;

  // Aplica filtros (KPI + selects)
  const filtered = useMemoAcomp(() => {
    return starred.filter(p => {
      if (kpiFilter === 'path' && !p.pathRisk) return false;
      if (kpiFilter === 'critical' && (p.pathRisk || p.criticality !== 'critical')) return false;
      if (kpiFilter === 'aguardando' && p.status !== 'aguardando') return false;
      if (filterCrit !== 'all' && p.criticality !== filterCrit) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterGroup !== 'all' && p.group !== filterGroup) return false;
      return true;
    });
  }, [starred, kpiFilter, filterCrit, filterStatus, filterGroup, filterPeriod]);

  // KPI counts (sempre sobre starred, sem afetar pelos filtros)
  const total = starred.length;
  const onPath = starred.filter(p => p.pathRisk).length;
  const critical = starred.filter(p => !p.pathRisk && p.criticality === 'critical').length;
  const aguardandoCount = starred.filter(p => p.status === 'aguardando').length;
  const concluidosCount = completedCount;

  const setFilter = (id) => setKpiFilter(prev => prev === id ? null : id);

  const toggleSel = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  const selectedIds = Object.keys(selected).filter(k => selected[k]);

  const concludeOne = (p) => {
    setPareceres(prev => prev.map(x => x.id === p.id ? { ...x, status: 'concluida' } : x));
  };
  const concludeMany = () => {
    setPareceres(prev => prev.map(x => selected[x.id] ? { ...x, status: 'concluida' } : x));
    setSelected({});
  };
  const reopenOne = (p) => {
    setPareceres(prev => prev.map(x => x.id === p.id ? { ...x, status: 'em_analise' } : x));
  };
  const unstarOne = (p) => {
    setPareceres(prev => prev.map(x => x.id === p.id ? { ...x, starred: false } : x));
  };

  if (allFollowed.length === 0) {
    return (
      <div className="page">
        <div className="acomp-toolbar">
          <div className="acomp-toolbar__filters"></div>
          <div className="acomp-toolbar__actions">
            <button className="btn btn--primary btn--sm" onClick={onNewAnalysis}>
              <I.Plus size={14}/> Nova análise
            </button>
          </div>
        </div>
        <div className="empty">
          <div className="empty__icon"><I.Bookmark size={28}/></div>
          <div className="empty__title">Nada em acompanhamento</div>
          <div className="empty__sub">
            Marque pareceres no Feed do @meris ou em Resumos com a ação <strong>Acompanhar</strong> para vê-los aqui.
          </div>
          <div className="empty__hint empty__hint--meris">
            <I.Bookmark size={11}/>
            Pareceres em acompanhamento ficam fixos no topo
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Toolbar: filtros + botões (linha única) */}
      <div className="acomp-toolbar">
        <div className="acomp-toolbar__filters">
          <select className={`select-input ${filterCrit !== 'all' ? 'select-input--active' : ''}`} value={filterCrit} onChange={e => setFilterCrit(e.target.value)}>
            <option value="all">Classificação</option>
            <option value="critical">Críticos</option>
            <option value="informative">Informativos</option>
          </select>
          <select className={`select-input ${filterStatus !== 'all' ? 'select-input--active' : ''}`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Status</option>
            <option value="aguardando">Em aberto</option>
            <option value="em_analise">Em análise</option>
            <option value="notificada">Notificada</option>
          </select>
          <select className={`select-input ${filterGroup !== 'all' ? 'select-input--active' : ''}`} value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
            <option value="all">Área</option>
            {Object.values(window.GROUPS).map(g => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>
        <div className="acomp-toolbar__actions">
          <button className="btn btn--primary btn--sm" onClick={onNewAnalysis}>
            <I.Plus size={14}/> Nova análise
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        {[
          { id: 'all',      tone: 'blue',   icon: 'BookmarkFilled',label: 'Em aberto',          value: total,    chip: 'acompanhadas' },
          { id: 'path',     tone: 'yellow', icon: 'AlertTriangle', label: 'Em caminho crítico', value: onPath,   chip: `de ${total}` },
          { id: 'critical', tone: 'red',    icon: 'AlertOctagon',  label: 'Críticos',           value: critical, chip: 'não atendidos' },
          { id: 'concluidos', tone: 'green', icon: 'CheckCircle',  label: 'Concluídos',         value: concluidosCount, chip: 'arquivadas' },
        ].map(k => {
          const Icon = I[k.icon];
          const isActive = k.id === 'concluidos' ? tab === 'completed' : (tab === 'open' && kpiFilter === k.id);
          return (
            <button
              key={k.id}
              type="button"
              className={`kpi kpi--${k.tone} ${isActive ? 'kpi--active' : ''}`}
              onClick={() => {
                if (k.id === 'concluidos') {
                  if (isActive) { setTab('open'); setKpiFilter(null); }
                  else { setTab('completed'); setKpiFilter(null); }
                } else {
                  if (tab !== 'open') setTab('open');
                  setFilter(k.id);
                }
              }}
              title={isActive ? 'Limpar filtro' : (k.id === 'concluidos' ? 'Ver análises concluídas' : `Filtrar por ${k.label.toLowerCase()}`)}>
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

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="bulk-bar fadein">
          <span><strong>{selectedIds.length}</strong> selecionado{selectedIds.length > 1 ? 's' : ''}</span>
          <button className="btn btn--ghost btn--sm" onClick={() => setSelected({})}>Limpar seleção</button>
          <span style={{flex:1}}></span>
          <button className="btn btn--secondary btn--sm">
            <I.Send size={13}/>Notificar grupo
          </button>
          <button className="btn btn--primary btn--sm" onClick={concludeMany}>
            <I.CheckCircle size={13}/>Concluir selecionados
          </button>
        </div>
      )}

      {/* Lista de pareceres — mesmo padrão do feed */}
      <div className="acomp-list">
        {filtered.map(p => {
          const concluded = p.status === 'concluida';
          return (
            <div key={p.id} className={`doc ${concluded ? 'doc--concluded-rv' : ''}`}>
              <div className="doc__head">
                <div className="doc__subject">{p.subject}</div>
                <div className="doc__head-right">
                  {p.pathRisk ? <window.PathBadge/> : <CritBadge kind={p.criticality}/>}
                  <window.StatusPill status={p.status}/>
                  {concluded && <span className="doc__check-badge"><I.Check size={10}/> Concluído</span>}
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
                {tab === 'open' ? (
                  <>
                    <button className="icon-btn icon-btn--starred" title="Remover dos acompanhados" onClick={() => unstarOne(p)}>
                      <I.BookmarkFilled size={14}/>
                    </button>
                    <button className="icon-btn" title="Reclassificar" onClick={() => onReclassify && onReclassify(p)}>
                      <I.Refresh size={14}/>
                    </button>
                    <button className="icon-btn" title="Concluir" onClick={() => onConcludeRequest ? onConcludeRequest(p) : concludeOne(p)}>
                      <I.CheckCircle size={14}/>
                    </button>
                    <window.Dropdown
                      trigger={<button className="icon-btn" title="Mais"><I.MoreHorizontal size={14}/></button>}
                      items={[
                        { icon: <I.Users size={14}/>, label: 'Compartilhar análise', onClick: () => onShareAnalysis && onShareAnalysis(p) },
                        { icon: <I.Send size={14}/>, label: 'Notificar grupo', onClick: () => onNotifyGroup && onNotifyGroup(p) },
                      ]}/>
                  </>
                ) : (
                  <button className="icon-btn" title="Reabrir análise" onClick={() => onReopenRequest ? onReopenRequest(p) : reopenOne(p)}>
                    <I.RotateCcw size={14}/>
                  </button>
                )}
                <span className="doc__actions-spacer"></span>
                <button className="doc__open" onClick={() => onOpenParecer(p)}>
                  Abrir análise <I.ChevronRight size={14}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty empty--compact empty--muted" style={{marginTop:16}}>
          <div className="empty__icon"><I.Filter size={24}/></div>
          <div className="empty__title">Nenhum parecer corresponde aos filtros aplicados</div>
          <div className="empty__sub">Limpe os filtros acima ou volte para o feed para encontrar outros pareceres.</div>
        </div>
      )}
    </div>
  );
}

window.AcompScreen = AcompScreen;
