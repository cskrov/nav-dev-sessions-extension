// biome-ignore lint/correctness/noNodejsModules: Bun build
import fs from 'node:fs/promises';
import tailwind from 'bun-plugin-tailwind';
import type { Manifest } from 'webextension-polyfill';

const stringify = (manifest: Manifest.WebExtensionManifest) => JSON.stringify(manifest, null, 2);

const BROWSERS = ['chrome', 'firefox'];

const { outputs, logs, success } = await Bun.build({
  entrypoints: ['./src/popup.html', './src/background.ts'],
  minify: true,
  sourcemap: 'inline',
  target: 'browser',
  format: 'esm',
  plugins: [
    tailwind,
    {
      name: 'manifest',
      setup({ onStart }) {
        onStart(async () => {
          const common: Manifest.WebExtensionManifest = await Bun.file('manifest/common.json').json();

          for (const browser of BROWSERS) {
            const browserManifest = Bun.file(`manifest/${browser}.json`);
            const exists = await browserManifest.exists();
            const manifest = exists ? { ...common, ...(await browserManifest.json()) } : common;
            // biome-ignore lint/complexity/useLiteralKeys: Delete the $schema property from the manifest.
            // biome-ignore lint/performance/noDelete: Delete the $schema property from the manifest.
            delete manifest['$schema'];

            await Bun.write(`dist/${browser}/manifest.json`, stringify(manifest));

            await fs.cp('manifest/images', `dist/${browser}/images`, { recursive: true });
          }
        });
      },
    },
  ],
});

for (const { level, message, position } of logs) {
  const line = position === null ? message : `${position.file}:${position.line}:${position.column} ${message}`;

  switch (level) {
    case 'info':
      console.info(line);
      break;
    case 'warning':
      console.warn(line);
      break;
    case 'error':
      console.error(line);
      break;
    case 'debug':
      console.debug(line);
      break;
    case 'verbose':
      console.info(line);
      break;
    default:
      console.debug(line);
      break;
  }
}

if (!success) {
  process.exit(1);
}

for (const browser of BROWSERS) {
  for (const output of outputs) {
    fs.writeFile(`dist/${browser}/${output.path}`, await output.text(), 'utf-8');
  }
}
