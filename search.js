// ===== Magnum CPA — site-wide search =====
(function(){
  // Searchable index of every page (title, url, keywords, snippet).
  var INDEX = [
    {title:'Home', url:'index.html',
     snippet:"California's premier partner for strategic growth & tax advantage.",
     text:'home magnum cpa pc max drew strategic growth tax advantage proactive accounting expert tax planning financial coaching ramsey trusted consultation california'},
    {title:'About Us', url:'about.html',
     snippet:'Our story, founder Max Drew, and The Magnum Advantage.',
     text:'about us max magnum drew founder california professional corporation financial partners magnum advantage bbb accredited better business bureau trusted by ramsey best business rate sacramento history mission'},
    {title:'Services', url:'services.html',
     snippet:'Tax preparation & planning, bookkeeping, consulting, future security.',
     text:'services tax preparation planning bookkeeping payroll business consulting future security wealth management retirement estate planning filings liabilities growth efficiency'},
    {title:'Client Newsletter', url:'client-newsletter.html',
     snippet:'Monthly updates, firm news, and money tips.',
     text:'client newsletter mid-year money check-in refund last-minute filing tips updates subscribe firm news'},
    {title:'Tax Planning Newsletter', url:'tax-planning-newsletter.html',
     snippet:'Strategy articles for proactive tax savings.',
     text:'tax planning newsletter retirement contributions 401k ira hsa small business entity llc s-corp sole proprietor charitable giving donor advised capital gains harvesting'},
    {title:'Tax Videos', url:'tax-videos.html',
     snippet:'Plain-English videos on key tax topics.',
     text:'tax videos understanding w-2 deductions credits quarterly taxes freelancers small business watch learn'},
    {title:'Financial Calculators', url:'financial-calculators.html',
     snippet:'Tax, retirement, mortgage, loan, savings & business calculators.',
     text:'financial calculators tax payroll 1040 marginal estate retirement roth ira 401k social security rmd mortgage piti arm loan amortization auto savings college net worth business cash flow breakeven valuation rent vs buy'},
    {title:'Client Portal', url:'client-portal.html', target:true,
     snippet:'Log in or sign up to access your documents.',
     text:'client portal login sign up account documents upload requirements profile messages chat dashboard secure'},
    {title:'Contact Us', url:'contact.html',
     snippet:'Phone, email, and our Sacramento office location.',
     text:'contact us phone 916 616 1789 email info ask magnumcpa find us 907 green moss drive sacramento ca 95831 map directions location office hours'},
    {title:'Request a Consultation', url:'request-consultation.html',
     snippet:'Request your free consultation with Max Drew, CPA.',
     text:'request consultation free appointment schedule book meeting max drew cpa tax planning preparation bookkeeping financial coaching preferred date service'}
  ];

  function escapeHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Build the search overlay once and attach to the page.
  var ov = document.createElement('div');
  ov.className = 'search-overlay';
  ov.innerHTML =
    '<div class="search-box">' +
      '<div class="search-top">' +
        '<span class="search-ic">🔍</span>' +
        '<input type="text" id="siteSearchInput" placeholder="Search the site..." autocomplete="off">' +
        '<button class="search-close" aria-label="Close search">&times;</button>' +
      '</div>' +
      '<div class="search-results" id="siteSearchResults"></div>' +
    '</div>';
  document.body.appendChild(ov);

  var input = ov.querySelector('#siteSearchInput');
  var results = ov.querySelector('#siteSearchResults');

  function openSearch(){ ov.classList.add('open'); input.value=''; render(''); setTimeout(function(){ input.focus(); }, 40); }
  function closeSearch(){ ov.classList.remove('open'); }

  function render(q){
    q = q.trim().toLowerCase();
    if (!q){ results.innerHTML = '<div class="search-none">Type a keyword to search across the website.</div>'; return; }
    var terms = q.split(/\s+/);
    var matches = INDEX.map(function(p){
      var hay = (p.title + ' ' + p.text + ' ' + p.snippet).toLowerCase();
      var score = 0;
      terms.forEach(function(t){ if (hay.indexOf(t) > -1) score++; });
      return {p:p, score:score};
    }).filter(function(m){ return m.score > 0; })
      .sort(function(a,b){ return b.score - a.score; });

    if (!matches.length){ results.innerHTML = '<div class="search-none">No results for &ldquo;' + escapeHtml(q) + '&rdquo;.</div>'; return; }
    results.innerHTML = matches.map(function(m){
      var tgt = m.p.target ? ' target="_blank" rel="noopener"' : '';
      return '<a href="' + m.p.url + '"' + tgt + '><b>' + escapeHtml(m.p.title) + '</b><span>' + escapeHtml(m.p.snippet) + '</span></a>';
    }).join('');
  }

  input.addEventListener('input', function(){ render(input.value); });
  ov.querySelector('.search-close').addEventListener('click', closeSearch);
  ov.addEventListener('click', function(e){ if (e.target === ov) closeSearch(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeSearch(); });

  document.querySelectorAll('.search-btn').forEach(function(b){
    b.addEventListener('click', function(e){ e.preventDefault(); openSearch(); });
  });
})();
