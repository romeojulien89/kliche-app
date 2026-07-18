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
                          # crée aussi la Collection Rekognition de l'événement (CreateCollectionCommand)
    e/[code]/             # accueil invité, consentement, galerie publique, capture selfie + galerie perso
    studio/                # upload photographe (non protégé), dropzone + file d'attente
    api/photos/upload/      # Route Handler : processPhoto (sharp) + stockage + IndexFaces + rattachement auto
    api/guests/selfie/       # Route Handler : IndexFaces du selfie + SearchFacesByImage → lie photo_faces.guest_id
    api/guests/photos/        # Route Handler : GET, renvoie les photos déjà matchées pour l'invité courant (polling)
  components/
    theme-toggle.tsx    # pilule Auto/Clair/Sombre (haut droit), persistée localStorage
  lib/
    theme.ts             # logique thème (auto = 6h-18h clair, sinon sombre) + script d'init inline
    event-code.ts          # génère le code court (6 car., sans O/0/I/1) affiché sur le QR
    watermark.ts            # sharp : redimensionnement HD/preview + filigrane KLICHÉ + cadre sponsor (SVG composité)
    rekognition.ts            # client Rekognition + conventions CollectionId/ExternalImageId (photo-<id>, guest-<id>)
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
- Rekognition : une Collection par événement, nommée `kliche-<event.id>` (créée à la création de l'événement, échec non bloquant — voir `admin/actions.ts`). Chaque visage indexé porte un `ExternalImageId` préfixé `photo-<photo.id>` (upload photographe) ou `guest-<guest.id>` (selfie invité) — c'est ce préfixe qui permet de distinguer les deux types de visages dans les résultats `SearchFaces`/`SearchFacesByImage` (voir `lib/rekognition.ts`).
- Le matching est bidirectionnel : à l'upload d'une photo, on cherche si un visage indexé correspond à un `guest-*` déjà enregistré ; au selfie d'un invité, on cherche si son visage correspond à des `photo-*` déjà indexées. Les deux écritures mettent à jour `photo_faces.guest_id`/`similarity` — c'est ce qui fait que la galerie personnelle se remplit même pour des photos arrivées après le selfie (via le polling de `/api/guests/photos`).
- Safari (macOS/iOS) peut envoyer un `FormData` contenant un `File` avec un corps HTTP vide (`Content-Length: 0`) alors que le `Content-Type` multipart est correct — notamment pour des photos dont l'original n'est pas totalement téléchargé localement (photothèque iCloud avec "Optimiser le stockage"). Contournement : lire le fichier en `ArrayBuffer` côté client puis construire un `Blob` explicite avant de l'ajouter au `FormData` (voir `upload-studio.tsx`, `uploadFile`). Si un futur formulaire d'upload refait le même pattern XHR/FormData(File), appliquer le même contournement.
- Le serveur dev (`npm run dev -- -p 3001`) doit tourner en tâche de fond détachée du terminal (`&` + `disown`, log dans `/tmp/kliche-dev.log`) pour rester accessible depuis Safari entre deux messages — `preview_start` (outil de prévisualisation) redémarre parfois le serveur en arrière-plan mais ne garantit pas qu'il reste actif d'un tour à l'autre.

## État actuel

- **J1 terminé** : squelette Next.js + DA (thème clair/sombre auto + pilule manuelle, polices, motif pagne, animations cascade) + page d'accueil "KLICHÉ", logo Rocket Corporation recoloré en or via masque CSS. Vérifié en local (desktop + mobile), lint et typecheck propres.
- **J2 terminé** : schéma Supabase complet appliqué (SQL Editor, pas de CLI liée), `.env.local` configuré (clés Supabase + AWS pour plus tard). `/admin` crée un événement et génère un code court. `/e/[code]` affiche l'accueil (+ lien galerie publique si activée). `/e/[code]/consentement` enregistre le consentement (ligne `guests`, cookie `kliche_guest_session` 30 jours) et redirige vers un stub `/selfie`. Testé de bout en bout en live (création → consentement → vérif DB), événement de test supprimé après coup.
- **J3 terminé** : buckets Supabase Storage créés (`photos-hd` privé, `photos-preview` public). `/studio` (dropzone multi-fichiers, progression par fichier via XHR, compteurs envoyées/traitées/livrées — "livrées" reste à 0 tant que le matching Rekognition n'existe pas). Route `/api/photos/upload` : sharp génère la version HD (max 3000px) et l'aperçu (max 1600px, filigrane diagonal "KLICHÉ" + cadre sponsor en bas), upload vers les deux buckets, insère la ligne `photos`. `/e/[code]/galerie` affiche les vraies photos en grille. Testé de bout en bout en live (upload API → vérif visuelle du filigrane → galerie), données de test supprimées après coup.
- **J4 terminé** : Collection Rekognition par événement (créée dans `createEvent`). `/api/photos/upload` indexe désormais les visages de chaque photo (IndexFaces) et tente un rattachement auto aux invités déjà enregistrés (SearchFaces). `/e/[code]/selfie` : vrai viseur caméra (getUserMedia, viseur ovale + halo doré, miroir), capture → `/api/guests/selfie` (IndexFaces + SearchFacesByImage, seuil 85 %) → galerie personnelle qui poll `/api/guests/photos` toutes les 5 s (Realtime pas branché, polling seulement). Si l'invité a déjà un selfie enregistré, il retombe direct sur sa galerie en revisitant la page.
  - **Validé en conditions réelles par l'utilisateur** (Safari, vraie webcam, vraie photo iPhone) : selfie capturé → photo uploadée via `/studio` → rattachement automatique en base avec **99,99 % de similarité**. Pipeline complet confirmé fonctionnel de bout en bout, pas seulement testé mécaniquement.
  - Corrigé au passage : bug Safari FormData/File à corps vide (voir Pièges connus) qui bloquait tout upload réel depuis `/studio`.
- **J5 terminé** : visionneuse plein écran (`photo-viewer.tsx`, partagée entre galerie publique et galerie personnelle via `photo-grid.tsx`) — Partager sur WhatsApp (`wa.me` + log dans `shares` via `/api/shares`), Télécharger (URL signée 60s sur `photos-hd` si `hd_included`, sinon aperçu filigrané), Copier le lien. QR code (`/admin/[code]/qr`, lib `qrcode`, aperçu + export PNG haute résolution). Tableau de bord live (`/admin/[code]`, poll 8s) : photos, invités, taux de récupération, partages, délai moyen upload→matching, flux d'activité. Rapport sponsor imprimable (`/admin/[code]/rapport-sponsor`, argumentaire généré à partir des chiffres, `window.print()` + CSS print, pilule thème masquée à l'impression). `/admin` liste désormais les événements existants.
  - Testé en live sur l'événement réel `NR2DHB` (vraies données J4) : dashboard, QR, rapport sponsor et visionneuse tous vérifiés avec captures d'écran ; partage WhatsApp confirmé loggé en base (ligne de test supprimée après coup pour ne pas fausser les stats réelles de l'utilisateur). Le `window.open` vers `wa.me` est bloqué dans le navigateur sandbox de test (politique de sécurité de l'outil) — à revalider en conditions réelles comme le reste.
- Connu non bloquant : studio/admin toujours sans auth, "livrées" dans `/studio` toujours à 0 (compteur non branché sur le matching réel), pas de notification WhatsApp Business API ni presets colorimétriques (Phase 2 du produit, hors scope V1/MVP).
- Toujours pas de remote GitHub connecté (prévu J6). Repo local, commits jusqu'à J5.
- Prochaine étape : **J6** — déploiement Vercel + nom de domaine + tests sur téléphone réel (résout aussi le blocage caméra HTTP constaté avant J5, HTTPS automatique sur Vercel).
