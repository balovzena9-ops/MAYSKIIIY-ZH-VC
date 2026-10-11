const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');

/* ============ GPU / ПРОИЗВОДИТЕЛЬНОСТЬ (мягкие флаги) ============ */
// Не форсируем GPU — Chromium сам решит, использовать железо или откатиться
// на софтверный рендер. Это спасает слабые ПК от крашей GPU-процесса.
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');

// Отключаем троттлинг фонового рендера — иначе аудио лагает в свёрнутом окне
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

// Автоматический откат на software-рендер при краше GPU
app.commandLine.appendSwitch('disable-gpu-process-crash-limit');

// Убираем системное меню
Menu.setApplicationMenu(null);

let mainWindow = null;
let splashWindow = null;

/* ============ SPLASH (меню загрузки) ============ */
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 520,
    height: 360,
    frame: false,
    transparent: false,
    resizable: false,
    movable: true,
    center: true,
    show: true,
    title: 'MAYSKIIIY ZH&VC — загрузка',
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, 'www', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  splashWindow.loadFile('splash.html');
}

/* ============ ГЛАВНОЕ ОКНО ============ */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    title: 'MAYSKIIIY ZH&VC',
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, 'www', 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
      backgroundThrottling: false,
      webgl: true,
      experimentalFeatures: true,
      spellcheck: false
    }
  });

  // Не даём HTML перезаписывать заголовок окна
  mainWindow.on('page-title-updated', (e) => e.preventDefault());

  mainWindow.loadFile(path.join(__dirname, 'www', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('maximize',   () => mainWindow.webContents.send('window-maximized-change', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-maximized-change', false));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

/* ============ ЖИЗНЕННЫЙ ЦИКЛ ============ */
app.whenReady().then(() => {
  createSplash();
  setTimeout(createMainWindow, 100);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ============ IPC: УПРАВЛЕНИЕ ОКНОМ ============ */
ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });

ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});

ipcMain.on('window-fullscreen', () => {
  if (!mainWindow) return;
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
});

ipcMain.on('window-close', () => { if (mainWindow) mainWindow.close(); });

ipcMain.handle('window-is-maximized', () => mainWindow ? mainWindow.isMaximized() : false);
