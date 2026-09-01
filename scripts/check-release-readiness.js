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

const WINGIFY_PACKAGE = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
).name;
const VWO_PACKAGE = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'package.vwo.json'), 'utf8'),
).name;

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

function isPublishedOnNpm(packageName, version) {
  try {
    const result = execSync(`npm view "${packageName}@${version}" version`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    return result === version;
  } catch (error) {
    const stderr = `${error.stderr || ''}${error.stdout || ''}${error.message || ''}`;

    if (
      stderr.includes('E404') ||
      stderr.includes('404 Not Found') ||
      stderr.includes('No match found') ||
      stderr.includes('is not in the npm registry')
    ) {
      return false;
    }

    console.error(`Error checking npm for ${packageName}@${version}:`);
    console.error(stderr);
    process.exit(1);
  }
}

function main() {
  const publishTarget = process.env.PUBLISH_TARGET || 'both';
  const dryRun = process.env.DRY_RUN === 'true';
  const changelogVersion = readChangelogVersion();
  const tagName = toTagName(changelogVersion);

  const wantWingify = publishTarget === 'both' || publishTarget === 'wingify';
  const wantVwo = publishTarget === 'both' || publishTarget === 'vwo';

  console.log(`Latest CHANGELOG.md version: ${changelogVersion}`);
  console.log(`Publish target: ${publishTarget}`);
  console.log('');

  const tagExists = remoteTagExists(tagName);
  console.log(`Git tag ${tagName}: ${tagExists ? 'exists (ok for partial release)' : 'not found'}`);
  console.log('');

  console.log('Checking npm registry...');
  const wingifyPublished = isPublishedOnNpm(WINGIFY_PACKAGE, changelogVersion);
  const vwoPublished = isPublishedOnNpm(VWO_PACKAGE, changelogVersion);

  console.log(`  ${WINGIFY_PACKAGE}@${changelogVersion}: ${wingifyPublished ? 'published' : 'not published'}`);
  console.log(`  ${VWO_PACKAGE}@${changelogVersion}: ${vwoPublished ? 'published' : 'not published'}`);
  console.log('');

  const publishWingify = wantWingify && !wingifyPublished;
  const publishVwo = wantVwo && !vwoPublished;

  if (!publishWingify && !publishVwo) {
    console.error(`Error: Nothing to release for version ${changelogVersion}.`);

    if (wantWingify && wingifyPublished) {
      console.error(`  - Wingify package is already published to npm.`);
    }

    if (wantVwo && vwoPublished) {
      console.error(`  - VWO package is already published to npm.`);
    }

    if (wingifyPublished && vwoPublished) {
      console.error('');
      console.error('Both packages are already published for this version.');
      console.error('Add a new CHANGELOG.md entry before releasing again.');
      console.error('For example: ## [x.y.z] - YYYY-MM-DD');
    }

    console.error('');
    process.exit(dryRun ? 0 : 1);
  }

  if (publishWingify) {
    console.log('Will publish Wingify package.');
  } else if (wantWingify) {
    console.log('Skipping Wingify publish (already on npm).');
  }

  if (publishVwo) {
    console.log('Will publish VWO package.');
  } else if (wantVwo) {
    console.log('Skipping VWO publish (already on npm).');
  }

  writeGithubOutput('release_version', changelogVersion);
  writeGithubOutput('tag_name', tagName);
  writeGithubOutput('tag_exists', tagExists ? 'true' : 'false');
  writeGithubOutput('wingify_published', wingifyPublished ? 'true' : 'false');
  writeGithubOutput('vwo_published', vwoPublished ? 'true' : 'false');
  writeGithubOutput('publish_wingify', publishWingify ? 'true' : 'false');
  writeGithubOutput('publish_vwo', publishVwo ? 'true' : 'false');
}

main();
