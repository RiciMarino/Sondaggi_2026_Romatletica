let DATA = null;

async function loadData() {
  const res = await fetch('data.json');
  DATA = await res.json();
  setup();
}

function setup() {
  bindTabs();
  renderSection('tesserati');
}

function bindTabs() {
  const buttons = document.querySelectorAll('.tab-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', function () {
      buttons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const section = this.dataset.section;
      renderSection(section);
    });
  });
}

function renderSection(section) {
  const container = document.getElementById('sectionContent');
  container.innerHTML = '';

  if (section === 'open') {
    renderOpen(container);
    return;
  }

  const sec = DATA.sections[section];

  sec.questions.forEach(q => {
    const div = document.createElement('div');
    div.className = 'panel';

    div.innerHTML = `
      <h3>${q.question}</h3>
      <div class="small">${q.answered_n} risposte</div>
      <ul class="list-clean">
        ${q.responses.map(r => `
          <li>${r.label} – ${r.count} (${r.percent_base}%)</li>
        `).join('')}
      </ul>
    `;

    container.appendChild(div);
  });
}

function renderOpen(container) {
  const open = DATA.open_responses;

  const wrapper = document.createElement('div');
  wrapper.className = 'grid-2';

  const tagBox = document.createElement('div');
  tagBox.className = 'panel';

  tagBox.innerHTML = `
    <h2>Tag</h2>
    <div class="tag-cloud">
      ${open.tag_summary.map(t => `
        <div class="tag-bubble">
          ${t.tag} (${t.total})
        </div>
      `).join('')}
    </div>
  `;

  const tableBox = document.createElement('div');
  tableBox.className = 'panel';

  tableBox.innerHTML = `
    <h2>Risposte</h2>
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
