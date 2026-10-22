const { defineConfig } = require('vite');

module.exports = defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/babki-iz-bloga/' : '/',
}));
