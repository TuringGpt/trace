// forge.config.js

const iconExtension = process.platform === 'win32' ? 'ico' : (process.platform === 'darwin' ? 'icns' : 'png');
const path = require('path')
const fs = require('node:fs/promises');

module.exports = {
  packagerConfig: {
    asar: {
      unpack: "**/node_modules/ffmpeg-static-electron/**"
    },
    icon: `src/assets/icons/icon.${iconExtension}`,
    executableName: 'trace'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
  hooks: {
     packageAfterPrune: async (_config, buildPath) => {
       const gypPath = path.join(
         buildPath,
         'node_modules',
         'uiohook-napi',
         'build',
         'node_gyp_bins'
       );
       await fs.rm(gypPath, {recursive: true, force: true});
    }
  }
};
