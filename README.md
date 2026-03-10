# 🏠 AppartCompare

Comparez vos appartements avec l'IA Gemini. Collez un lien d'annonce, l'IA extrait automatiquement les critères et les affiche dans un tableau comparatif.

## Fonctionnalités

- 🔗 Analyse d'URLs d'annonces immobilières (SeLoger, LeBonCoin, PAP, Bien'ici, etc.)
- 🤖 Extraction automatique des critères via Gemini AI
- 📊 Vue cartes et vue tableau
- ⭐ Score automatique sur 10
- ✏️ Critères personnalisables
- 🔑 Clé API saisie directement dans l'interface

## Déploiement sur Vercel

### 1. Prérequis
- Compte [Vercel](https://vercel.com)
- Clé API Gemini : [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Deploy

```bash
# Option A : via CLI
npm i -g vercel
vercel

# Option B : via GitHub
# Push ce dossier sur GitHub, puis importez sur vercel.com
```

### 3. Variables d'environnement (optionnel)

Si vous voulez pré-configurer la clé API pour tous les utilisateurs :

Dans Vercel Dashboard → Settings → Environment Variables :
```
GEMINI_API_KEY = votre_clé_ici
```

Sinon, chaque utilisateur peut saisir sa propre clé dans ⚙ Paramètres.

## Développement local

```bash
npm install
cp .env.example .env.local
# Ajoutez GEMINI_API_KEY dans .env.local
npm run dev
```

## Structure

```
app/
  page.js          → Interface principale
  page.module.css  → Styles
  api/analyze/
    route.js       → API Route (fetch URL + Gemini)
  layout.js        → Layout racine
  globals.css      → Reset CSS
```
