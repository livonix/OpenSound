# Scripts OpenSound

Ce dossier contient les scripts d'automatisation pour la gestion des versions et releases d'OpenSound.

## 🚀 Scripts de version

### Gestion des versions

Les scripts suivants gèrent automatiquement le versionnement de l'application :

#### `npm run version:patch`
- Incrémente la version de patch (1.0.0 → 1.0.1)
- Pour les corrections de bugs

#### `npm run version:minor` 
- Incrémente la version mineure (1.0.0 → 1.1.0)
- Pour les nouvelles fonctionnalités

#### `npm run version:major`
- Incrémente la version majeure (1.0.0 → 2.0.0)
- Pour les changements cassants (breaking changes)

### Scripts de release

#### `npm run release:patch`
- Met à jour la version (patch)
- Génère le changelog automatiquement
- Crée un tag Git
- Build l'application
- Crée l'installer Windows

#### `npm run release:minor`
- Met à jour la version (minor)
- Génère le changelog automatiquement
- Crée un tag Git
- Build l'application
- Crée l'installer Windows

#### `npm run release:major`
- Met à jour la version (major)
- Génère le changelog automatiquement
- Crée un tag Git
- Build l'application
- Crée l'installer Windows

## 📋 Processus de release

### 1. Préparation
```bash
# S'assurer que tout est commité
git status
git add .
git commit -m "feat: nouvelle fonctionnalité"
```

### 2. Créer la release
```bash
# Pour une correction de bug
npm run release:patch

# Pour une nouvelle fonctionnalité
npm run release:minor

# Pour un changement majeur
npm run release:major
```

### 3. Publication sur GitHub
```bash
# Push les changements et tags
git push origin main --tags
```

### 4. Créer la release sur GitHub
1. Aller sur https://github.com/livonix/OpenSound/releases/new
2. Sélectionner le tag créé (ex: v1.1.0)
3. Copier le changelog depuis `CHANGELOG.md`
4. Uploader le fichier `OpenSound Setup 1.1.0.exe`
5. Publier la release

## 📝 Changelog automatique

Le script `changelog.js` génère automatiquement le changelog basé sur les commits Git depuis le dernier tag :

### Catégories automatiques
- ✨ **Nouveautés** : Commits avec "feat" ou "feature"
- 🐛 **Corrections** : Commits avec "fix" ou "bug"
- 📚 **Documentation** : Commits avec "doc" ou "readme"
- 🔧 **Améliorations** : Autres commits

### Convention de commits
Pour un meilleur changelog, utilisez cette convention :

```
feat: ajouter la recherche par artiste
fix: corriger le bug de lecture audio
docs: mettre à jour le README
refactor: optimiser le cache Lavalink
```

## 🎯 Exemple d'utilisation complète

```bash
# 1. Développer une nouvelle fonctionnalité
git add .
git commit -m "feat: ajouter le mode playlist aléatoire"

# 2. Créer la release
npm run release:minor

# 3. Push sur GitHub
git push origin main --tags

# 4. Créer la release sur GitHub (manuel)
# - Aller sur https://github.com/livonix/OpenSound/releases/new
# - Sélectionner le tag v1.1.0
# - Copier le changelog depuis CHANGELOG.md
# - Uploader OpenSound Setup 1.1.0.exe
# - Publier
```

## 📁 Fichiers générés

- `CHANGELOG.md` - Historique des modifications
- `release/OpenSound Setup X.X.X.exe` - Installer Windows
- Tags Git `vX.X.X` - Versions tagguées

## ⚙️ Configuration

Les scripts sont configurés dans :
- `package.json` - Scripts npm
- `scripts/version.js` - Logique de version
- `scripts/changelog.js` - Génération du changelog

## 🔧 Dépannage

### Erreur "Git tag existe déjà"
```bash
# Supprimer le tag local
git tag -d v1.1.0

# Supprimer le tag distant
git push origin --delete v1.1.0

# Recréer la release
npm run release:minor
```

### Erreur de build
```bash
# Nettoyer et rebuild
npm run build
npm run dist
```

### Changelog vide
```bash
# Générer manuellement le changelog
node scripts/changelog.js
```
