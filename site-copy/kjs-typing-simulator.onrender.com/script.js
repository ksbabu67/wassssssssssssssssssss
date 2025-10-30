// Typing Bubbles Game - Basic implementation
// kid-friendly short words (2-4 letters) for children under 6
// We build a small weighted word list so certain words appear more commonly.
const baseWords = [
  'cat','dog','sun','cup','car','hat','ball','bee','egg','pig',
  'cow','fox','bat','bee','ant','tree','fish','book','star','cake'
];

// Words the user asked to make common. Higher weight => higher frequency.
const weightMap = {
  'apple': 12,
  'pie': 10,
  'apple pie': 18,
  'mangoes': 10,
  'peach': 10,
  'jeshvik': 8,
  'aarav': 8,
  'sigma': 6,
  'rizz': 6
};

// build the final weighted words array (keeps size small and predictable)
const words = [];
// give base words a small default weight
for (const w of baseWords){
  for (let i = 0; i < 2; i++) words.push(w);
}
// add weighted words according to weightMap
for (const [w, wt] of Object.entries(weightMap)){
  for (let i = 0; i < wt; i++) words.push(w);
}

const gameArea = document.getElementById('gameArea');
const collectedEl = document.getElementById('collected');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const voiceToggle = document.getElementById('voiceToggle');
const hintLetterEl = document.getElementById('hintLetter');
const currentTypedEl = document.getElementById('currentTyped');
const info = document.getElementById('info');
const touchKeyboard = document.getElementById('touchKeyboard');
const bigTimerEl = document.getElementById('bigTimer');

let bubbles = new Map(); // id -> {el, word, index, spawnTime}
let nextId = 1;
let collected = '';
let score = 0;
let running = false;
let spawnInterval = null;
let lastTick = null;
let startTime = 0;
// game duration in seconds (1 minute)
let gameDuration = 60;
// external split-screen timer iframe references
// removed external split-screen timer iframe (no external iframe will be opened)

function rand(min,max){return Math.random()*(max-min)+min}

function createBubble(word){
  const id = nextId++;
  const el = document.createElement('div');
  el.className = 'bubble large';
  el.textContent = word;
  el.dataset.id = id;

  // random horizontal position (within gameArea)
  const areaRect = gameArea.getBoundingClientRect();
  const x = rand(6, areaRect.width - 120);
  const y = areaRect.height + 40; // start below view
  el.style.left = x + 'px';
  el.style.top = y + 'px';

  // set animation duration based on word length and difficulty
  // make bubbles slow and easy to read for very young kids
  const dur = rand(12, 18);
  el.style.animation = `floatUp ${dur}s linear forwards`;

  gameArea.appendChild(el);

  const meta = {el, word, index:0, spawnTime:performance.now(), dur};
  bubbles.set(String(id), meta);

  // update hint and optionally speak the word
  updateHint(word[0]);
  if (currentTypedEl) currentTypedEl.textContent = '';
  if (isVoiceEnabled()) speakWord(word);

  // remove when animation ends (if not popped earlier)
  el.addEventListener('animationend', ()=>{
    if (bubbles.has(String(id))){
      // word reached top — remove and don't penalize heavily for kids
      try{ if (el.parentNode) el.parentNode.removeChild(el); } catch(e){}
      bubbles.delete(String(id));
    }
  });
}

function updateHint(letter){
  hintLetterEl.textContent = letter ? letter.toUpperCase() : '';
}

function isVoiceEnabled(){
  return !!(voiceToggle && voiceToggle.checked && window.speechSynthesis);
}

function speakWord(word){
  try{
    const s = new SpeechSynthesisUtterance(word);
    s.rate = 0.9; s.pitch = 1.1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(s);
  }catch(e){/* ignore if not supported */}
}

// spawn only one bubble at a time for young children
function spawnLoop(){
  if (!running) return;
  if (bubbles.size > 0) return; // wait until bubble is popped or gone
  const w = words[Math.floor(Math.random()*words.length)];
  createBubble(w);
}

function startGame(){
  if (running) return;
  running = true;
  info.style.display = 'none';
  startBtn.disabled = true;
  resetBtn.disabled = false;
  startTime = performance.now();
  lastTick = startTime;
  // start the tick loop for the countdown timer
  requestAnimationFrame(tick);
  // show large countdown
  try{ if (bigTimerEl){ bigTimerEl.classList.add('running'); bigTimerEl.style.display = 'flex'; }}catch(e){}
  // spawn every 1200ms initially
  spawnInterval = setInterval(spawnLoop, 1200);
  // give focus to game area so it receives key events
  gameArea.focus();
  // show touch keyboard on small screens
  if (window.innerWidth <= 700) buildTouchKeyboard();
  // (split-screen timer removed)
}

function resetGame(){
  // stop and clear bubbles
  running = false;
  startBtn.disabled = false;
  resetBtn.disabled = true;
  info.style.display = 'block';
  clearInterval(spawnInterval);
  spawnInterval = null;
  bubbles.forEach((meta,id)=>{
    if (meta.el && meta.el.parentNode) meta.el.parentNode.removeChild(meta.el);
  });
  bubbles.clear();
  collected = '';
  score = 0;
  updateCollected();
  updateScore();
  timerEl.textContent = 'Time: 0.0s';
  // clear any big timer/game over display
  clearBigTimer();
  // remove play again button if present
  try{ const btn = document.getElementById('playAgainBtn'); if (btn) btn.remove(); }catch(e){}
}

// clear bigTimer display when reset
function clearBigTimer(){
  try{ const big = document.getElementById('bigTimer'); if (big){ big.textContent = ''; big.style.display = 'none'; }}catch(e){}
}

function updateScore(){ scoreEl.textContent = `Score: ${score}` }
function updateCollected(){ collectedEl.textContent = collected }

function onKey(e){
  if (!running) return;
  // support both KeyboardEvent and synthetic objects from touch keys
  const key = (typeof e === 'string') ? e : (e.key || '');
  if (!key || key.length !== 1) return;
  const ch = key.toLowerCase();

  // Require full-word typing: get the active bubble (only one at a time)
  if (bubbles.size === 0) return;
  const first = bubbles.values().next().value;
  const meta = first;
  if (!meta) return;

  const expected = meta.word[meta.index];
  if (!expected) return;

  // correct next letter
  if (ch === expected.toLowerCase()){
    meta.index += 1;
    // update current typed display
    if (currentTypedEl) currentTypedEl.textContent = meta.word.slice(0, meta.index).toUpperCase();

    // small feedback spark
    const rect = meta.el.getBoundingClientRect();
    showSpark(rect.left + rect.width/2, rect.top, '+1');

    // if full word typed, pop
    if (meta.index >= meta.word.length){
      const now = performance.now();
      const elapsed = (now - meta.spawnTime)/1000;
      const gained = Math.max(5, Math.floor((meta.word.length * 4) + (6 - Math.min(6, elapsed))));
      score += gained; updateScore();

      // add full word to collected
      collected += (collected ? ' ' : '') + meta.word.toLowerCase();
      updateCollected();

      // voice praise
      if (isVoiceEnabled()) speakWord('Great! ' + meta.word);

      // clear hint and current
      updateHint(''); if (currentTypedEl) currentTypedEl.textContent = '';

      // show final spark and pop
      showSpark(rect.left + rect.width/2, rect.top, `+${gained}`);
      popBubble(meta.el.dataset.id);
    }
  } else {
    // optional negative feedback: small shake or sound could be added
    // no penalty for wrong key for young kids
  }
}

// Build a simple on-screen keyboard for mobile
function buildTouchKeyboard(){
  if (!touchKeyboard) return;
  touchKeyboard.innerHTML = '';
  const rows = ['qwertyuiop','asdfghjkl','zxcvbnm'];
  rows.forEach(r =>{
    const row = document.createElement('div'); row.className='row';
    for (const ch of r){
      const k = document.createElement('div'); k.className='key'; k.textContent = ch.toUpperCase();
      k.addEventListener('touchstart', (ev)=>{ ev.preventDefault(); handleTouchKey(ch); });
      k.addEventListener('click', ()=>handleTouchKey(ch));
      row.appendChild(k);
    }
    touchKeyboard.appendChild(row);
  });
  // show keyboard
  touchKeyboard.style.display = 'flex';
}

function handleTouchKey(ch){
  // call onKey with a string to reuse logic
  onKey(ch);
}

function showSpark(x,y,text){
  const s = document.createElement('div');
  s.className = 'score-spark';
  s.style.left = (x) + 'px';
  s.style.top = (y) + 'px';
  s.textContent = text;
  document.body.appendChild(s);
  s.animate([
    { transform: 'translateY(0) scale(1)', opacity:1 },
    { transform: 'translateY(-40px) scale(1.4)', opacity:0 }
  ],{duration:900, easing:'cubic-bezier(.2,.9,.3,1)'}).onfinish = ()=>s.remove();
}

function popBubble(id){
  const meta = bubbles.get(String(id));
  if (!meta) return;
  const el = meta.el;
  // pop animation then remove
  el.classList.add('pop-animation');
  setTimeout(()=>{ try{ if (el.parentNode) el.parentNode.removeChild(el); }catch(_){} }, 220);
  bubbles.delete(String(id));
  // after popping, clear hint if no more bubbles
  if (bubbles.size === 0) updateHint('');
}

// Focus to capture key events
gameArea.addEventListener('keydown', onKey);
// also capture keydown on window to be robust
window.addEventListener('keydown', onKey);

startBtn.addEventListener('click', ()=>{
  // mark todo in manager
  startGame();
});
resetBtn.addEventListener('click', ()=>resetGame());
resetBtn.disabled = true;

// Keep timer updated
function tick(){
  if (!running) return;
  const now = performance.now();
  const elapsed = (now - startTime)/1000;
  const remaining = Math.max(0, gameDuration - elapsed);
  if (timerEl) timerEl.textContent = `Time: ${remaining.toFixed(1)}s`;
  // update large countdown (integer seconds for readability)
  try{ if (bigTimerEl && bigTimerEl.classList.contains('running')){
    bigTimerEl.textContent = `${Math.ceil(remaining)}s`;
  }}catch(e){}
  if (remaining <= 0){
    // time's up
    endGame();
    return;
  }
  requestAnimationFrame(tick);
}

function endGame(customMessage){
  // stop game loop and spawning
  running = false;
  clearInterval(spawnInterval);
  spawnInterval = null;
  // cleanup external iframe if present
  // cancel any speaking
  try{ if (window.speechSynthesis) { window.speechSynthesis.cancel(); } }catch(e){}
  // remove all existing bubbles from the screen
  bubbles.forEach((meta,id)=>{
    try{ if (meta.el && meta.el.parentNode) meta.el.parentNode.removeChild(meta.el); }catch(e){}
  });
  bubbles.clear();
  // hide touch keyboard if visible
  try{ if (touchKeyboard) touchKeyboard.style.display = 'none'; }catch(e){}
  // update UI buttons: game ended so allow reset, but disable start until reset
  startBtn.disabled = true;
  resetBtn.disabled = false;
  // show the final message clearly
  const msg = customMessage || `Game Over! Score: ${score}`;
  info.textContent = msg;
  info.style.display = 'block';
  // add a Play Again button inside the overlay for convenience
  try{
    let btn = document.getElementById('playAgainBtn');
    if (!btn){
      btn = document.createElement('button');
      btn.id = 'playAgainBtn';
      btn.textContent = 'Play Again';
      btn.style.marginTop = '12px';
      btn.className = 'start-btn-large';
      btn.addEventListener('click', ()=>{
        // reset and start a new game immediately
        resetGame();
        setTimeout(()=>startGame(), 150);
      });
      info.appendChild(document.createElement('br'));
      info.appendChild(btn);
    }
  }catch(e){}
  // show a large Game Over in the big timer area for emphasis
  try{ const big = document.getElementById('bigTimer'); if (big){ big.textContent = 'GAME OVER'; big.style.display = 'block'; }}catch(e){}
  if (timerEl) timerEl.textContent = `Time: 0.0s`;
}

// Auto-start the game when the page fully loads
window.addEventListener('load', ()=>{
  // small delay so layout and styles settle, then start
  setTimeout(()=>{
    try{ startGame(); }catch(e){}
  }, 150);
});

// Open a right-side iframe showing the 1-minute timer page and close it after gameDuration
// split-screen timer removed: no external iframe is created or closed

// bind click on bubbles to pop (bonus)
gameArea.addEventListener('click', (e)=>{
  const b = e.target.closest('.bubble');
  if (b){
    // Do NOT pop on click (keep full-word typing). Instead give a gentle pulse,
    // optionally speak the word, and focus the game area for keyboard input.
    const id = b.dataset.id;
    const meta = bubbles.get(String(id));
    if (!meta) return;
    // pulse animation
    try{
      b.animate([
        { transform: 'scale(1)', offset: 0 },
        { transform: 'scale(1.06)', offset: 0.5 },
        { transform: 'scale(1)', offset: 1 }
      ], { duration: 300, easing: 'ease-out' });
    }catch(e){}
    if (isVoiceEnabled()) speakWord(meta.word);
    // focus input so typing can continue
    gameArea.focus();
  }
});

// initial info
updateCollected(); updateScore();

// small accessibility: clicking game area focuses it
gameArea.addEventListener('mousedown', ()=>gameArea.focus());

// ensure gameArea is focusable
gameArea.setAttribute('tabindex','0');

// start animation loop when running
(function mainLoop(){
  requestAnimationFrame(mainLoop);
})();
