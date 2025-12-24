function getText(el) {
  return el?.textContent?.trim() || '';
}

function getFirstPicture(root) {
  return root.querySelector('picture') || null;
}

export default function decorate(block) {
const rows = [...block.querySelectorAll(':scope > div')]
    .map((r) => r.firstElementChild)
    .filter(Boolean);

  const titleCell = rows[0] || block;
  const subtitleCell = rows[1] || null;
  const mediaCell = rows[2] || block;

  const title = getText(titleCell.querySelector('h1, h2, h3'))
    || getText(titleCell.querySelector('p'))
    || getText(titleCell)
    || getText(document.querySelector('main h1'))
    || '';

  const subtitle = getText(subtitleCell?.querySelector('p')) || getText(subtitleCell) || '';

  const picture = getFirstPicture(mediaCell) || getFirstPicture(block);

  block.textContent = '';
  block.classList.add('hero-banner');

  const inner = document.createElement('div');
  inner.className = 'hero-banner-inner';

  const h1 = document.createElement('h1');
  h1.className = 'hero-banner-title';
  h1.textContent = title;

  const p = document.createElement('p');
  p.className = 'hero-banner-subtitle';
  p.textContent = subtitle;

  const media = document.createElement('div');
  media.className = 'hero-banner-media';
  if (picture) media.append(picture);

  inner.append(h1);
  if (subtitle) inner.append(p);
  if (picture) inner.append(media);

  block.append(inner);
}
