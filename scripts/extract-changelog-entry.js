/**
 * Copyright 2024-2026 Wingify Software Pvt. Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
const outputPath = process.argv[2] || path.join(projectRoot, 'release-notes.md');

const version = process.argv[3] || require(path.join(projectRoot, 'package.json')).version;
const changelog = fs.readFileSync(changelogPath, 'utf8');
const lines = changelog.split('\n');

let capture = false;
const entry = [];

for (const line of lines) {
  if (line.startsWith(`## [${version}]`)) {
    capture = true;
    entry.push(line);
    continue;
  }

  if (capture && /^## \[[^\]]+\]/.test(line)) {
    break;
  }

  if (capture) {
    entry.push(line);
  }
}

if (!entry.length) {
  fs.writeFileSync(outputPath, `No changelog entry found for version ${version}.\n`);
  process.exit(0);
}

fs.writeFileSync(outputPath, `${entry.join('\n').trim()}\n`);
console.log(`Wrote changelog entry for ${version} to ${outputPath}`);
