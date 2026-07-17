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
    e/[code]/             # accueil invité, consentement, galerie publique, stub selfie
    studio/                # upload photographe (non protégé), dropzone + file d'attente
    api/photos/upload/      # Route Handler : reçoit le fichier, appelle processPhoto, stocke, insère en DB
  components/
    theme-toggle.tsx    # pilule Auto/Clair/Sombre (haut droit), persistée localStorage
  lib/
    theme.ts             # logique thème (auto = 6h-18h clair, sinon sombre) + script d'init inline
    event-code.ts          # génère le code court (6 car., sans O/0/I/1) affiché sur le QR
    watermark.ts            # sharp : redimensionnement HD/preview + filigrane KLICHÉ + cadre sponsor (SVG composité)
    supabase/
      client.ts             # client navigateur (clé publishable)
      server.ts               # client Server Component (cookies, RLS via anon/publishable)
      admin.ts                 # client service_role (server-only, contourne RLS) — mutations
                                 # invité/photographe qui n'ont pas de session Supabase Auth,
                                 # et lectures publiques (galerie) sur des tables sans policy RLS
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
- `photos`, `guests`, etc. n'ont aucune policy RLS publique par design → toute lecture/écriture ciblée côté serveur (y compris pages publiques comme `/e/[code]/galerie`) doit utiliser `createAdminClient()`, jamais le client anon (`lib/supabase/server.ts`), sinon la requête renvoie silencieusement un tableau vide.
- `sharp` : ne jamais appeler `.metadata()` sur un pipeline après un `.resize()` pour connaître les dimensions de sortie — ça renvoie les dimensions **originales** (le resize est appliqué en lazy à la génération). Calculer soi-même les dimensions cibles avant de composer un overlay (voir `watermark.ts`).

## État actuel

- **J1 terminé** : squelette Next.js + DA (thème clair/sombre auto + pilule manuelle, polices, motif pagne, animations cascade) + page d'accueil "KLICHÉ", logo Rocket Corporation recoloré en or via masque CSS. Vérifié en local (desktop + mobile), lint et typecheck propres.
- **J2 terminé** : schéma Supabase complet appliqué (SQL Editor, pas de CLI liée), `.env.local` configuré (clés Supabase + AWS pour plus tard). `/admin` crée un événement et génère un code court. `/e/[code]` affiche l'accueil (+ lien galerie publique si activée). `/e/[code]/consentement` enregistre le consentement (ligne `guests`, cookie `kliche_guest_session` 30 jours) et redirige vers un stub `/selfie`. Testé de bout en bout en live (création → consentement → vérif DB), événement de test supprimé après coup.
- **J3 terminé** : buckets Supabase Storage créés (`photos-hd` privé, `photos-preview` public). `/studio` (dropzone multi-fichiers, progression par fichier via XHR, compteurs envoyées/traitées/livrées — "livrées" reste à 0 tant que le matching Rekognition n'existe pas). Route `/api/photos/upload` : sharp génère la version HD (max 3000px) et l'aperçu (max 1600px, filigrane diagonal "KLICHÉ" + cadre sponsor en bas), upload vers les deux buckets, insère la ligne `photos`. `/e/[code]/galerie` affiche les vraies photos en grille. Testé de bout en bout en live (upload API → vérif visuelle du filigrane → galerie), données de test supprimées après coup.
- Connu non bloquant : studio sans auth (comme admin), pas encore d'indexation Rekognition sur les photos uploadées (arrive en J4 avec le matching selfie), stub `/selfie` toujours en place.
- Toujours pas de remote GitHub connecté (prévu J6). Repo local, commits jusqu'à J3.
- Prochaine étape : **J4** — capture selfie invité (getUserMedia), Collection Rekognition par événement, IndexFaces à l'upload photographe, SearchFacesByImage au selfie invité, galerie personnelle temps réel.
