// Tela 6: Resumos — navegação por mês + drill-down para semanas + críticos em aberto
const { useState: useStateRes, useMemo: useMemoRes, useEffect: useEffectRes } = React;

const RES_TODAY = new Date(2026, 4, 12);
const RES_MONTHS_LONG = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const RES_MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

const resIsoDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const resParseDate = (s) => {
  const [d, m, rest] = s.split('/');
  const [year, time] = rest.split(' ');
  const [hh, mm] = (time || '00:00').split(':');
  return new Date(+year, +m - 1, +d, +hh, +mm);
};
const resAddDays = (d, n) => { const r = new Date(d); r.setDate(d.getDate() + n); return r; };
const resStartOfWeek = (d) => { const r = new Date(d); const offset = (r.getDay() + 6) % 7; r.setDate(d.getDate() - offset); r.setHours(0,0,0,0); return r; };
const resDaysBetween = (a, b) => Math.floor((b - a) / (1000*60*60*24));
const resFmtShort = (d) => `${String(d.getDate()).padStart(2,'0')} ${RES_MONTHS_SHORT[d.getMonth()]}`;
const resFmtLong = (d) => d.toLocaleDateString('pt-BR', { day:'numeric', month:'long' });

function ResumosScreen({ onOpenParecer, participantsByParecer = {}, pareceres, onReopenRequest, onShareAnalysis, onNotifyGroup }) {
  const allPareceres = pareceres || window.PARECERES;
  const [search, setSearch] = useStateRes('');
  const [searchOpen, setSearchOpen] = useStateRes(false);
  const [filterArea, setFilterArea] = useStateRes('all');
  const [filterCrit, setFilterCrit] = useStateRes('all');
  const [filterStatus, setFilterStatus] = useStateRes('all');
  const [selectedWeek, setSelectedWeek] = useStateRes(() => resIsoDate(resStartOfWeek(RES_TODAY)));
  const [critCollapsed, setCritCollapsed] = useStateRes(true);
  const [critExpanded, setCritExpanded] = useStateRes(false);
  const [cursor, setCursor] = useStateRes(new Date(RES_TODAY.getFullYear(), RES_TODAY.getMonth(), 1));
  const [frequency, setFrequency] = useStateRes('semanal');
  const [freqModalOpen, setFreqModalOpen] = useStateRes(false);
  const [critSort, setCritSort] = useStateRes('oldest'); // 'oldest' | 'newest'

  const pareceresByDate = useMemoRes(() => {
    const map = {};
    allPareceres.forEach(p => {
      const dt = resParseDate(p.date);
      (map[resIsoDate(dt)] = map[resIsoDate(dt)] || []).push(p);
    });
    return map;
  }, [allPareceres]);

  const isUserCreated = (p) => p.isNew || p.isUserCreated || p.sharedWithMe || (typeof p.id === 'string' && p.id.startsWith('new-'));
  const applyFilters = (items) => {
    return items.filter(p => {
      if (filterArea === 'meus' && !isUserCreated(p)) return false;
      if (filterArea !== 'all' && filterArea !== 'meus' && (p.group !== filterArea || isUserCreated(p))) return false;
      if (filterCrit === 'critical' && !(p.criticality === 'critical' && !p.pathRisk)) return false;
      if (filterCrit === 'path' && !p.pathRisk) return false;
      if (filterCrit === 'informative' && p.criticality !== 'informative') return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.subject.toLowerCase().includes(q) && !p.summary.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  };

  const criticalOpen = useMemoRes(() => {
    return allPareceres
      .filter(p => p.criticality === 'critical')
      .filter(p => {
        if (filterArea === 'all') return true;
        if (filterArea === 'meus') return isUserCreated(p);
        return p.group === filterArea && !isUserCreated(p);
      })
      .sort((a, b) => {
        const diff = resParseDate(a.date) - resParseDate(b.date);
        return critSort === 'newest' ? -diff : diff;
      });
  }, [allPareceres, filterArea, critSort]);

  const months = useMemoRes(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    return [{ year: y, month: m, key: `${y}-${String(m+1).padStart(2,'0')}` }];
  }, [cursor]);

  const getMonthMeta = (year, month) => {
    const items = [];
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    let d = new Date(first);
    while (d <= last) {
      (pareceresByDate[resIsoDate(d)] || []).forEach(p => items.push(p));
      d = resAddDays(d, 1);
    }
    const filtered = applyFilters(items);
    const crit = filtered.filter(p => !p.pathRisk && p.criticality === 'critical').length;
    const path = filtered.filter(p => p.pathRisk).length;
    const weeks = new Set();
    filtered.forEach(p => weeks.add(resIsoDate(resStartOfWeek(resParseDate(p.date)))));
    return { total: filtered.length, totalRaw: items.length, crit, path, weeksCount: weeks.size, items: filtered };
  };

  const getWeeksOfMonth = (year, month) => {
    const out = [];
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    let w = resStartOfWeek(first);
    while (w <= last) {
      out.push(w);
      w = resAddDays(w, 7);
    }
    return out;
  };

  const getWeekMeta = (start) => {
    const end = resAddDays(start, 6);
    const items = [];
    let d = new Date(start);
    while (d <= end) {
      (pareceresByDate[resIsoDate(d)] || []).forEach(p => items.push(p));
      d = resAddDays(d, 1);
    }
    const filtered = applyFilters(items);
    const crit = filtered.filter(p => !p.pathRisk && p.criticality === 'critical').length;
    const path = filtered.filter(p => p.pathRisk).length;
    const dominant = crit > 0 ? 'critical' : path > 0 ? 'path' : (filtered.length > 0 ? 'info' : 'empty');
    return { total: filtered.length, crit, path, dominant, items: filtered, start, end };
  };

  const searchResults = useMemoRes(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allPareceres
      .filter(p => p.subject.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q))
      .map(p => {
        const dt = resParseDate(p.date);
        const wkStart = resStartOfWeek(dt);
        return { p, dt, weekStart: wkStart, monthKey: `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}` };
      })
      .sort((a, b) => b.dt - a.dt);
  }, [allPareceres, search]);

  const monthMatchCount = useMemoRes(() => {
    const map = {};
    searchResults.forEach(r => { map[r.monthKey] = (map[r.monthKey] || 0) + 1; });
    return map;
  }, [searchResults]);

  const goToResult = (r) => {
    setCursor(new Date(r.dt.getFullYear(), r.dt.getMonth(), 1));
    setSelectedWeek(resIsoDate(r.weekStart));
    setSearchOpen(false);
  };

  const hasActiveFilter = filterArea !== 'all' || filterCrit !== 'all' || filterStatus !== 'all';

  const renderCritCard = (p) => {
    const dt = resParseDate(p.date);
    const wk = resStartOfWeek(dt);
    const wkEnd = resAddDays(wk, 6);
    const ageDays = resDaysBetween(dt, RES_TODAY);
    const ageBand = ageDays > 90 ? 'stale' : 'fresh';
    return (
      <div key={p.id} className="rv-critical-card">
        <div className={`rv-critical-card__age rv-critical-card__age--${ageBand}`}>
          <I.AlertOctagon size={11}/>
          Aberto há {ageDays} dias · Semana de {resFmtLong(wk)} a {resFmtLong(wkEnd)}
        </div>
        <div className="doc" onClick={() => onOpenParecer && onOpenParecer(p)} style={{cursor:'pointer'}}>
          <div className="doc__head">
            <div className="doc__subject">{p.subject}</div>
            <div className="doc__head-right">
              {p.pathRisk ? <window.PathBadge/> : <CritBadge kind={p.criticality}/>}
              <window.StatusPill status={p.status}/>
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
          <div className="doc__actions" onClick={e => e.stopPropagation()}>
            <button className="icon-btn" title="Acompanhar"><I.Bookmark size={14}/></button>
            <button className="icon-btn" title="Reclassificar"><I.Refresh size={14}/></button>
            <window.Dropdown
              trigger={<button className="icon-btn" title="Mais"><I.MoreHorizontal size={14}/></button>}
              items={[
                { icon: <I.Users size={14}/>, label: 'Compartilhar análise' },
                { icon: <I.Send size={14}/>, label: 'Notificar grupo' },
              ]}/>
            <span className="doc__actions-spacer"></span>
            <button className="doc__open" onClick={() => onOpenParecer && onOpenParecer(p)}>Abrir análise <I.ChevronRight size={14}/></button>
          </div>
        </div>
      </div>
    );
  };

  const renderDocCard = (p) => {
    const concluded = p.status === 'concluida';
    const isUC = isUserCreated(p);
    const creationDateShort = (() => {
      try { const d = resParseDate(p.date); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; } catch (e) { return ''; }
    })();
    const createdByLabel = isUC && p.sharedWithMe
      ? `Criada por ${p.createdByName || p.senderName || 'colega'} em ${creationDateShort}`
      : isUC
        ? `Criada por você em ${creationDateShort}`
        : null;
    return (
      <div key={p.id} className={`doc ${concluded ? 'doc--concluded-rv' : ''}`}>
        <div className="doc__head">
          <div className="doc__subject">{p.subject}</div>
          <div className="doc__head-right">
            {p.pathRisk ? <window.PathBadge/> : <CritBadge kind={p.criticality}/>}
            <window.StatusPill status={p.status}/>
            <window.ParticipantStack participants={participantsByParecer[p.id]} shared={(participantsByParecer[p.id]||[]).length > 0}/>
            <span className="doc__time">{p.date}</span>
          </div>
        </div>
        {createdByLabel ? (
          <div className="doc__meta">
            <I.User size={12}/>
            <span className="doc__meta-strong">{createdByLabel}</span>
          </div>
        ) : (
          <div className="doc__meta">
            <I.Mail size={12}/>
            <span className="doc__meta-strong">{p.senderName}</span>
            <span className="doc__meta-sep">·</span>
            <span>{p.sender}</span>
          </div>
        )}
        <div className="doc__summary">{p.summary}</div>
        {p.justification && (
          <div className="doc__just">
            <span className="doc__just-label">Justificativa</span>
            <span>{p.justification}</span>
          </div>
        )}
        <div className="doc__actions">
          {concluded ? (
            <button className="icon-btn" title="Reabrir" onClick={() => onReopenRequest && onReopenRequest(p)}>
              <I.RotateCcw size={14}/>
            </button>
          ) : (
            <>
              <button className="icon-btn" title="Acompanhar"><I.Bookmark size={14}/></button>
              <button className="icon-btn" title="Reclassificar"><I.Refresh size={14}/></button>
              <window.Dropdown
                trigger={<button className="icon-btn" title="Mais"><I.MoreHorizontal size={14}/></button>}
                items={[
                  { icon: <I.Users size={14}/>, label: 'Compartilhar análise', onClick: () => onShareAnalysis && onShareAnalysis(p) },
                  { icon: <I.Send size={14}/>, label: 'Notificar grupo', onClick: () => onNotifyGroup && onNotifyGroup(p) },
                ]}/>
            </>
          )}
          <span className="doc__actions-spacer"></span>
          <button className="doc__open" onClick={() => onOpenParecer && onOpenParecer(p)}>Abrir análise <I.ChevronRight size={14}/></button>
        </div>
        {concluded && p.concludedBy && p.concludedAt && (
          <div className="doc__concluded-by">
            <I.Check size={11}/>
            Concluído por <strong>{p.concludedBy}</strong> em {p.concludedAt}
          </div>
        )}
      </div>
    );
  };

  const visibleCritOpen = critExpanded ? criticalOpen : criticalOpen.slice(0, 3);

  return (
    <div className="page">
      {/* Filtros + busca */}
      <div className="resumos-toolbar">
        <div className="resumos-toolbar__filters">
          <select className={`select-input ${filterCrit !== 'all' ? 'select-input--active' : ''}`} value={filterCrit} onChange={e => setFilterCrit(e.target.value)}>
            <option value="all">Classificação</option>
            <option value="critical">Críticos</option>
            <option value="path">Em caminho crítico</option>
            <option value="informative">Informativos</option>
          </select>
          <select className={`select-input ${filterStatus !== 'all' ? 'select-input--active' : ''}`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Status</option>
            <option value="aguardando">Em aberto</option>
            <option value="em_analise">Em análise</option>
            <option value="notificada">Notificada</option>
            <option value="concluida">Concluída</option>
          </select>
          <select className={`select-input ${filterArea !== 'all' ? 'select-input--active' : ''}`} value={filterArea} onChange={e => setFilterArea(e.target.value)}>
            <option value="all">Área</option>
            {Object.values(window.GROUPS).map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
          {hasActiveFilter && (
            <button className="rv-icon-btn" style={{width:'auto',padding:'0 12px',fontSize:12,fontWeight:500,color:'var(--color-primary)'}}
              onClick={() => { setFilterArea('all'); setFilterCrit('all'); setFilterStatus('all'); }}>
              Limpar
            </button>
          )}
        </div>
        <div className="resumos-toolbar__right">
          <div className="resumos-search" style={{position:'relative'}}>
            <I.Search size={14}/>
            <input
              placeholder="Buscar em todo o projeto..."
              value={search}
              onChange={e => { setSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}/>
            {search && <button onClick={() => { setSearch(''); setSearchOpen(false); }} style={{border:0,background:'transparent',cursor:'pointer',color:'var(--color-text-tertiary)'}}><I.X size={13}/></button>}
            {searchOpen && search.trim() && searchResults.length > 0 && (
              <div className="rv-search-tray">
                <div className="rv-search-tray__head">{searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} em {Object.keys(monthMatchCount).length} mês{Object.keys(monthMatchCount).length !== 1 ? 'es' : ''}</div>
                {searchResults.map((r, i) => {
                  const q = search.trim();
                  const idx = r.p.subject.toLowerCase().indexOf(q.toLowerCase());
                  const titleHtml = idx >= 0
                    ? r.p.subject.slice(0, idx) + `<mark>${r.p.subject.slice(idx, idx + q.length)}</mark>` + r.p.subject.slice(idx + q.length)
                    : r.p.subject;
                  const userBadge = r.p.sharedWithMe
                    ? { label: 'Compartilhada comigo', cls: 'rv-search-result__tag--shared' }
                    : (r.p.isUserCreated || r.p.isNew || (typeof r.p.id === 'string' && r.p.id.startsWith('new-')))
                      ? { label: 'Criada por mim', cls: 'rv-search-result__tag--mine' }
                      : null;
                  return (
                    <button key={i} className="rv-search-result" onClick={() => goToResult(r)}>
                      <div className="rv-search-result__title-row">
                        <div className="rv-search-result__title" dangerouslySetInnerHTML={{__html: titleHtml}}/>
                        {userBadge && <span className={`rv-search-result__tag ${userBadge.cls}`}>{userBadge.label}</span>}
                      </div>
                      <div className="rv-search-result__snippet">{r.p.summary.slice(0, 120)}…</div>
                      <div className="rv-search-result__meta">
                        <I.Calendar size={11}/>
                        {RES_MONTHS_LONG[r.dt.getMonth()]} de {r.dt.getFullYear()} · semana de {resFmtShort(r.weekStart)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button className="rv-icon-btn" title={`Frequência: ${frequency === 'diario' ? 'Diário' : 'Semanal'}`} onClick={() => setFreqModalOpen(true)}>
            <I.Settings size={14}/>
          </button>
        </div>
      </div>

      {/* Críticos identificados */}
      <div className={`rv-critical ${critCollapsed ? 'rv-critical--collapsed' : ''}`}>
        <div className="rv-critical__head">
          <div className="rv-critical__icon">
            <I.AlertOctagon size={16}/>
          </div>
          <div className="rv-critical__body">
            <div className="rv-critical__title">Críticos detectados pelo @meris</div>
            <div className="rv-critical__sub">
              Pareceres que o @meris classificou como críticos à luz das cláusulas contratuais. Ficam consolidados aqui no topo, independente da semana de origem, para você não perder nada urgente.
            </div>
            <div className="rv-critical__count">
              {criticalOpen.length === 0 ? 'Nenhum crítico detectado no período.' :
                `${criticalOpen.length} crítico${criticalOpen.length > 1 ? 's' : ''} no período`}
            </div>
          </div>
          {criticalOpen.length > 0 && !critCollapsed && (
            <button className="rv-critical__sort"
              onClick={(e) => { e.stopPropagation(); setCritSort(v => v === 'oldest' ? 'newest' : 'oldest'); }}
              title={`Ordenar: ${critSort === 'oldest' ? 'mais antigos primeiro' : 'mais recentes primeiro'}`}>
              <I.ChevronDown size={12} style={{transform: critSort === 'newest' ? 'rotate(180deg)' : 'none'}}/>
              {critSort === 'oldest' ? 'Mais antigos' : 'Mais recentes'}
            </button>
          )}
          {criticalOpen.length > 0 && (
            <button className="rv-critical__toggle" onClick={() => setCritCollapsed(v => !v)} title={critCollapsed ? 'Expandir' : 'Recolher'} aria-label={critCollapsed ? 'Expandir' : 'Recolher'}>
              <I.ChevronDown size={16} style={{transform: critCollapsed ? 'none' : 'rotate(180deg)', transition: 'transform 150ms ease'}}/>
            </button>
          )}
        </div>

        {!critCollapsed && criticalOpen.length === 0 && (
          <div className="empty empty--compact empty--success" style={{margin:'8px 18px 16px',background:'#F0FDF4',borderColor:'#BBF7D0'}}>
            <div className="empty__icon"><I.Check size={24}/></div>
            <div className="empty__title">Nenhum crítico detectado</div>
            <div className="empty__sub">Bom trabalho. Não há críticos pendentes no momento.</div>
          </div>
        )}

        {!critCollapsed && criticalOpen.length > 0 && (
          <div className="rv-critical__body">
            {visibleCritOpen.map(renderCritCard)}
            {criticalOpen.length > 3 && (
              <button className="rv-critical__see-all" onClick={() => setCritExpanded(v => !v)}>
                {critExpanded ? `Mostrar apenas os 3 mais antigos` : `Ver todos (${criticalOpen.length})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navegação por mês */}
      <div className="rv-year-nav">
        <button className="rv-icon-btn" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))} title="Mês anterior"><I.ChevronLeft size={14}/></button>
        <div className="rv-year-nav__title" style={{textTransform:'capitalize'}}>
          {RES_MONTHS_LONG[cursor.getMonth()]} de {cursor.getFullYear()}
        </div>
        <button className="rv-icon-btn" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))} title="Próximo mês"><I.ChevronRight size={14}/></button>
        <button className="rv-year-nav__latest" onClick={() => {
          setCursor(new Date(RES_TODAY.getFullYear(), RES_TODAY.getMonth(), 1));
          setSelectedWeek(resIsoDate(resStartOfWeek(RES_TODAY)));
        }}>Mês atual</button>
      </div>

      {months.map(m => {
        const meta = getMonthMeta(m.year, m.month);
        const isEmpty = meta.totalRaw === 0;
        const matchCount = monthMatchCount[m.key];
        const weeks = !isEmpty ? getWeeksOfMonth(m.year, m.month) : [];
        const selectedWeekInThisMonth = !isEmpty && selectedWeek && weeks.some(w => resIsoDate(w) === selectedWeek);
        const selectedWeekDate = selectedWeek ? new Date(selectedWeek + 'T00:00:00') : null;
        const selectedWeekMeta = selectedWeekInThisMonth ? getWeekMeta(selectedWeekDate) : null;

        return (
          <div key={m.key} className={`rv-month rv-month--expanded ${isEmpty ? 'rv-month--empty' : ''}`}>
            <div className="rv-month__head">
              <div className="rv-month__title-wrap">
                <div className="rv-month__name">
                  <span>{RES_MONTHS_LONG[m.month]} de {m.year}</span>
                  {matchCount > 0 && <span className="rv-month__search-tag">{matchCount} resultado{matchCount > 1 ? 's' : ''}</span>}
                </div>
                {isEmpty && <div className="rv-month__summary">Sem resumos neste mês.</div>}
              </div>
              {!isEmpty && (
                <div className="area-card__stats">
                  <span className="area-stat"><strong>{meta.weeksCount}</strong> resumo{meta.weeksCount > 1 ? 's' : ''}</span>
                  <span className="area-stat__sep">·</span>
                  <span className="area-stat"><strong>{meta.total}</strong> parecer{meta.total !== 1 ? 'es' : ''}</span>
                  <span className="area-stat__sep">·</span>
                  <span className={`area-stat ${meta.path > 0 ? 'area-stat--path' : 'area-stat--muted'}`}><strong>{meta.path}</strong> em caminho crítico</span>
                  <span className="area-stat__sep">·</span>
                  <span className={`area-stat ${meta.crit > 0 ? 'area-stat--critical' : 'area-stat--muted'}`}><strong>{meta.crit}</strong> crítico{meta.crit !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {!isEmpty && (() => {
              const renderWeekContent = (wMeta) => (
                <div className="rv-week-content">
                  {(() => {
                    const groupKey = (p) => (p.isNew || p.isUserCreated || (typeof p.id === 'string' && p.id.startsWith('new-'))) ? 'meus' : p.group;
                    const grouped = {};
                    wMeta.items.forEach(p => { const k = groupKey(p); (grouped[k] = grouped[k] || []).push(p); });
                    const entries = Object.entries(grouped).sort(([ka,a],[kb,b]) => {
                      if (ka === 'meus') return 1;
                      if (kb === 'meus') return -1;
                      const ca = a.filter(p => p.pathRisk || p.criticality === 'critical').length;
                      const cb = b.filter(p => p.pathRisk || p.criticality === 'critical').length;
                      return cb - ca;
                    });
                    return entries.map(([gid, items]) => {
                      const group = window.GROUPS[gid];
                      const Icon = I[group.icon] || I.Folders;
                      const groupOnPath = items.filter(p => p.pathRisk).length;
                      const groupCrit = items.filter(p => !p.pathRisk && p.criticality === 'critical').length;
                      return (
                        <div key={gid} className="area-card">
                          <div className="area-card__head">
                            <div className="area-card__left">
                              <span className="area-card__avatar"><Icon size={18}/></span>
                              <div className="area-card__main">
                                <div className="area-card__name">{group.label}</div>
                                <div className="area-card__sub"><span className="area-card__sub--mono">{group.email}</span></div>
                              </div>
                            </div>
                            <div className="area-card__stats">
                              <span className="area-stat"><strong>{items.length}</strong> pareceres</span>
                              <span className="area-stat__sep">·</span>
                              <span className={`area-stat ${groupOnPath > 0 ? 'area-stat--path' : 'area-stat--muted'}`}><strong>{groupOnPath}</strong> em caminho crítico</span>
                              <span className="area-stat__sep">·</span>
                              <span className={`area-stat ${groupCrit > 0 ? 'area-stat--critical' : 'area-stat--muted'}`}><strong>{groupCrit}</strong> crítico{groupCrit !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <div className="area-card__list">
                            {items.map(renderDocCard)}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              );

              return (
                <div className="rv-month__body">
                  <div className="rv-weeks">
                    {weeks.map(w => {
                      const wMeta = getWeekMeta(w);
                      const isActive = resIsoDate(w) === selectedWeek;
                      const isEmptyWeek = wMeta.total === 0;
                      return (
                        <React.Fragment key={resIsoDate(w)}>
                          <button
                            className={`rv-week-pill ${isActive ? 'rv-week-pill--active' : ''}`}
                            disabled={isEmptyWeek}
                            onClick={() => setSelectedWeek(isActive ? null : resIsoDate(w))}>
                            <span className={`rv-week-pill__dot rv-week-pill__dot--${wMeta.dominant === 'empty' ? 'info' : wMeta.dominant}`}></span>
                            <span className="rv-week-pill__label">Semana de {resFmtShort(w)} a {resFmtShort(resAddDays(w, 6))}</span>
                            <span className="rv-week-pill__stats">
                              {isEmptyWeek ? 'sem resumo' :
                                <><strong>{Math.round(wMeta.total * 35)}</strong> e-mails · <strong>{wMeta.total}</strong> pareceres
                                  {wMeta.path > 0 && <> · <strong style={{color:'var(--color-warning-text)'}}>{wMeta.path}</strong> caminho</>}
                                  {wMeta.crit > 0 && <> · <strong style={{color:'var(--color-danger-text)'}}>{wMeta.crit}</strong> crítico{wMeta.crit > 1 ? 's' : ''}</>}
                                </>}
                            </span>
                            {!isEmptyWeek && (
                              <I.ChevronDown size={14} className={`rv-week-pill__chevron ${isActive ? 'rv-week-pill__chevron--open' : ''}`}/>
                            )}
                          </button>
                          {isActive && !isEmptyWeek && renderWeekContent(wMeta)}
                        </React.Fragment>
                      );
                    })}
                  </div>

                </div>
              );
            })()}
          </div>
        );
      })}

      {/* Modal de frequência */}
      {freqModalOpen && (() => {
        const FreqModal = () => {
          const [draft, setDraft] = React.useState(frequency);
          const nextCycle = draft === 'diario' ? 'amanhã às 8h' : 'segunda-feira às 8h';
          const canSave = draft !== frequency;
          return (
            <div className="modal__scrim fadein" onClick={() => setFreqModalOpen(false)}>
              <div className="modal modal--sm" onClick={e => e.stopPropagation()} style={{maxWidth:460}}>
                <div className="modal__header">
                  <div className="modal__title-row"><I.Settings size={16}/><div className="modal__title">Frequência dos resumos</div></div>
                  <div className="modal__sub">Define com que frequência o @meris gera novos resumos das comunicações.</div>
                </div>
                <div className="modal__body">
                  <div className="onboard-freq__cards">
                    {[
                      { id: 'diario', title: 'Diário', desc: 'Todo dia útil pela manhã.' },
                      { id: 'semanal', title: 'Semanal', desc: 'Toda segunda-feira pela manhã.' },
                    ].map(opt => (
                      <button key={opt.id}
                        className={`onboard-freq__card ${draft === opt.id ? 'onboard-freq__card--active' : ''}`}
                        onClick={() => setDraft(opt.id)}>
                        <div className="onboard-freq__head">
                          <I.Calendar size={15}/>
                          <span className="onboard-freq__name">{opt.title}</span>
                          {frequency === opt.id && <span className="freq-current-tag">Atual</span>}
                        </div>
                        <div className="onboard-freq__desc">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  <div className="freq-warning">
                    <I.AlertTriangle size={12}/>
                    A alteração vale a partir do próximo ciclo. Resumos passados mantêm a frequência original.
                  </div>
                </div>
                <div className="modal__footer">
                  <button className="btn btn--ghost" onClick={() => setFreqModalOpen(false)}>Cancelar</button>
                  <button className="btn btn--primary" disabled={!canSave}
                    onClick={() => { setFrequency(draft); setFreqModalOpen(false); }}>
                    Confirmar alteração
                  </button>
                </div>
              </div>
            </div>
          );
        };
        return <FreqModal/>;
      })()}
    </div>
  );
}

window.ResumosScreen = ResumosScreen;
