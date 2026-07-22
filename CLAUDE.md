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
  proxy.ts             # (ex-middleware, renommé en Next 16) rafraîchit la session Supabase,
                        # redirige vers /login de façon optimiste sur /admin, /studio
  app/
    layout.tsx        # polices (Playfair Display + Inter), script d'init thème, motif pagne
    page.tsx           # page d'accueil
    globals.css         # tokens couleur clair/sombre, motif pagne, animations cascade/halo
    login/               # connexion admin/photographe (Supabase Auth email+mdp)
    admin/               # layout.tsx protège tout /admin/* (requireAdmin) ; création d'événement,
                          # crée aussi la Collection Rekognition de l'événement (CreateCollectionCommand)
      photographes/         # l'admin crée des comptes photographe (email + mdp temporaire généré)
    e/[code]/             # accueil invité, consentement, galerie publique, capture selfie + galerie perso
    studio/                # layout.tsx protège tout /studio/* (requireStudioAccess) ; upload photographe
    api/photos/upload/      # Route Handler : processPhoto (sharp) + stockage + IndexFaces + rattachement auto
    api/guests/selfie/       # Route Handler : IndexFaces du selfie + SearchFacesByImage → lie photo_faces.guest_id
    api/guests/photos/        # Route Handler : GET, renvoie les photos déjà matchées pour l'invité courant (polling)
  components/
    theme-toggle.tsx    # pilule Auto/Clair/Sombre (haut droit), persistée localStorage
  lib/
    auth.ts               # requireAdmin()/requireStudioAccess() — vraie autorisation (table admins/photographers),
                           # appelés depuis les layouts server-side, pas depuis proxy.ts
    theme.ts             # logique thème (auto = 6h-18h clair, sinon sombre) + script d'init inline
    event-code.ts          # génère le code court (6 car., sans O/0/I/1) affiché sur le QR
    watermark.ts            # sharp : redimensionnement HD/preview + filigrane KLICHÉ + cadre sponsor (SVG composité)
    rekognition.ts            # client Rekognition + conventions CollectionId/ExternalImageId (photo-<id>, guest-<id>)
    event-stats.ts             # KPIs + flux d'activité pour le dashboard admin et le rapport sponsor
    realtime.ts                 # broadcast() (server-only, service_role) — diffusion Realtime après chaque action
    realtime-channels.ts         # noms de canaux (guest-<id>, event-<id>) — PAS server-only, utilisable côté client
    supabase/
      client.ts             # client navigateur (clé publishable)
      proxy.ts               # updateSession() — helper appelé par src/proxy.ts
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
- **Vercel — bugs invisibles en local, seulement en prod** (voir détail complet dans l'entrée J6 ci-dessous) :
  - Ne jamais passer un `Buffer` Node.js brut à `supabase-storage-js` `.upload()` — corrompu en serverless Vercel. Toujours l'envelopper : `new Blob([new Uint8Array(buffer)], { type: ... })`.
  - Ne jamais passer un `Buffer` produit par `sharp` directement à un SDK AWS (`Image: { Bytes: buffer }`) — peut être soutenu par un `SharedArrayBuffer` rejeté silencieusement. Toujours `Uint8Array.from(buffer)` avant.
  - Un `Redeploy` sur Vercel réutilise la configuration figée du déploiement (y compris un `Framework` mal détecté à l'import initial) — si les Project Settings ont changé depuis, il faut un **nouveau commit/déploiement**, pas un simple Redeploy.
  - Le compte équipe Vercel peut activer "Vercel Authentication" (Deployment Protection) par défaut, qui bloque **tout le monde**, pas seulement les previews — à vérifier/désactiver pour Production avant toute mise en ligne réelle.
  - Je n'ai pas d'accès direct aux logs Vercel (pas de CLI liée, pas de token) — en cas de bug uniquement reproductible en prod, le plus efficace est de reproduire l'appel en isolation (script Node local avec les mêmes identifiants/fichier réel téléchargé depuis Supabase) plutôt que d'itérer à l'aveugle, et de demander à l'utilisateur de copier-coller les logs de l'onglet Logs/déploiement quand nécessaire.

## État actuel

- **J1 terminé** : squelette Next.js + DA (thème clair/sombre auto + pilule manuelle, polices, motif pagne, animations cascade) + page d'accueil "KLICHÉ", logo Rocket Corporation recoloré en or via masque CSS. Vérifié en local (desktop + mobile), lint et typecheck propres.
- **J2 terminé** : schéma Supabase complet appliqué (SQL Editor, pas de CLI liée), `.env.local` configuré (clés Supabase + AWS pour plus tard). `/admin` crée un événement et génère un code court. `/e/[code]` affiche l'accueil (+ lien galerie publique si activée). `/e/[code]/consentement` enregistre le consentement (ligne `guests`, cookie `kliche_guest_session` 30 jours) et redirige vers un stub `/selfie`. Testé de bout en bout en live (création → consentement → vérif DB), événement de test supprimé après coup.
- **J3 terminé** : buckets Supabase Storage créés (`photos-hd` privé, `photos-preview` public). `/studio` (dropzone multi-fichiers, progression par fichier via XHR, compteurs envoyées/traitées/livrées — "livrées" reste à 0 tant que le matching Rekognition n'existe pas). Route `/api/photos/upload` : sharp génère la version HD (max 3000px) et l'aperçu (max 1600px, filigrane diagonal "KLICHÉ" + cadre sponsor en bas), upload vers les deux buckets, insère la ligne `photos`. `/e/[code]/galerie` affiche les vraies photos en grille. Testé de bout en bout en live (upload API → vérif visuelle du filigrane → galerie), données de test supprimées après coup.
- **J4 terminé** : Collection Rekognition par événement (créée dans `createEvent`). `/api/photos/upload` indexe désormais les visages de chaque photo (IndexFaces) et tente un rattachement auto aux invités déjà enregistrés (SearchFaces). `/e/[code]/selfie` : vrai viseur caméra (getUserMedia, viseur ovale + halo doré, miroir), capture → `/api/guests/selfie` (IndexFaces + SearchFacesByImage, seuil 85 %) → galerie personnelle qui poll `/api/guests/photos` toutes les 5 s (Realtime pas branché, polling seulement). Si l'invité a déjà un selfie enregistré, il retombe direct sur sa galerie en revisitant la page.
  - **Validé en conditions réelles par l'utilisateur** (Safari, vraie webcam, vraie photo iPhone) : selfie capturé → photo uploadée via `/studio` → rattachement automatique en base avec **99,99 % de similarité**. Pipeline complet confirmé fonctionnel de bout en bout, pas seulement testé mécaniquement.
  - Corrigé au passage : bug Safari FormData/File à corps vide (voir Pièges connus) qui bloquait tout upload réel depuis `/studio`.
- **J5 terminé** : visionneuse plein écran (`photo-viewer.tsx`, partagée entre galerie publique et galerie personnelle via `photo-grid.tsx`) — Partager sur WhatsApp (`wa.me` + log dans `shares` via `/api/shares`), Télécharger (URL signée 60s sur `photos-hd` si `hd_included`, sinon aperçu filigrané), Copier le lien. QR code (`/admin/[code]/qr`, lib `qrcode`, aperçu + export PNG haute résolution). Tableau de bord live (`/admin/[code]`, poll 8s) : photos, invités, taux de récupération, partages, délai moyen upload→matching, flux d'activité. Rapport sponsor imprimable (`/admin/[code]/rapport-sponsor`, argumentaire généré à partir des chiffres, `window.print()` + CSS print, pilule thème masquée à l'impression). `/admin` liste désormais les événements existants.
  - Testé en live sur l'événement réel `NR2DHB` (vraies données J4) : dashboard, QR, rapport sponsor et visionneuse tous vérifiés avec captures d'écran ; partage WhatsApp confirmé loggé en base (ligne de test supprimée après coup pour ne pas fausser les stats réelles de l'utilisateur). Le `window.open` vers `wa.me` est bloqué dans le navigateur sandbox de test (politique de sécurité de l'outil) — à revalider en conditions réelles comme le reste.
- **J6 terminé** : repo poussé sur GitHub (`romeojulien89/kliche-app`, SSH), déployé sur Vercel en production : **https://kliche-app.vercel.app**. Pas de nom de domaine acheté pour l'instant (Vercel suffit, HTTPS automatique — la caméra selfie fonctionne donc sur mobile réel).
  - Mise en prod nettement plus longue que prévu à cause de plusieurs bugs qui ne se voyaient qu'en environnement Vercel (jamais reproduits en local) :
    1. **Vercel Authentication** (Deployment Protection) activé par défaut sur le compte équipe → bloquait tout visiteur, y compris les invités scannant le QR code. Désactivé dans Settings → Deployment Protection.
    2. **"No framework detected"** : le tout premier déploiement de production avait figé `Framework: Other` (mauvaise détection à l'import initial) alors que les Project Settings disaient déjà Next.js — un simple *Redeploy* réutilise cette config figée par déploiement, il a fallu un **nouveau** commit pour qu'un déploiement frais reprenne les settings corrects.
    3. **Photos uploadées corrompues en prod** : passer un `Buffer` Node.js brut à `supabase-storage-js` `.upload()` produit un fichier illisible en environnement serverless Vercel (jamais en local). Fix : envelopper dans un `Blob` explicite (voir Pièges connus).
    4. **`photo_faces` vide en prod** malgré des photos valides : le buffer sharp est parfois soutenu par un `SharedArrayBuffer`, que le SDK AWS rejette silencieusement (`TypeError: input argument must be ArrayBuffer`), avalé par le `catch`. Fix : `Uint8Array.from(buffer)` avant de l'envoyer à Rekognition (voir Pièges connus). Diagnostiqué en reproduisant l'appel Rekognition en isolation avec le fichier réellement stocké (contournant l'absence d'accès aux logs Vercel).
  - Leçon retenue : sans accès aux logs Vercel en direct, chaque bug a demandé plusieurs allers-retours (demander à l'utilisateur de copier-coller les logs manuellement). Cf. l'idée de monitoring (Sentry) évoquée pour une prochaine étape.
- **Optimisation post-J6, indexation en arrière-plan** : l'indexation Rekognition (`indexAndMatchFaces`) tournait de façon synchrone dans `/api/photos/upload`, faisant attendre le photographe ~10s par photo. Déplacée dans un callback `after()` (`next/server`, natif Vercel via `waitUntil`) : la réponse HTTP part dès la photo stockée, l'indexation continue après coup. `maxDuration = 60` sur la route pour laisser le temps à la tâche différée (plusieurs visages = plusieurs appels `SearchFaces` séquentiels).
- **Optimisation post-J6, Realtime** : polling remplacé par Supabase Realtime **Broadcast** (pas Postgres Changes — `photos`/`guests`/`photo_faces` n'ont pas de policy RLS publique, un abonnement direct aux tables serait bloqué). Le serveur diffuse un événement (`lib/realtime.ts`, `broadcast()`) après chaque action pertinente (consentement, upload photo + matching, selfie, partage) sur un canal `event-<id>` (dashboard admin) ou `guest-<id>` (galerie personnelle) ; le client s'abonne et rafraîchit à la réception. Polling de secours conservé en filet (60s invité, 30s admin) si un message est manqué.
  - **Piège qui a cassé le build** : `lib/realtime.ts` (`server-only`, dépend de `createAdminClient`) exportait aussi `guestChannelName`/`eventChannelName`, importés depuis des Client Components (`selfie-capture.tsx`, `live-dashboard.tsx`) pour construire les noms de canaux côté client. `server-only` interdit d'importer **quoi que ce soit** d'un tel module depuis du code client, même les exports qui n'en dépendent pas — Turbopack fait échouer le build entier. Fix : les helpers de nommage (sans dépendance serveur) vivent dans `lib/realtime-channels.ts`, séparé de `lib/realtime.ts` qui ne garde que `broadcast()`. Si une future fonction serveur doit être appelée par un composant partagé client/serveur, séparer systématiquement ainsi plutôt que de mélanger dans un seul fichier.
  - Cette erreur n'apparaît qu'au **build Next.js/Turbopack complet** (`npm run build`), pas à `tsc --noEmit` ni `eslint` — désormais je lance aussi `npm run build` en local avant de pousser tout changement qui touche à la frontière Client/Server Component, pour l'attraper avant un cycle de déploiement Vercel perdu.
  - Fausse piste explorée en cours de route : un `engines.node: "22.x"` avait été ajouté en pensant que Realtime échouait faute de WebSocket natif (reproduit avec succès en local sur Node 20, qui n'a pas de WebSocket natif) — mais Vercel utilise déjà Node 24.x par défaut pour ce projet (qui l'a), donc ce n'était pas la cause. Retiré une fois le vrai bug (ci-dessus) identifié et corrigé ; confirmé par un test Realtime cross-client réel en prod (un script d'écoute séparé reçoit bien la diffusion déclenchée par `/api/shares`).
- **Optimisation post-J6, auth admin/photographe** : `/admin` et `/studio` protégés par Supabase Auth. `src/proxy.ts` (Next 16 a renommé "middleware" en "proxy", même fonctionnement) rafraîchit la session et redirige vers `/login` de façon optimiste (présence d'un utilisateur) ; le vrai contrôle d'accès (appartenance à `admins`/`photographers`, via `lib/auth.ts` `requireAdmin()`/`requireStudioAccess()`) est fait dans les layouts server-side — recommandation officielle Next.js (le proxy ne doit pas être la seule couche d'autorisation).
  - Compte admin fondateur créé directement via `supabase.auth.admin.createUser()` (clé service_role, pas de dashboard Supabase nécessaire) + ligne `admins` correspondante.
  - `/admin/photographes` : l'admin crée des comptes photographe (email + mot de passe temporaire généré, transmis manuellement — pas d'envoi d'email automatique, hors scope pour l'instant).
  - `events.created_by` et `photos.photographer_id` sont maintenant renseignés depuis la session authentifiée (avant : toujours `null`).
  - Piège : la barre "nom + Déconnexion" ajoutée dans `admin/layout.tsx`/`studio/layout.tsx` était alignée à droite (`justify-end`) — pile sous la pilule de thème (`fixed top-4 right-4`), donc invisible/cachée. Alignée à gauche à la place. Penser à la pilule de thème (coin haut-droit, fixed, z-50) avant de placer un nouvel élément dans cette zone.
- Connu non bloquant : "livrées" dans `/studio` toujours à 0 (compteur non branché sur le matching réel, et de toute façon asynchrone maintenant), pas de notification WhatsApp Business API ni presets colorimétriques (Phase 2 du produit, hors scope V1/MVP), pas de monitoring d'erreurs (Sentry ou équivalent) — chaque bug prod nécessite de demander à l'utilisateur de copier les logs Vercel à la main, pas d'interface pour changer son mot de passe (à faire via Supabase Dashboard directement pour l'instant).
- Pistes identifiées pour la suite (proposées à l'utilisateur, pas encore démarrées) : tâche de purge automatique à J+30 (`guests.purge_at` existe en base mais rien ne l'exécute), monitoring d'erreurs.
