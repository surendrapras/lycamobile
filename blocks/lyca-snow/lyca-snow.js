function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find((s) => s.src === src);
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve();
      else existing.addEventListener('load', resolve, { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.dataset.loaded = 'false';
    s.onload = () => {
      s.dataset.loaded = 'true';
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function ensureTsParticles() {
  const primary = 'https://cdn.jsdelivr.net/npm/tsparticles@3/tsparticles.bundle.min.js';
  const fallback = 'https://cdn.jsdelivr.net/npm/tsparticles@3/tsparticles.pjs.bundle.min.js';

  try {
    await loadScriptOnce(primary);
  } catch (e) {
    await loadScriptOnce(fallback);
  }

  return window.tsParticles;
}

export default async function decorate(block) {
  if (window.lycaSnowInitialized) {
    block.textContent = '';
    return;
  }
  window.lycaSnowInitialized = true;

  const engine = await ensureTsParticles();
  if (!engine) {
    block.textContent = '';
    return;
  }

  const id = 'lyca-snow-canvas';
  let host = document.getElementById(id);
  if (!host) {
    host = document.createElement('div');
    host.id = id;
    document.body.appendChild(host);
  }

  const density = Math.max(
    20,
    Math.min(160, parseInt((block.textContent || '').match(/\d+/)?.[0] || '80', 10)),
  );

  const base = window.hlx?.codeBasePath || '';
  const giftUrl = new URL(`${base}/blocks/lyca-snow/icons/gift.svg`, window.location.href).toString();
  const treeUrl = new URL(`${base}/blocks/lyca-snow/icons/tree.svg`, window.location.href).toString();

  const options = {
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    detectRetina: true,
    fpsLimit: 60,
    particles: {
      number: { value: density, density: { enable: true, area: 900 } },
      opacity: { value: { min: 0.55, max: 1 } },
      size: { value: { min: 10, max: 18 } },
      move: {
        enable: true,
        direction: 'bottom',
        speed: { min: 1, max: 2.8 },
        outModes: { default: 'out' },
        drift: { min: -1, max: 1 },
      },
      rotate: {
        value: { min: 0, max: 360 },
        direction: 'random',
        animation: { enable: true, speed: 10 },
      },
      shape: {
        type: 'image',
        options: {
          image: [
            { src: giftUrl, width: 28, height: 28 },
            { src: treeUrl, width: 28, height: 28 },
          ],
        },
      },
    },
  };

  await engine.load(id, options);
  block.textContent = '';
}
