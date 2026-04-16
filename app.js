
const palette = ['#365B49','#7EA66A','#A9C58A','#D7C57B','#A8BDB1','#708D81','#CFE0C3','#E8F1E5','#8BB3A0','#B9C46B'];

let surveyData = null;

function pct(v){ return typeof v === 'number' ? `${v.toFixed(1)}%` : v; }
function escapeHtml(str=''){ return str.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function getSection(sectionKey){ return surveyData.sections[sectionKey]; }
function findQuestion(sectionKey, questionId){ return getSection(sectionKey).questions.find(q => q.id === questionId); }

function doughnutConfig(question){
  return {
    type: 'doughnut',
    data: {
      labels: question.responses.map(r => r.label),
      datasets: [{
        data: question.responses.map(r => r.count),
        backgroundColor: question.responses.map((_,i)=> palette[i % palette.length]),
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw} risposte`
          }
        }
      },
      cutout: '54%'
    }
  };
}

function renderSummaryCards(){
  const wrap = document.getElementById('summaryCards');
  wrap.innerHTML = surveyData.summary_cards.map(card => `
    <div class="card">
      <div class="eyebrow">${escapeHtml(card.title)}</div>
      <div class="value">${escapeHtml(String(card.value))}</div>
      <div class="subtitle">${escapeHtml(card.subtitle)}</div>
    </div>
  `).join('');
}

function renderAnalysis(){
  document.getElementById('strengths').innerHTML = surveyData.analyses.strengths.map(item =>
    `<li><strong>${escapeHtml(item.label)}</strong>: ${escapeHtml(String(item.value))}${String(item.value).includes('%') ? '' : '%'} <span class="small">(n=${item.base_n})</span></li>`
  ).join('');

  document.getElementById('weaknesses').innerHTML = surveyData.analyses.weaknesses.map(item => {
    const suffix = item.type?.includes('pct') ? '%' : ' citazioni';
    return `<li><strong>${escapeHtml(item.label)}</strong>: ${escapeHtml(String(item.value))}${suffix}</li>`;
  }).join('');

  document.getElementById('insights').innerHTML = surveyData.analyses.insights.map(item => `
    <div class="panel">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.text)}</p>
    </div>
  `).join('');
}

function renderOpenTags(){
  const box = document.getElementById('tagCloud');
  box.innerHTML = surveyData.open_responses.tag_summary.map(tag => {
    const areaStr = Object.entries(tag.areas).map(([k,v]) => `${k}: ${v}`).join(' · ');
    return `<div class="tag-bubble">${escapeHtml(tag.tag)} <small>${tag.total} · ${escapeHtml(areaStr)}</small></div>`;
  }).join('');

  const table = document.getElementById('openTableBody');
  table.innerHTML = surveyData.open_responses.responses.map(row => `
    <tr>
      <td>${escapeHtml(row.area)}</td>
      <td>${escapeHtml(row.tags.join(', '))}</td>
      <td>${escapeHtml(row.text)}</td>
    </tr>
  `).join('');
}

function renderSection(sectionKey){
  const section = getSection(sectionKey);
  const host = document.getElementById('sectionContent');

  host.innerHTML = `
    <div class="panel">
      <h2>${escapeHtml(section.label)}</h2>
      <div class="kpi-strip">
        <div class="kpi-pill">Base: ${section.base_n}</div>
        <div class="kpi-pill">Domande: ${section.questions.length}</div>
      </div>
      <p class="small">Grafici a torta con quota percentuale e collegamento ai dettagli per ogni domanda.</p>
    </div>
    <div class="chart-grid" id="chartsGrid"></div>
  `;

  const grid = document.getElementById('chartsGrid');
  section.questions.forEach((q, idx) => {
    const lead = q.responses[0];
    const html = document.createElement('div');
    html.className = 'panel chart-card';
    html.innerHTML = `
      <h3>${escapeHtml(q.question)}</h3>
      <div class="chart-topline">
        <span>${q.answered_n} risposte su ${q.base_n}</span>
        <span>${lead ? escapeHtml(lead.label) + ' · ' + lead.percent_base.toFixed(1) + '%' : ''}</span>
      </div>
      <div class="canvas-wrap"><canvas id="chart-${sectionKey}-${idx}"></canvas></div>
      <div class="legend">
        ${q.responses.map((r,i) => `
          <div class="legend-item">
            <span class="swatch" style="background:${palette[i % palette.length]}"></span>
            <span>${escapeHtml(r.label)}</span>
            <span>${r.count} · ${r.percent_base.toFixed(1)}%</span>
          </div>
        `).join('')}
      </div>
      <div class="actions"><a class="btn-link" href="dettagli.html?section=${encodeURIComponent(sectionKey)}&question=${encodeURIComponent(q.id)}">Apri dettagli</a></div>
    `;
    grid.appendChild(html);
    new Chart(document.getElementById(`chart-${sectionKey}-${idx}`), doughnutConfig(q));
  });
}

async function init(){
  console.log("Uso dati già presenti in app.js");

  document.getElementById('generatedOn').textContent = surveyData.generated_on;
  renderSummaryCards();
  renderAnalysis();
  renderOpenTags();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      renderSection(btn.dataset.section);
    });
  });
  renderSection('tesserati');
}

init();
