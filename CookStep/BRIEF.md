# CookStep — Brief Projet

## Vision
Une app mobile Android qui transforme la cuisine en aventure guidée.
Pas un catalogue de recettes de plus — un compagnon de cuisine intelligent,
qui parle vrai, qui aide en temps réel, et qui rend la cuisine accessible à tous.

## Problème résolu
Suivre une recette en cuisine c'est galère :
- On jongle entre téléphone et plan de travail
- On perd sa place dans les étapes
- On n'a pas toujours tous les ingrédients
- Les apps existantes sont soit trop complexes, soit trop américaines

## Cible utilisateur
- 25–45 ans, cuisiniers du quotidien (pas chefs)
- Veulent bien manger sans y passer des heures
- À l'aise avec le mobile, pas forcément tech
- Marché francophone en priorité (France, Belgique, Suisse, Canada)

## Plateforme
- **Android uniquement** (v1)
- Publication via Google Play Console

## Fonctionnalités v1 (MVP)

### Must-have
- [ ] Catalogue de recettes (cloud Supabase)
- [ ] Mode cuisine étape par étape (écran par étape, timer intégré)
- [ ] Ajustement des portions (×2, ×0.5, etc.)
- [ ] Favoris synchronisés
- [ ] Authentification (email + Google)
- [ ] Assistant IA "J'ai pas ça" (substitutions d'ingrédients)

### Nice-to-have v1
- [ ] Navigation vocale mains-libres
- [ ] Ajout de recette perso (structurée par IA)
- [ ] Mode sombre

### Hors scope v1
- Publication iOS
- Livraison de courses
- Planification de menus
- Réseau social / partage communautaire

## Design
- Ton : chaleureux, ludique, encourageant
- Pas de jargon culinaire inutile
- Animations légères et plaisantes
- Gros texte lisible les mains mouillées

## Contenu recettes
- Générées via Claude (API Anthropic) et importées dans Supabase
- ~50 recettes pour le lancement
- Mix : cuisine française quotidienne, recettes rapides, végétarien, cuisine du monde
- Enrichissement communautaire prévu en v2

## Modèle économique (à définir)
- Freemium probable : accès libre + premium pour fonctions IA avancées
- Pas de pub dans la v1

## Concurrents directs
| App | Forces | Faiblesses |
|---|---|---|
| SideChef | Très complet | Centré US, interface chargée |
| Kitchen Stories | Beau, vidéos HD | Pas d'IA, payant |
| Preplo | IA TikTok, moderne | iOS seulement |
| Tasty | Grande audience | Catalogue statique, pas d'IA |

## Notre avantage
1. IA embarquée vraiment utile pendant la cuisson
2. Francophone natif
3. UX simple et ludique
4. Recettes enrichies automatiquement par IA

## Budget
- Claude Pro : 20€/mois
- Supabase : 0€/mois (gratuit jusqu'à 500MB)
- Google Play Console : 25€ une seule fois
- EAS Build : 0€/mois
- API Anthropic in-app : ~2–5€/mois au démarrage
- **Total : ~25€/mois + 25€ une fois**

## Roadmap

### Phase 1 — Conception
- [x] Brief rédigé
- [x] CLAUDE.md préparé
- [x] Recettes générées et prêtes pour import Supabase
- [ ] Maquettes écrans principaux

### Phase 2 — Setup & structure (Semaine 1)
- [ ] Initialisation projet Expo
- [ ] Configuration Supabase + import recettes
- [ ] Navigation skeleton
- [ ] Design system (couleurs, typo, composants de base)

### Phase 3 — Développement core (Semaines 2–4)
- [ ] Catalogue recettes + écran détail
- [ ] Mode cuisine étape par étape
- [ ] Timer intégré
- [ ] Ajustement portions
- [ ] Authentification + favoris

### Phase 4 — IA & polish (Semaines 5–6)
- [ ] Intégration API Anthropic (substitutions)
- [ ] Animations et micro-interactions
- [ ] Tests sur émulateur Android

### Phase 5 — Publication (Semaine 7–8)
- [ ] EAS Build production Android
- [ ] Google Play Console
- [ ] Screenshots + fiche store
