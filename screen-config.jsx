// Tela 7: Configurações do meta-modelo
function ConfigScreen() {
  const [docs, setDocs] = React.useState(window.PROJECT_DOCS);
  const [freq, setFreq] = React.useState('semanal');

  return (
    <div className="page">
      <div style={{maxWidth:880, margin:'0 auto'}}>
        <div className="section">
          <div className="section__head">
            <span className="section__title">Fonte de comunicação</span>
            <span className="text-xs muted">Pré-conectada · gerenciada pelo time MERIS</span>
          </div>
          <div className="source-card">
            <div className="source-card__icon"><I.Mail size={20}/></div>
            <div className="source-card__body">
              <div className="source-card__name">Matriz de Comunicação: Projeto Boaventura</div>
              <div className="source-card__sub">IMAP · 4 caixas · última sincronização há 2 min · 247 mensagens 24h</div>
            </div>
            <span className="crit-badge" style={{background:'var(--color-success-bg)', color:'var(--color-success-text)'}}>
              <span className="dot dot--ok" style={{boxShadow:'none'}}></span>
              Conectado
            </span>
          </div>
        </div>

        <div className="section">
          <div className="section__head">
            <span className="section__title">Documentos do meta-modelo</span>
            <span className="section__count">{docs.length} arquivos</span>
            <span className="section__divider"></span>
            <button className="btn btn--primary btn--sm"><I.Plus size={14}/> Adicionar documento</button>
          </div>
          <div className="ged-note">
            <I.Folders size={14}/>
            <span>Os documentos do meta-modelo populam automaticamente a pasta <strong>Gestão Contratual</strong> no GED do projeto.</span>
            <a className="ged-note__link" href="#" onClick={e => e.preventDefault()}>Ver no GED <I.ChevronRight size={12}/></a>
          </div>
          {docs.map(d => (
            <div key={d.id} className="doc-row" style={{gridTemplateColumns:'auto 1fr auto auto auto auto auto'}}>
              <div className="doc-row__icon"><I.FileText size={18}/></div>
              <div>
                <div className="doc-row__name">{d.name}</div>
                <div className="doc-row__meta">Adicionado em {d.when}</div>
              </div>
              <span className="doc-row__type">{d.type}</span>
              <span className="doc-row__size">{d.size}</span>
              <button className="icon-btn" title="Substituir"><I.Refresh size={14}/></button>
              <button className="icon-btn" title="Baixar"><I.Download size={14}/></button>
              <button className="icon-btn" title="Remover" onClick={() => setDocs(prev => prev.filter(x => x.id !== d.id))}><I.Trash size={14}/></button>
            </div>
          ))}
        </div>

        <div className="section">
          <div className="section__head">
            <span className="section__title">Frequência dos resumos</span>
          </div>
          <div className="radio-cards">
            {[
              { id: 'diario', title: 'Diário', desc: 'Para fases críticas: comissionamento, partida.' },
              { id: 'semanal', title: 'Semanal', desc: 'Recomendado durante o ciclo normal de obra.' },
            ].map(opt => (
              <button key={opt.id}
                className={`radio-card ${freq === opt.id ? 'radio-card--active' : ''}`}
                onClick={() => setFreq(opt.id)}>
                <div className="radio-card__head">
                  <span className="radio-card__radio"></span>
                  <span className="radio-card__title">{opt.title}</span>
                </div>
                <div className="radio-card__desc">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section__head">
            <span className="section__title">Histórico de alterações</span>
          </div>
          <div style={{background:'#fff', border:'1px solid var(--color-border)', borderRadius:8, padding:'4px 8px'}}>
            <div className="history-row" style={{fontWeight:600, color:'var(--color-text-secondary)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em'}}>
              <span>Quando</span><span>Alteração</span><span>Quem</span>
            </div>
            {window.HISTORY.map((h, i) => (
              <div key={i} className="history-row">
                <span className="history-row__when">{h.when}</span>
                <span style={{color:'var(--color-text-primary)'}}>{h.what}</span>
                <span>{h.who}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.ConfigScreen = ConfigScreen;
