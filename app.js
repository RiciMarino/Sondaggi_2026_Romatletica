let DATA = null;

async function loadData() {
  const res = await fetch('data.json');
  DATA = await res.json();
  init();
}

function init() {
  bindTabs();
  renderSummary();
  renderSection('tesserati');
}

function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = function () {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderSection(this.dataset.section);
    };
  });
}

function renderSummary() {
  document.getElementById('strengths').innerHTML =
    DATA.analyses.strengths.map(s =>
      `<li>${s.label} – <strong>${s.value}%</strong></li>`
    ).join('');

  document.getElementById('weaknesses').innerHTML =
    DATA.analyses.weaknesses.map(w =>
      `<li>${w.label}</li>`
    ).join('');
}

function renderSection(section) {
  const container = document.getElementById('sectionContent');
  container.innerHTML = '';

  if (section === 'open') {
    renderOpen(container);
    return;
  }

  const sec = DATA.sections[section];

  sec.questions.forEach((q, i) => {
    const canvasId = `chart-${section}-${i}`;

    const div = document.createElement('div');
    div.className = 'panel';

    div.innerHTML = `
      <h3>${q.question}</h3>
      <canvas id="${canvasId}"></canvas>
    `;

    container.appendChild(div);

    new Chart(document.getElementById(canvasId), {
      type: 'doughnut',
      data: {
        labels: q.responses.map(r => r.label),
        datasets: [{
          data: q.responses.map(r => r.count),
          backgroundColor: ['#365b49','#7ea66a','#a8c09a','#d7c57b']
        }]
      }
    });
  });
}

function renderOpen(container) {
  const open = DATA.open_responses;

  container.innerHTML = `
    <div class="panel">
      <h2>Tag</h2>
      ${open.tag_summary.map(t => `<div>${t.tag} (${t.total})</div>`).join('')}
    </div>

    <div class="panel">
      <h2>Commenti</h2>
      ${open.responses.map(r => `<p><b>${r.area}</b>: ${r.text}</p>`).join('')}
    </div>
  `;
}

loadData();
