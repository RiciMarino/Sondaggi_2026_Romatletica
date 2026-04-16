let DATA = null;

async function loadData() {
  const res = await fetch('data.json');
  DATA = await res.json();
  init();
}

function init() {
  renderTabs();
  renderSection('tesserati');
}

function renderTabs() {
  const buttons = document.querySelectorAll('.tab-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSection(btn.dataset.section);
    });
  });
}

function renderSection(section) {
  const container = document.getElementById('sectionContent');
  container.innerHTML = '';

  if (section === 'open') {
    renderOpenResponses(container);
    return;
  }

  const sec = DATA.sections[section];

  sec.questions.forEach(q => {
    const card = document.createElement('div');
    card.className = 'panel';

    card.innerHTML = `
      <h3>${q.question}</h3>
      <div class="small">${q.answered_n} risposte</div>
      <ul class="list-clean">
        ${q.responses.map(r => `
          <li>${r.label} – ${r.count} (${r.percent_base}%)</li>
        `).join('')}
      </ul>
    `;

    container.appendChild(card);
  });
}

function renderOpenResponses(container) {
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
          ${t.tag} ${t.total}
          <small>t:${t.areas.tesserati || 0} e:${t.areas.ex || 0} g:${t.areas.genitori || 0}</small>
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
