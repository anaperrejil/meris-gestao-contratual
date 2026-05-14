// Shared pieces: avatars, badges, parecer card, banner, pinned strip
const { useState: useState_p } = React;

function MerisAvatar({size=32}) {
  return (
    <div className="meris-avatar" style={{width:size, height:size, fontSize: size*0.4}}>
      <I.Sparkles size={size*0.5}/>
    </div>
  );
}

function CritBadge({ kind, withIcon=true }) {
  if (kind === 'critical') {
    return (
      <span className="crit-badge crit-badge--critical">
        {withIcon && <I.AlertTriangle size={11}/>}
        Crítico
      </span>
    );
  }
  if (kind === 'informative') {
    return (
      <span className="crit-badge crit-badge--informative">
        Informativo
      </span>
    );
  }
  return (
    <span className="crit-badge crit-badge--unclassified">
      Sem classificação
    </span>
  );
}

function PathBadge() {
  return (
    <span className="path-badge path-badge--critical">
      <I.AlertTriangle size={11}/>
      Em caminho crítico
    </span>
  );
}

function StatusPill({ status }) {
  const map = {
    aguardando:         { label: 'Em aberto' },
    em_analise:         { label: 'Em análise' },
    notificada:         { label: 'Notificada' },
    concluida:          { label: 'Concluída' },
  };
  const v = map[status] || map.aguardando;
  return <span className="pinned__status">{v.label}</span>;
}

function PinnedStrip({ pareceres, onToggleStar, onOpen, onComplete }) {
  if (!pareceres.length) {
    return (
      <div className="pinned">
        <div className="pinned__head">
          <span className="pinned__star"><I.Bookmark size={14}/></span>
          <div className="pinned__title">Em acompanhamento</div>
        </div>
        <div className="pinned__empty">
          Marque pareceres com a estrela para acompanhá-los aqui.
        </div>
      </div>
    );
  }
  return (
    <div className="pinned">
      <div className="pinned__head">
        <span className="pinned__star"><I.BookmarkFilled size={14}/></span>
        <div className="pinned__title">Em acompanhamento</div>
        <span className="pinned__count">{pareceres.length}</span>
      </div>
      <div className="pinned__list">
        {pareceres.map(p => (
          <div key={p.id} className="pinned__item fadein" onClick={() => onOpen(p)}>
            {p.pathRisk ? <PathBadge/> : <CritBadge kind={p.criticality} />}
            <div>
              <div className="pinned__subject">{p.subject}</div>
              <div className="pinned__meta">{window.GROUPS[p.group].label} · {p.date}</div>
            </div>
            <StatusPill status={p.status} />
            <button
              className="icon-btn"
              title="Concluir"
              onClick={(e) => { e.stopPropagation(); onComplete(p); }}>
              <I.Check size={14}/>
            </button>
            <button
              className="icon-btn icon-btn--starred"
              title="Remover dos acompanhados"
              onClick={(e) => { e.stopPropagation(); onToggleStar(p); }}>
              <I.BookmarkFilled size={14}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParecerCard({ p, onToggleStar, onOpen, onReclassify, justAdded }) {
  const group = window.GROUPS[p.group];
  const cls = p.criticality === 'critical'
    ? 'parecer--critical'
    : p.starred
      ? 'parecer--starred'
      : 'parecer--informative';

  return (
    <div className={`parecer ${cls}`}>
      <MerisAvatar />
      <div className="parecer__body">
        <div className="parecer__top">
          <span className="parecer__author">@meris</span>
          <span className="parecer__author-tag">analista contratual</span>
          {p.pathRisk ? <PathBadge/> : <CritBadge kind={p.criticality} />}
          <span className="parecer__time">{p.date}</span>
        </div>

        <div className="parecer__subject">{p.subject}</div>

        <div className="parecer__meta">
          <I.Mail size={12}/>
          <span className="parecer__meta-strong">{p.senderName}</span>
          <span className="sep">·</span>
          <span>{p.sender}</span>
          <span className="sep">·</span>
          <I.Tag size={12}/>
          <span>{group.label}</span>
        </div>

        <div className="parecer__summary">{p.summary}</div>

        <div className="parecer__justification">
          <span className="parecer__justification-label">Justificativa</span>
          <span>{p.justification}</span>
        </div>

        <div className="parecer__actions">
          <button
            className={`icon-btn ${p.starred ? 'icon-btn--starred' : ''} ${justAdded ? 'star-anim' : ''}`}
            onClick={() => onToggleStar(p)}
            title={p.starred ? 'Remover dos acompanhados' : 'Acompanhar'}>
            {p.starred ? <I.BookmarkFilled size={16}/> : <I.Bookmark size={16}/>}
          </button>
          <button className="icon-btn" title="Reclassificar" onClick={() => onReclassify && onReclassify(p)}><I.Refresh size={16}/></button>
          <button className="icon-btn" title="Marcar como visto"><I.Eye size={16}/></button>
          <button className="icon-btn" title="Mais"><I.MoreHorizontal size={16}/></button>
          <span className="parecer__actions-spacer"></span>
          <button className="btn btn--ghost btn--sm" onClick={() => onOpen(p)}>
            Abrir análise <I.ChevronRight size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function CriticalPathBanner({ kind = 'preventive', onDismiss, onFilter, active, items }) {
  const isCritical = kind === 'critical';
  return (
    <div
      className={`banner banner--clickable ${isCritical ? 'banner--critical pulse-critical' : 'banner--preventive'} ${active ? 'banner--active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onFilter && onFilter(isCritical ? 'critical' : 'preventive')}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onFilter) { e.preventDefault(); onFilter(isCritical ? 'critical' : 'preventive'); } }}>
      <div className="banner__icon">
        {isCritical ? <I.AlertOctagon size={20}/> : <I.AlertTriangle size={20}/>}
      </div>
      <div className="banner__body">
        <div className="banner__title">
          {isCritical
            ? `${items} item${items > 1 ? 's' : ''} em caminho crítico`
            : `${items} item${items > 1 ? 's' : ''} pode${items > 1 ? 'm' : ''} entrar em caminho crítico`}
        </div>
        <div className="banner__sub">
          {isCritical
            ? 'Marcos contratuais comprometidos. Clique para filtrar os pareceres correlacionados.'
            : 'Movimentos contratuais detectados podem comprometer marcos previstos. Clique para filtrar.'}
        </div>
      </div>
      <div className="banner__actions" onClick={(e) => e.stopPropagation()}>
        <button
          className={`btn btn--sm ${isCritical ? 'btn--danger' : 'btn--secondary'}`}
          onClick={() => onFilter && onFilter(isCritical ? 'critical' : 'preventive')}>
          {active ? 'Filtrando' : 'Ver pareceres'}
        </button>
        <button className="icon-btn" onClick={onDismiss} title="Dispensar"><I.X size={14}/></button>
      </div>
    </div>
  );
}

function Dropdown({ trigger, items }) {
  const [open, setOpen] = useState_p(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);
  return (
    <span className="menu-wrap" ref={ref}>
      <span onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}>{trigger}</span>
      {open && (
        <div className="menu-pop" role="menu">
          {items.map((it, i) => it.divider
            ? <div key={i} className="menu-sep"/>
            : (
              <button key={i}
                className={`menu-item ${it.danger ? 'menu-item--danger' : ''}`}
                onClick={(e) => { e.stopPropagation(); setOpen(false); it.onClick && it.onClick(); }}>
                {it.icon}
                <span>{it.label}</span>
              </button>
            ))}
        </div>
      )}
    </span>
  );
}

// ── DateRangePicker: trigger pill + popover com presets + de/até ──
const DRP_TODAY = new Date(2026, 4, 11);
const fmtDate = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
const fmtShort = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fromISO = (s) => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };

const DRP_PRESETS = [
  { id: 'thisWeek',   label: 'Esta semana' },
  { id: 'lastWeek',   label: 'Semana anterior' },
  { id: 'last4Weeks', label: 'Últimas 4 semanas' },
  { id: 'thisMonth',  label: 'Este mês' },
  { id: 'lastMonth',  label: 'Mês anterior' },
];

function presetRange(id) {
  const t = DRP_TODAY;
  if (id === 'thisWeek') {
    const start = new Date(t); start.setDate(t.getDate() - 6);
    return { start, end: new Date(t), preset: id };
  }
  if (id === 'lastWeek') {
    const end = new Date(t); end.setDate(t.getDate() - 7);
    const start = new Date(end); start.setDate(end.getDate() - 6);
    return { start, end, preset: id };
  }
  if (id === 'last4Weeks') {
    const start = new Date(t); start.setDate(t.getDate() - 27);
    return { start, end: new Date(t), preset: id };
  }
  if (id === 'thisMonth') {
    const start = new Date(t.getFullYear(), t.getMonth(), 1);
    return { start, end: new Date(t), preset: id };
  }
  if (id === 'lastMonth') {
    const start = new Date(t.getFullYear(), t.getMonth() - 1, 1);
    const end = new Date(t.getFullYear(), t.getMonth(), 0);
    return { start, end, preset: id };
  }
  return null;
}

function DateRangePicker({ value, onChange, placeholder = 'Período' }) {
  const [open, setOpen] = useState_p(false);
  const [draftStart, setDraftStart] = useState_p(value?.start ? toISO(value.start) : '');
  const [draftEnd, setDraftEnd] = useState_p(value?.end ? toISO(value.end) : '');
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  React.useEffect(() => {
    setDraftStart(value?.start ? toISO(value.start) : '');
    setDraftEnd(value?.end ? toISO(value.end) : '');
  }, [value?.start, value?.end]);

  const triggerLabel = (() => {
    if (!value || !value.start || !value.end) return placeholder;
    const p = value.preset && DRP_PRESETS.find(x => x.id === value.preset);
    if (p) return p.label;
    return `${fmtShort(value.start)} a ${fmtShort(value.end)}`;
  })();

  const isActive = !!(value && value.start && value.end);

  const applyPreset = (id) => {
    const r = presetRange(id);
    if (r) { onChange && onChange(r); setOpen(false); }
  };
  const applyCustom = () => {
    if (!draftStart || !draftEnd) return;
    const s = fromISO(draftStart);
    const e = fromISO(draftEnd);
    if (e < s) return;
    onChange && onChange({ start: s, end: e, preset: 'custom' });
    setOpen(false);
  };
  const clearRange = () => {
    onChange && onChange(null);
    setOpen(false);
  };

  return (
    <span className="drp" ref={ref}>
      <button
        type="button"
        className={`drp__trigger select-input ${isActive ? 'select-input--active' : ''}`}
        onClick={() => setOpen(v => !v)}>
        <I.Calendar size={13} style={{marginRight:6, opacity:0.7}}/>
        {triggerLabel}
      </button>
      {open && (
        <div className="drp__pop">
          <div className="drp__presets">
            {DRP_PRESETS.map(p => (
              <button key={p.id}
                className={`drp__preset ${value && value.preset === p.id ? 'drp__preset--active' : ''}`}
                onClick={() => applyPreset(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="drp__sep"></div>
          <div className="drp__custom">
            <div className="drp__custom-title">Personalizado</div>
            <div className="drp__inputs">
              <label className="drp__input-field">
                <span>De</span>
                <input type="date" value={draftStart} onChange={e => setDraftStart(e.target.value)} max={draftEnd || undefined}/>
              </label>
              <label className="drp__input-field">
                <span>Até</span>
                <input type="date" value={draftEnd} onChange={e => setDraftEnd(e.target.value)} min={draftStart || undefined}/>
              </label>
            </div>
            <div className="drp__actions">
              {isActive && <button className="drp__clear" onClick={clearRange}>Limpar</button>}
              <span style={{flex:1}}/>
              <button className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn btn--primary btn--sm" disabled={!draftStart || !draftEnd} onClick={applyCustom}>Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

window.DateRangePicker = DateRangePicker;
window.presetRange = presetRange;

// Stack de avatares para mostrar participantes compartilhados em cards
function ParticipantStack({ participants = [], max = 3, shared = false }) {
  const hasParticipants = participants && participants.length > 0;
  if (!hasParticipants && !shared) return null;
  if (!hasParticipants && shared) {
    return (
      <span className="pstack pstack--shared-only" title="Compartilhado">
        <span className="pstack__avatar pstack__avatar--icon" aria-label="Compartilhado">
          <I.Users size={11}/>
        </span>
      </span>
    );
  }
  const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  const visible = participants.slice(0, max);
  const extra = participants.length - visible.length;
  const names = participants.map(p => p.name).join(', ');
  return (
    <span className="pstack" title={`Compartilhado com: ${names}`}>
      {visible.map((u, i) => (
        <span key={u.id || i} className="pstack__avatar" style={{zIndex: max - i}}>
          {initials(u.name)}
        </span>
      ))}
      {extra > 0 && <span className="pstack__avatar pstack__avatar--more">+{extra}</span>}
    </span>
  );
}
window.ParticipantStack = ParticipantStack;

window.MerisAvatar = MerisAvatar;
window.CritBadge = CritBadge;
window.PathBadge = PathBadge;
window.StatusPill = StatusPill;
window.PinnedStrip = PinnedStrip;
window.ParecerCard = ParecerCard;
window.CriticalPathBanner = CriticalPathBanner;
window.Dropdown = Dropdown;
