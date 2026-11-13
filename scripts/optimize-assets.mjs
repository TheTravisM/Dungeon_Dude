/**
 * Cross-platform asset optimizer for the Dungeon Dude overhaul.
 *
 * Raw downloads live in assets-src/ and are never shipped. This script turns
 * them into small WebP textures and optimized GLB models under public/, then
 * prints a size report so the phone budget in docs/PERF_CHECKLIST.md can be
 * checked before wiring anything into the scene.
 *
 * Usage:
 *   node scripts/optimize-assets.mjs              # assets-src -> public
 *   node scripts/optimize-assets.mjs --legacy     # also shrink the existing public jpgs
 */

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceRoot = join(root, 'assets-src');
const textureOut = join(root, 'src', 'assets', 'textures');
const modelOut = join(root, 'public', 'models');
const legacyTextureRoot = join(root, 'public', 'assets', 'textures');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MODEL_EXTENSIONS = new Set(['.glb', '.gltf']);

const legacy = process.argv.includes('--legacy');

mkdirSync(textureOut, { recursive: true });
mkdirSync(modelOut, { recursive: true });

function listFiles(directory, extensions) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => extensions.has(extname(name).toLowerCase()))
    .map((name) => join(directory, name));
}

function walk(directory, extensions) {
  if (!existsSync(directory)) return [];
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...walk(fullPath, extensions));
    else if (extensions.has(extname(entry.name).toLowerCase())) found.push(fullPath);
  }
  return found;
}

function megabytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const rows = [];

async function optimizeTexture(file) {
  const name = basename(file, extname(file));
  const isFloor = /floor|flag/i.test(name);
  const maxSize = isFloor ? 512 : 1024;
  const output = join(textureOut, `${name}.webp`);

  await sharp(file)
    .resize({ width: maxSize, height: maxSize, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(output);

  rows.push({
    kind: 'texture',
    file: output,
    before: statSync(file).size,
    after: statSync(output).size,
  });
}

function optimizeModel(file) {
  const name = basename(file, extname(file));
  const output = join(modelOut, `${name}.glb`);
  const cli = join(root, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');

  if (existsSync(cli)) {
    try {
      execFileSync(
        process.execPath,
        [cli, 'optimize', file, output, '--compress', 'meshopt', '--texture-compress', 'webp'],
        { cwd: root, stdio: 'inherit' }
      );
    } catch {
      console.warn(`meshopt failed for ${basename(file)}; copying without compression`);
      execFileSync(process.execPath, [cli, 'copy', file, output], {
        cwd: root,
        stdio: 'inherit',
      });
    }
  } else {
    console.warn('gltf-transform is not installed; skipped model optimization');
    return;
  }

  rows.push({
    kind: 'model',
    file: output,
    before: statSync(file).size,
    after: statSync(output).size,
  });
}

async function main() {
  const sourceTextures = walk(join(sourceRoot, 'textures'), IMAGE_EXTENSIONS);
  const legacyTextures = legacy
    ? listFiles(legacyTextureRoot, IMAGE_EXTENSIONS)
    : [];
  const sourceModels = walk(join(sourceRoot, 'models'), MODEL_EXTENSIONS);

  const textures = [...sourceTextures, ...legacyTextures];
  if (textures.length === 0 && sourceModels.length === 0) {
    console.log('No files found in assets-src/. See docs/ASSET_PIPELINE.md.');
    if (!legacy) return;
  }

  for (const file of textures) await optimizeTexture(file);
  for (const file of sourceModels) optimizeModel(file);

  if (rows.length === 0) return;

  console.log('\nOptimized asset report');
  console.log('----------------------');
  let before = 0;
  let after = 0;
  for (const row of rows) {
    before += row.before;
    after += row.after;
    console.log(
      `${row.kind.padEnd(8)} ${basename(row.file).padEnd(36)} ${megabytes(row.before)} -> ${megabytes(row.after)}`
    );
  }
  console.log(`\nTotal: ${megabytes(before)} -> ${megabytes(after)}`);

  for (const row of rows) {
    if (row.kind === 'model' && row.after > 3 * 1024 * 1024) {
      console.warn(`Over target (3 MB): ${basename(row.file)}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
