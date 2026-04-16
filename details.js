
const palette = ['#365B49','#7EA66A','#A9C58A','#D7C57B','#A8BDB1','#708D81','#CFE0C3','#E8F1E5','#8BB3A0','#B9C46B'];
let data = null;
function escapeHtml(str=''){ return str.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function getParam(name){ return new URLSearchParams(window.location.search).get(name); }

async function init(){
  data = await (await fetch('data.json')).json();
  const sectionKey = getParam('section') || 'tesserati';
  const questionId = getParam('question');
  const section = data.sections[sectionKey];
  const question = section.questions.find(q => q.id === questionId) || section.questions[0];

  document.getElementById('pageTitle').textContent = `${section.label} · ${question.question}`;
  document.getElementById('breadcrumb').innerHTML = `<a href="index.html">Dashboard</a> · <span>${escapeHtml(section.label)}</span>`;
  document.getElementById('questionTitle').textContent = question.question;
  document.getElementById('meta').textContent = `${question.answered_n} risposte su ${question.base_n}`;

  new Chart(document.getElementById('detailChart'), {
    type: 'doughnut',
    data: {
      labels: question.responses.map(r => r.label),
      datasets: [{
        data: question.responses.map(r => r.count),
        backgroundColor: question.responses.map((_,i)=> palette[i % palette.length]),
        borderWidth:0
      }]
    },
    options: {
      maintainAspectRatio:false,
      plugins:{legend:{position:'bottom'}},
      cutout:'50%'
    }
  });

  document.getElementById('tableBody').innerHTML = question.responses.map((r, i) => `
    <tr>
      <td><span class="swatch" style="background:${palette[i % palette.length]}"></span> ${escapeHtml(r.label)}</td>
      <td>${r.count}</td>
      <td>${r.percent_base.toFixed(1)}%</td>
      <td>${r.percent_answered.toFixed(1)}%</td>
    </tr>
  `).join('');

  if(question.summary){
    document.getElementById('summaryBox').innerHTML = `
      <div class="kpi-strip">
        <div class="kpi-pill">Positive: ${question.summary.positive_pct.toFixed(1)}%</div>
        <div class="kpi-pill">Neutre: ${question.summary.neutral_pct.toFixed(1)}%</div>
        <div class="kpi-pill">Critiche: ${question.summary.negative_pct.toFixed(1)}%</div>
      </div>
    `;
  }

  const nav = document.getElementById('otherQuestions');
  nav.innerHTML = section.questions.map(q => `
    <li><a href="dettagli.html?section=${encodeURIComponent(sectionKey)}&question=${encodeURIComponent(q.id)}">${escapeHtml(q.question)}</a></li>
  `).join('');
}
init();
