const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const { app, BrowserWindow, ipcMain, Menu, nativeImage, shell } = require("electron");
const next = require("next");

let nextApp;
let nextServer;
let serverBaseUrl = "";
let windowRef = null;
let settingsPath = "";

function getProjectDir() {
  return app.isPackaged ? app.getAppPath() : path.resolve(__dirname, "..");
}

async function loadSettings() {
  try {
    const raw = await fs.readFile(settingsPath, "utf8");
    return JSON.parse(raw);
  } catch {
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

  nextApp = next({ dev: isDev, dir: projectDir, hostname: "127.0.0.1" });
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

async function createMainWindow() {
  await startNextServer();

  windowRef = new BrowserWindow({
    width: 480,
    height: 480,
    minWidth: 400,
    minHeight: 400,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#050809",
    icon: path.join(__dirname, "assets", "icon.icns"),
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

  windowRef.once("ready-to-show", () => {
    windowRef.show();
    windowRef.focus();
  });

  await windowRef.loadURL(`${serverBaseUrl}/menubar`);
}

app.whenReady().then(async () => {
  settingsPath = path.join(app.getPath("userData"), "settings.json");
  setupIpcHandlers();

  if (app.dock) {
    const dockIcon = nativeImage.createFromPath(path.join(__dirname, "assets", "icon.icns"));
    if (!dockIcon.isEmpty()) app.dock.setIcon(dockIcon);
  }

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          {
            label: "Reset API Key",
            click: async () => {
              await clearSavedApiKey();
              if (windowRef) {
                windowRef.webContents
                  .executeJavaScript("localStorage.removeItem('datafast_api_key'); window.location.reload();", true)
                  .catch(() => {});
              }
            },
          },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      { label: "Edit", submenu: [{ role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
    ])
  );

  try {
    await createMainWindow();
  } catch (error) {
    console.error("Failed to start DataRadar:", error);
    app.quit();
  }
});

app.on("window-all-closed", () => app.quit());

app.on("activate", () => {
  if (!windowRef || windowRef.isDestroyed()) {
    createMainWindow();
  } else {
    windowRef.show();
  }
});

app.on("before-quit", () => {
  if (nextServer) nextServer.close();
});
