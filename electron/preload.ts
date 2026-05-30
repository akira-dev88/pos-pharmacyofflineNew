import { contextBridge, app } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isPackaged: () => app.isPackaged,
  getVersion: () => process.env.npm_package_version || '1.0.0'
});