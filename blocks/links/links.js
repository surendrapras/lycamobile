function cleanText(str) {
  return (str || '').replace(/\{[^}]+\}/g, '').trim();
}

function getRows(block) {
  return [...block.children].map((row) => [...row.children]);
}

export default function decorate(block) {
  const rows = getRows(block);

  const list = document.createElement('div');
  list.className = 'download-list';

  rows.forEach((cells) => {
    const cell = cells[0];
    if (!cell) return;

    const aInCell = cell.querySelector('a');
    const label = cleanText(cell.textContent || '');
    const href = aInCell?.getAttribute('href') || '#';

    const a = document.createElement('a');
    a.className = 'download';
    a.href = href;

    const icon = document.createElement('span');
    icon.className = 'icon-download';

    const txt = document.createElement('span');
    txt.textContent = label;

    a.append(icon, txt);
    list.append(a);
  });

  block.replaceChildren(list);
}
