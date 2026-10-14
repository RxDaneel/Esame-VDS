/* ==========================================================
   ESAME VDS — logica applicativa
   Dati e regole di correzione ricostruiti dall'app originale.
   ========================================================== */

const MATERIA_ORDER = ["1","2","3","4","5","6","7","8","9"];

const state = {
  screen: "device",
  device: localStorage.getItem('vds_device') || null, // "web" | "mobile"
  specialtyKey: null,
  mode: null,          // "esame" | "materia"
  materiaKey: null,
  randomOrder: localStorage.getItem('vds_random_order') === '1',
  questions: [],        // [{materiaKey, materiaNome, domanda, opzioni, esatta, figura}]
  answers: [],           // parallel array, null = non risposta
  index: 0,
  verified: false,
  isReview: false,       // true = sessione di ripasso dei soli errori
};
if(state.device){ state.screen = 'specialty'; }

const $main = document.getElementById('main');
const $topbar = document.getElementById('topbar');
const $btnBack = document.getElementById('btnBack');
const $brandSub = document.getElementById('brandSub');
const $btnDevice = document.getElementById('btnDevice');

document.getElementById('btnInfo').addEventListener('click', ()=>{
  document.getElementById('infoOverlay').hidden = false;
});
document.getElementById('btnCloseInfo').addEventListener('click', ()=>{
  document.getElementById('infoOverlay').hidden = true;
});
$btnBack.addEventListener('click', goBack);
document.getElementById('btnHome').addEventListener('click', goHome);
$btnDevice.addEventListener('click', ()=>{
  const prevScreen = state.screen;
  state.screen = 'device';
  state._returnTo = (prevScreen !== 'device') ? prevScreen : 'specialty';
  render();
});

function applyDeviceClass(){
  document.body.classList.toggle('device-web', state.device === 'web');
  document.body.classList.toggle('device-mobile', state.device === 'mobile');
}

function chooseDevice(d){
  state.device = d;
  localStorage.setItem('vds_device', d);
  applyDeviceClass();
  state.screen = state._returnTo || 'specialty';
  state._returnTo = null;
  render();
}

function goHome(){
  if(state.screen === 'quiz'){
    if(!confirm('Uscire dalla simulazione in corso? I progressi andranno persi.')) return;
  }
  if(state.screen === 'device') return;
  state.specialtyKey = null;
  state.mode = null;
  state.materiaKey = null;
  state.isReview = false;
  state._returnTo = null;
  state.screen = 'specialty';
  render();
}

function goBack(){
  if(state.screen === 'menu'){ state.specialtyKey = null; state.screen = 'specialty'; }
  else if(state.screen === 'subjectPick'){ state.screen = 'menu'; }
  else if(state.screen === 'quiz'){
    if(!confirm('Uscire dalla simulazione in corso? I progressi andranno persi.')) return;
    state.screen = 'menu';
  }
  else if(state.screen === 'results'){ state.screen = 'menu'; }
  else if(state.screen === 'device'){ state.screen = state._returnTo || 'specialty'; state._returnTo = null; }
  render();
}

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function sample(arr, n){
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}
function pct(part, total){ return total ? Math.round((part/total)*100) : 0; }

/* ---------------- ROUTER / RENDER ---------------- */

function render(){
  applyDeviceClass();
  $btnBack.hidden = (state.screen === 'specialty' || state.screen === 'device');
  $brandSub.textContent = subtitleFor(state.screen);
  $main.innerHTML = '';
  const map = {
    device: renderDeviceScreen,
    specialty: renderSpecialtyScreen,
    menu: renderMenuScreen,
    subjectPick: renderSubjectPickScreen,
    quiz: renderQuizScreen,
    results: renderResultsScreen,
  };
  (map[state.screen] || renderSpecialtyScreen)();
  window.scrollTo(0,0);
}

function subtitleFor(screen){
  const sp = state.specialtyKey ? QUIZ_DATA.specialita[state.specialtyKey].nome : null;
  switch(screen){
    case 'device': return 'Simulatore di quiz';
    case 'specialty': return 'Simulatore di quiz';
    case 'menu': return sp;
    case 'subjectPick': return sp + ' · Simula per materia';
    case 'quiz': return sp + (state.isReview ? ' · Ripasso errori' : (state.mode==='esame' ? ' · Simulazione esame' : ' · ' + currentMateriaName()));
    case 'results': return sp + (state.isReview ? ' · Risultati ripasso' : ' · Risultati');
    default: return 'Simulatore di quiz';
  }
}
function currentMateriaName(){
  if(!state.materiaKey) return '';
  return QUIZ_DATA.specialita[state.specialtyKey].materie[state.materiaKey].nome;
}

/* ---------------- SCREEN: DEVICE ---------------- */

function renderDeviceScreen(){
  const el = document.createElement('div');
  el.className = 'screen';
  el.innerHTML = `
    <div class="eyebrow">Preferenze</div>
    <h1 class="screen-title">Come vuoi usare l'app?</h1>
    <p class="screen-sub">Scegli il layout più adatto a come stai guardando questa pagina. Potrai cambiarlo in qualsiasi momento dall'icona in alto.</p>
    <div class="device-grid">
      <button class="device-card" id="cardWeb">
        <span class="device-icon">
          <svg width="26" height="26" viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 20.5h8M12 17v3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </span>
        <span class="device-title">Web / Desktop</span>
        <span class="device-desc">Layout più ampio, pensato per mouse e schermo grande: pannelli affiancati e più contenuto visibile insieme.</span>
      </button>
      <button class="device-card" id="cardMobile">
        <span class="device-icon">
          <svg width="26" height="26" viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="19" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M11 18.5h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </span>
        <span class="device-title">Smartphone</span>
        <span class="device-desc">Layout a colonna singola con pulsanti grandi e barra di navigazione fissa in basso, ottimizzato per il tocco.</span>
      </button>
    </div>
  `;
  $main.appendChild(el);
  el.querySelector('#cardWeb').addEventListener('click', ()=> chooseDevice('web'));
  el.querySelector('#cardMobile').addEventListener('click', ()=> chooseDevice('mobile'));
}

/* ---------------- SCREEN: SPECIALTY ---------------- */

function renderSpecialtyScreen(){
  const el = document.createElement('div');
  el.className = 'screen';
  el.innerHTML = `
    <div class="eyebrow">Passo 1</div>
    <h1 class="screen-title">Scegli la specialità</h1>
    <p class="screen-sub">La banca dati e le quote d'esame corrispondono all'apparecchio VDS scelto, come nel questionario ufficiale.</p>
    <div class="spec-grid" id="specGrid"></div>
    <div class="foot-credit">Ricostruzione fedele del questionario esame_VDS — nuova interfaccia, stessi contenuti</div>
  `;
  $main.appendChild(el);
  const grid = el.querySelector('#specGrid');
  Object.entries(QUIZ_DATA.specialita).forEach(([key, sp])=>{
    const btn = document.createElement('button');
    btn.className = 'spec-card';
    const imgUrl = IMAGES[sp.immagine.split('/').pop()];
    btn.innerHTML = `
      <span class="spec-tag">${sp.num_domande_esame} domande</span>
      <span class="spec-img" style="background-image:url('${imgUrl}')"></span>
      <span class="spec-label">${sp.nome}</span>
    `;
    btn.addEventListener('click', ()=>{
      state.specialtyKey = key;
      state.screen = 'menu';
      render();
    });
    grid.appendChild(btn);
  });
}

/* ---------------- SCREEN: MENU ---------------- */

function renderMenuScreen(){
  const sp = QUIZ_DATA.specialita[state.specialtyKey];
  const el = document.createElement('div');
  el.className = 'screen';
  el.innerHTML = `
    <div class="eyebrow">Passo 2</div>
    <h1 class="screen-title">${sp.nome}</h1>
    <p class="screen-sub">Scegli come vuoi allenarti.</p>
    <div class="mode-grid">
      <button class="mode-card" id="cardEsame">
        <span class="mode-icon">
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 13l6-1.5L15 4l2 1-4 8.5 5-1 2 2-7 3-2 5-2-1 1-5-5-2 1-2 4 2z" fill="currentColor"/></svg>
        </span>
        <span class="mode-title">Simula Esame</span>
        <span class="mode-desc">Estrazione casuale delle domande nelle stesse quote per materia dell'esame reale, con verifica finale e idoneità.</span>
        <span class="mode-meta">${sp.num_domande_esame} DOMANDE · SOGLIA ${Math.floor(sp.num_domande_esame/10)} ERRORI</span>
      </button>
      <button class="mode-card" id="cardMateria">
        <span class="mode-icon">
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </span>
        <span class="mode-title">Simula per Materia</span>
        <span class="mode-desc">Tutte le domande di una singola materia, per studiare un argomento alla volta.</span>
        <span class="mode-meta">9 MATERIE DISPONIBILI</span>
      </button>
    </div>
  `;
  $main.appendChild(el);
  el.querySelector('#cardEsame').addEventListener('click', ()=> startEsame());
  el.querySelector('#cardMateria').addEventListener('click', ()=>{
    state.screen = 'subjectPick';
    render();
  });
}

/* ---------------- SCREEN: SUBJECT PICK ---------------- */

function renderSubjectPickScreen(){
  const sp = QUIZ_DATA.specialita[state.specialtyKey];
  const el = document.createElement('div');
  el.className = 'screen';
  el.innerHTML = `
    <div class="eyebrow">Passo 3</div>
    <h1 class="screen-title">Scegli la materia</h1>
    <p class="screen-sub">Verranno proposte tutte le domande disponibili per la materia selezionata.</p>
    <button class="toggle-row" id="toggleRandom" aria-pressed="${state.randomOrder}">
      <span class="toggle-row-text">
        <span class="toggle-row-title">Ordine casuale</span>
        <span class="toggle-row-desc">Mescola l'ordine delle domande della materia</span>
      </span>
      <span class="toggle-switch ${state.randomOrder?'on':''}"><span class="toggle-knob"></span></span>
    </button>
    <div class="subject-list" id="subjList"></div>
  `;
  $main.appendChild(el);
  el.querySelector('#toggleRandom').addEventListener('click', ()=>{
    state.randomOrder = !state.randomOrder;
    localStorage.setItem('vds_random_order', state.randomOrder ? '1' : '0');
    render();
  });
  const list = el.querySelector('#subjList');
  MATERIA_ORDER.forEach(k=>{
    const m = sp.materie[k];
    const row = document.createElement('button');
    row.className = 'subject-row';
    row.innerHTML = `
      <span class="num">${k}</span>
      <span class="name">${m.nome}</span>
      <span class="count">${m.numero_domande}</span>
    `;
    row.addEventListener('click', ()=> startMateria(k));
    list.appendChild(row);
  });
}

/* ---------------- QUIZ SETUP ---------------- */

function startEsame(){
  const sp = QUIZ_DATA.specialita[state.specialtyKey];
  const qs = [];
  MATERIA_ORDER.forEach((k, i)=>{
    const materia = sp.materie[k];
    const quota = sp.quote_esame[i];
    const picked = sample(materia.domande, quota);
    picked.forEach(d=> qs.push({materiaKey:k, materiaNome: materia.nome, ...d}));
  });
  state.mode = 'esame';
  state.materiaKey = null;
  state.questions = qs;
  state.answers = new Array(qs.length).fill(null);
  state.index = 0;
  state.verified = false;
  state.isReview = false;
  state.screen = 'quiz';
  render();
}

function startMateria(k){
  const sp = QUIZ_DATA.specialita[state.specialtyKey];
  const materia = sp.materie[k];
  let ordered = materia.domande;
  if(state.randomOrder) ordered = shuffle(ordered);
  const qs = ordered.map(d=> ({materiaKey:k, materiaNome: materia.nome, ...d}));
  state.mode = 'materia';
  state.materiaKey = k;
  state.questions = qs;
  state.answers = new Array(qs.length).fill(null);
  state.index = 0;
  state.verified = false;
  state.isReview = false;
  state.screen = 'quiz';
  render();
}

function startReviewWrong(){
  const wrongQs = state.questions.filter((q,i)=> state.answers[i] !== null && state.answers[i] !== q.esatta);
  if(wrongQs.length === 0) return;
  state.questions = wrongQs;
  state.answers = new Array(wrongQs.length).fill(null);
  state.index = 0;
  state.verified = false;
  state.isReview = true;
  state.screen = 'quiz';
  render();
}

/* ---------------- SCREEN: QUIZ ---------------- */

function renderQuizScreen(){
  const total = state.questions.length;
  const q = state.questions[state.index];
  const answered = state.answers.filter(a=>a!==null).length;

  const el = document.createElement('div');
  el.className = 'screen screen-quiz';
  const circumference = 2*Math.PI*18;
  const offset = circumference - (pct(state.index+1,total)/100)*circumference;

  el.innerHTML = `
    <div class="quiz-head">
      <div>
        <div class="materia-chip">${q.materiaNome}</div>
        <div class="quiz-progress-txt">Domanda <b>${state.index+1}</b> / ${total} &nbsp;·&nbsp; risposte date: <b>${answered}</b>/${total}</div>
      </div>
      <div class="gauge-mini">
        <svg width="46" height="46" viewBox="0 0 46 46">
          <circle class="track" cx="23" cy="23" r="18" fill="none" stroke-width="4"/>
          <circle class="fill" cx="23" cy="23" r="18" fill="none" stroke-width="4"
            stroke-linecap="round"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <span class="val">${state.index+1}/${total}</span>
      </div>
    </div>

    <div class="progress-track"><div class="progress-fill" style="width:${pct(state.index+1,total)}%"></div></div>

    <div class="question-card">
      <p class="question-text">${escapeHtml(q.domanda)}</p>
      ${q.figura ? `<img class="question-figure" src="${IMAGES['fig'+q.figura+'.jpg']}" alt="Figura ${q.figura}">` : ''}
      <div class="options" id="optionsWrap"></div>
    </div>

    <div class="quiz-footer">
      <div class="dotmap" id="dotmap"></div>

      <div class="quiz-nav">
        <div class="side">
          <button class="btn btn-ghost" id="btnPrev" ${state.index===0?'disabled':''}>← Precedente</button>
        <button class="btn btn-ghost" id="btnNext" ${state.index===total-1?'disabled':''}>Successivo →</button>
      </div>
      <button class="btn btn-primary" id="btnVerify">Verifica risultati</button>
      </div>
    </div>
  `;
  $main.appendChild(el);

  const optWrap = el.querySelector('#optionsWrap');
  const given = state.answers[state.index];
  q.opzioni.forEach((opt, i)=>{
    const b = document.createElement('button');
    let cls = 'option';
    if(given === i) cls += ' selected';
    if(given !== null){
      if(i === q.esatta) cls += ' correct';
      else if(i === given) cls += ' wrong';
    }
    b.className = cls;
    b.innerHTML = `<span class="letter">${String.fromCharCode(65+i)}</span><span>${escapeHtml(opt)}</span>`;
    b.addEventListener('click', ()=>{
      state.answers[state.index] = i;
      if(state.index < total - 1){
        state.index++;
      }
      render();
    });
    optWrap.appendChild(b);
  });

  const dotmap = el.querySelector('#dotmap');
  state.questions.forEach((qq, i)=>{
    const ans = state.answers[i];
    let cls = 'dot';
    if(i===state.index) cls += ' current';
    if(ans !== null) cls += (ans === qq.esatta ? ' correct' : ' wrong');
    const d = document.createElement('button');
    d.className = cls;
    d.title = 'Domanda ' + (i+1);
    d.addEventListener('click', ()=>{ state.index = i; render(); });
    dotmap.appendChild(d);
  });

  el.querySelector('#btnPrev').addEventListener('click', ()=>{ state.index--; render(); });
  el.querySelector('#btnNext').addEventListener('click', ()=>{ state.index++; render(); });
  el.querySelector('#btnVerify').addEventListener('click', ()=>{
    state.verified = true;
    state.screen = 'results';
    render();
  });
}

/* ---------------- SCREEN: RESULTS ---------------- */

function renderResultsScreen(){
  const total = state.questions.length;
  let esatte=0, errate=0, bianche=0;
  state.questions.forEach((q,i)=>{
    const a = state.answers[i];
    if(a===null) bianche++;
    else if(a===q.esatta) esatte++;
    else errate++;
  });
  const maxErrate = Math.floor(total/10);
  const idoneo = esatte >= (total - maxErrate);

  const circumference = 2*Math.PI*58;
  const offset = circumference - (pct(esatte,total)/100)*circumference;

  const el = document.createElement('div');
  el.className = 'screen';
  el.innerHTML = `
    <div class="eyebrow">Esito</div>
    <h1 class="screen-title">${state.isReview ? 'Risultato ripasso errori' : (state.mode==='esame' ? 'Risultato simulazione esame' : 'Risultato — ' + currentMateriaName())}</h1>

    <div class="result-top">
      <div class="gauge-big">
        <svg width="132" height="132" viewBox="0 0 132 132">
          <circle class="track" cx="66" cy="66" r="58" fill="none" stroke-width="9"/>
          <circle class="fill ${idoneo ? 'is-pass' : 'is-fail'}" cx="66" cy="66" r="58" fill="none" stroke-width="9"
            stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="center"><b>${pct(esatte,total)}%</b><span>corrette</span></div>
      </div>
      <div class="result-info">
        <div class="result-badge ${idoneo?'pass':'fail'}">${idoneo ? 'IDONEO' : 'NON IDONEO'}</div>
        <div class="result-stats">
          <div class="stat esatte"><b>${esatte}</b><span>Esatte</span></div>
          <div class="stat errate"><b>${errate}</b><span>Errate</span></div>
          <div class="stat bianche"><b>${bianche}</b><span>Non risposte</span></div>
        </div>
      </div>
    </div>

    <div class="quiz-nav" style="margin-bottom:8px;">
      <button class="btn btn-ghost" id="btnRetry">↻ Riprova</button>
      ${errate > 0 ? `<button class="btn btn-primary" id="btnReviewWrong">Ripassa ${errate===1 ? '1 errore' : errate+' errori'}</button>` : ''}
      <button class="btn ${errate > 0 ? 'btn-ghost' : 'btn-primary'}" id="btnMenu">Torna al menu</button>
    </div>

    <div class="section-label">Revisione domande</div>
    <div id="reviewList"></div>
  `;
  $main.appendChild(el);

  const list = el.querySelector('#reviewList');
  state.questions.forEach((q,i)=>{
    const a = state.answers[i];
    const status = a===null ? 'blank' : (a===q.esatta ? 'ok' : 'no');
    const item = document.createElement('div');
    item.className = 'review-item';
    item.innerHTML = `
      <div class="review-head">
        <span class="review-status ${status}">${status==='ok'?'✓':status==='no'?'✕':'–'}</span>
        <span>DOMANDA ${i+1} · ${q.materiaNome.toUpperCase()}</span>
      </div>
      <p class="review-q">${escapeHtml(q.domanda)}</p>
      ${q.figura ? `<img class="question-figure" src="${IMAGES['fig'+q.figura+'.jpg']}" alt="Figura ${q.figura}">` : ''}
      <div class="review-opts">
        ${q.opzioni.map((opt,oi)=>{
          let cls = '';
          if(oi===q.esatta) cls='correct';
          else if(oi===a) cls='wrong';
          return `<div class="review-opt ${cls}"><span class="letter">${String.fromCharCode(65+oi)}</span><span>${escapeHtml(opt)}</span></div>`;
        }).join('')}
      </div>
    `;
    list.appendChild(item);
  });

  el.querySelector('#btnRetry').addEventListener('click', ()=>{
    if(state.mode==='esame') startEsame(); else startMateria(state.materiaKey);
  });
  if(errate > 0){
    el.querySelector('#btnReviewWrong').addEventListener('click', startReviewWrong);
  }
  el.querySelector('#btnMenu').addEventListener('click', ()=>{
    state.screen = 'menu';
    render();
  });
}

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

render();
