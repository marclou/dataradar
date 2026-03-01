const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dataradarKeyStore", {
  getApiKey: () => ipcRenderer.invoke("dataradar:key:get"),
  setApiKey: (apiKey) => ipcRenderer.invoke("dataradar:key:set", apiKey),
  clearApiKey: () => ipcRenderer.invoke("dataradar:key:clear"),
});

contextBridge.exposeInMainWorld("dataradarVisibility", {
  onVisibilityChange: (callback) => {
    ipcRenderer.on("dataradar:visibility", (_event, visible) => callback(visible));
  },
});
