// Tela 3: Sub-chat de análise aprofundada (redesign AI-native)
const { useState: useStateSub } = React;

function SubChatScreen({ parecer, allPareceres, isCompleted, participants = [], reclassifyHistory = [], onBack, onOpenModal, onShareAnalysis, onReclassify, onRequestComplete, onReopen, onRemoveParticipant }) {
  const [emailExpanded, setEmailExpanded] = useStateSub(false);
  const [composer, setComposer] = useStateSub('');
  const [messages, setMessages] = useStateSub(parecer?.isNew ? [] : [{ role: 'meris', kind: 'analysis' }]);
  const [newTitle, setNewTitle] = useStateSub('Nova análise');
  const [gedPickerOpen, setGedPickerOpen] = useStateSub(false);
  const [attachedDocs, setAttachedDocs] = useStateSub([]);
  const [participantsPopOpen, setParticipantsPopOpen] = useStateSub(false);
  const participantsRef = React.useRef(null);
  React.useEffect(() => {
    if (!participantsPopOpen) return;
    const onDoc = (e) => { if (participantsRef.current && !participantsRef.current.contains(e.target)) setParticipantsPopOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setParticipantsPopOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [participantsPopOpen]);
  const fileInputRef = React.useRef(null);
  const handleLocalFiles = (files) => {
    if (!files || !files.length) return;
    const items = [...files].map(f => ({ id: `local-${f.name}-${f.size}`, name: f.name, size: `${Math.max(1, Math.round(f.size/1024))} KB`, source: 'local' }));
    setAttachedDocs(prev => [...prev, ...items.filter(it => !prev.some(p => p.id === it.id))]);
  };

  if (!parecer) return null;
  const group = window.GROUPS[parecer.group];
  const isNew = parecer.isNew;
  const openSubchats = allPareceres.filter(p => p.starred || p.id === parecer.id).slice(0, 5);
  const isCriticalPath = parecer.pathRisk === 'critical';
  const isPossiblePath = parecer.pathRisk === 'preventive';

  const sendMessage = () => {
    if (!composer.trim()) return;
    if (isNew && messages.length === 0) {
      setMessages([
        { role: 'user', text: composer },
        { role: 'meris', kind: 'analysis-new', text: 'Recebi o contexto. Analisando à luz dos documentos do meta-modelo e do histórico do projeto…' },
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        { role: 'user', text: composer },
        { role: 'meris', kind: 'reply', text: 'Vou aprofundar a análise. Posso preparar um rascunho de notificação formal em paralelo, ou prefere primeiro discutir as referências contratuais?' },
      ]);
    }
    setComposer('');
  };

  const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  const statusLabel = parecer.pathRisk ? 'Em caminho crítico' : parecer.criticality === 'critical' ? 'Status crítico' : 'Informativo';

  return (
    <div className="subchat">
      {/* ── Coluna principal ─────────────────────────────────────────── */}
      <div className="subchat__main">

        {/* Header minimalista */}
        <div className="subchat__header">
          <div className="subchat__header-row">
            <div className="subchat__title-wrap">
              {isNew ? (
                <input
                  className="subchat__subject subchat__subject--editable"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onFocus={e => { if (e.target.value === 'Nova análise') e.target.select(); }}
                  placeholder="Nova análise"
                  aria-label="Título da análise"
                />
              ) : (
                <div className="subchat__subject">{parecer.subject}</div>
              )}
              {!isNew && (
                <div className="subchat__subtitle">
                  {parecer.pathRisk ? <window.PathBadge/> : <CritBadge kind={parecer.criticality}/>}
                  <window.StatusPill status={parecer.status}/>
                  <span>{group.label}</span>
                  <span className="subchat__subtitle-sep">·</span>
                  <span>Atualizado há 4 min</span>
                </div>
              )}
            </div>
            {participants.length > 0 && (
              <div className="participants participants-trigger" ref={participantsRef}
                title="Gerenciar participantes"
                onClick={() => setParticipantsPopOpen(v => !v)}>
                {participants.slice(0, 5).map(u => (
                  <span key={u.id} className="participant" title={`${u.name} · ${u.role || ''}`}>{initials(u.name)}</span>
                ))}
                {participants.length > 5 && (
                  <span className="participant participant--more">+{participants.length - 5}</span>
                )}
                {participantsPopOpen && (
                  <div className="participants-pop" onClick={e => e.stopPropagation()}>
                    <div className="participants-pop__head">Participantes · {participants.length}</div>
                    {participants.map(u => (
                      <div key={u.id} className="participants-pop__row">
                        <span className="participants-pop__avatar">{initials(u.name)}</span>
                        <div className="participants-pop__main">
                          <div className="participants-pop__name">{u.name}</div>
                          {u.role && <div className="participants-pop__role">{u.role}</div>}
                        </div>
                        <button className="participants-pop__remove" title={`Remover ${u.name}`} aria-label={`Remover ${u.name}`}
                          onClick={(e) => { e.stopPropagation(); setParticipantsPopOpen(false); onRemoveParticipant && onRemoveParticipant(u); }}>
                          <I.UserX size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button className="btn btn--secondary btn--sm" onClick={onShareAnalysis}>
              <I.Users size={13}/> Compartilhar
            </button>
            {!isNew && !isCompleted && (
              <button className="btn btn--primary btn--sm" onClick={onRequestComplete}>
                <I.CheckCircle size={13}/> Concluir
              </button>
            )}
            {isCompleted && (
              <button className="btn btn--primary btn--sm" onClick={onReopen}>
                <I.RotateCcw size={13}/> Reabrir
              </button>
            )}
          </div>

          {reclassifyHistory.length > 0 && (
            <div className="reclassify-log">
              <I.History size={12}/>
              <span>
                Reclassificado de <strong>{reclassifyHistory[reclassifyHistory.length - 1].from}</strong> para <strong>{reclassifyHistory[reclassifyHistory.length - 1].to}</strong>
                {' · '}motivo: <em>{reclassifyHistory[reclassifyHistory.length - 1].reason.replace('_', ' ')}</em>
              </span>
            </div>
          )}
        </div>

        {/* Feed da conversa */}
        <div className="subchat__feed">
          <div className="subchat__feed-inner">

            {/* Welcome do meris para nova análise */}
            {isNew && messages.length === 0 && (
              <div className="bubble bubble--meris fadein">
                <div className="meris-bubble-avatar"><I.Sparkles size={16}/></div>
                <div className="bubble__body">
                  <div className="bubble__meta">@meris <span className="bubble__meta-role">analista contratual</span></div>
                  <div className="meris-card">
                    <p className="meris-card__text" style={{margin:'0 0 6px'}}>Sobre o que você gostaria de analisar?</p>
                    <p className="meris-card__text" style={{margin:0, color:'var(--color-text-secondary)'}}>
                      Pode descrever a situação, colar um e-mail, anexar um documento — vou olhar à luz do contrato e trazer um parecer.
                    </p>
                  </div>
                  <div className="bubble__time-below">agora</div>
                </div>
              </div>
            )}

            {/* Banner concluído */}
            {isCompleted && (
              <div className="concluded-banner fadein">
                <I.CheckCircle size={16}/>
                <div className="concluded-banner__body">
                  <div className="concluded-banner__title">Análise concluída · arquivada no histórico</div>
                  <div className="concluded-banner__sub">O parecer permanece vinculado às ações tomadas. Reabra para retomar a conversa com o @meris.</div>
                </div>
                <button className="btn btn--secondary btn--sm" onClick={onReopen}>
                  <I.RotateCcw size={13}/> Reabrir
                </button>
              </div>
            )}

            {!isNew && (<>
              {/* E-mail original (collapsible, discreto) */}
              <button
                className={`email-toggle ${emailExpanded ? 'email-toggle--open' : ''}`}
                onClick={() => setEmailExpanded(v => !v)}>
                <I.Mail size={13}/>
                <span>E-mail original · {parecer.senderName}</span>
                <I.ChevronDown size={13} style={{marginLeft:'auto', transform: emailExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 120ms ease'}}/>
              </button>
              {emailExpanded && (
                <div className="email-body fadein">
                  <div className="email-body__head">
                    <div><span>De</span> {parecer.senderName} &lt;{parecer.sender}&gt;</div>
                    <div><span>Data</span> {parecer.date}</div>
                  </div>
                  <div className="email-body__text">{`Prezados,\n\nConforme tratado em campo na semana passada, solicitamos formalmente a inclusão de duas linhas adicionais ao skid 4730-IF-001 (filtragem) e a realização de teste integrado em campo. Entendemos que a inclusão é compatível com o cronograma se iniciada em 15 dias.\n\nAnexamos planta atualizada e memorial preliminar.\n\nAtenciosamente,\n${parecer.senderName}`}</div>
                </div>
              )}

              {/* Análise principal — novo card "analista contratual" */}
              <div className="bubble bubble--meris fadein">
                <div className="meris-bubble-avatar"><I.Sparkles size={16}/></div>
                <div className="bubble__body">
                  <div className="bubble__meta">@meris <span className="bubble__meta-role">analista contratual</span></div>
                  <div className="meris-card">
                    <div className="meris-card__badges">
                      {parecer.pathRisk ? <window.PathBadge/> : <CritBadge kind={parecer.criticality}/>}
                      <span className="meris-card__tag"><I.Tag size={11}/> {window.GROUPS[parecer.group]?.label}</span>
                    </div>
                    <p className="meris-card__text">{parecer.summary}</p>
                    {parecer.justification && (
                      <p className="meris-card__just"><strong>Justificativa.</strong> {parecer.justification}</p>
                    )}
                    {(parecer.references || []).map((ref, i) => (
                      <div key={i} className="meris-ref">
                        <div className="meris-ref__label">Referência</div>
                        <div className="meris-ref__name">{ref}</div>
                      </div>
                    ))}
                    <p className="meris-card__text" style={{margin:0}}>
                      Posso aprofundar a análise em três frentes: (1) histórico de comunicações correlacionadas neste tópico; (2) precedentes em casos similares no projeto; (3) rascunho de notificação formal à contraparte. Por onde você quer começar?
                    </p>
                  </div>
                  <div className="bubble__time-below">há 4 minutos</div>
                </div>
              </div>
            </>)}

            {/* Mensagens dinâmicas */}
            {(isNew ? messages : messages.slice(1)).map((m, i) => {
              if (m.role === 'user') {
                return (
                  <div key={i} className="bubble bubble--user fadein">
                    <div className="bubble__body bubble__body--user">
                      <div className="bubble__user-header">
                        <span className="user-avatar">AP</span>
                        <span className="bubble__meta">Ana Perrejil <span className="bubble__meta-time">· agora</span></span>
                      </div>
                      <div className="bubble__content bubble__content--user">{m.text}</div>
                    </div>
                  </div>
                );
              }
              if (m.role === 'other') {
                return (
                  <div key={i} className="bubble fadein">
                    <div className="user-avatar user-avatar--other">{initials(m.author || 'Convidado')}</div>
                    <div className="bubble__body">
                      <div className="bubble__meta">{m.author} <span className="bubble__meta-time">· convidado(a)</span></div>
                      <div className="bubble__content">{m.text}</div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="bubble bubble--meris fadein">
                  <div className="meris-bubble-avatar"><I.Sparkles size={16}/></div>
                  <div className="bubble__body">
                    <div className="bubble__meta">@meris <span className="bubble__meta-role">analista contratual</span></div>
                    <div className="meris-card">
                      <p className="meris-card__text" style={{margin:0}}>{m.text}</p>
                    </div>
                    <div className="bubble__time-below">agora</div>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* Composer — input AI-native */}
        <div className="subchat__composer">
          {isCompleted ? (
            <div className="subchat__composer-locked">
              <I.CheckCircle size={16}/>
              <div>
                <div className="subchat__locked-title">Análise concluída</div>
                <div className="subchat__locked-sub">Arquivada no histórico do parecer. Reabra para retomar a conversa com o @meris.</div>
              </div>
              <button className="btn btn--secondary btn--sm" onClick={onReopen}>
                <I.RotateCcw size={13}/> Reabrir análise
              </button>
            </div>
          ) : (
            <div className="subchat__composer-inner">
              {attachedDocs.length > 0 && (
                <div className="composer-attached">
                  {attachedDocs.map(d => (
                    <span key={d.id} className="composer-attached__chip" title={`${d.source === 'ged' ? 'GED' : 'Local'} · ${d.size || ''}`}>
                      {d.source === 'ged' ? <I.Database size={12}/> : <I.Upload size={12}/>}
                      <span className="composer-attached__name">{d.name}</span>
                      <button className="composer-attached__remove" onClick={() => setAttachedDocs(prev => prev.filter(x => x.id !== d.id))} aria-label="Remover anexo">
                        <I.X size={10}/>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <textarea
                className="composer-textarea"
                placeholder="Continue a conversa…"
                value={composer}
                onChange={e => setComposer(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendMessage(); }}}/>
              <div className="composer-toolbar">
                <div className="composer-toolbar__left">
                  <window.Dropdown
                    trigger={
                      <button className="composer-action" title="Anexar"><I.Paperclip size={14}/> Anexar{attachedDocs.length > 0 && <span className="composer-action__badge">{attachedDocs.length}</span>}</button>
                    }
                    items={[
                      { icon: <I.Database size={14}/>, label: 'Do GED', onClick: () => setGedPickerOpen(true) },
                      { icon: <I.Upload size={14}/>, label: 'Do meu computador', onClick: () => fileInputRef.current?.click() },
                    ]}/>
                  <input ref={fileInputRef} type="file" multiple style={{display:'none'}}
                    onChange={e => { handleLocalFiles(e.target.files); e.target.value = ''; }}/>
                  <window.Dropdown
                    trigger={
                      <button className="composer-action" title="Skills do @meris"><I.Sparkles size={14}/> Skills</button>
                    }
                    items={[
                      { icon: <I.FileText size={14}/>, label: 'Resumir esta análise', onClick: () => setComposer('Resuma esta análise em até 5 pontos, destacando os riscos contratuais e o que precisa ser decidido.') },
                      { icon: <I.Sparkles size={14}/>, label: 'Sugerir resposta ao remetente', onClick: () => setComposer('Sugira uma resposta formal ao remetente, considerando as cláusulas contratuais aplicáveis e o canal adequado.') },
                      { icon: <I.Activity size={14}/>, label: 'Identificar próximos passos', onClick: () => setComposer('Liste os próximos passos contratuais recomendados para tratar esta solicitação.') },
                      { icon: <I.History size={14}/>, label: 'Comparar com casos similares', onClick: () => setComposer('Compare esta situação com casos similares já analisados neste contrato.') },
                      { icon: <I.FileCheck size={14}/>, label: 'Gerar minuta de notificação formal', onClick: () => setComposer('Gere uma minuta de notificação formal com base nas cláusulas contratuais identificadas.') },
                    ]}/>
                  {!isNew && (
                    <window.Dropdown
                      trigger={
                        <button className="composer-action" title="Ações da análise"><I.Zap size={14}/> Ações</button>
                      }
                      items={[
                        { icon: <I.FileText size={14}/>, label: 'Gerar relatório' },
                        { icon: <I.Bell size={14}/>, label: 'Notificar grupo', onClick: () => onOpenModal('notify') },
                        { icon: <I.Refresh size={14}/>, label: 'Reclassificar', onClick: onReclassify },
                      ]}/>
                  )}
                </div>
                <div className="composer-toolbar__right">
                  <span className="composer-count">{composer.length} / 4000</span>
                  <button className="composer-send" onClick={sendMessage} disabled={!composer.trim()} title="Enviar (Ctrl+Enter)" aria-label="Enviar">
                    <I.ArrowUp size={16}/>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="subchat__disclaimer">
          MERIS pode produzir respostas incorretas. Sempre verifique com a fonte original.
        </div>
      </div>

      {gedPickerOpen && (
        <GedPickerModal
          existingIds={attachedDocs.filter(d => d.source === 'ged').map(d => d.id)}
          onClose={() => setGedPickerOpen(false)}
          onConfirm={(docs) => {
            setAttachedDocs(prev => [...prev, ...docs.map(d => ({ id: d.id, name: d.name, size: d.size, source: 'ged' })).filter(it => !prev.some(p => p.id === it.id))]);
            setGedPickerOpen(false);
          }}/>
      )}
    </div>
  );
}

function GedPickerModal({ existingIds = [], onClose, onConfirm }) {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState({});
  const docs = (window.PROJECT_DOCS || []).filter(d => !query.trim() || d.name.toLowerCase().includes(query.toLowerCase()));
  const toggle = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  const selectedDocs = (window.PROJECT_DOCS || []).filter(d => selected[d.id]);
  return (
    <div className="modal__scrim fadein" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:560}}>
        <div className="modal__header">
          <div className="modal__title-row">
            <I.Database size={16}/>
            <div className="modal__title">Anexar do GED</div>
          </div>
          <div className="modal__sub">Selecione documentos do projeto para anexar a esta análise.</div>
        </div>
        <div className="modal__body">
          <div className="field">
            <input className="recipients__input" style={{width:'100%'}} placeholder="Buscar documento…" value={query} onChange={e => setQuery(e.target.value)}/>
          </div>
          <div className="ged-picker__list">
            {docs.length === 0 && (
              <div className="ged-picker__empty">Nenhum documento encontrado.</div>
            )}
            {docs.map(d => {
              const already = existingIds.includes(d.id);
              const isSel = !!selected[d.id];
              return (
                <button key={d.id} className={`ged-picker__row ${isSel ? 'ged-picker__row--sel' : ''} ${already ? 'ged-picker__row--disabled' : ''}`}
                  disabled={already}
                  onClick={() => toggle(d.id)}>
                  <span className={`checkbox ${isSel ? 'checkbox--checked' : ''}`}>
                    {isSel && <I.Check size={11}/>}
                  </span>
                  <I.FileText size={14}/>
                  <div className="ged-picker__main">
                    <div className="ged-picker__name">{d.name}</div>
                    <div className="ged-picker__meta">{d.type} · {d.size} · {d.when}</div>
                  </div>
                  {already && <span className="ged-picker__tag">Já anexado</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" disabled={selectedDocs.length === 0} onClick={() => onConfirm(selectedDocs)}>
            <I.Paperclip size={14}/> Anexar{selectedDocs.length > 0 && ` (${selectedDocs.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

window.SubChatScreen = SubChatScreen;
