// Leonida Grid — entry program for the make.fun gta6-cover-art-01 bounty.
//
// The app itself is the static site in app/ (open app/index.html in a browser;
// it runs fully offline). This program is the hand-in: it copies app/ and
// screenshots/ into the output directory and writes the dossier the judge
// reads, using the kit's vendored buildDossier. Node 22, standard library
// only, no network. Output is deterministic: two runs write identical bytes.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (MAKEFUN_OUTPUT_DIR stands in for /output outside the grader.)

import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Empty the output directory's contents without removing the directory
// itself — in the grader it is a mount point and must stay put.
function clearContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

// Order directory entries by name, ascending.
function compareEntryNames(a: { name: string }, b: { name: string }): number {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

// Copy a tree in sorted order so the result never depends on the order the
// filesystem happens to enumerate directory entries.
function copyTreeSorted(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  const entries = readdirSync(from, { withFileTypes: true })
    .sort(compareEntryNames);
  for (const entry of entries) {
    const src = join(from, entry.name);
    const dst = join(to, entry.name);
    if (entry.isDirectory()) copyTreeSorted(src, dst);
    else if (entry.isFile()) copyFileSync(src, dst);
  }
}

clearContents(outputDir);
copyTreeSorted(join(repoDir, 'app'), join(outputDir, 'app'));
if (existsSync(join(repoDir, 'screenshots'))) {
  copyTreeSorted(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'));
} else {
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's gate, so a hand-in this program accepts is one
// the scorer accepts: dossier text capped at 160 KiB, at most 4 screenshots
// of 256 KiB, at most 993 app files / 48 MiB, no app path over 1000 bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
