// desktop/preload.js — pont sécurisé entre le processus principal et le renderer
const { contextBridge, ipcRenderer } = require('electron');

// URL du serveur, lue de façon synchrone au chargement de la page.
// Consommée par l'app React via window.desktopConfig.serverUrl.
const serverUrl = ipcRenderer.sendSync('get-server-url') || '';

contextBridge.exposeInMainWorld('desktopConfig', {
  serverUrl,
  isDesktop: true,
});

contextBridge.exposeInMainWorld('desktop', {
  saveServerUrl: (url) => ipcRenderer.invoke('save-server-url', url),
  resetServerUrl: () => ipcRenderer.invoke('reset-server-url'),
});
