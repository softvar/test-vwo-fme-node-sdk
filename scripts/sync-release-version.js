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
const versionFilePath = path.join(projectRoot, 'VERSION.js');

const PACKAGE_FILES = ['package.json', 'package.vwo.json'];

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

function readPackageState(filePath) {
  const absolutePath = path.join(projectRoot, filePath);

  if (!fs.existsSync(absolutePath)) {
    console.warn(`Warning: ${filePath} not found`);
    return null;
  }

  const packageJson = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  return {
    version: packageJson.version || null,
    author: packageJson.author || null,
  };
}

function readVersionJsVersion() {
  if (!fs.existsSync(versionFilePath)) {
    return null;
  }

  const content = fs.readFileSync(versionFilePath, 'utf8');
  const match = content.match(/version:\s*["']([^"']+)["']/);

  return match ? match[1] : null;
}

function isAuthorInSync(author, packageStates) {
  if (!author) {
    return true;
  }

  return PACKAGE_FILES.every((file) => {
    const state = packageStates[file];
    return state && state.author === author;
  });
}

function isVersionInSync(changelogVersion, packageStates, versionJsVersion) {
  const packageVersions = PACKAGE_FILES.map((file) => packageStates[file]?.version);

  if (packageVersions.some((version) => !version)) {
    return false;
  }

  if (!versionJsVersion) {
    return false;
  }

  return (
    packageVersions.every((version) => version === changelogVersion) &&
    versionJsVersion === changelogVersion
  );
}

function updatePackageFile(filePath, version, author) {
  const absolutePath = path.join(projectRoot, filePath);
  const packageJson = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  let changed = false;

  if (packageJson.version !== version) {
    packageJson.version = version;
    changed = true;
  }

  if (author && packageJson.author !== author) {
    packageJson.author = author;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(absolutePath, `${JSON.stringify(packageJson, null, 2)}\n`);
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`Skipped ${filePath} (already up to date)`);
  }

  return changed;
}

function updateVersionFile(version) {
  const fileContent = `module.exports = { version: "${version}" };`;
  const current = fs.existsSync(versionFilePath)
    ? fs.readFileSync(versionFilePath, 'utf8')
    : '';

  if (current !== fileContent) {
    fs.writeFileSync(versionFilePath, fileContent);
    console.log('Updated VERSION.js');
    return true;
  }

  console.log('Skipped VERSION.js (already up to date)');
  return false;
}

function logVersionSummary(changelogVersion, packageStates, versionJsVersion) {
  console.log('\nVersion check summary:');
  console.log(`  CHANGELOG.md:     ${changelogVersion}`);

  for (const file of PACKAGE_FILES) {
    const state = packageStates[file];
    console.log(`  ${file.padEnd(18)} ${state?.version || 'missing'}`);
  }

  console.log(`  VERSION.js:       ${versionJsVersion || 'missing'}`);
  console.log('');
}

function main() {
  const author = process.env.RELEASE_AUTHOR || '';
  const changelogVersion = readChangelogVersion();

  const packageStates = Object.fromEntries(
    PACKAGE_FILES.map((file) => [file, readPackageState(file)]),
  );
  const versionJsVersion = readVersionJsVersion();

  logVersionSummary(changelogVersion, packageStates, versionJsVersion);

  const versionsMatch = isVersionInSync(changelogVersion, packageStates, versionJsVersion);
  const authorsMatch = isAuthorInSync(author, packageStates);

  if (versionsMatch && authorsMatch) {
    console.log(
      `All version files are already in sync with CHANGELOG.md (${changelogVersion}). Skipping updates.`,
    );
    writeGithubOutput('sync_needed', 'false');
    writeGithubOutput('release_version', changelogVersion);
    return;
  }

  if (versionsMatch && !authorsMatch) {
    console.log(
      `Versions already match CHANGELOG.md (${changelogVersion}). Updating author only where needed.`,
    );
  } else {
    console.log(`Syncing version files to CHANGELOG.md (${changelogVersion})...`);
  }

  let changed = false;

  for (const file of PACKAGE_FILES) {
    if (!packageStates[file]) {
      console.warn(`Warning: skipping missing file ${file}`);
      continue;
    }

    changed = updatePackageFile(file, changelogVersion, author) || changed;
  }

  changed = updateVersionFile(changelogVersion) || changed;

  if (changed) {
    console.log(`\nSync complete. All files now at version ${changelogVersion}.`);
  } else {
    console.log(`\nNo file changes required. All files already at version ${changelogVersion}.`);
  }

  writeGithubOutput('sync_needed', changed ? 'true' : 'false');
  writeGithubOutput('release_version', changelogVersion);
}

main();
