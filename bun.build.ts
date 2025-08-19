import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import tailwind from 'bun-plugin-tailwind';
import type { Manifest } from 'webextension-polyfill';

const stringify = (manifest: Manifest.WebExtensionManifest) => JSON.stringify(manifest, null, 2);

enum Browser {
  CHROME = 'chrome',
  FIREFOX = 'firefox',
}

const BROWSER_NAMES: Record<Browser, string> = {
  [Browser.CHROME]: 'Chrome',
  [Browser.FIREFOX]: 'Firefox',
};

const BROWSERS = Object.values(Browser);

if (existsSync('dist')) {
  rmSync('dist', { recursive: true, force: true }); // Delete the dist folder before build.
  console.log('Deleted dist folder before build.\n');
}

const { outputs, logs, success } = await Bun.build({
  entrypoints: ['./app/popup.html', './background/background.ts'],
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
          console.log(
            `Building extension manifests for ${BROWSERS.map((browser) => BROWSER_NAMES[browser]).join(', ')}...`,
          );

          const common: Manifest.WebExtensionManifest = await Bun.file('manifest/common.json').json();

          for (const browser of BROWSERS) {
            const browserManifest = Bun.file(`manifest/${browser}.json`);
            const exists = await browserManifest.exists();
            const manifest = exists ? { ...common, ...(await browserManifest.json()) } : common;
            // biome-ignore lint/complexity/useLiteralKeys: Delete the $schema property from the manifest.
            delete manifest['$schema'];

            await Bun.write(`dist/${browser}/manifest.json`, stringify(manifest));
            console.log(`Successfully built manifest.json file for ${BROWSER_NAMES[browser]}.`);

            cpSync('manifest/images', `dist/${browser}/images`, { recursive: true });
            console.log(`Successfully copied manifest images for ${BROWSER_NAMES[browser]}.`);
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
  console.error('Build failed');
  process.exit(1);
}

console.log('\nCreating HTML/JS/CSS files in browser dist folders...');

let fileCount = 1;

for (const output of outputs) {
  for (const browser of BROWSERS) {
    const content = await output.text();

    writeFileSync(join(`dist/${browser}`, basename(output.path)), content, 'utf-8');

    console.log(
      `Successfully created (${fileCount}/${outputs.length}) "${basename(output.path)}" (${(output.size / 1000).toFixed(2)} kB) for ${BROWSER_NAMES[browser]}.`,
    );
  }

  fileCount++;
}

console.log('Build completed successfully!');
