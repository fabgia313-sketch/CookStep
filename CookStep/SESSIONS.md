# CookStep — Journal de sessions

> Mettre à jour après chaque session Claude Code.
> Ce fichier remplace la mémoire entre sessions.

---

## Session 0 — Initialisation projet
**Date** : 18 mai 2026
**Outil** : Claude.ai (chat)
**Statut** : ✅ Terminée

### Ce qui a été fait
- Définition de la stack technique (Expo + Supabase + API Anthropic)
- Analyse concurrentielle (SideChef, Kitchen Stories, Preplo, Tasty)
- Création de la structure du dossier projet
- Rédaction de CLAUDE.md, BRIEF.md, SUPABASE.md, SESSIONS.md
- Décision : données cloud (Supabase) plutôt que local
- Décision : Android uniquement pour la v1
- Différenciation identifiée : IA conversationnelle + marché francophone
- Recettes : générées via Claude, importées en Supabase (~50 recettes)

### Décisions techniques prises
- Supabase pour le backend (pas de JSON local)
- Expo SDK 52 + Expo Router
- API Anthropic pour l'IA embarquée
- EAS Build + Google Play Console pour la publication

### Prochaine session
**Objectif** : Génération des 50 recettes de lancement (JSON prêt pour import Supabase)

---

## Session 1 — Initialisation Expo
**Date** : 18 mai 2026
**Outil** : Claude Code
**Objectif** : Init Expo SDK 52 + Expo Router, connexion Supabase, navigation skeleton, design system
**Statut** : ✅ Terminée

### Ce qui a été fait
- Initialisation du projet Expo SDK 52 + Expo Router v4
- Connexion Supabase (client avec AsyncStorage pour la persistance de session)
- Design system de base : Colors, Typography, Spacing
- Types TypeScript pour Recipe, Step, Ingredient, UserProfile, Favorite
- Navigation : 3 tabs (Explorer, Favoris, Profil) + écran Détail + mode Cuisine
- Store Zustand pour les recettes (fetch, recherche, filtre par catégorie)
- Hooks : useRecipe, useTimer, usePortions
- Composants : Button, RecipeCard
- Stub API Claude (suggestSubstitution, adjustPortions)

### Fichiers créés
- `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`
- `.env` (à remplir), `.gitignore`
- `constants/Colors.ts`, `constants/Typography.ts`, `constants/Spacing.ts`
- `types/index.ts`
- `lib/supabase.ts`, `lib/claude.ts`
- `stores/useRecipeStore.ts`
- `hooks/useRecipe.ts`, `hooks/useTimer.ts`, `hooks/usePortions.ts`
- `components/ui/Button.tsx`, `components/recipe/RecipeCard.tsx`
- `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`, `app/(tabs)/favorites.tsx`, `app/(tabs)/profile.tsx`
- `app/recipe/[id].tsx`, `app/cook/[id].tsx`

### Prochaine session
**Objectif** : Remplir `.env` avec les vraies clés Supabase → `npm install` → tester sur Android

---

## Session 2 — Connexion Supabase + Écran Accueil
**Date** : 1 juin 2026
**Outil** : Claude Code
**Objectif** : Connecter l'app à Supabase et afficher l'écran Accueil / Catalogue de recettes
**Statut** : ✅ Terminée

### Ce qui a été fait
- Fix `react@18.3.1` (18.3.2 n'existe pas sur npm)
- `npm install` + installation `expo-image@~2.0.7` et `@react-native-community/netinfo@11.4.1`
- `.env` rempli avec les vraies clés Supabase (récupérées via MCP, ignoré par git)
- `lib/supabase.ts` — déjà correct, aucune modification nécessaire
- `types/index.ts` — déjà complet, aucune modification nécessaire
- `stores/useRecipeStore.ts` — ajout vérification offline avec NetInfo
- `components/recipe/RecipeCard.tsx` — migré de `Image` RN vers `expo-image`
- `app/(tabs)/index.tsx` — ajout bandeau hors-ligne

### Fichiers modifiés
- `package.json` (fix react version + ajout des 2 packages)
- `package-lock.json` (généré)
- `stores/useRecipeStore.ts`
- `components/recipe/RecipeCard.tsx`
- `app/(tabs)/index.tsx`
- `.env` (non poussé sur git)

### Problèmes rencontrés
- `react@18.3.2` n'existe pas → corrigé en `18.3.1`
- `npm install` sans `--legacy-peer-deps` échouait → résolu

### Prochaine session
**Objectif** : Créer l'écran Fiche Recette (`app/recipe/[id].tsx`)

---

## Session 3 — Écran Fiche Recette
**Date** : 1 juin 2026
**Outil** : Claude Code
**Objectif** : Créer l'écran Fiche Recette complet avec portions, expo-image, bouton fixe
**Statut** : ✅ Terminée

### Ce qui a été fait
- Réécriture complète de `app/recipe/[id].tsx`
  - Photo hero pleine largeur (300px) avec `expo-image` + bouton retour flottant
  - Titre, description, badges durée / difficulté / catégorie
  - Stepper portions − / + connecté au hook `usePortions` (quantités ajustées en temps réel)
  - Liste ingrédients avec quantités recalculées + hint d'ajustement
  - Bouton **"C'est parti ! 🔥"** fixe en bas de l'écran (hors ScrollView, SafeAreaView bottom)
  - États loading / error / offline avec écrans dédiés et bouton "Réessayer"
- Mise à jour `hooks/useRecipe.ts` — ajout gestion offline (NetInfo) + `refetch()`
- Correction bug TypeScript préexistant dans `components/ui/Button.tsx` (mélange ViewStyle/TextStyle)
- 0 erreur TypeScript (`tsc --noEmit`)

### Fichiers modifiés
- `app/recipe/[id].tsx` (réécriture complète)
- `hooks/useRecipe.ts` (ajout offline + refetch)
- `components/ui/Button.tsx` (fix TypeScript)
- `SESSIONS.md` (ce fichier)

### Problèmes rencontrés
- `Button.tsx` avait une erreur TypeScript latente (TextStyle dans array ViewStyle) → corrigé en séparant les StyleSheet par domaine

### Prochaine session
**Objectif** : Créer le Mode Cuisine (`app/cook/[id].tsx`) — étape en grand, timer circulaire, bouton "J'ai pas ça 🤔"

---

_Template pour les prochaines sessions :_

## Session N — [Nom]
**Date** :
**Outil** : Claude Code / Claude.ai
**Objectif** :
**Statut** : 🔄 En cours / ✅ Terminée / ❌ Bloquée

### Ce qui a été fait
-

### Fichiers modifiés
-

### Problèmes rencontrés
-

### Prochaine session
**Objectif** :
