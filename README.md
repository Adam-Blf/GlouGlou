# GlouGlou!

[![version](https://img.shields.io/badge/version-0.1.0-000091?style=flat-square)](https://github.com/Adam-Blf/GlouGlou/releases)

<!-- adam-badges:start -->
[![commits](https://img.shields.io/github/commit-activity/t/Adam-Blf/GlouGlou?color=001329&label=commits&style=flat-square)](https://github.com/Adam-Blf/GlouGlou/commits) [![visites](https://hits.sh/github.com/Adam-Blf/GlouGlou.svg?style=flat-square&label=visites&color=001329)](https://hits.sh/github.com/Adam-Blf/GlouGlou/) [![last commit](https://img.shields.io/github/last-commit/Adam-Blf/GlouGlou?color=D4A437&style=flat-square&label=dernier%20push)](https://github.com/Adam-Blf/GlouGlou/commits) [![top language](https://img.shields.io/github/languages/top/Adam-Blf/GlouGlou?style=flat-square)](https://github.com/Adam-Blf/GlouGlou) [![license](https://img.shields.io/github/license/Adam-Blf/GlouGlou?style=flat-square&color=D4A437)](LICENSE)
<!-- adam-badges:end -->


![Status](https://img.shields.io/badge/status-active-brightgreen)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Vercel](https://img.shields.io/badge/deploy-Vercel-000?logo=vercel&logoColor=white)

Le jeu de l'oie version apéro - 60 cases, 16 personnages, dé animé, système de code pour rejoindre une partie, installable en PWA.

**Live** - https://glouglou-mu.vercel.app

## Architecture

```mermaid
flowchart TB
    A["index.html<br/>chargement React UMD - Babel Standalone"]
    B["data/cases.js<br/>60 cases - categories - icones"]
    C["data/characters.js<br/>16 archetypes d'alcool"]
    D["components/app.jsx<br/>orchestration - logique de partie"]
    E["components/board.jsx<br/>plateau serpentin 6x10"]
    F["components/screens.jsx<br/>Home - Lobby - CharacterPick"]
    G["components/ui.jsx<br/>Dice - Avatar - Toast - Confetti"]
    H["components/net.jsx<br/>multijoueur P2P PeerJS - hote autoritatif"]
    I["sw.js + manifest.json<br/>Service Worker - PWA offline"]
    A --> D
    B --> D
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    A --> I
```

## Stack

- HTML + CSS pur (design system custom, palette néon)
- React 18 via UMD + Babel Standalone (compilation JSX dans le navigateur)
- Service Worker pour le fonctionnement offline
- Manifest PWA - installable iOS / Android / desktop

## Lancer en local

```bash
npm run dev
# puis ouvrir http://localhost:5173
```

> Un serveur statique HTTP est requis (le service worker ne marche pas en `file://`).

## Déploiement

Déployé sur Vercel en tant que site statique - aucun build, tout est servi tel quel.

```bash
vercel --prod
```

## Structure

```
index.html              # entrée + chargement React/Babel/SW
styles.css              # design system complet
manifest.json           # PWA manifest
sw.js                   # service worker (cache-first, offline)
icons/icon.svg          # icône vectorielle
data/
  cases.js              # 60 cases avec catégories/icônes/descriptions
  characters.js         # 16 archétypes d'alcool
components/
  ui.jsx                # Dice, Avatar, Toast, Confetti, GenderSelector
  net.jsx               # multijoueur PeerJS (host/guest, broker public)
  screens.jsx           # Home, Lobby, CharacterPick
  extra_screens.jsx     # Rules, HostSetup, TurnIntro, modals, EndStats
  board.jsx             # plateau serpentin 6x10
  app.jsx               # orchestration + logique de partie
```

## Gameplay

- Chaque case appartient à une catégorie (boire, donner, rôle, action, répit, spécial, tournée, ciblé).
- Cases spéciales chaînées - 39 → 33, 50 → -1, 53 → -3, 56 → téléport avant, 57 → téléport joueur.
- Rôles persistants - Roi des questions, Reine, Valet des pouces.
- Les bots jouent automatiquement pour tester le flow complet.

## Multijoueur

- P2P via [PeerJS](https://peerjs.com) - broker public, aucun backend requis.
- L'hôte crée la partie et obtient un code à 6 caractères. Les joueurs tapent ce code pour rejoindre.
- L'hôte est autoritatif - il applique les actions (dé, cases, modals) et re-broadcaste l'état complet à tous.
- Les guests envoient des actions RPC (`rollDice`, `closeModal`, `pickCupidon`, `giveSips`).
- Chacun ne peut agir que sur son propre tour / ses propres modals.

## Question homme/femme

À l'écran de choix de perso, chaque joueur déclare `homme` (🍌) ou `femme` (🍑). Les cases 19/44 ciblent les hommes, les cases 29/46 ciblent les femmes.

## À faire

- Jokers utilisables depuis l'UI en cours de tour
- Reconnexion guest après perte de connexion
- Host migration si l'hôte quitte

---

<p align="center">
  <sub>Par <a href="https://adam.beloucif.com">Adam Beloucif</a> - Data Engineer & Fullstack Developer - <a href="https://github.com/Adam-Blf">GitHub</a> - <a href="https://www.linkedin.com/in/adambeloucif/">LinkedIn</a></sub>
</p>


## Star History

<a href="https://www.star-history.com/?repos=Adam-Blf%2FGlouGlou&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=Adam-Blf/GlouGlou&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=Adam-Blf/GlouGlou&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=Adam-Blf/GlouGlou&type=date&legend=top-left" />
 </picture>
</a>
