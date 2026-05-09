const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => { navbar.classList.toggle('scrolled', window.scrollY > 40); });

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
hamburger.addEventListener('click', () => { navLinks.classList.toggle('open'); });
navLinks.querySelectorAll('a').forEach(link => { link.addEventListener('click', () => navLinks.classList.remove('open')); });

const revealEls = document.querySelectorAll('.stat-card, .expertise-card, .achievement-card, .policy-card, .contact-card, .timeline-item, .contribution-item');
revealEls.forEach(el => el.classList.add('reveal'));
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) { setTimeout(() => entry.target.classList.add('visible'), i * 60); observer.unobserve(entry.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => observer.observe(el));

const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => { if (window.scrollY >= sec.offsetTop - 80) current = sec.id; });
  navAnchors.forEach(a => { a.style.color = a.getAttribute('href') === '#' + current ? 'var(--brown-dark)' : ''; });
});