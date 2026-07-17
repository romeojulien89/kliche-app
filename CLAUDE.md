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
supabase/migrations/0001_init.sql  # schéma complet (events, guests, photos, photo_faces,
                                     # photographers, event_photographers, shares, admins) + RLS
                                     # exécuté à la main dans Supabase SQL Editor (pas de CLI liée)
src/
  app/
    layout.tsx        # polices (Playfair Display + Inter), script d'init thème, motif pagne
    page.tsx           # page d'accueil
    globals.css         # tokens couleur clair/sombre, motif pagne, animations cascade/halo
    admin/               # création d'événement (non protégé — pas d'auth admin pour l'instant)
    e/[code]/             # accueil invité, consentement, stubs selfie/galerie
  components/
    theme-toggle.tsx    # pilule Auto/Clair/Sombre (haut droit), persistée localStorage
  lib/
    theme.ts             # logique thème (auto = 6h-18h clair, sinon sombre) + script d'init inline
    event-code.ts          # génère le code court (6 car., sans O/0/I/1) affiché sur le QR
    supabase/
      client.ts             # client navigateur (clé publishable)
      server.ts               # client Server Component (cookies, RLS via anon/publishable)
      admin.ts                 # client service_role (server-only, contourne RLS) — mutations
                                 # invité/photographe qui n'ont pas de session Supabase Auth
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
- Le fichier `Kliche App key.rtf` (clés brutes Supabase/AWS collées par l'utilisateur) vit dans le dossier du projet mais est exclu via `.gitignore` — ne jamais le committer.
- Supabase utilise le nouveau format de clés (`sb_publishable_...` / `sb_secret_...`) plutôt que `anon`/`service_role` classiques — fonctionnellement équivalent pour `@supabase/ssr` et `@supabase/supabase-js`, juste un nom différent.
- `events.created_by` est nullable tant qu'il n'y a pas d'auth admin — `/admin` est un formulaire ouvert à quiconque a l'URL, pas de protection.
- Après toute modif de `.env.local`, redémarrer le serveur dev (Next.js ne recharge pas les env vars à chaud).

## État actuel

- **J1 terminé** : squelette Next.js + DA (thème clair/sombre auto + pilule manuelle, polices, motif pagne, animations cascade) + page d'accueil "KLICHÉ", logo Rocket Corporation recoloré en or via masque CSS. Vérifié en local (desktop + mobile), lint et typecheck propres.
- **J2 terminé** : schéma Supabase complet appliqué (SQL Editor, pas de CLI liée), `.env.local` configuré (clés Supabase + AWS pour plus tard). `/admin` crée un événement et génère un code court. `/e/[code]` affiche l'accueil (+ lien galerie publique si activée). `/e/[code]/consentement` enregistre le consentement (ligne `guests`, cookie `kliche_guest_session` 30 jours) et redirige vers un stub `/selfie`. Testé de bout en bout en live (création → consentement → vérif DB), événement de test supprimé après coup.
- Connu non bloquant : admin sans auth (voir Pièges connus), stubs `/selfie` et `/galerie` à remplacer en J3/J4.
- Toujours pas de remote GitHub connecté (prévu J6). Repo local avec 3 commits (J1 squelette, J1 logo, J2 Supabase).
- Prochaine étape : **J3** — upload photographe (`/studio`), traitement filigrane/cadre sponsor (sharp), affichage galerie publique avec les vraies photos.
