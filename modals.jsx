// Telas 4 e 5: Modais
const { useState: useStateModal } = React;

function NotifyGroupModal({ parecer, onClose, onSubmit }) {
  const initials = (name) => (name || '').split(' ').filter(Boolean).slice(0,2).map(s => s[0]).join('').toUpperCase();
  const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim());

  const [recipients, setRecipients] = useStateModal([]);
  const [query, setQuery] = useStateModal('');
  const [message, setMessage] = useStateModal('');

  const pool = window.RECIPIENTS_POOL || [];
  const q = query.trim().toLowerCase();
  const taken = new Set(recipients.map(r => r.id));
  const matchedUsers = pool.filter(u => !taken.has(u.id) && (q === '' || u.name.toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q)));
  const queryIsEmail = isValidEmail(query);
  const emailAlreadyAdded = recipients.some(r => r.type === 'email' && r.email.toLowerCase() === query.trim().toLowerCase());
  const matchesUserEmail = pool.some(u => (u.email || '').toLowerCase() === query.trim().toLowerCase());
  const canAddFreeEmail = queryIsEmail && !emailAlreadyAdded && !matchesUserEmail;

  const addUser = (u) => {
    setRecipients(prev => [...prev, { id: u.id, type: 'user', name: u.name, role: u.role, email: u.email }]);
    setQuery('');
  };
  const addEmail = (email) => {
    const e = email.trim();
    if (!isValidEmail(e)) return;
    const id = `email:${e.toLowerCase()}`;
    if (recipients.some(r => r.id === id)) return;
    setRecipients(prev => [...prev, { id, type: 'email', email: e }]);
    setQuery('');
  };
  const removeRecipient = (id) => setRecipients(prev => prev.filter(r => r.id !== id));

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      if (canAddFreeEmail) { e.preventDefault(); addEmail(query); return; }
      if (matchedUsers.length > 0 && q) { e.preventDefault(); addUser(matchedUsers[0]); return; }
    }
    if (e.key === 'Backspace' && query === '' && recipients.length > 0) {
      e.preventDefault();
      removeRecipient(recipients[recipients.length - 1].id);
    }
  };

  const canSubmit = recipients.length > 0;
  const userCount = recipients.filter(r => r.type === 'user').length;
  const emailCount = recipients.filter(r => r.type === 'email').length;

  return (
    <div className="modal__scrim fadein" onClick={onClose}>
      <aside className="notify-drawer fadein" onClick={e => e.stopPropagation()}>
        <div className="notify-drawer__head">
          <div className="notify-drawer__title-row">
            <I.Bell size={16}/>
            <div className="notify-drawer__title">Notificar sobre {parecer ? `"${parecer.subject}"` : 'este item'}</div>
          </div>
          <button className="notify-drawer__close" onClick={onClose} aria-label="Fechar">
            <I.X size={16}/>
          </button>
        </div>

        <div className="notify-drawer__body">
          <div className="field">
            <label className="field__label">Destinatários</label>
            <div className="notify-recipients">
              {recipients.map(r => (
                r.type === 'user' ? (
                  <span key={r.id} className="notify-chip notify-chip--user">
                    <span className="notify-chip__avatar">{initials(r.name)}</span>
                    <span className="notify-chip__label">{r.name}</span>
                    <button className="notify-chip__remove" onClick={() => removeRecipient(r.id)} aria-label="Remover">
                      <I.X size={10}/>
                    </button>
                  </span>
                ) : (
                  <span key={r.id} className="notify-chip notify-chip--email">
                    <I.Mail size={12}/>
                    <span className="notify-chip__label">{r.email}</span>
                    <button className="notify-chip__remove" onClick={() => removeRecipient(r.id)} aria-label="Remover">
                      <I.X size={10}/>
                    </button>
                  </span>
                )
              ))}
              <input
                className="notify-recipients__input"
                placeholder={recipients.length ? 'Adicionar mais…' : 'Buscar por nome ou digitar um e-mail…'}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKeyDown}/>
            </div>

            {(matchedUsers.length > 0 || canAddFreeEmail) && q && (
              <div className="notify-suggest">
                {matchedUsers.slice(0, 6).map(u => (
                  <button key={u.id} className="notify-suggest__item" type="button" onClick={() => addUser(u)}>
                    <span className="notify-suggest__avatar">{initials(u.name)}</span>
                    <div className="notify-suggest__main">
                      <div className="notify-suggest__name">{u.name}</div>
                      <div className="notify-suggest__role">{u.role}</div>
                    </div>
                    <span className="notify-suggest__source">MERIS</span>
                  </button>
                ))}
                {canAddFreeEmail && (
                  <button className="notify-suggest__item notify-suggest__item--email" type="button" onClick={() => addEmail(query)}>
                    <span className="notify-suggest__avatar notify-suggest__avatar--icon"><I.Mail size={13}/></span>
                    <div className="notify-suggest__main">
                      <div className="notify-suggest__name">Adicionar {query.trim()}</div>
                      <div className="notify-suggest__role">Não está no MERIS — será notificado por e-mail</div>
                    </div>
                    <span className="notify-suggest__source notify-suggest__source--email">E-mail livre</span>
                  </button>
                )}
              </div>
            )}

            <div className="notify-hint">
              <I.Info size={11}/>
              Usuários MERIS recebem notificação in-app e por e-mail. E-mails livres recebem apenas por e-mail.
            </div>
          </div>

          <div className="field">
            <label className="field__label">Adicione um recado <span className="field__label-opt">(opcional)</span></label>
            <textarea
              className="textarea"
              rows={5}
              placeholder="Contexto rápido para os destinatários…"
              value={message}
              onChange={e => setMessage(e.target.value)}/>
          </div>

          {parecer && (
            <div className="field">
              <label className="field__label">Item referenciado</label>
              <div className="parecer-ref">
                <div className="parecer-ref__label">Parecer · {window.GROUPS[parecer.group]?.label}</div>
                <div className="parecer-ref__subject">{parecer.subject}</div>
                <div className="parecer-ref__meta">{parecer.senderName} · {parecer.date}</div>
              </div>
            </div>
          )}
        </div>

        <div className="notify-drawer__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary"
            disabled={!canSubmit}
            onClick={() => onSubmit && onSubmit(recipients.length, { recipients, message })}>
            <I.Send size={14}/> Enviar notificação{recipients.length > 0 ? ` (${recipients.length})` : ''}
          </button>
        </div>
      </aside>
    </div>
  );
}

function FormalNotificationModal({ parecer, onClose, onSubmit }) {
  const [counterparty, setCounterparty] = useStateModal('Petrobras: Gestão de Contrato Boaventura');
  const [deadline, setDeadline] = useStateModal('22/05/2026');
  const [clause, setClause] = useStateModal('cl-4-2');
  const [description, setDescription] = useStateModal(parecer
    ? `Em referência à comunicação recebida em ${parecer.date.split(' ')[0]} sobre "${parecer.subject}", informamos que qualquer alteração de escopo do skid 4730-IF-001 deve observar a Cláusula 4.2 do contrato, mediante instrumento formal entre as partes. Solicitamos a abertura de TAP correspondente e o registro em ata. Até a formalização, fica suspensa a execução de quaisquer atividades vinculadas à inclusão proposta.`
    : ''
  );

  return (
    <div className="modal__scrim fadein" onClick={onClose}>
      <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title-row">
            <I.FileCheck size={18}/>
            <div className="modal__title">Notificação formal</div>
            <div className="modal__seal">Registro contratual</div>
          </div>
          <div className="modal__sub">Documento será emitido com numeração sequencial e arquivado no dossiê do projeto.</div>
        </div>
        <div className="modal__body">
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
            <div className="field">
              <label className="field__label">Destinatário (contraparte)</label>
              <input className="input" value={counterparty} onChange={e => setCounterparty(e.target.value)}/>
            </div>
            <div className="field">
              <label className="field__label">Prazo de resposta</label>
              <div style={{position:'relative'}}>
                <input className="input" value={deadline} onChange={e => setDeadline(e.target.value)} style={{paddingRight:36}}/>
                <I.Calendar size={16} style={{position:'absolute', right:12, top:10, color:'var(--color-text-tertiary)'}}/>
              </div>
            </div>
          </div>

          <div className="field">
            <label className="field__label">Cláusula referenciada</label>
            <select className="input" value={clause} onChange={e => setClause(e.target.value)}>
              <option value="cl-4-2">Cláusula 4.2: Escopo de fornecimento</option>
              <option value="cl-6-1">Cláusula 6.1: Marcos contratuais</option>
              <option value="cl-9-2">Cláusula 9.2: Atrasos imputáveis a terceiros</option>
              <option value="cl-9-3">Cláusula 9.3: Eventos de força maior</option>
              <option value="cl-11-2">Cláusula 11.2: Adendos</option>
              <option value="upload">Carregar referência adicional…</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label">Descrição da obrigação</label>
            <textarea
              className="textarea"
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}/>
            <div className="field__hint">
              <I.Sparkles size={11} style={{display:'inline', verticalAlign:'middle', marginRight:4}}/>
              Texto sugerido pelo @meris com base no parecer e nas cláusulas referenciadas.
            </div>
          </div>

          <div className="field">
            <label className="field__label">Pré-visualização do documento</label>
            <div className="doc-preview">
              <div className="doc-preview__title">NOTIFICAÇÃO FORMAL Nº 2026/047</div>
              <div className="doc-preview__meta">
                <span>Destinatário:</span><strong>{counterparty}</strong>
                <span>Projeto:</span><strong>Boaventura: Unidade B</strong>
                <span>Referência:</span><strong>Cláusula 4.2: Escopo de fornecimento</strong>
                <span>Prazo:</span><strong>{deadline}</strong>
              </div>
              <div style={{borderTop:'1px solid var(--color-border)', paddingTop:8, fontSize:11, lineHeight:'17px', whiteSpace:'pre-wrap'}}>
                {description}
              </div>
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn--ghost">Salvar como rascunho</button>
          <button className="btn btn--primary" onClick={onSubmit}>
            <I.FileCheck size={14}/> Emitir notificação
          </button>
        </div>
      </div>
    </div>
  );
}

window.NotifyGroupModal = NotifyGroupModal;
window.FormalNotificationModal = FormalNotificationModal;

function ConcludeAnalysisModal({ parecer, onClose, onConfirm }) {
  const [outcome, setOutcome] = useStateModal('action_taken'); // action_taken | no_action | escalate
  const [note, setNote] = useStateModal('');
  const [keepStarred, setKeepStarred] = useStateModal(false);

  if (!parecer) return null;
  const group = window.GROUPS[parecer.group];

  // Mock: actions registered during this analysis
  const registeredActions = [
    { icon: <I.FileCheck size={13}/>, label: 'Notificação formal nº 2026/047 emitida', when: 'há 2 min' },
    { icon: <I.Users size={13}/>, label: 'Notificação interna ao grupo Engenharia', when: 'há 8 min' },
    { icon: <I.Calendar size={13}/>, label: 'Marco contratual adicionado ao calendário', when: 'há 12 min' },
  ];

  const outcomes = [
    {
      id: 'action_taken',
      title: 'Ação tomada',
      desc: 'O ponto contratual foi endereçado por uma ou mais ações registradas. O parecer fica arquivado no histórico.',
    },
    {
      id: 'no_action',
      title: 'Sem ação necessária',
      desc: 'A análise concluiu que não há risco contratual relevante. Justifique abaixo para registro.',
    },
    {
      id: 'escalate',
      title: 'Escalado para o jurídico',
      desc: 'Caso transferido para análise externa ao módulo. Mantém vinculação ao parecer original.',
    },
  ];

  return (
    <div className="modal__scrim fadein" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title-row">
            <I.CheckCircle size={18}/>
            <div className="modal__title">Concluir análise</div>
          </div>
          <div className="modal__sub">A análise será arquivada no histórico do parecer. Você poderá reabri-la a qualquer momento.</div>
        </div>
        <div className="modal__body">
          <div className="field">
            <label className="field__label">Parecer</label>
            <div className="parecer-ref">
              <div className="parecer-ref__label">Parecer · {group.label}</div>
              <div className="parecer-ref__subject">{parecer.subject}</div>
              <div className="parecer-ref__meta">{parecer.senderName} · {parecer.date}</div>
            </div>
          </div>

          <div className="field">
            <label className="field__label">Ações registradas durante a análise</label>
            <div className="action-log">
              {registeredActions.map((a, i) => (
                <div key={i} className="action-log__row">
                  <span className="action-log__icon">{a.icon}</span>
                  <span className="action-log__label">{a.label}</span>
                  <span className="action-log__time">{a.when}</span>
                </div>
              ))}
              <div className="action-log__hint">
                <I.Sparkles size={11}/>
                Estas ações ficam vinculadas ao parecer e visíveis no histórico do projeto.
              </div>
            </div>
          </div>

          <div className="field">
            <label className="field__label">Resultado da análise</label>
            <div className="outcome-list">
              {outcomes.map(o => (
                <button key={o.id}
                  className={`outcome-card ${outcome === o.id ? 'outcome-card--active' : ''}`}
                  onClick={() => setOutcome(o.id)}>
                  <span className={`outcome-radio ${outcome === o.id ? 'outcome-radio--active' : ''}`}></span>
                  <div>
                    <div className="outcome-card__title">{o.title}</div>
                    <div className="outcome-card__desc">{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field__label">Nota de fechamento (opcional)</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Resumo objetivo do desfecho da análise: fica anexado ao histórico do parecer."
              value={note}
              onChange={e => setNote(e.target.value)}/>
          </div>

          {parecer.starred && (
            <label className="field__check" onClick={() => setKeepStarred(v => !v)}>
              <span className={`checkbox ${keepStarred ? 'checkbox--checked' : ''}`}>
                {keepStarred && <I.Check size={11}/>}
              </span>
              Manter em acompanhamento mesmo após concluir
              <span className="field__check-hint">(útil quando ainda há marco contratual em aberto)</span>
            </label>
          )}
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={() => onConfirm({ outcome, note, keepStarred })}>
            <I.CheckCircle size={14}/> Concluir e arquivar
          </button>
        </div>
      </div>
    </div>
  );
}

window.ConcludeAnalysisModal = ConcludeAnalysisModal;

function ConcludeConfirmModal({ parecer, onClose, onConfirm }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onConfirm]);
  if (!parecer) return null;
  return (
    <div className="modal__scrim fadein" onClick={onClose}>
      <div className="modal modal--sm conclude-confirm" onClick={e => e.stopPropagation()} style={{maxWidth:400}}>
        <div className="conclude-confirm__icon"><I.CheckCircle size={28}/></div>
        <div className="conclude-confirm__title">Concluir este parecer?</div>
        <div className="conclude-confirm__text">
          O parecer continuará acessível em Resumos, dentro da semana de origem. Você pode reabri-lo a qualquer momento.
        </div>
        <div className="modal__footer conclude-confirm__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" autoFocus onClick={onConfirm}>Concluir</button>
        </div>
      </div>
    </div>
  );
}
window.ConcludeConfirmModal = ConcludeConfirmModal;

function ReopenConfirmModal({ parecer, onClose, onConfirm }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onConfirm]);
  if (!parecer) return null;
  return (
    <div className="modal__scrim fadein" onClick={onClose}>
      <div className="modal modal--sm reopen-confirm" onClick={e => e.stopPropagation()} style={{maxWidth:400}}>
        <div className="reopen-confirm__icon"><I.RotateCcw size={26}/></div>
        <div className="reopen-confirm__title">Reabrir este parecer?</div>
        <div className="reopen-confirm__text">
          O parecer voltará para o sub-módulo "Em aberto" e poderá ser tratado novamente. Se for crítico, aparecerá também no topo de Resumos.
        </div>
        <div className="modal__footer reopen-confirm__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" autoFocus onClick={onConfirm}>Reabrir</button>
        </div>
      </div>
    </div>
  );
}
window.ReopenConfirmModal = ReopenConfirmModal;

function RemoveParticipantConfirmModal({ participant, onClose, onConfirm }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onConfirm]);
  if (!participant) return null;
  const name = participant.name;
  return (
    <div className="modal__scrim fadein" onClick={onClose}>
      <div className="modal modal--sm remove-participant-confirm" onClick={e => e.stopPropagation()} style={{maxWidth:400}}>
        <div className="remove-participant-confirm__icon"><I.UserX size={24}/></div>
        <div className="remove-participant-confirm__title">Remover {name} do chat?</div>
        <div className="remove-participant-confirm__text">
          {name} perderá acesso a este chat e não receberá mais atualizações. O histórico que escreveu permanece visível.
        </div>
        <div className="modal__footer remove-participant-confirm__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--danger" autoFocus onClick={onConfirm}>Remover</button>
        </div>
      </div>
    </div>
  );
}
window.RemoveParticipantConfirmModal = RemoveParticipantConfirmModal;

function RestrictedAccessModal({ sharedBy, onReturn }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); onReturn && onReturn(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onReturn]);
  return (
    <div className="modal__scrim modal__scrim--blocking fadein">
      <div className="modal modal--sm restricted-access" onClick={e => e.stopPropagation()} style={{maxWidth:440}}>
        <div className="restricted-access__icon"><I.Lock size={26}/></div>
        <div className="restricted-access__title">Este chat é restrito</div>
        <div className="restricted-access__text">
          O módulo Gestão Contratual e seus chats são acessíveis apenas para usuários da área ADM Contratual. Esse link foi compartilhado com você, mas seu perfil atual não tem permissão para entrar.
        </div>
        <div className="restricted-access__hint">
          Se você precisa acessar essa discussão, fale com a pessoa que enviou o link ou com a equipe responsável pelo contrato.
        </div>
        {sharedBy && (
          <div className="restricted-access__sharedby">Link compartilhado por: <strong>{sharedBy}</strong></div>
        )}
        <div className="modal__footer restricted-access__footer">
          <button className="btn btn--primary" autoFocus onClick={onReturn}>Voltar</button>
        </div>
      </div>
    </div>
  );
}
window.RestrictedAccessModal = RestrictedAccessModal;

// ──────────────────────────────────────────────────────────────────────────
// Onboarding: confirma a conexão da Matriz e define a frequência dos resumos.
// ──────────────────────────────────────────────────────────────────────────
function OnboardingModal({ onClose, onComplete }) {
  const [frequency, setFrequency] = useStateModal('semanal');

  return (
    <div className="modal__scrim fadein" onClick={onClose}>
      <div className="onboard-modal" onClick={e => e.stopPropagation()}>
        <div className="onboard-modal__hero">
          <div className="onboard-modal__eyebrow">
            <I.Sparkles size={12}/> NOVO · MONITORAMENTO
          </div>
          <h2 className="onboard-modal__title">Monitoramento de comunicação contratual</h2>
          <p className="onboard-modal__sub">
            MERIS passa a observar as caixas oficiais do seu contrato e produz resumos periódicos do
            que está acontecendo, organizados por área. Continue a investigação a partir do resumo
            em uma análise comum.
          </p>
        </div>

        <div className="onboard-modal__body">
          <div className="onboard-feature">
            <div className="onboard-feature__icon"><I.Mail size={18}/></div>
            <div>
              <div className="onboard-feature__title">Caixas oficiais conectadas</div>
              <div className="onboard-feature__desc">As caixas <code>engenharia@</code>, <code>producao@</code>, <code>contrato@</code>, <code>qualidade@</code> e <code>sms@</code> do contrato HC² já vêm conectadas, sem configuração manual.</div>
            </div>
          </div>
          <div className="onboard-feature">
            <div className="onboard-feature__icon"><I.Sparkles size={18}/></div>
            <div>
              <div className="onboard-feature__title">Resumo por área, com ações</div>
              <div className="onboard-feature__desc">Cada resumo destaca pleitos, divergências, FVI/FVM, notificações e quase-acidentes, com botões para abrir uma investigação focada.</div>
            </div>
          </div>
          <div className="onboard-feature">
            <div className="onboard-feature__icon"><I.Lock size={18}/></div>
            <div>
              <div className="onboard-feature__title">Acesso restrito ao seu grupo</div>
              <div className="onboard-feature__desc">Conteúdo visível apenas a usuários do grupo Administração Contratual com permissão no contrato, em qualquer caminho (URL, busca, menção, notificação).</div>
            </div>
          </div>

          <div className="onboard-freq">
            <div className="onboard-freq__title">Com que frequência receber o resumo?</div>
            <div className="onboard-freq__cards">
              {[
                { id: 'diario', title: 'Diário', desc: 'Manhãs de seg. a sex., síntese das trocas do dia anterior.' },
                { id: 'semanal', title: 'Semanal', desc: 'Segundas pela manhã, síntese consolidada da semana anterior.' },
              ].map(opt => (
                <button key={opt.id}
                  className={`onboard-freq__card ${frequency === opt.id ? 'onboard-freq__card--active' : ''}`}
                  onClick={() => setFrequency(opt.id)}>
                  <div className="onboard-freq__head">
                    <I.Calendar size={15}/>
                    <span className="onboard-freq__name">{opt.title}</span>
                  </div>
                  <div className="onboard-freq__desc">{opt.desc}</div>
                </button>
              ))}
            </div>
            <div className="onboard-freq__hint">Esta preferência fica salva no perfil e pode ser editada depois nas configurações.</div>
          </div>
        </div>

        <div className="onboard-modal__footer">
          <button className="btn btn--primary" onClick={() => onComplete({ frequency })}>
            Confirmar e continuar <I.ArrowRight size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}

window.OnboardingModal = OnboardingModal;

// ──────────────────────────────────────────────────────────────────────────
// Reclassify modal — pede justificativa quando o usuário muda criticidade.
// ──────────────────────────────────────────────────────────────────────────
function ReclassifyModal({ parecer, onClose, onConfirm }) {
  // Identifica a classificação atual: 'path' tem prioridade
  const currentId = parecer?.pathRisk
    ? 'path'
    : (parecer?.criticality === 'critical' ? 'critical' : 'informative');

  const CLASSIFICATIONS = [
    {
      id: 'critical',
      label: 'Crítico',
      desc: 'Impacto contratual direto. Exige ação imediata.',
      tone: 'critical',
      icon: 'AlertTriangle',
    },
    {
      id: 'path',
      label: 'Em caminho crítico',
      desc: 'Pode comprometer marcos ou prazos contratuais.',
      tone: 'path',
      icon: 'AlertTriangle',
    },
    {
      id: 'informative',
      label: 'Informativo',
      desc: 'Sem impacto contratual direto. Apenas registro.',
      tone: 'info',
      icon: 'MessageSquare',
    },
  ];

  const [target, setTarget] = useStateModal(currentId);
  const [note, setNote] = useStateModal('');
  const noteValid = note.trim().length >= 5;
  const changed = target !== currentId;
  const canConfirm = changed && noteValid;

  return (
    <div className="modal__scrim fadein" onClick={onClose}>
      <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title-row">
            <I.Refresh size={16}/>
            <div className="modal__title">Reclassificar parecer</div>
          </div>
          <div className="modal__sub">
            Sua justificativa ajuda o @meris a aprender e melhorar a assertividade das próximas classificações.
          </div>
        </div>
        <div className="modal__body">
          <div className="field">
            <label className="field__label">Classificação atual</label>
            <div className="reclass-current">
              {currentId === 'path' && <window.PathBadge/>}
              {currentId === 'critical' && <window.CritBadge kind="critical"/>}
              {currentId === 'informative' && <window.CritBadge kind="informative"/>}
            </div>
          </div>

          <div className="field">
            <label className="field__label">Nova classificação</label>
            <div className="reclass-options">
              {CLASSIFICATIONS.map(opt => {
                const Icon = I[opt.icon];
                const isActive = target === opt.id;
                const isCurrent = currentId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`reclass-option reclass-option--${opt.tone} ${isActive ? 'reclass-option--active' : ''}`}
                    onClick={() => setTarget(opt.id)}
                    disabled={isCurrent}>
                    <span className="reclass-option__icon"><Icon size={14}/></span>
                    <div className="reclass-option__body">
                      <div className="reclass-option__label">
                        {opt.label}
                        {isCurrent && <span className="reclass-option__current">atual</span>}
                      </div>
                      <div className="reclass-option__desc">{opt.desc}</div>
                    </div>
                    <span className="reclass-option__check">
                      {isActive && !isCurrent && <I.Check size={14}/>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field">
            <label className="field__label">
              Justificativa <span className="field__required">*</span>
            </label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Por que essa reclassificação? Detalhe para o @meris aprender com a sua decisão."
              value={note}
              onChange={e => setNote(e.target.value)}/>
            <div className="field__hint">
              {note.trim().length === 0
                ? 'Mínimo 5 caracteres. A justificativa é enviada ao @meris para aprendizado.'
                : noteValid
                  ? <><I.Check size={11} style={{display:'inline',verticalAlign:'middle',marginRight:4}}/>{note.trim().length} caracteres</>
                  : `${note.trim().length} de 5 caracteres mínimos`}
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn--primary"
            disabled={!canConfirm}
            onClick={() => onConfirm({ to: target, reason: 'manual', note: note.trim() })}>
            <I.Check size={14}/> Confirmar reclassificação
          </button>
        </div>
      </div>
    </div>
  );
}

window.ReclassifyModal = ReclassifyModal;

// ──────────────────────────────────────────────────────────────────────────
// Share-analysis modal — envolve outras pessoas no sub-chat.
// ──────────────────────────────────────────────────────────────────────────
function ShareAnalysisModal({ parecer, existingParticipants = [], isOwner = true, onClose, onConfirm, onRemoveParticipant, onShowToast }) {
  const [query, setQuery] = useStateModal('');
  const [selected, setSelected] = useStateModal([]);
  const [blockedUser, setBlockedUser] = useStateModal(null);
  const [linkCopied, setLinkCopied] = useStateModal(false);
  const pool = window.RECIPIENTS_POOL || [];
  const isAdmContratual = (u) => /gest[aã]o contratual|adm.*contratual/i.test(u.role || '');
  const alreadyIds = new Set([...existingParticipants, ...selected].map(u => u.id));
  const matches = pool.filter(u =>
    !alreadyIds.has(u.id) &&
    (query === '' || u.name.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 6);
  const shareLink = parecer ? `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}#chat/${parecer.id}` : '';
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = shareLink; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
    }
    setLinkCopied(true);
    onShowToast && onShowToast('Link copiado.');
    setTimeout(() => setLinkCopied(false), 2500);
  };

  return (
    <div className="modal__scrim fadein" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title-row">
            <I.Users size={16}/>
            <div className="modal__title">Compartilhar análise</div>
          </div>
          <div className="modal__sub">
            {isOwner
              ? 'As pessoas selecionadas terão acesso a este sub-chat e poderão interagir com o @meris. Compartilhamento privado, não público.'
              : 'Visualização da lista de participantes. Apenas o criador da análise pode adicionar ou remover pessoas.'}
          </div>
        </div>
        <div className="modal__body">
          <div className="field">
            <label className="field__label">Link do chat</label>
            <div className="share-link">
              <div className="share-link__url" title={shareLink}>{shareLink}</div>
              <button className="btn btn--secondary btn--sm" onClick={copyLink}>
                {linkCopied ? <><I.Check size={13}/> Copiado</> : <><I.Copy size={13}/> Copiar link</>}
              </button>
            </div>
          </div>
          {existingParticipants.length > 0 && (
            <div className="field">
              <label className="field__label">Já participando</label>
              <div className="recipients">
                {existingParticipants.map(u => (
                  <span key={u.id} className="recipient-chip recipient-chip--readonly" title={u.role || ''}>
                    {u.name}
                    {isOwner && onRemoveParticipant && (
                      <button className="recipient-chip__remove" title={`Remover ${u.name}`} aria-label={`Remover ${u.name}`}
                        onClick={() => onRemoveParticipant(u)}>
                        <I.X size={10}/>
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
          {isOwner && (
          <div className="field">
            <label className="field__label">Adicionar pessoas</label>
            <div className="recipients">
              {selected.map(u => (
                <span key={u.id} className="recipient-chip">
                  {u.name}
                  <button className="recipient-chip__remove" onClick={() => setSelected(prev => prev.filter(x => x.id !== u.id))}>
                    <I.X size={10}/>
                  </button>
                </span>
              ))}
              <input
                className="recipients__input"
                placeholder={selected.length ? 'Adicionar mais…' : 'Buscar pessoa…'}
                value={query}
                onChange={e => setQuery(e.target.value)}/>
            </div>
            {query && matches.length > 0 && (
              <div className="suggest">
                {matches.map(u => {
                  const allowed = isAdmContratual(u);
                  return (
                    <button key={u.id} className={`suggest__item ${!allowed ? 'suggest__item--blocked' : ''}`}
                      type="button"
                      onClick={() => {
                        if (!allowed) { setBlockedUser(u); return; }
                        setSelected(prev => [...prev, u]);
                        setQuery('');
                        setBlockedUser(null);
                      }}>
                      <span className="suggest__avatar">{u.name.split(' ').map(s => s[0]).slice(0,2).join('')}</span>
                      <div style={{flex:1, minWidth:0}}>
                        <div className="suggest__name">{u.name}</div>
                        <div className="suggest__role">{u.role}</div>
                      </div>
                      {!allowed && (
                        <span className="suggest__lock" title="Sem acesso à área Gestão Contratual">
                          <I.Lock size={12}/> Bloqueado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {blockedUser && (
              <div className="share-blocked">
                <I.AlertOctagon size={14}/>
                <div className="share-blocked__body">
                  <div className="share-blocked__title">Acesso bloqueado</div>
                  <div className="share-blocked__text">
                    <strong>{blockedUser.name}</strong> ({blockedUser.role}) está fora da área <strong>ADM Contratual</strong>.
                    Esta análise só pode ser compartilhada com pessoas da Gestão Contratual.
                  </div>
                </div>
                <button className="share-blocked__close" onClick={() => setBlockedUser(null)} aria-label="Fechar">
                  <I.X size={12}/>
                </button>
              </div>
            )}
          </div>
          )}
        </div>
        <div className="modal__footer">
          {isOwner ? (
            <>
              <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
              <button className="btn btn--primary"
                disabled={!selected.length}
                onClick={() => onConfirm(selected)}>
                <I.Send size={14}/> Compartilhar
              </button>
            </>
          ) : (
            <button className="btn btn--primary" onClick={onClose}>Fechar</button>
          )}
        </div>
      </div>
    </div>
  );
}

window.ShareAnalysisModal = ShareAnalysisModal;
