let DATA = null;

async function loadData() {
  const res = await fetch('data.json');
  DATA = await res.json();
  init();
}

function init() {
  bindTabs();
  renderSection('tesserati');
}

function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      renderSection(this.dataset.section);
    });
  });
}

function renderSection(section) {
  const container = document.getElementById('sectionContent');
  container.innerHTML = '';

  // 👉 RISPOSTE APERTE
  if (section === 'open') {
    renderOpen(container);
    return;
  }

  const sec = DATA.sections[section];

  sec.questions.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'panel chart-card';

    const canvasId = `chart-${section}-${i}`;

    div.innerHTML = `
      <h3>${q.question}</h3>
      <div class="small">${q.answered_n} risposte</div>
      <div class="canvas-wrap">
        <canvas id="${canvasId}"></canvas>
      </div>
    `;

    container.appendChild(div);

    // GRAFICO A TORTA
    const ctx = document.getElementById(canvasId);

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: q.responses.map(r => r.label),
        datasets: [{
          data: q.responses.map(r => r.count),
          backgroundColor: [
            '#365b49',
            '#7ea66a',
            '#a8c09a',
            '#d7c57b',
            '#cfe3c6'
          ]
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  });
}

function renderOpen(container) {
  const open = DATA.open_responses;

  const wrapper = document.createElement('div');
  wrapper.className = 'grid-2';

  // TAG
  const tagBox = document.createElement('div');
  tagBox.className = 'panel';

  tagBox.innerHTML = `
    <h2>Tag risposte aperte</h2>
    <div class="tag-cloud">
      ${open.tag_summary.map(t => `
        <div class="tag-bubble">
          ${t.tag} (${t.total})
        </div>
      `).join('')}
    </div>
  `;

  // TABELLA
  const tableBox = document.createElement('div');
  tableBox.className = 'panel';

  tableBox.innerHTML = `
    <h2>Risposte aperte</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Area</th>
            <th>Tag</th>
            <th>Commento</th>
          </tr>
        </thead>
        <tbody>
          ${open.responses.map(r => `
            <tr>
              <td>${r.area}</td>
              <td>${r.tags.join(', ')}</td>
              <td>${r.text}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  wrapper.appendChild(tagBox);
  wrapper.appendChild(tableBox);
  container.appendChild(wrapper);
}

loadData();
