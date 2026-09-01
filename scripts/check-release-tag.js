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

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const changelogPath = path.join(projectRoot, 'CHANGELOG.md');

function writeGithubOutput(key, value) {
  const outputPath = process.env.GITHUB_OUTPUT;

  if (outputPath) {
    fs.appendFileSync(outputPath, `${key}=${value}\n`);
  }
}

function readChangelogVersion() {
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const match = changelog.match(/^## \[([^\]]+)\]/m);

  if (!match) {
    console.error('Error: Could not find a version entry in CHANGELOG.md');
    process.exit(1);
  }

  return match[1];
}

function toTagName(version) {
  return version.startsWith('v') ? version : `v${version}`;
}

function remoteTagExists(tagName) {
  const remote = process.env.GIT_REMOTE || 'origin';

  try {
    execSync(`git fetch ${remote} --tags --force`, {
      cwd: projectRoot,
      stdio: 'pipe',
    });
  } catch (error) {
    console.warn(`Warning: could not fetch tags from ${remote}: ${error.message}`);
  }

  const result = execSync(`git ls-remote --tags ${remote} "refs/tags/${tagName}"`, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();

  return result.length > 0;
}

function main() {
  const changelogVersion = readChangelogVersion();
  const tagName = toTagName(changelogVersion);

  console.log(`Latest CHANGELOG.md version: ${changelogVersion}`);
  console.log(`Checking for existing tag: ${tagName}`);

  if (remoteTagExists(tagName)) {
    console.error('');
    console.error(`Error: Cannot release version ${changelogVersion}.`);
    console.error(`Tag ${tagName} already exists on the GitHub repository.`);
    console.error('');
    console.error(
      'A new CHANGELOG.md entry is required before releasing again.',
    );
    console.error(
      `Add a new top-level section, for example: ## [x.y.z] - YYYY-MM-DD`,
    );
    console.error('');
    process.exit(1);
  }

  console.log(`Tag ${tagName} does not exist. Release can proceed.`);
  writeGithubOutput('release_version', changelogVersion);
  writeGithubOutput('tag_name', tagName);
}

main();
