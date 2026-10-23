import { config } from './config.js';

const validUrl = value => { try { return new URL(value, location.origin).protocol === 'https:'; } catch { return false; } };
const notice = document.querySelector('#notice');
document.querySelectorAll('.payment').forEach(button => button.addEventListener('click', () => {
  if (validUrl(config.paymentUrl)) location.assign(config.paymentUrl);
  else notice.showModal();
}));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
});
document.querySelectorAll('[data-photo]').forEach(container => {
  const src = config.photos[container.dataset.photo];
  if (!src) return;
  const img = document.createElement('img');
  img.src = src; img.alt = container.dataset.photo === 'nadezhda' ? 'Надежда Мнацаканян' : 'Евгения Домбровская';
  if (!container.closest('.hero')) img.loading = 'lazy';
  container.replaceChildren(img);
});
const makeLegalLink = (title, url) => {
  const resolved = url ? new URL(url, location.origin) : null;
  const available = resolved && (resolved.protocol === 'https:' || (resolved.protocol === 'http:' && resolved.origin === location.origin));
  const el = document.createElement(available ? 'a' : 'span');
  el.textContent = title;
  if (available) { el.href = url; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
  else { el.className = 'unavailable'; el.title = 'Документ ещё не предоставлен'; }
  return el;
};
const legal = document.querySelector('#legal-links');
legal.append(makeLegalLink('Публичная оферта', config.offerUrl), makeLegalLink('Политика конфиденциальности', config.privacyUrl));
document.querySelector('#business').textContent = config.businessDetails || 'Данные ИП ещё не предоставлены';
if (config.contactEmail) {
  const contact = document.createElement('a'); contact.href = `mailto:${config.contactEmail}`; contact.textContent = config.contactEmail;
  document.querySelector('#business').append(document.createElement('br'), contact);
}
document.querySelectorAll('.legal-note').forEach(note => {
  note.append('Оплачивая участие, вы соглашаетесь с ', makeLegalLink('офертой', config.offerUrl), ' и ', makeLegalLink('политикой конфиденциальности', config.privacyUrl), '.');
});
const track = document.querySelector('.review-track');
const lightbox = document.querySelector('#lightbox');
if (config.reviews.length) config.reviews.forEach((review, i) => {
  const button = document.createElement('button'); button.className = 'review'; button.setAttribute('aria-label', 'Увеличить: ' + review.alt);
  const img = document.createElement('img'); img.src = review.src; img.alt = review.alt; img.loading = 'lazy';
  img.width = review.width; img.height = review.height;
  button.append(img); button.addEventListener('click', () => { const full = lightbox.querySelector('img'); full.src = review.src; full.alt = review.alt; lightbox.showModal(); }); track.append(button);
});
else for (let i = 0; i < 2; i++) {
  const placeholder = document.createElement('div'); placeholder.className = 'review review-empty';
  const num = document.createElement('span'); num.textContent = '0' + (i + 1);
  const text = document.createElement('p'); text.textContent = 'Здесь будет оригинальный скриншот отзыва';
  placeholder.append(num, text); track.append(placeholder);
}
const scrollReview = direction => track.scrollBy({ left: direction * (track.firstElementChild.getBoundingClientRect().width + 24), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
document.querySelector('#prev').addEventListener('click', () => scrollReview(-1));
document.querySelector('#next').addEventListener('click', () => scrollReview(1));
track.addEventListener('keydown', event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); scrollReview(event.key === 'ArrowRight' ? 1 : -1); } });
const arrows = () => { document.querySelector('#prev').disabled = track.scrollLeft < 2; document.querySelector('#next').disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2; };
track.addEventListener('scroll', arrows, { passive: true }); window.addEventListener('resize', arrows); arrows();
new IntersectionObserver(entries => { document.querySelector('.sticky').classList.toggle('visible', !entries[0].isIntersecting); }).observe(document.querySelector('.hero .payment'));
