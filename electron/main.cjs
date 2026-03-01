const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
  shell,
} = require("electron");
const next = require("next");

const WINDOW_WIDTH = 360;
const WINDOW_HEIGHT = 410;

let nextApp;
let nextServer;
let serverBaseUrl = "";
let tray = null;
let windowRef = null;
let settingsPath = "";

function getProjectDir() {
  return app.isPackaged ? app.getAppPath() : path.resolve(__dirname, "..");
}

async function loadSettings() {
  try {
    const raw = await fs.readFile(settingsPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === "ENOENT") return {};
    return {};
  }
}

async function saveSettings(settings) {
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf8");
}

async function getSavedApiKey() {
  const settings = await loadSettings();
  return typeof settings.apiKey === "string" ? settings.apiKey : null;
}

async function setSavedApiKey(apiKey) {
  const key = typeof apiKey === "string" ? apiKey.trim() : "";
  const settings = await loadSettings();

  if (!key) {
    delete settings.apiKey;
  } else {
    settings.apiKey = key;
  }

  await saveSettings(settings);
}

async function clearSavedApiKey() {
  await setSavedApiKey("");
}

function setupIpcHandlers() {
  ipcMain.handle("dataradar:key:get", () => getSavedApiKey());
  ipcMain.handle("dataradar:key:set", (_event, apiKey) => setSavedApiKey(apiKey));
  ipcMain.handle("dataradar:key:clear", () => clearSavedApiKey());
}

async function startNextServer() {
  if (serverBaseUrl) return;

  const projectDir = getProjectDir();
  const isDev = !app.isPackaged;

  nextApp = next({
    dev: isDev,
    dir: projectDir,
    hostname: "127.0.0.1",
  });

  await nextApp.prepare();

  const handle = nextApp.getRequestHandler();
  nextServer = http.createServer((req, res) => handle(req, res));

  await new Promise((resolve, reject) => {
    nextServer.once("error", reject);
    nextServer.listen(0, "127.0.0.1", resolve);
  });

  const address = nextServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start local web server");
  }

  serverBaseUrl = `http://127.0.0.1:${address.port}`;
}

function createTrayIcon() {
  const iconPath = path.join(__dirname, "assets", "trayTemplate.png");
  const trayIcon = nativeImage.createFromPath(iconPath);
  if (trayIcon.isEmpty()) {
    throw new Error(`Tray icon failed to load: ${iconPath}`);
  }
  trayIcon.setTemplateImage(true);
  return trayIcon;
}

async function createMainWindow() {
  if (!serverBaseUrl) {
    await startNextServer();
  }

  windowRef = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: "#050809",
    vibrancy: "menu",
    visualEffectState: "active",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  windowRef.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  windowRef.on("blur", () => {
    if (!windowRef || windowRef.webContents.isDevToolsOpened()) return;
    windowRef.hide();
  });

  await windowRef.loadURL(`${serverBaseUrl}/menubar`);
}

function showWindow() {
  if (!tray || !windowRef) return;

  const trayBounds = tray.getBounds();
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - WINDOW_WIDTH / 2);
  const y = Math.round(trayBounds.y + trayBounds.height + 8);

  windowRef.setPosition(x, y, false);
  windowRef.show();
  windowRef.focus();
}

function toggleWindow() {
  if (!windowRef) return;

  if (windowRef.isVisible()) {
    windowRef.hide();
    return;
  }

  showWindow();
}

function attachTrayMenu() {
  if (!tray || !windowRef) return;

  tray.setToolTip("DataRadar");
  tray.on("click", toggleWindow);
  tray.on("right-click", () => {
    const menu = Menu.buildFromTemplate([
      { label: "Open Radar", click: showWindow },
      {
        label: "Reset API Key",
        click: async () => {
          await clearSavedApiKey();
          if (!windowRef) return;
          windowRef.webContents
            .executeJavaScript(
              "localStorage.removeItem('datafast_api_key'); window.location.reload();",
              true
            )
            .catch(() => {});
          showWindow();
        },
      },
      { type: "separator" },
      { label: "Quit DataRadar", click: () => app.quit() },
    ]);
    tray.popUpContextMenu(menu);
  });
}

async function boot() {
  settingsPath = path.join(app.getPath("userData"), "settings.json");
  setupIpcHandlers();
  Menu.setApplicationMenu(null);
  await createMainWindow();
  tray = new Tray(createTrayIcon());
  attachTrayMenu();
}

app.whenReady().then(async () => {
  if (app.dock) app.dock.hide();

  try {
    await boot();
  } catch (error) {
    console.error("Failed to start DataRadar:", error);
    app.quit();
  }
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});

app.on("before-quit", () => {
  if (nextServer) {
    nextServer.close();
  }
});
