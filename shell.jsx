// MERIS app shell: rail + sub-nav + topbar
const { useState } = React;

function Shell({ activeScreen, setActiveScreen, children, title, crumbs, hideSubNav, customSubNav }) {
  const counts = window.PARECERES.reduce((acc, p) => {
    if (p.criticality === 'critical') acc.critical++;
    else acc.informative++;
    if (p.starred) acc.starred++;
    return acc;
  }, { critical: 0, informative: 0, starred: 0 });

  const [monitoringOpen, setMonitoringOpen] = useState(true);

  return (
    <div className="app">
      {/* Module rail */}
      <aside className="rail">
        <div className="rail__top">
          <div className="rail__mark" title="MERIS">M</div>
        </div>
        <div className="rail__modules">
          <div className="rail__group">
            <button className="rail__item" title="Procurement"><I.ShoppingBag size={16}/></button>
            <button className="rail__item" title="Planejamento"><I.Activity size={16}/></button>
            <button className="rail__item" title="Engenharia"><I.HardHat size={16}/></button>
            <button className="rail__item rail__item--disabled" title="Suprimentos (Em breve)" disabled><I.Truck size={16}/></button>
            <button className="rail__item rail__item--disabled" title="C&M (Em breve)" disabled><I.Wrench size={16}/></button>
            <button className="rail__item rail__item--active" title="Gestão Contratual"><I.BookOpenText size={16}/></button>
            <button className="rail__item" title="Qualidade"><I.FlaskConical size={16}/></button>
            <button className="rail__item" title="Comissionamento"><I.PackageCheck size={16}/></button>
          </div>
          <div className="rail__divider"></div>
          <div className="rail__group">
            <button className="rail__item" title="Documentos"><I.Folders size={16}/></button>
            <button className="rail__item" title="Ativos"><I.Locate size={16}/></button>
          </div>
        </div>
        <div className="rail__footer">
          <button className="rail__item" title="Suporte"><I.Life size={16}/></button>
          <button className="rail__item" title="Ajuda"><I.Help size={16}/></button>
          <button className="rail__item" title="Configurações" onClick={() => setActiveScreen('config')}><I.Settings size={16}/></button>
          <div className="rail__avatar" title="Ana Perrejil">AP</div>
        </div>
      </aside>

      {/* Sub-nav */}
      {!hideSubNav && (customSubNav || (
        <nav className="subnav">
          <div className="subnav__head">
            <div className="subnav__title">Gestão Contratual</div>
            <button className="subnav__collapse" title="Recolher menu"><I.PanelRightOpen size={16}/></button>
          </div>

          <div className="subnav__body">
            <button
              className={`subnav__parent ${activeScreen === 'feed' ? 'subnav__parent--active' : ''}`}
              onClick={() => { setActiveScreen('feed'); setMonitoringOpen(true); }}>
              <span className="subnav__parent-left">
                <I.FileChartLine size={16}/>
                <span>Feed</span>
              </span>
              <span
                className={`subnav__chev ${monitoringOpen ? 'subnav__chev--open' : ''}`}
                onClick={(e) => { e.stopPropagation(); setMonitoringOpen(v => !v); }}>
                <I.ChevronDown size={16}/>
              </span>
            </button>

            {monitoringOpen && (
              <div className="subnav__children">
                <button
                  className={`subnav__child ${activeScreen === 'acomp' || activeScreen === 'subchat' ? 'subnav__child--active' : ''}`}
                  onClick={() => setActiveScreen('acomp')}>
                  <span className="subnav__leaf"/>
                  <span className="subnav__child-label">Análises em aberto</span>
                </button>
                <button
                  className={`subnav__child ${activeScreen === 'resumos' ? 'subnav__child--active' : ''}`}
                  onClick={() => setActiveScreen('resumos')}>
                  <span className="subnav__leaf"/>
                  <span className="subnav__child-label">Resumos periódicos</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      ))}

      {/* Main */}
      <main className="main">
        <div className="topbar">
          <div className="topbar__left">
            <nav className="topbar__breadcrumb" aria-label="Breadcrumb">
              <button className="topbar__breadcrumb-home" title="Início"><I.Home size={16}/></button>
              {(crumbs || []).map((c, i) => (
                <React.Fragment key={i}>
                  <I.ChevronRight size={14} className="topbar__breadcrumb-sep"/>
                  <span className={i === crumbs.length - 1 ? 'topbar__breadcrumb-page' : 'topbar__breadcrumb-module'}>{c}</span>
                </React.Fragment>
              ))}
            </nav>
          </div>
          <div className="topbar__right">
            <button className="org-chip" title="Organização">
              <I.Building2 size={16}/>
              <span>Coodex</span>
              <I.ChevronsUpDown size={14} className="org-chip__indicator"/>
            </button>
            <button className="notif-btn" title="Notificações">
              <I.Bell size={18}/>
              <span className="notif-btn__badge">12</span>
            </button>
            <button className="notif-btn" title="Idioma"><I.Globe size={18}/></button>
          </div>
        </div>
        <div className="scroll">{children}</div>
      </main>
    </div>
  );
}

window.Shell = Shell;

// ──────────────────────────────────────────────────────────────────────────
// Top-level App: routes between the 7 screens, owns parecer + modal state.
// ──────────────────────────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = React.useState('feed');           // feed | acomp | subchat | resumos | config
  const [pareceres, setPareceres] = React.useState(window.PARECERES);
  const [activeParecerId, setActiveParecerId] = React.useState(null);
  const [feedViewState, setFeedViewState] = React.useState('normal');
  const [modal, setModal] = React.useState(null);                // null | 'notify' | 'formal' | 'concludeAnalysis' | 'onboarding'
  const [toast, setToast] = React.useState(null);
  const [completedIds, setCompletedIds] = React.useState({});    // ids of pareceres whose sub-chat was concluded
  const [resumoFrequency, setResumoFrequency] = React.useState('semanal');
  const [reclassifyTarget, setReclassifyTarget] = React.useState(null); // parecer being reclassified
  const [shareTarget, setShareTarget] = React.useState(null);      // parecer whose share modal is open
  const [notifyTarget, setNotifyTarget] = React.useState(null);    // parecer whose notify-group modal is open
  const [concludeTarget, setConcludeTarget] = React.useState(null); // parecer whose conclude modal is open (from list view)
  const [reopenTarget, setReopenTarget] = React.useState(null);     // parecer whose reopen-confirm modal is open
  const [removeParticipantTarget, setRemoveParticipantTarget] = React.useState(null); // { parecerId, participant }
  const [restrictedAccess, setRestrictedAccess] = React.useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('restricted')) {
        return { sharedBy: params.get('sharedBy') || params.get('restrictedBy') || '' };
      }
    } catch (e) {}
    return null;
  });
  const [participantsByParecer, setParticipantsByParecer] = React.useState({
    p2: [
      { id: 'u1', name: 'Carlos Mendes', role: 'Engenharia' },
      { id: 'u2', name: 'Fernanda Lima', role: 'Planejamento' },
    ],
    p8: [
      { id: 'u3', name: 'Daniela Souza', role: 'Jurídico' },
      { id: 'u4', name: 'Roberto Pinto', role: 'Comercial' },
      { id: 'u5', name: 'Mariana Castro', role: 'Diretoria' },
      { id: 'u6', name: 'Eduardo Lopes', role: 'Engenharia' },
    ],
  });
  const [reclassifyHistory, setReclassifyHistory] = React.useState({}); // { [parecerId]: [{from,to,reason,note,at}] }

  const activeParecer = pareceres.find(p => p.id === activeParecerId)
    || window.PARECERES.find(p => p.id === activeParecerId);

  const openParecer = (p) => { setActiveParecerId(p.id); setScreen('subchat'); };
  const goBackToFeed = () => { setScreen('feed'); setActiveParecerId(null); };

  const startNewAnalysis = () => {
    const id = `new-${Date.now()}`;
    const stub = {
      id,
      isNew: true,
      isUserCreated: true,
      criticality: null,
      pathRisk: null,
      starred: true,
      status: 'aguardando',
      group: 'producao',
      senderName: 'Você',
      sender: '',
      date: new Date().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).replace(',', ''),
      subject: 'Nova análise',
      summary: '',
      justification: '',
      references: [],
    };
    setPareceres(prev => [stub, ...prev]);
    setActiveParecerId(id);
    setScreen('subchat');
  };

  const confirmReclassify = ({ to, reason, note }) => {
    const target = reclassifyTarget;
    if (!target) return;
    const from = target.pathRisk ? 'path' : (target.criticality === 'critical' ? 'critical' : 'informative');
    setPareceres(prev => prev.map(x => {
      if (x.id !== target.id) return x;
      if (to === 'critical')    return { ...x, criticality: 'critical',    pathRisk: null };
      if (to === 'path')        return { ...x, criticality: 'critical',    pathRisk: 'critical' };
      /* informative */         return { ...x, criticality: 'informative', pathRisk: null };
    }));
    setReclassifyHistory(prev => ({
      ...prev,
      [target.id]: [...(prev[target.id] || []), { from, to, reason, note, at: new Date().toISOString() }],
    }));
    setReclassifyTarget(null);
    const label = to === 'critical' ? 'Crítico' : to === 'path' ? 'Em caminho crítico' : 'Informativo';
    showToast(`Parecer reclassificado. Obrigada por ensinar o @meris.`);
  };

  const confirmShare = (selectedUsers) => {
    const target = shareTarget;
    if (!target) return;
    setParticipantsByParecer(prev => ({
      ...prev,
      [target.id]: [...(prev[target.id] || []), ...selectedUsers.filter(u => !(prev[target.id] || []).some(x => x.id === u.id))],
    }));
    setPareceres(prev => prev.map(x => x.id === target.id && !['notificada','concluida'].includes(x.status) ? { ...x, status: 'em_analise' } : x));
    setShareTarget(null);
    showToast(selectedUsers.length === 1 ? `${selectedUsers[0].name} adicionado ao chat.` : `${selectedUsers.length} pessoas adicionadas ao chat.`);
  };

  const markStatus = (parecerId, newStatus) => {
    const priority = { aguardando: 0, em_analise: 1, notificada: 2, concluida: 3 };
    setPareceres(prev => prev.map(x => {
      if (x.id !== parecerId) return x;
      if ((priority[newStatus] || 0) >= (priority[x.status] || 0)) return { ...x, status: newStatus };
      return x;
    }));
  };

  const showToast = (text, kind = 'success') => {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 4000);
  };

  // Per-screen meta — breadcrumb espelha a hierarquia da sidebar
  let title, crumbs, hideSubNav = false;
  if (screen === 'feed') {
    title = 'Pareceres do @meris';
    crumbs = ['Gestão Contratual', 'Feed'];
  } else if (screen === 'acomp') {
    title = 'Em acompanhamento';
    crumbs = ['Gestão Contratual', 'Feed', 'Análises em aberto'];
  } else if (screen === 'subchat' && activeParecer) {
    title = 'Análise aprofundada';
    const subj = activeParecer.subject?.length > 40 ? activeParecer.subject.slice(0, 40) + '…' : activeParecer.subject;
    crumbs = ['Gestão Contratual', 'Feed', 'Análises em aberto', subj];
  } else if (screen === 'resumos') {
    title = 'Resumos periódicos';
    crumbs = ['Gestão Contratual', 'Feed', 'Resumos periódicos'];
  } else if (screen === 'config') {
    title = 'Configurações do meta-modelo';
    crumbs = ['Gestão Contratual', 'Configurações'];
  }

  return (
    <>
      <Shell
        activeScreen={screen}
        setActiveScreen={setScreen}
        title={title}
        crumbs={crumbs}
        hideSubNav={hideSubNav}>

        {screen === 'feed' && (
          <window.FeedScreen
            pareceres={pareceres}
            setPareceres={setPareceres}
            onOpenParecer={openParecer}
            onReclassify={(p) => setReclassifyTarget(p)}
            onShareAnalysis={(p) => setShareTarget(p)}
            onNotifyGroup={(p) => setNotifyTarget(p)}
            participantsByParecer={participantsByParecer}
            resumoFrequency={resumoFrequency}/>
        )}
        {screen === 'acomp' && (
          <window.AcompScreen
            pareceres={pareceres}
            setPareceres={setPareceres}
            onOpenParecer={openParecer}
            onNewAnalysis={startNewAnalysis}
            onReclassify={(p) => setReclassifyTarget(p)}
            onShareAnalysis={(p) => setShareTarget(p)}
            onNotifyGroup={(p) => setNotifyTarget(p)}
            onConcludeRequest={(p) => setConcludeTarget(p)}
            onReopenRequest={(p) => setReopenTarget(p)}
            participantsByParecer={participantsByParecer}/>
        )}
        {screen === 'subchat' && (
          <window.SubChatScreen
            parecer={activeParecer}
            allPareceres={pareceres}
            isCompleted={!!completedIds[activeParecerId]}
            participants={participantsByParecer[activeParecerId] || []}
            reclassifyHistory={reclassifyHistory[activeParecerId] || []}
            onBack={goBackToFeed}
            onOpenModal={(kind) => setModal(kind)}
            onShareAnalysis={() => setShareTarget(activeParecer)}
            onReclassify={() => setReclassifyTarget(activeParecer)}
            onRequestComplete={() => setModal('concludeAnalysis')}
            onRemoveParticipant={(participant) => setRemoveParticipantTarget({ parecerId: activeParecerId, participant })}
            onReopen={() => {
              setCompletedIds(prev => { const n = {...prev}; delete n[activeParecerId]; return n; });
              showToast('Parecer reaberto.');
            }}/>
        )}
        {screen === 'resumos' && (
          <window.ResumosScreen
            onOpenParecer={openParecer}
            participantsByParecer={participantsByParecer}
            pareceres={pareceres}
            onReopenRequest={(p) => setReopenTarget(p)}
            onShareAnalysis={(p) => setShareTarget(p)}
            onNotifyGroup={(p) => setNotifyTarget(p)}/>
        )}
        {screen === 'config' && <window.ConfigScreen/>}
      </Shell>

      {modal === 'notify' && (
        <window.NotifyGroupModal
          parecer={activeParecer}
          onClose={() => setModal(null)}
          onSubmit={(count) => { markStatus(activeParecerId, 'notificada'); setModal(null); showToast(`Notificação enviada para ${count || 1} pessoa${(count || 1) > 1 ? 's' : ''}.`); }}/>
      )}
      {notifyTarget && (
        <window.NotifyGroupModal
          parecer={notifyTarget}
          onClose={() => setNotifyTarget(null)}
          onSubmit={(count) => { markStatus(notifyTarget.id, 'notificada'); setNotifyTarget(null); showToast(`Notificação enviada para ${count || 1} pessoa${(count || 1) > 1 ? 's' : ''}.`); }}/>
      )}
      {modal === 'formal' && (
        <window.FormalNotificationModal
          parecer={activeParecer}
          onClose={() => setModal(null)}
          onSubmit={() => { markStatus(activeParecerId, 'notificada'); setModal(null); showToast('Notificação formal nº 2026/047 emitida e arquivada no dossiê.'); }}/>
      )}
      {modal === 'concludeAnalysis' && (
        <window.ConcludeConfirmModal
          parecer={activeParecer}
          onClose={() => setModal(null)}
          onConfirm={() => {
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            setModal(null);
            setCompletedIds(prev => ({ ...prev, [activeParecerId]: true }));
            setPareceres(prev => prev.map(x => x.id === activeParecerId ? { ...x, status: 'concluida', concludedBy: 'Você', concludedAt: `${dd}/${mm}` } : x));
            showToast('Parecer concluído.');
          }}/>
      )}
      {restrictedAccess && (
        <window.RestrictedAccessModal
          sharedBy={restrictedAccess.sharedBy}
          onReturn={() => {
            setRestrictedAccess(null);
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('restricted');
              url.searchParams.delete('sharedBy');
              url.searchParams.delete('restrictedBy');
              window.history.replaceState({}, '', url.toString());
            } catch (e) {}
            showToast('Você foi redirecionado para a tela inicial do seu perfil.', 'info');
          }}/>
      )}
      {removeParticipantTarget && (
        <window.RemoveParticipantConfirmModal
          participant={removeParticipantTarget.participant}
          onClose={() => setRemoveParticipantTarget(null)}
          onConfirm={() => {
            const { parecerId, participant } = removeParticipantTarget;
            setRemoveParticipantTarget(null);
            setParticipantsByParecer(prev => ({
              ...prev,
              [parecerId]: (prev[parecerId] || []).filter(u => u.id !== participant.id),
            }));
            showToast(`${participant.name} removido do chat.`);
          }}/>
      )}
      {reopenTarget && (
        <window.ReopenConfirmModal
          parecer={reopenTarget}
          onClose={() => setReopenTarget(null)}
          onConfirm={() => {
            const id = reopenTarget.id;
            setReopenTarget(null);
            setCompletedIds(prev => { const n = {...prev}; delete n[id]; return n; });
            setPareceres(prev => prev.map(x => x.id === id ? { ...x, status: 'em_analise' } : x));
            showToast('Parecer reaberto.');
          }}/>
      )}
      {concludeTarget && (
        <window.ConcludeConfirmModal
          parecer={concludeTarget}
          onClose={() => setConcludeTarget(null)}
          onConfirm={() => {
            const id = concludeTarget.id;
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            setConcludeTarget(null);
            setCompletedIds(prev => ({ ...prev, [id]: true }));
            setPareceres(prev => prev.map(x => x.id === id ? { ...x, status: 'concluida', concludedBy: 'Você', concludedAt: `${dd}/${mm}` } : x));
            showToast('Parecer concluído.');
          }}/>
      )}
      {modal === 'onboarding' && (
        <window.OnboardingModal
          onClose={() => setModal(null)}
          onComplete={({ frequency }) => {
            setModal(null);
            setResumoFrequency(frequency);
            const label = frequency === 'diario' ? 'diária' : 'semanal';
            showToast(`Configuração concluída. Frequência de resumos definida como ${label}.`);
          }}/>
      )}
      {reclassifyTarget && (
        <window.ReclassifyModal
          parecer={reclassifyTarget}
          onClose={() => setReclassifyTarget(null)}
          onConfirm={confirmReclassify}/>
      )}
      {shareTarget && (
        <window.ShareAnalysisModal
          parecer={shareTarget}
          existingParticipants={participantsByParecer[shareTarget.id] || []}
          isOwner={!shareTarget.sharedWithMe}
          onClose={() => setShareTarget(null)}
          onConfirm={confirmShare}
          onRemoveParticipant={(participant) => setRemoveParticipantTarget({ parecerId: shareTarget.id, participant })}
          onShowToast={(t) => showToast(t)}/>
      )}
      {toast && (
        <div className={`toast toast--${toast.kind || 'success'}`}>
          <span className="toast__icon">
            {toast.kind === 'error' ? <I.AlertOctagon size={14}/> :
             toast.kind === 'warning' ? <I.AlertTriangle size={14}/> :
             toast.kind === 'info' ? <I.MessageSquare size={14}/> :
             <I.Check size={14}/>}
          </span>
          <span>{toast.text}</span>
          <button className="toast__close" onClick={() => setToast(null)}><I.X size={12}/></button>
        </div>
      )}

      {/* Re-run onboarding shortcut (always accessible bottom-left) */}
      <button className="redo-onboarding" onClick={() => setModal('onboarding')} title="Refazer onboarding">
        <I.RotateCcw size={13}/> Refazer onboarding
      </button>
    </>
  );
}

window.App = App;
