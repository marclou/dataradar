const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dataradarKeyStore", {
  getApiKey: () => ipcRenderer.invoke("dataradar:key:get"),
  setApiKey: (apiKey) => ipcRenderer.invoke("dataradar:key:set", apiKey),
  clearApiKey: () => ipcRenderer.invoke("dataradar:key:clear"),
});
