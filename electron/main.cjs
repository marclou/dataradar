const http = require("node:http");
const path = require("node:path");
const {
  app,
  BrowserWindow,
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

function getProjectDir() {
  return app.isPackaged ? app.getAppPath() : path.resolve(__dirname, "..");
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
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
  <circle cx="9" cy="9" r="7" fill="none" stroke="black" stroke-width="1.5" />
  <path d="M9 9 L14.2 11.5" stroke="black" stroke-width="1.5" stroke-linecap="round" />
  <circle cx="11.7" cy="10.2" r="1.2" fill="black" />
</svg>`;

  const image = nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
  );

  image.setTemplateImage(true);
  return image.resize({ width: 18, height: 18 });
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
        click: () => {
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
