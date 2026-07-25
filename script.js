// ===== Pocket Ledger — shared script =====

// Highlight current nav link
(function highlightNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[href]').forEach(a=>{
    const href = a.getAttribute('href');
    if(href === path || (path === '' && href === 'index.html')){
      a.classList.add('active');
    }
  });
})();

// Page transitions: fade out before navigating to another page on this site
(function pageTransitions(){
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[href$=".html"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if(a.target === '_blank' || e.metaKey || e.ctrlKey || reduced) return;
      e.preventDefault();
      document.body.classList.add('page-exit');
      setTimeout(()=>{ window.location.href = href; }, 300);
    });
  });
})();

// Scroll-reveal for .entry elements
(function scrollReveal(){
  const entries = document.querySelectorAll('.entry');
  if(!entries.length) return;
  const io = new IntersectionObserver((items)=>{
    items.forEach(it=>{ if(it.isIntersecting){ it.target.classList.add('visible'); } });
  }, {threshold:0.25});
  entries.forEach(e=>io.observe(e));
})();

// Stamp reveal
(function stampReveal(){
  const stamp = document.getElementById('stampEl');
  if(!stamp) return;
  const io = new IntersectionObserver((items)=>{
    items.forEach(it=>{ if(it.isIntersecting){ stamp.classList.add('visible'); } });
  }, {threshold:0.4});
  io.observe(stamp);
})();

// ===================== TOOLS =====================

// Tab switching
(function toolTabs(){
  const tabs = document.querySelectorAll('.tool-tab');
  if(!tabs.length) return;
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.tool-panel').forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.panel).classList.add('active');
    });
  });
})();

function fmt(n){
  return '$' + n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
}

// ---- 1. Budget Calculator ----
(function budgetCalc(){
  const income = document.getElementById('bc-income');
  const save = document.getElementById('bc-save');
  const spend = document.getElementById('bc-spend');
  if(!income) return;
  const goalVal = document.getElementById('bc-goal-val');
  const spendVal = document.getElementById('bc-spend-val');
  const saveVal = document.getElementById('bc-save-val');
  const barSave = document.getElementById('bar-save');
  const barSpend = document.getElementById('bar-spend');
  const barGoal = document.getElementById('bar-goal');
  const outSave = document.getElementById('out-save');
  const outSpend = document.getElementById('out-spend');
  const outGoal = document.getElementById('out-goal');

  function render(){
    const total = parseFloat(income.value) || 0;
    let savePct = parseInt(save.value);
    let spendPct = parseInt(spend.value);
    if(savePct + spendPct > 100){ spendPct = 100 - savePct; spend.value = spendPct; }
    const goalPct = 100 - savePct - spendPct;

    saveVal.textContent = savePct + '%';
    spendVal.textContent = spendPct + '%';
    goalVal.textContent = goalPct + '%';

    const saveAmt = total * savePct/100;
    const spendAmt = total * spendPct/100;
    const goalAmt = total * goalPct/100;

    outSave.textContent = fmt(saveAmt);
    outSpend.textContent = fmt(spendAmt);
    outGoal.textContent = fmt(goalAmt);

    const max = Math.max(saveAmt, spendAmt, goalAmt, 1);
    barSave.style.height = (saveAmt/max*100) + '%';
    barSpend.style.height = (spendAmt/max*100) + '%';
    barGoal.style.height = (goalAmt/max*100) + '%';
  }
  [income, save, spend].forEach(el=>el.addEventListener('input', render));
  render();
})();

// ---- 2. Savings Goal Tracker ----
(function savingsTracker(){
  const goalName = document.getElementById('sg-name');
  const goalAmt = document.getElementById('sg-amount');
  const already = document.getElementById('sg-already');
  const perWeek = document.getElementById('sg-perweek');
  if(!goalAmt) return;
  const outName = document.getElementById('sg-out-name');
  const outWeeks = document.getElementById('sg-out-weeks');
  const outDate = document.getElementById('sg-out-date');
  const fill = document.getElementById('sg-progress-fill');
  const pctLabel = document.getElementById('sg-pct');

  function render(){
    const target = parseFloat(goalAmt.value) || 0;
    const have = parseFloat(already.value) || 0;
    const weekly = parseFloat(perWeek.value) || 0;
    const remaining = Math.max(target - have, 0);
    const weeks = weekly > 0 ? Math.ceil(remaining / weekly) : 0;

    outName.textContent = goalName.value || 'your goal';
    const pct = target > 0 ? Math.min((have/target)*100, 100) : 0;
    fill.style.width = pct + '%';
    pctLabel.textContent = Math.round(pct) + '%';

    if(weekly <= 0 || remaining <= 0){
      outWeeks.textContent = remaining <= 0 ? 'Reached! 🎉' : '— enter a weekly amount';
      outDate.textContent = '—';
    } else {
      outWeeks.textContent = weeks + (weeks === 1 ? ' week' : ' weeks');
      const d = new Date();
      d.setDate(d.getDate() + weeks*7);
      outDate.textContent = d.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
    }
  }
  [goalName, goalAmt, already, perWeek].forEach(el=>el.addEventListener('input', render));
  render();
})();

// ---- 3. Compound Interest Visualizer ----
(function compoundInterest(){
  const start = document.getElementById('ci-start');
  const monthly = document.getElementById('ci-monthly');
  const rate = document.getElementById('ci-rate');
  const years = document.getElementById('ci-years');
  if(!start) return;
  const rateVal = document.getElementById('ci-rate-val');
  const yearsVal = document.getElementById('ci-years-val');
  const outTotal = document.getElementById('ci-total');
  const outContrib = document.getElementById('ci-contrib');
  const outInterest = document.getElementById('ci-interest');
  const barContrib = document.getElementById('ci-bar-contrib');
  const barInterest = document.getElementById('ci-bar-interest');

  function render(){
    const p0 = parseFloat(start.value) || 0;
    const m = parseFloat(monthly.value) || 0;
    const r = parseFloat(rate.value) / 100;
    const y = parseInt(years.value);
    rateVal.textContent = rate.value + '%';
    yearsVal.textContent = y + (y === 1 ? ' year' : ' years');

    const months = y * 12;
    const monthlyRate = r / 12;
    let balance = p0;
    for(let i=0;i<months;i++){
      balance = balance * (1+monthlyRate) + m;
    }
    const contributed = p0 + m*months;
    const interestEarned = balance - contributed;

    outTotal.textContent = fmt(balance);
    outContrib.textContent = fmt(contributed);
    outInterest.textContent = fmt(Math.max(interestEarned,0));

    const max = Math.max(contributed, balance, 1);
    barContrib.style.height = (contributed/max*100) + '%';
    barInterest.style.height = (Math.max(interestEarned,0)/max*100) + '%';
  }
  [start, monthly, rate, years].forEach(el=>el.addEventListener('input', render));
  render();
})();

// ---- 4. Needs vs Wants Quiz ----
(function needsWantsQuiz(){
  const itemEl = document.getElementById('nw-item');
  if(!itemEl) return;
  const feedback = document.getElementById('nw-feedback');
  const scoreEl = document.getElementById('nw-score');
  const btnNeed = document.getElementById('nw-need');
  const btnWant = document.getElementById('nw-want');

  const items = [
    {name:'School lunch', answer:'need'},
    {name:'Bus fare to school', answer:'need'},
    {name:'Newest video game release', answer:'want'},
    {name:'Winter coat when yours is broken', answer:'need'},
    {name:'A third pair of sneakers', answer:'want'},
    {name:'Phone case for a cracked screen', answer:'need'},
    {name:'In-game skins', answer:'want'},
    {name:'Notebook for school', answer:'need'},
    {name:'Concert tickets', answer:'want'},
    {name:'Toothpaste', answer:'need'},
  ];
  let order = [...items].sort(()=>Math.random()-0.5);
  let idx = 0, correct = 0, answered = 0;

  function showItem(){
    if(idx >= order.length){
      itemEl.textContent = "That's every item!";
      feedback.textContent = '';
      scoreEl.textContent = `Final score: ${correct}/${order.length}`;
      btnNeed.disabled = true; btnWant.disabled = true;
      return;
    }
    itemEl.textContent = order[idx].name;
    feedback.textContent = '';
    feedback.className = 'quiz-feedback';
  }

  function answer(choice){
    if(idx >= order.length) return;
    const right = order[idx].answer;
    answered++;
    if(choice === right){
      correct++;
      feedback.textContent = 'Correct — that\'s a ' + right + '.';
      feedback.className = 'quiz-feedback correct';
    } else {
      feedback.textContent = 'Actually a ' + right + ' — good guess though.';
      feedback.className = 'quiz-feedback wrong';
    }
    scoreEl.textContent = `Score: ${correct}/${answered}`;
    idx++;
    setTimeout(showItem, 900);
  }

  btnNeed.addEventListener('click', ()=>answer('need'));
  btnWant.addEventListener('click', ()=>answer('want'));
  showItem();
  scoreEl.textContent = `Score: 0/0`;
})();
