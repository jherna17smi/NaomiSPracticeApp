// app.js
// - Registers service worker sw.js (intercepts /api/stories)
// - Renders stories, quizzes, footer flashcard answers
// - Underlines phonics words (ck/ch/wh/th/sh)
// - Fireworks on perfect score
// - Printable Q&A placeholder

// ---------------------------
// 1) Register Service Worker
// ---------------------------
async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported in this browser.');
    return;
  }
  try {
    // Put sw.js at site root; scope '/' so it can catch /api/stories
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('Service Worker registered with scope:', reg.scope);
  } catch (err) {
    console.error('SW registration failed:', err);
  }
}
registerSW();

// ---------------------------
// 2) Data: Questions & Answers
// ---------------------------
const QUIZ = {
  story1: [
    { q: "Where did Whisker go?", options: ["A little shop", "A big ship", "A tall tree"], a: 0 },
    { q: "What did Whisker put in her backpack?", options: ["A snack", "A rock", "A clock"], a: 0 },
    { q: "Who ran the counter at the shop?", options: ["A chick", "A fish", "A duck"], a: 0 },
    { q: "Who did Whisker share with?", options: ["Shell the fish", "Chad the chipmunk", "Whit the whale"], a: 0 },
    { q: "How did Whisker feel?", options: ["It was a whizzy day", "It was a rainy day", "It was a sleepy day"], a: 0 },
  ],
  story2: [
    { q: "Where did Chip find the magic shell?", options: ["By the wharf", "In the woods", "On the hill"], a: 0 },
    { q: "What did the voice say?", options: ["Make a wish!", "Wash the dish!", "Catch the fish!"], a: 0 },
    { q: "What did the picnic bring?", options: ["Bread, chips, chowder", "Cake and tea", "Pasta and soup"], a: 0 },
    { q: "Who would enjoy the picnic?", options: ["His three friends", "Only Chip", "Strangers"], a: 0 },
    { q: "How did they feel at the end?", options: ["Thankful and happy", "Lost and chilly", "Sleepy and grumpy"], a: 0 },
  ]
};

const ANSWERS_TEXT = {
  story1: [
    "Whisker visited a little shop.",
    "She put a snack in her backpack.",
    "A chick ran the counter.",
    "She shared with Shell the fish.",
    "It was a whizzy day!",
  ],
  story2: [
    "He found it by the wharf.",
    "The voice said, “Make a wish!”",
    "Bread, chips, and chowder.",
    "His three friends.",
    "They were thankful and happy.",
  ]
};

// ---------------------------
// 3) Render Quizzes
// ---------------------------
function renderQuiz(containerId, items, prefix){
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  items.forEach((item, idx) => {
    const col = document.createElement('div');
    col.className = "col-12 col-lg-6";
    const card = document.createElement('div');
    card.className = "question";
    card.innerHTML = `
      <p class="fw-semibold mb-2">${idx+1}. ${item.q}</p>
      ${item.options.map((opt, i) => `
        <div class="form-check">
          <input class="form-check-input" type="radio" name="${prefix}-${idx}" id="${prefix}-${idx}-${i}" value="${i}">
          <label class="form-check-label" for="${prefix}-${idx}-${i}">${opt}</label>
        </div>
      `).join("")}
    `;
    col.appendChild(card);
    container.appendChild(col);
  });
}
renderQuiz('quiz1', QUIZ.story1, 's1');
renderQuiz('quiz2', QUIZ.story2, 's2');

// ---------------------------
// 4) Footer Flashcard Answers
// ---------------------------
function buildAnswerCards(containerId, answers, label){
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = ""; // rebuild fresh
  answers.forEach((text, i) => {
    const col = document.createElement('div');
    col.className = "col-12 col-md-6 col-lg-4";
    col.innerHTML = `
      <div class="answer-card card">
        <div class="answer-inner">
          <div class="answer-face d-flex flex-column justify-content-between">
            <strong>${label} — Answer ${i+1}</strong>
            <button class="btn answer-btn mt-2 w-100" type="button">Click me</button>
          </div>
          <div class="answer-face answer-back">
            <p class="m-0"><strong>A${i+1}:</strong> ${escapeHTML(text)}</p>
          </div>
        </div>
      </div>`;
    wrap.appendChild(col);
  });
}
buildAnswerCards('answers1', ANSWERS_TEXT.story1, 'Story 1');
buildAnswerCards('answers2', ANSWERS_TEXT.story2, 'Story 2');

// Flashcard flipping + pink hover already in CSS
document.addEventListener('click', (e)=>{
  if(e.target.classList.contains('answer-btn')){
    const card = e.target.closest('.answer-card');
    card.classList.toggle('flipped');
  }
});

// ---------------------------
// 5) Scoring + Fireworks
// ---------------------------
function computeScore(){
  let score = 0;
  QUIZ.story1.forEach((item, idx)=>{
    const choice = document.querySelector(`input[name="s1-${idx}"]:checked`);
    if(choice && Number(choice.value) === item.a) score++;
  });
  QUIZ.story2.forEach((item, idx)=>{
    const choice = document.querySelector(`input[name="s2-${idx}"]:checked`);
    if(choice && Number(choice.value) === item.a) score++;
  });
  return score;
}
function updateScoreBadge(score){
  const badge = document.getElementById('scoreBadge');
  badge.textContent = `Score: ${score} / 10`;
  badge.classList.remove('text-bg-success','text-bg-danger','text-bg-warning');
  if(score === 10){ badge.classList.add('text-bg-success'); }
  else if(score >= 6){ badge.classList.add('text-bg-warning'); }
  else { badge.classList.add('text-bg-danger'); }
}
document.getElementById('checkAllBtn').addEventListener('click', ()=>{
  const s = computeScore();
  updateScoreBadge(s);
  if(s === 10) launchFireworks();
});

// ---------------------------
// 6) Phonics underline
// ---------------------------
const PHONICS_TARGETS = ["ck","ch","wh","th","sh"];

function underlineTargetsInParagraphs(){
  const paras = document.querySelectorAll('.story-paragraph');
  const bucket = { ck:[], ch:[], wh:[], th:[], sh:[] };

  paras.forEach(p=>{
    const words = p.innerHTML.split(/(\s+)/);
    for(let i=0;i<words.length;i++){
      const raw = words[i];
      const pure = raw.replace(/[^a-zA-Z]/g,'');
      const lower = pure.toLowerCase();
      for(const t of PHONICS_TARGETS){
        if(lower.includes(t) && pure){
          words[i] = raw.replace(pure, `<u>${pure}</u>`);
          bucket[t].push(pure);
          break;
        }
      }
    }
    p.innerHTML = words.join('');
  });

  const list = document.getElementById('phonicsList');
  list.innerHTML = "";
  PHONICS_TARGETS.forEach(t=>{
    const col = document.createElement('div');
    col.className = "col-12 col-md-6 col-lg-4";
    const unique = [...new Set(bucket[t])];
    col.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <h3 class="h6 mb-2"><span class="badge phonics-badge">${t}</span> words</h3>
          <p class="phonics-word mb-0">${unique.length ? unique.map(w=>`<u>${w}</u>`).join(', ') : '<em>Will appear here as you read!</em>'}</p>
        </div>
      </div>`;
    list.appendChild(col);
  });
}
underlineTargetsInParagraphs();

// ---------------------------
// 7) Fetch More Stories (SW API)
// ---------------------------
document.getElementById('loadStoriesBtn').addEventListener('click', fetchStories);
async function fetchStories(){
  try{
    const res = await fetch('/api/stories', { headers:{'Accept':'application/json'} });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    renderFetchedStories(json.stories || []);
  }catch(err){
    console.error(err);
    const wrap = document.getElementById('fetchedStories');
    wrap.innerHTML = `
      <div class="col-12"><div class="alert alert-danger">
        Could not fetch stories. Make sure you're on https or localhost so the service worker can run.
      </div></div>`;
  }
}
function renderFetchedStories(stories){
  const wrap = document.getElementById('fetchedStories');
  wrap.innerHTML = "";
  if(!stories.length){
    wrap.innerHTML = `<div class="col-12"><div class="alert alert-warning">No stories found.</div></div>`;
    return;
  }
  stories.forEach((st)=>{
    const col = document.createElement('div');
    col.className = "col-12 col-lg-6";
    col.innerHTML = `
      <div class="card h-100">
        <div class="card-body d-flex flex-column">
          <h3 class="h5 text-primary">${escapeHTML(st.title)}</h3>
          <p class="mb-3">${escapeHTML(st.body)}</p>
          <div class="mt-auto">
            <h4 class="h6 text-secondary">Questions (placeholder)</h4>
            <ol class="mb-2">
              <li>Who is the main character?</li>
              <li>What fun thing happens?</li>
            </ol>
            <h4 class="h6 text-secondary">Answers (placeholder)</h4>
            <ul class="mb-0">
              <li>(Write the answer here)</li>
              <li>(Write the answer here)</li>
            </ul>
          </div>
        </div>
      </div>`;
    wrap.appendChild(col);
  });
}

// Print the placeholder section
document.getElementById('printBtn').addEventListener('click', ()=>window.print());

// ---------------------------
// 8) Fireworks Celebration
// ---------------------------
let fireCtx, W, H, particles = [], animId = null;
function rand(min,max){ return Math.random()*(max-min)+min; }
function resizeCanvas(){
  const c = document.getElementById('fireworksCanvas');
  c.width = W = window.innerWidth;
  c.height = H = window.innerHeight;
}
function spawnBurst(){
  const x = rand(0.15*W, 0.85*W);
  const y = rand(0.15*H, 0.55*H);
  const count = 80;
  for(let i=0;i<count;i++){
    const angle = (Math.PI*2)*(i/count);
    const speed = rand(2,6);
    particles.push({
      x, y,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed,
      life: rand(40,70),
      age: 0,
      size: rand(1.5,3.5)
    });
  }
}
function step(){
  fireCtx.clearRect(0,0,W,H);
  if(Math.random() < 0.08) spawnBurst();
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.age++;
    const alpha = 1 - (p.age/p.life);
    if(alpha <= 0){ particles.splice(i,1); continue; }
    fireCtx.globalAlpha = Math.max(0, alpha);
    fireCtx.beginPath();
    fireCtx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    const hue = (p.x/W)*360;
    fireCtx.fillStyle = `hsl(${hue}, 90%, 60%)`;
    fireCtx.fill();
  }
  animId = requestAnimationFrame(step);
}
function launchFireworks(){
  const overlay = document.getElementById('celebrateOverlay');
  overlay.style.display = 'block';
  const c = document.getElementById('fireworksCanvas');
  fireCtx = c.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  for(let i=0;i<4;i++) spawnBurst();
  animId = requestAnimationFrame(step);
}
document.getElementById('closeCelebrate').addEventListener('click', ()=>{
  const overlay = document.getElementById('celebrateOverlay');
  overlay.style.display = 'none';
  cancelAnimationFrame(animId);
  particles.length = 0;
  window.removeEventListener('resize', resizeCanvas);
});

// ---------------------------
// 9) Helpers
// ---------------------------
function escapeHTML(str=''){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}
