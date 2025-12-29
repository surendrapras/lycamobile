function cleanText(str) {
  return (str || '').replace(/\{[^}]+\}/g, '').trim();
}

function slugify(str) {
  return cleanText(str)
    .toLowerCase()
    .replace(/\*/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getRows(block) {
  return [...block.children].map((row) => [...row.children]);
}

function getCellText(cell) {
  return cleanText(cell?.textContent || '');
}

function buildSelect({
  id, required, placeholder, options,
}) {
  const select = document.createElement('select');
  select.id = id;
  select.name = id;
  if (required) select.required = true;

  const ph = document.createElement('option');
  ph.value = '';
  ph.disabled = true;
  ph.selected = true;
  ph.textContent = placeholder || 'Select';
  select.append(ph);

  (options || []).forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    select.append(o);
  });

  return select;
}

function buildInput({
  id, type, required, placeholder,
}) {
  const input = document.createElement('input');
  input.id = id;
  input.name = id;
  input.type = type || 'text';
  input.placeholder = placeholder || '';
  if (required) input.required = true;
  return input;
}

function renderToggleForm(block, rows) {
  const wrap = document.createElement('div');
  wrap.className = 'toggle';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('data-consent-toggle', 'true');

  const label = document.createElement('div');
  const toggleRow = rows.find(
    (r) => getCellText(r[0]).toLowerCase() === 'toggle',
  );
  label.textContent = toggleRow ? getCellText(toggleRow[1]) : '';

  wrap.append(input, label);
  block.replaceChildren(wrap);
}

function parseAttributeMatrix(rows) {
  const map = {};
  rows.forEach((r) => {
    const key = getCellText(r[0]).toLowerCase();
    map[key] = r.slice(1).map((c) => getCellText(c));
  });
  return map;
}

function renderAttributeForm(block, rows) {
  const attrs = parseAttributeMatrix(rows);
  const labels = attrs.label || [];
  const fields = attrs.field || [];
  const types = attrs.type || [];
  const count = Math.max(labels.length, fields.length, types.length);

  const items = [];
  for (let i = 0; i < count; i += 1) {
    const labelRaw = labels[i] || '';
    const placeholder = fields[i] || '';
    const type = (types[i] || 'text').toLowerCase();

    const required = /\*/.test(labelRaw);
    const labelText = cleanText(labelRaw).replace(/\*$/, '').trim();
    const id = slugify(labelText || placeholder || `field-${i + 1}`);

    items.push({
      id, labelText, placeholder, type, required,
    });
  }

  // Special: email + verify button inline (email-verify form)
  const emailField = items.find((f) => f.type === 'email' || f.type === 'text');
  const btnField = items.find((f) => f.type === 'button');

  if (block.classList.contains('email-verify') && emailField && btnField) {
    const field = document.createElement('div');
    field.className = 'field';

    const lab = document.createElement('div');
    lab.className = 'field-label';
    lab.textContent = emailField.labelText || 'Email';

    const inline = document.createElement('div');
    inline.className = 'field-inline';

    const input = buildInput({
      id: emailField.id,
      type: emailField.type === 'button' ? 'text' : emailField.type,
      required: emailField.required,
      placeholder: emailField.placeholder || emailField.labelText,
    });

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ghost-button';
    btn.textContent = btnField.placeholder || 'Verify';

    inline.append(input, btn);
    field.append(lab, inline);
    block.replaceChildren(field);
    return;
  }

  const grid = document.createElement('div');
  const fieldCount = items.filter((f) => f.type !== 'button').length;

  grid.className = 'field-grid';
  if (block.classList.contains('checkout-details')) grid.classList.add('three');
  else if (fieldCount === 3) grid.classList.add('three');
  else if (fieldCount === 2) grid.classList.add('two');

  items.forEach((f) => {
    if (f.type === 'button') return;

    const field = document.createElement('div');
    field.className = 'field';

    const lab = document.createElement('div');
    lab.className = 'field-label';
    lab.textContent = f.labelText || '';

    let control;
    if (f.type === 'select') {
      control = buildSelect({
        id: f.id,
        required: f.required,
        placeholder: f.labelText || f.placeholder || 'Select',
        options: ['Mr', 'Mrs', 'Ms', 'Dr', 'Mx'],
      });
    } else {
      control = buildInput({
        id: f.id,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder || f.labelText,
      });
    }

    field.append(lab, control);
    grid.append(field);
  });

  block.replaceChildren(grid);
}

export default function decorate(block) {
  const rows = getRows(block);
  if (!rows.length) return;

  const headerA = getCellText(rows[0][0]).toLowerCase();
  const headerB = getCellText(rows[0][1]).toLowerCase();

  // Key/Value style table (consent toggle)
  if (headerA === 'key' && headerB === 'value') {
    renderToggleForm(block, rows.slice(1));
    return;
  }

  // Attribute matrix style: Label/Field/Type rows
  renderAttributeForm(block, rows);
}
