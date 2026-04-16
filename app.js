const palette = ['#365B49','#7EA66A','#A9C58A','#D7C57B','#A8BDB1','#708D81','#CFE0C3','#E8F1E5','#8BB3A0','#B9C46B'];

let surveyData = null;
let currentSectionKey = 'tesserati';
const chartInstances = [];

const sectionDescriptions = {
  tesserati: 'Atleti che hanno indicato di allenarsi regolarmente oppure saltuariamente con la società.',
  autonomi: 'Tesserati che oggi si allenano in autonomia ma mantengono un legame con Romatletica.',
  ex: 'Ex tesserati che hanno dichiarato di non allenarsi più.',
  genitori: 'Genitori dei tesserati che hanno risposto al questionario dedicato.'
};

function escapeHtml(value = '') {
  return String(value).replace(/[&<>\"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[c]));
}

function getSection(sectionKey) {
  return surveyData?.sections?.[sectionKey] || null;
}

function safeSetHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function formatPercent(value) {
  const num = Number(value);
  return Number.isFinite(num) ? `${num.toFixed(1)}%` : escapeHtml(value);
}

function destroyCharts() {
  while (chartInstances.length) {
    const chart = chartInstances.pop();
    try { chart.destroy(); } catch (_) {}
  }
}

function doughnutConfig(question) {
  return {
    type: 'doughnut',
    data: {
      labels: question.responses.map((r) => r.label),
      datasets: [{
        data: question.responses.map((r) => r.count),
        backgroundColor: question.responses.map((_, i) => palette[i % palette.length]),
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

function renderSummaryCards() {
  const cards = Array.isArray(surveyData?.summary_cards) ? surveyData.summary_cards : [];
  safeSetHtml('summaryCards', cards.map((card) => `
    <div class="card card-kpi">
      <div class="eyebrow">${escapeHtml(card.title)}</div>
      <div class="value">${escapeHtml(card.value)}</div>
      <div class="subtitle">${escapeHtml(card.subtitle)}</div>
    </div>
  `).join(''));
}

function renderAnalysis() {
  const strengths = Array.isArray(surveyData?.analyses?.strengths) ? surveyData.analyses.strengths : [];
  const weaknesses = Array.isArray(surveyData?.analyses?.weaknesses) ? surveyData.analyses.weaknesses : [];
  const insights = Array.isArray(surveyData?.analyses?.insights) ? surveyData.analyses.insights : [];

  safeSetHtml('strengths', strengths.map((item) => `
    <li>
      <strong>${escapeHtml(item.label)}</strong>: ${formatPercent(item.value)}${item.base_n ? ` <span class="small">(n=${item.base_n})</span>` : ''}
    </li>
  `).join(''));

  safeSetHtml('weaknesses', weaknesses.map((item) => {
    const suffix = String(item.type || '').includes('pct') ? '%' : ' citazioni';
    const value = Number.isFinite(Number(item.value)) ? item.value : escapeHtml(item.value);
    return `<li><strong>${escapeHtml(item.label)}</strong>: ${value}${suffix}</li>`;
  }).join(''));

  safeSetHtml('insights', insights.map((item) => `
    <div class="panel panel-soft">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.text)}</p>
    </div>
  `).join(''));
}

function renderOpenTags() {
  const tags = Array.isArray(surveyData?.open_responses?.tag_summary) ? surveyData.open_responses.tag_summary : [];
  const totals = surveyData?.open_responses?.totals || {};
  const responses = Array.isArray(surveyData?.open_responses?.responses) ? surveyData.open_responses.responses : [];

  safeSetHtml('tagCloud', tags.map((tag) => {
    const areaStr = Object.entries(tag.areas || {}).map(([k, v]) => `${k}: ${v}`).join(' · ');
    return `<div class="tag-bubble">${escapeHtml(tag.tag)} <small>${escapeHtml(tag.total)} · ${escapeHtml(areaStr)}</small></div>`;
  }).join(''));

  safeSetHtml('openResponseTotals', Object.entries(totals).map(([area, count]) => `
    <div class="kpi-pill">${escapeHtml(area)}: ${escapeHtml(count)}</div>
  `).join(''));

  safeSetHtml('openTableBody', responses.map((row) => `
    <tr>
      <td>${escapeHtml(row.area)}</td>
      <td>${escapeHtml((row.tags || []).join(', '))}</td>
      <td>${escapeHtml(row.text)}</td>
    </tr>
  `).join(''));
}

function renderSectionMenu() {
  const host = document.getElementById('sectionMenu');
  if (!host) return;

  const entries = Object.entries(surveyData?.sections || {});
  host.innerHTML = entries.map(([key, section]) => `
    <button type="button" class="menu-card ${key === currentSectionKey ? 'active' : ''}" data-section="${escapeHtml(key)}">
      <span class="menu-card-eyebrow">${escapeHtml(section.label)}</span>
      <span class="menu-card-value">${escapeHtml(section.base_n)}</span>
      <span class="menu-card-copy">risposte valide</span>
      <span class="menu-card-link">Apri sezione</span>
    </button>
  `).join('');

  host.querySelectorAll('.menu-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentSectionKey = btn.dataset.section;
      renderSectionMenu();
      renderTabs();
      renderSection(currentSectionKey);
      document.getElementById('surveySections')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderTabs() {
  const host = document.getElementById('sectionTabs');
  if (!host) return;

  host.innerHTML = Object.entries(surveyData?.sections || {}).map(([key, section]) => `
    <button type="button" class="tab-btn ${key === currentSectionKey ? 'active' : ''}" data-section="${escapeHtml(key)}">${escapeHtml(section.label)}</button>
  `).join('');

  host.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentSectionKey = btn.dataset.section;
      renderSectionMenu();
      renderTabs();
      renderSection(currentSectionKey);
    });
  });
}

function renderSection(sectionKey) {
  const section = getSection(sectionKey);
  const host = document.getElementById('sectionContent');
  if (!section || !host) return;

  safeSetText('sectionTitle', section.label || 'Sezione');
  safeSetText('sectionDescription', sectionDescriptions[sectionKey] || '');

  host.innerHTML = `
    <div class="section-intro">
      <div class="kpi-strip">
        <div class="kpi-pill">Base: ${escapeHtml(section.base_n)}</div>
        <div class="kpi-pill">Domande: ${escapeHtml(section.questions?.length || 0)}</div>
      </div>
      <p class="small">Grafici a torta con quota percentuale e collegamento ai dettagli per ogni domanda.</p>
    </div>
    <div class="chart-grid" id="chartsGrid"></div>
  `;

  destroyCharts();
  const grid = document.getElementById('chartsGrid');
  if (!grid) return;

  (section.questions || []).forEach((q, idx) => {
    const sorted = [...(q.responses || [])].sort((a, b) => Number(b.percent_base || 0) - Number(a.percent_base || 0));
    const best = sorted[0];
    const card = document.createElement('div');
    card.className = 'panel chart-card';
    card.innerHTML = `
      <div class="chart-card-head">
        <h3>${escapeHtml(q.question)}</h3>
        <span class="question-badge">${q.type === 'multi' ? 'Risposta multipla' : 'Risposta singola'}</span>
      </div>
      <div class="chart-topline">
        <span>${escapeHtml(q.answered_n)} risposte su ${escapeHtml(q.base_n)}</span>
        <span>${best ? `${escapeHtml(best.label)} · ${Number(best.percent_base).toFixed(1)}%` : ''}</span>
      </div>
      <div class="canvas-wrap"><canvas id="chart-${sectionKey}-${idx}"></canvas></div>
      <div class="legend">
        ${(q.responses || []).map((r, i) => `
          <div class="legend-item">
            <span class="swatch" style="background:${palette[i % palette.length]}"></span>
            <span>${escapeHtml(r.label)}</span>
            <span>${escapeHtml(r.count)} · ${Number(r.percent_base).toFixed(1)}%</span>
          </div>
        `).join('')}
      </div>
      <div class="actions"><a class="btn-link" href="dettagli.html?section=${encodeURIComponent(sectionKey)}&question=${encodeURIComponent(q.id)}">Apri dettagli</a></div>
    `;
    grid.appendChild(card);

    if (window.Chart) {
      const canvas = document.getElementById(`chart-${sectionKey}-${idx}`);
      if (canvas) {
        chartInstances.push(new Chart(canvas, doughnutConfig(q)));
      }
    }
  });
}

async function init() {
  try {
    const res = await fetch(`data.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    surveyData = await res.json();

    safeSetText('generatedOn', surveyData.generated_on || '');
    renderSummaryCards();
    renderAnalysis();
    renderOpenTags();
    renderSectionMenu();
    renderTabs();
    renderSection(currentSectionKey);
  } catch (error) {
    console.error('Errore caricamento dashboard:', error);
    safeSetHtml('summaryCards', '<div class="panel"><p>Impossibile caricare i dati del sondaggio.</p></div>');
  }
}

window.addEventListener('DOMContentLoaded', init);
