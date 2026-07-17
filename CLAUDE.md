# CLAUDE.md — Kliché

Contexte projet pour Claude Code. Évite de ré-explorer tout le dossier à chaque session.

@AGENTS.md

## Produit

Kliché (Rocket Corporation, Abidjan) : web app de livraison instantanée de photos d'événement par reconnaissance faciale. 100 % français, FCFA, locale fr-FR. Le cahier des charges complet (parcours invité/photographe/organisateur, DA détaillée, schéma DB, jalons) est dans [kliche-guide-claude-code.md](kliche-guide-claude-code.md) — s'y référer avant toute décision de scope ou de design.

Développé pour un fondateur non-technique : expliquer chaque action en français simple, une étape à la fois, demander validation avant les choix structurants.

## Stack

- Next.js 16 (App Router, TypeScript), React 19, Tailwind v4
- Supabase (DB + auth + stockage), AWS Rekognition (reconnaissance faciale), Vercel (déploiement)
- Comptes GitHub/Supabase/Vercel/AWS déjà créés par l'utilisateur

## Structure

```
src/
  app/
    layout.tsx        # polices (Playfair Display + Inter), script d'init thème, motif pagne
    page.tsx           # page d'accueil
    globals.css         # tokens couleur clair/sombre, motif pagne, animations cascade/halo
  components/
    theme-toggle.tsx    # pilule Auto/Clair/Sombre (haut droit), persistée localStorage
  lib/
    theme.ts             # logique thème (auto = 6h-18h clair, sinon sombre) + script d'init inline
```

## Direction artistique (voir guide pour détail complet)

- Thème sombre par défaut si "Auto" hors 6h-18h : fond `#161013`, surface `#221820`, texte `#F7F1E6`, accent `#E9C87E`
- Thème clair : fond `#FAF5EB`, surface `#FFFDF8`, texte `#241A12`, accent `#B8862F`
- Dark mode piloté par classe `.dark` sur `<html>` (Tailwind v4 `@custom-variant dark`), appliquée par un script inline bloquant dans le `<head>` (évite le flash) — logique dupliquée dans `THEME_INIT_SCRIPT` (lib/theme.ts) et le comportement client de `theme-toggle.tsx`. Si la logique auto/clair/sombre change, mettre à jour les deux.
- Playfair Display (700) pour les titres (`font-display`), Inter pour le corps (`font-sans`)
- `prefers-reduced-motion` respecté (désactive `.cascade` et `.halo-pulse` dans globals.css)

## Pièges connus

- Les composants qui lisent `localStorage` au montage (ex. `theme-toggle.tsx`) doivent utiliser un `useState(() => ...)` avec lazy initializer + `suppressHydrationWarning`, jamais un `setState` dans un `useEffect` — la règle ESLint `react-hooks/set-state-in-effect` (Next 16 / React 19) bloque ce pattern.
- Next.js 16 : ce projet a été scaffoldé avec des changements potentiellement différents de l'entraînement du modèle. En cas de doute sur une API, consulter `node_modules/next/dist/docs/` avant d'écrire du code (voir AGENTS.md).

## État actuel

- **J1 terminé** : squelette Next.js + DA (thème clair/sombre auto + pilule manuelle, polices, motif pagne, animations cascade) + page d'accueil "KLICHÉ". Vérifié en local (desktop + mobile), lint et typecheck propres.
- Pas encore de dépôt Git distant connecté — GitHub/Vercel/Supabase/AWS existent côté compte utilisateur mais ne sont pas encore branchés au projet (prévu au jalon J6, sauf pour Supabase qui arrivera dès J2).
- Prochaine étape : **J2** — brancher Supabase (schéma `events`), page admin de création d'événement test, page invité `/e/[code]` (accueil + écran de consentement).
