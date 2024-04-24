// util/tray.ts

import { app, Tray, nativeImage, Menu, ipcMain } from 'electron';
import path from 'path';

let tray: Tray | null = null;
// eslint-disable-next-line no-undef
let blinkInterval: NodeJS.Timeout | null = null;

function createTrayIcon(tooltip: string, iconPath: string): void {
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip(tooltip);

  const contextMenu = Menu.buildFromTemplate([
    { label: tooltip, type: 'normal' },
  ]);

  tray.setContextMenu(contextMenu);
}

export function initializeTray(): void {
  const iconPath = path.join(app.getAppPath(), 'assets/icons/24x24.png');
  const iconPath2 = path.join(app.getAppPath(), 'assets/icons/icon-empty.png');
  createTrayIcon('Trace - Ready', iconPath);

  ipcMain.on('start-keystrokes-logging', () => {
    const icon1 = nativeImage.createFromPath(iconPath);
    const icon2 = nativeImage.createFromPath(iconPath2);

    let iconState = false;
    blinkInterval = setInterval(() => {
      tray?.setImage(iconState ? icon1 : icon2);
      iconState = !iconState;
    }, 500);

    tray?.setToolTip('Trace - Recording in progress');
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Trace - Recording in progress', type: 'normal' },
    ]);
    tray?.setContextMenu(contextMenu);
  });

  ipcMain.on('stop-keystrokes-logging', () => {
    if (blinkInterval) {
      clearInterval(blinkInterval);
      blinkInterval = null;
    }

    tray?.setImage(iconPath);
    tray?.setToolTip('Trace - Ready to Record');
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Trace - Ready', type: 'normal' },
    ]);
    tray?.setContextMenu(contextMenu);
  });
}

export function destroyTrayIcon(): void {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }

  tray?.destroy();
  tray = null;
}
