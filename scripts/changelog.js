#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHANGELOG_PATH = path.join(__dirname, '../CHANGELOG.md');

function getLastTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'v0.0.0'; // Premier tag
  }
}

function getCommitsSinceTag(tag) {
  try {
    const commits = execSync(`git log ${tag}..HEAD --pretty=format:"- %s (%h)"`, { encoding: 'utf8' });
    const commitList = commits.trim().split('\n').filter(line => line.trim());
    return commitList.length > 0 ? commitList : [];
  } catch (error) {
    console.log('Pas de commits trouvés ou premier tag');
    return [];
  }
}

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  return packageJson.version;
}

function updateChangelog(version, commits) {
  let changelog = '';
  
  // Lire le changelog existant
  if (fs.existsSync(CHANGELOG_PATH)) {
    changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  } else {
    // Créer un nouveau changelog
    changelog = `# Changelog OpenSound\n\nToutes les modifications notables de ce projet seront documentées dans ce fichier.\n\n`;
  }
  
  // Préparer la nouvelle section
  const date = new Date().toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let newSection = `## [${version}] - ${date}\n\n`;
  
  if (!commits || commits.length === 0) {
    newSection += '### 🎉 Première release!\n\n';
    newSection += '- Version initiale d\'OpenSound\n';
    newSection += '- Système de streaming musical complet\n';
    newSection += '- Integration Lavalink + YouTube\n';
    newSection += '- Mises à jour automatiques\n';
    newSection += '- Interface utilisateur moderne\n';
  } else {
    // Catégoriser les commits
    const features = [];
    const fixes = [];
    const docs = [];
    const other = [];
    
    commits.forEach(commit => {
      if (commit.toLowerCase().includes('feat') || commit.toLowerCase().includes('feature')) {
        features.push(commit);
      } else if (commit.toLowerCase().includes('fix') || commit.toLowerCase().includes('bug')) {
        fixes.push(commit);
      } else if (commit.toLowerCase().includes('doc') || commit.toLowerCase().includes('readme')) {
        docs.push(commit);
      } else {
        other.push(commit);
      }
    });
    
    if (features.length > 0) {
      newSection += '### ✨ Nouveautés\n\n';
      features.forEach(commit => newSection += `${commit}\n`);
      newSection += '\n';
    }
    
    if (fixes.length > 0) {
      newSection += '### 🐛 Corrections\n\n';
      fixes.forEach(commit => newSection += `${commit}\n`);
      newSection += '\n';
    }
    
    if (docs.length > 0) {
      newSection += '### 📚 Documentation\n\n';
      docs.forEach(commit => newSection += `${commit}\n`);
      newSection += '\n';
    }
    
    if (other.length > 0) {
      newSection += '### 🔧 Améliorations\n\n';
      other.forEach(commit => newSection += `${commit}\n`);
      newSection += '\n';
    }
  }
  
  newSection += '\n---\n\n';
  
  // Insérer la nouvelle section au début
  const firstH2Index = changelog.indexOf('## [');
  if (firstH2Index === -1) {
    changelog += newSection;
  } else {
    changelog = changelog.substring(0, firstH2Index) + newSection + changelog.substring(firstH2Index);
  }
  
  // Écrire le nouveau changelog
  fs.writeFileSync(CHANGELOG_PATH, changelog);
  
  console.log(`✅ Changelog mis à jour pour la version ${version}`);
  console.log(`📝 ${commits.length} commits ajoutés`);
}

// Main
function main() {
  console.log(`🎵 OpenSound - Gestionnaire de changelog\n`);
  
  const version = getCurrentVersion();
  const lastTag = getLastTag();
  
  console.log(`📦 Version actuelle: ${version}`);
  console.log(`🏷️  Dernier tag: ${lastTag}`);
  
  const commits = getCommitsSinceTag(lastTag);
  console.log(`📝 ${commits.length} commits trouvés`);
  
  updateChangelog(version, commits);
  
  console.log(`\n✨ Changelog prêt!`);
  console.log(`📋 Fichier: ${CHANGELOG_PATH}`);
}

if (require.main === module) {
  main();
}

module.exports = { updateChangelog, getLastTag, getCommitsSinceTag };
