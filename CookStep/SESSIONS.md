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

## Session 4 — Mode Cuisine
**Date** : 1 juin 2026
**Outil** : Claude Code
**Objectif** : Créer le Mode Cuisine — écran le plus important de l'app
**Statut** : ✅ Terminée

### Ce qui a été fait
- Réécriture complète de `app/cook/[id].tsx`
  - **TopBar** : bouton ✕, titre recette tronqué, badge "X/Y" coloré
  - **Barre de progression** animée (Reanimated `withTiming` sur la width réelle)
  - **Instruction** en très grand texte (fontSize xl+2, extraBold) — lisible mains mouillées
  - **Timer circulaire SVG animé** (`react-native-svg` + `Animated.createAnimatedComponent(Circle)`) avec `useAnimatedProps` via Reanimated
    - Cercle de fond gris + arc coloré animé en douceur (600ms, easing quad)
    - Tourne dans le sens horaire en partant du haut (`rotation="-90"`)
    - Passe au vert + affiche ✓ quand le timer est terminé
  - **Contrôles timer** : Démarrer / Pause / Reprendre / Relancer selon l'état
  - **Variante sans timer** : si `duration_sec` est null, pas de section timer
  - **Bouton flottant "J'ai pas ça 🤔"** (position absolute, bottom right, au-dessus de la nav)
  - **Modal substitution** : bottom sheet avec message "Bientôt disponible ✨" (placeholder IA)
  - **Navigation Précédent / Suivant** : bien espacée, grande zone de tap, disabled state sur le premier
  - **Écran de félicitations** : `🎉 Bravo, c'est prêt !` avec animation spring d'entrée, 2 boutons (accueil / recette)
  - **États loading / error / offline** avec bouton Réessayer
- Mise à jour `hooks/useTimer.ts` : ajout `done` (timer arrivé à 0 après démarrage) et `started` (booléen reset à chaque changement d'étape)
- 0 erreur TypeScript (`tsc --noEmit`)

### Fichiers modifiés
- `app/cook/[id].tsx` (réécriture complète)
- `hooks/useTimer.ts` (ajout `done` + `started`)
- `SESSIONS.md` (ce fichier)

### Problèmes rencontrés
- Aucun — 0 erreur TypeScript dès le premier passage

### Prochaine session
**Objectif** : Écran Favoris (`app/(tabs)/favorites.tsx`) — liste des recettes sauvegardées, toggle cœur sur les cartes, store Zustand + persistance Supabase

---

## Session 5 — Authentification + Favoris
**Date** : 1 juin 2026
**Outil** : Claude Code
**Objectif** : Auth Supabase (email + Google), store favoris, écrans Favoris et Profil
**Statut** : ✅ Terminée

### Ce qui a été fait
- Installation `expo-auth-session@~6.0.3` (pour `makeRedirectUri` Google OAuth)
- **`stores/useAuthStore.ts`** (nouveau)
  - Session Supabase, user, initialized, loading, error
  - `initialize()` : lit la session AsyncStorage + écoute `onAuthStateChange`
  - `signIn`, `signUp`, `signOut`, `signInWithGoogle` (WebBrowser + makeRedirectUri scheme `cookstep://`)
- **`stores/useFavoritesStore.ts`** (nouveau)
  - `fetchFavorites(userId)` : 2 requêtes Supabase (ids puis recettes complètes)
  - `toggle(recipeId, userId)` : mise à jour optimiste + sync Supabase (RLS `auth.uid()`)
  - `isFavorite(recipeId)`, `clear()`
- **`app/auth.tsx`** (nouveau)
  - Mode switcher Connexion / Inscription (tab pill)
  - Inputs email + mot de passe (avec show/hide password)
  - Validation locale + affichage erreurs Supabase
  - Message succès après inscription (vérification email)
  - Bouton "Continuer avec Google" (code prêt, nécessite config Supabase dashboard)
  - KeyboardAvoidingView + ScrollView pour Android
- **`app/_layout.tsx`** (modifié)
  - Appel `initialize()` au démarrage avec callback : charge les favoris si session active, clear si déconnexion
  - Ajout `<Stack.Screen name="auth">` (modal slide from bottom)
- **`components/recipe/RecipeCard.tsx`** (modifié)
  - Bouton ❤️ flottant en haut à gauche de l'image
  - Si connecté → toggle favori (optimiste) ; si non connecté → redirect vers `/auth`
  - Couleur orange #FF6B35 si favori, blanc transparent sinon
- **`app/(tabs)/favorites.tsx`** (réécrit)
  - Si non connecté : écran d'invitation avec bouton "Se connecter"
  - Si connecté + 0 favoris : écran vide avec bouton "Explorer les recettes"
  - Si connecté + favoris : grille 2 colonnes avec `RecipeCard` + pull-to-refresh
  - Compteur de favoris dans le header
- **`app/(tabs)/profile.tsx`** (réécrit)
  - Si non connecté : avatar placeholder + boutons Se connecter / Créer un compte
  - Si connecté : avatar initiale colorée, nom (metadata Google ou email), stats favoris, bouton déconnexion avec `Alert.alert`
- 0 erreur TypeScript (`tsc --noEmit`)

### Fichiers créés
- `stores/useAuthStore.ts`
- `stores/useFavoritesStore.ts`
- `app/auth.tsx`

### Fichiers modifiés
- `package.json` (+ expo-auth-session)
- `app/_layout.tsx`
- `app/(tabs)/favorites.tsx`
- `app/(tabs)/profile.tsx`
- `components/recipe/RecipeCard.tsx`
- `SESSIONS.md`

### Problèmes rencontrés
- Aucun — 0 erreur TypeScript dès le premier passage

### Notes de configuration Google OAuth
Pour activer la connexion Google :
1. Supabase dashboard → Authentication → Providers → Google : activer + copier les Client ID/Secret
2. Google Cloud Console → OAuth 2.0 → ajouter `cookstep://auth/callback` comme redirect URI
3. Supabase dashboard → URL Configuration → ajouter `cookstep://auth/callback` comme redirect URL

### Prochaine session
**Objectif** : Polishing UI — animations de transition, skeleton loaders, haptic feedback, test sur appareil Android réel

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
