// ===== Magnum CPA — shared nav behavior =====
(function(){
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');
  if (toggle && nav){
    toggle.addEventListener('click', function(){
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
  }
  // dropdown: on mobile, tap the parent to expand the submenu
  document.querySelectorAll('.has-sub > .sub-toggle').forEach(function(a){
    a.addEventListener('click', function(e){
      if (window.matchMedia('(max-width:860px)').matches){
        e.preventDefault();
        a.parentNode.classList.toggle('open');
      }
    });
  });
  // current year in footer
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // floating "Book a Consultation" CTA on every public page (not the booking page itself)
  if (!/request-consultation\.html/i.test(location.pathname)){
    var bf = document.createElement('a');
    bf.className = 'book-fab';
    bf.href = 'request-consultation.html';
    bf.innerHTML = '📅 Book a Consultation';
    document.body.appendChild(bf);
  }

  // Font Awesome (for social icons)
  if (!document.getElementById('fa-cdn')){
    var fa = document.createElement('link');
    fa.id = 'fa-cdn'; fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    document.head.appendChild(fa);
  }
  // Inject social media row into footer(s)
  var SOC = [
    ['https://www.facebook.com/max.drew.522','fa-facebook-f','Facebook'],
    ['https://www.instagram.com/magnumcpa11/','fa-instagram','Instagram'],
    ['https://www.youtube.com/@MaxDrew','fa-youtube','YouTube'],
    ['https://www.threads.com/@magnumcpa11?xmt=AQG0ulpk6R3kK_t4bDitznWtQA3G7iO-LKH2PQMVhY07s6E','fa-threads','Threads'],
    ['https://x.com/MagnumCPA11','fa-x-twitter','X'],
    ['https://www.quora.com/profile/Magnum-CPA','fa-quora','Quora']
  ];
  document.querySelectorAll('footer .foot-copy').forEach(function(copy){
    if (copy.previousElementSibling && copy.previousElementSibling.classList.contains('social')) return;
    var row = document.createElement('div');
    row.className = 'social';
    row.innerHTML = SOC.map(function(s){
      return '<a href="' + s[0] + '" target="_blank" rel="noopener" aria-label="' + s[2] + '"><i class="fa-brands ' + s[1] + '"></i></a>';
    }).join('');
    copy.parentNode.insertBefore(row, copy);
  });
})();
