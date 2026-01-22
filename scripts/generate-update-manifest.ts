import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface UpdateManifest {
  addons: {
    [addonId: string]: {
      updates: Array<{
        version: string;
        update_link: string;
      }>;
    };
  };
}

const getVersion = (): string => {
  const version = process.env.VERSION;
  if (!version) {
    throw new Error('VERSION environment variable is required');
  }
  return version.replace(/^v/, '');
};

const getRepoUrl = (): string => {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    throw new Error('GITHUB_REPOSITORY environment variable is required');
  }
  return `https://github.com/${repo}`;
};

const getAddonId = (): string => {
  const firefoxManifest = JSON.parse(readFileSync(join(import.meta.dirname, '../manifest/firefox.json'), 'utf-8'));
  return firefoxManifest.browser_specific_settings.gecko.id;
};

const generateUpdateManifest = (): void => {
  const version = getVersion();
  const repoUrl = getRepoUrl();
  const addonId = getAddonId();

  const updateLink = `${repoUrl}/releases/download/v${version}/firefox.xpi`;

  const manifest: UpdateManifest = {
    addons: {
      [addonId]: {
        updates: [
          {
            version,
            update_link: updateLink,
          },
        ],
      },
    },
  };

  const outputDir = join(import.meta.dirname, '../gh-pages');
  mkdirSync(outputDir, { recursive: true });

  const outputPath = join(outputDir, 'updates.json');
  writeFileSync(outputPath, JSON.stringify(manifest, null, '  '));

  console.log(`Generated update manifest at ${outputPath}`);
  console.log(`Addon ID: ${addonId}`);
  console.log(`Version: ${version}`);
  console.log(`Update link: ${updateLink}`);
};

generateUpdateManifest();
