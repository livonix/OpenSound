#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PACKAGE_PATH = path.join(__dirname, '../package.json');
const PACKAGE_LOCK_PATH = path.join(__dirname, '../package-lock.json');

// Importer le gestionnaire de changelog
const { updateChangelog, getLastTag, getCommitsSinceTag } = require('./changelog');

// Types de version
const VERSION_TYPES = {
  patch: 'Patch (bug fixes) - 1.0.0 → 1.0.1',
  minor: 'Minor (new features) - 1.0.0 → 1.1.0', 
  major: 'Major (breaking changes) - 1.0.0 → 2.0.0'
};

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
  return packageJson.version;
}

function updateVersion(type) {
  console.log(`🚀 Mise à jour de version (${type})...`);
  
  // Mettre à jour package.json
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
  const currentVersion = packageJson.version;
  
  // Parser la version
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  let newVersion;
  
  switch (type) {
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    default:
      throw new Error(`Type de version invalide: ${type}`);
  }
  
  console.log(`📦 Version actuelle: ${currentVersion}`);
  console.log(`✨ Nouvelle version: ${newVersion}`);
  
  // Mettre à jour package.json
  packageJson.version = newVersion;
  fs.writeFileSync(PACKAGE_PATH, JSON.stringify(packageJson, null, 2));
  
  // Mettre à jour package-lock.json
  if (fs.existsSync(PACKAGE_LOCK_PATH)) {
    const packageLockJson = JSON.parse(fs.readFileSync(PACKAGE_LOCK_PATH, 'utf8'));
    packageLockJson.version = newVersion;
    if (packageLockJson.packages && packageLockJson.packages['']) {
      packageLockJson.packages[''].version = newVersion;
    }
    fs.writeFileSync(PACKAGE_LOCK_PATH, JSON.stringify(packageLockJson, null, 2));
  }
  
  return newVersion;
}

function createGitTag(version) {
  console.log(`🏷️  Création du tag Git v${version}...`);
  
  try {
    // Commit les changements
    execSync('git add package.json package-lock.json CHANGELOG.md', { stdio: 'inherit' });
    execSync(`git commit -m "chore: bump version to v${version}"`, { stdio: 'inherit' });
    
    // Créer le tag
    execSync(`git tag v${version}`, { stdio: 'inherit' });
    
    console.log(`✅ Tag v${version} créé avec succès`);
  } catch (error) {
    console.error(`❌ Erreur lors de la création du tag: ${error.message}`);
    throw error;
  }
}

function buildAndPublish(version) {
  console.log(`🔨 Build et publication de la version ${version}...`);
  
  try {
    // Build l'application
    execSync('npm run build', { stdio: 'inherit' });
    
    // Créer l'installer
    execSync('npm run dist', { stdio: 'inherit' });
    
    console.log(`✅ Build terminé pour la version ${version}`);
    console.log(`📦 Fichiers créés dans le dossier 'release/'`);
    console.log(`🎯 Prêt pour la publication sur GitHub!`);
    
  } catch (error) {
    console.error(`❌ Erreur lors du build: ${error.message}`);
    throw error;
  }
}

// Main
function main() {
  const args = process.argv.slice(2);
  const type = args[0];
  
  if (!type || !VERSION_TYPES[type]) {
    console.log('🎵 OpenSound - Gestionnaire de version\n');
    console.log('Usage: node scripts/version.js <type>');
    console.log('\nTypes disponibles:\n');
    
    Object.entries(VERSION_TYPES).forEach(([key, description]) => {
      console.log(`  ${key.padEnd(6)} - ${description}`);
    });
    
    console.log('\nExemples:');
    console.log('  node scripts/version.js patch  # Pour un bug fix');
    console.log('  node scripts/version.js minor  # Pour une nouvelle feature');
    console.log('  node scripts/version.js major  # Pour un breaking change');
    
    process.exit(1);
  }
  
  try {
    console.log(`🎵 OpenSound - Gestion de version\n`);
    
    // Mettre à jour la version
    const newVersion = updateVersion(type);
    
    // Générer le changelog
    console.log(`📝 Génération du changelog...`);
    const lastTag = getLastTag();
    const commits = getCommitsSinceTag(lastTag);
    updateChangelog(newVersion, commits);
    
    // Créer le tag Git
    createGitTag(newVersion);
    
    // Build et préparer pour publication
    buildAndPublish(newVersion);
    
    console.log(`\n🎉 Version ${newVersion} prête!`);
    console.log(`\n📋 Prochaines étapes:`);
    console.log(`1. Push les changements: git push origin main --tags`);
    console.log(`2. Créer une release sur GitHub: https://github.com/livonix/OpenSound/releases/new`);
    console.log(`3. Uploader le fichier 'OpenSound Setup ${newVersion}.exe'`);
    console.log(`4. Copier le changelog depuis CHANGELOG.md`);
    
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateVersion, createGitTag, buildAndPublish };
