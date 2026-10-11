const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize:   () => ipcRenderer.send('window-minimize'),
  maximize:   () => ipcRenderer.send('window-maximize'),
  fullscreen: () => ipcRenderer.send('window-fullscreen'),
  close:      () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (cb) => ipcRenderer.on('window-maximized-change', (_e, v) => cb(v))
});

function injectTitlebar() {
  const TB_HEIGHT = 36;

  /* ---------- Стили ---------- */
  const style = document.createElement('style');
  style.id = 'electron-titlebar-style';
  style.textContent = `
    #app { top: ${TB_HEIGHT}px !important; }

    #electron-titlebar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: ${TB_HEIGHT}px;
      background: rgba(10,10,10,0.94);
      backdrop-filter: blur(22px) saturate(180%);
      -webkit-backdrop-filter: blur(22px) saturate(180%);
      border-bottom: 1px solid rgba(255,255,255,.07);
      display: flex;
      align-items: center;
      z-index: 2147483647;
      -webkit-app-region: drag;
      user-select: none;
      font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;
    }
    html[data-theme="light"] #electron-titlebar {
      background: rgba(245,245,247,0.94);
      border-bottom-color: rgba(0,0,0,.08);
    }
    #electron-titlebar .etb-title {
      flex: 1;
      padding: 0 14px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 2.2px;
      color: rgba(255,255,255,.55);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
      pointer-events: none;
    }
    html[data-theme="light"] #electron-titlebar .etb-title { color: rgba(0,0,0,.55); }
    #electron-titlebar .etb-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: linear-gradient(135deg,#ff3a8a,#a855f7);
      margin-left: 14px; margin-right: 8px;
      box-shadow: 0 0 12px rgba(255,58,138,.7);
      flex-shrink: 0;
    }
    #electron-titlebar .etb-buttons {
      display: flex;
      height: 100%;
      -webkit-app-region: no-drag;
    }
    #electron-titlebar button {
      width: 46px;
      height: 100%;
      display: grid;
      place-items: center;
      background: transparent;
      border: 0;
      color: rgba(255,255,255,.75);
      cursor: pointer;
      transition: background .14s ease, color .14s ease;
      -webkit-app-region: no-drag;
      outline: none;
    }
    html[data-theme="light"] #electron-titlebar button { color: rgba(0,0,0,.7); }
    #electron-titlebar button:hover {
      background: rgba(255,255,255,.09);
      color: #fff;
    }
    html[data-theme="light"] #electron-titlebar button:hover {
      background: rgba(0,0,0,.07);
      color: #000;
    }
    #electron-titlebar button.etb-close:hover {
      background: #e81123;
      color: #fff;
    }
    #electron-titlebar button svg {
      width: 12px; height: 12px;
      stroke: currentColor;
      stroke-width: 1.4;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `;
  document.head.appendChild(style);

  /* ---------- Разметка ---------- */
  const bar = document.createElement('div');
  bar.id = 'electron-titlebar';
  bar.innerHTML = `
    <div class="etb-dot"></div>
    <div class="etb-title">MAYSKIIIY ZH&amp;VC</div>
    <div class="etb-buttons">
      <button class="etb-min" title="Свернуть" aria-label="Свернуть">
        <svg viewBox="0 0 12 12"><line x1="2" y1="6" x2="10" y2="6"/></svg>
      </button>
      <button class="etb-max" title="Развернуть" aria-label="Развернуть">
        <svg viewBox="0 0 12 12"><rect x="2.5" y="2.5" width="7" height="7" rx="1"/></svg>
      </button>
      <button class="etb-close" title="Закрыть" aria-label="Закрыть">
        <svg viewBox="0 0 12 12">
          <line x1="2.5" y1="2.5" x2="9.5" y2="9.5"/>
          <line x1="9.5" y1="2.5" x2="2.5" y2="9.5"/>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(bar);

  /* ---------- Логика ---------- */
  const btnMin   = bar.querySelector('.etb-min');
  const btnMax   = bar.querySelector('.etb-max');
  const btnClose = bar.querySelector('.etb-close');

  btnMin.addEventListener('click',   () => window.electronAPI.minimize());
  btnMax.addEventListener('click',   () => window.electronAPI.maximize());
  btnClose.addEventListener('click', () => window.electronAPI.close());

  bar.addEventListener('dblclick', (e) => {
    if (e.target.closest('.etb-buttons')) return;
    window.electronAPI.maximize();
  });

  const MAX_ICON = '<svg viewBox="0 0 12 12"><rect x="2.5" y="2.5" width="7" height="7" rx="1"/></svg>';
  const RESTORE_ICON = '<svg viewBox="0 0 12 12"><rect x="2.5" y="4" width="6" height="6" rx="1"/><path d="M4.5 4V3a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1H8.5"/></svg>';

  window.electronAPI.isMaximized().then((isMax) => {
    if (isMax) { btnMax.innerHTML = RESTORE_ICON; btnMax.title = 'Восстановить'; }
  });

  window.electronAPI.onMaximizeChange((isMax) => {
    if (isMax) {
      btnMax.innerHTML = RESTORE_ICON;
      btnMax.title = 'Восстановить';
    } else {
      btnMax.innerHTML = MAX_ICON;
      btnMax.title = 'Развернуть';
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectTitlebar);
} else {
  injectTitlebar();
}