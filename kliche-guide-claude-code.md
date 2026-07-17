# KLICHÉ — Guide de développement avec Claude Code
### Produit par Rocket Corporation · Guide pour fondateur non-technique
*Tu n'écriras aucune ligne de code : Claude Code le fait. Toi, tu diriges.*

---

## PARTIE A — Les choix techniques (déjà faits pour toi)

| Brique | Choix | Pourquoi |
|---|---|---|
| Framework | **Next.js + TypeScript + Tailwind CSS** | Standard mondial, web app rapide/élégante/responsive, parfaitement maîtrisé par Claude Code |
| Hébergement | **Vercel** (gratuit au départ) | Déploiement en 1 clic depuis GitHub, HTTPS automatique, aucun serveur à gérer |
| Base de données + comptes + stockage photos | **Supabase** (gratuit au départ) | Tout-en-un, interface visuelle, généreuse en gratuit |
| Reconnaissance faciale | **AWS Rekognition** | ~0,60 FCFA/photo, fiable, aucune maintenance |
| Partage WhatsApp | **Liens wa.me** au MVP (gratuit, zéro configuration) | L'API WhatsApp Business officielle viendra en phase 2 (elle exige une vérification Meta longue) |
| Paiement HD | **Phase 2** via CinetPay (Wave + Orange Money + MTN) | On lance d'abord sans paiement pour valider le produit |

**Découpage en 3 phases** (chaque phase = une app utilisable) :
- **Phase 1 (MVP pilote)** : upload photographe par navigateur → traitement (filigrane + cadre sponsor) → QR → selfie → reconnaissance → galerie → partage wa.me. *Suffisant pour tes 2-3 événements pilotes.*
- **Phase 2** : paiement HD CinetPay, notifications WhatsApp API, presets colorimétriques, vidéos.
- **Phase 3** : capture connectée boîtiers (FTP), montage live, multi-événements avancé.

---

## PARTIE B — Préparation (à faire une seule fois, ~1h)

1. **Créer les comptes** (email pro Rocket Corporation recommandé) :
   - github.com (stocke ton code) · vercel.com (héberge, connexion via GitHub) · supabase.com · aws.amazon.com (carte bancaire requise, coût quasi nul au départ) · claude.ai/code ou abonnement incluant Claude Code.
2. **Installer sur ton ordinateur** : Node.js (nodejs.org, version LTS, installation par défaut) puis Claude Code (suivre les instructions sur le site d'Anthropic — une seule commande à copier-coller dans le Terminal).
3. **Ouvrir le Terminal** (Mac : Cmd+Espace → "Terminal" / Windows : menu Démarrer → "PowerShell"). C'est la seule fenêtre "technique" que tu utiliseras : tu y tapes `claude` puis tu parles en français.
4. **Récupérer 4 clés** (Claude Code te guidera pour les placer) :
   - Supabase : Project Settings → API → `URL` + `anon key` + `service_role key`
   - AWS : créer un utilisateur IAM avec accès Rekognition → `Access key` + `Secret key`

> Règle d'or : quand une étape te bloque, copie le message d'erreur dans Claude Code et écris « aide-moi à résoudre ça ». Il s'en charge.

---

## PARTIE C — LE PROMPT CLAUDE CODE (Phase 1)

*Copie tout le bloc ci-dessous dans Claude Code, dans un dossier vide nommé `kliche`.*

```
Tu es mon développeur senior. Je suis fondateur non-technique : explique chaque action en français simple, une étape à la fois, et demande ma validation avant les choix importants. Optimise l'usage des tokens : réponses concises, pas de répétition de code déjà écrit.

# PROJET : KLICHÉ
Web app de livraison instantanée de photos d'événement par reconnaissance faciale.
Produit par Rocket Corporation (Abidjan). Langue : 100 % français. Devise : FCFA. Locale fr-FR.

# STACK IMPOSÉE
Next.js 14+ (App Router) + TypeScript + Tailwind CSS. Base de données/auth/stockage : Supabase. Reconnaissance faciale : AWS Rekognition (une Collection par événement). Déploiement : Vercel. Mobile-first, responsive, accessible (focus visible, prefers-reduced-motion respecté).

# DIRECTION ARTISTIQUE (obligatoire)
Identité "gala nocturne premium ivoirien" :
- Thème sombre : fond #161013, surface #221820, texte ivoire #F7F1E6, accent or champagne #E9C87E (texte sur accent : #20160a).
- Thème clair : fond #FAF5EB, surface #FFFDF8, texte #241A12, accent or profond #B8862F.
- Thème automatique selon l'heure (clair 6h-18h, sombre sinon) + choix manuel Auto/Clair/Sombre mémorisé (localStorage), pilule en haut à droite.
- Typo display : Playfair Display (Google Fonts) en 700 pour titres, style Didot. Corps : Inter.
- Motif de fond très discret type pagne (lignes diagonales or, opacité 5 %).
- Animations d'entrée en cascade sur chaque écran (translateY + fade, 0.5-0.7s, easing cubic-bezier(.2,.8,.2,1)), effet "développement polaroid" à l'apparition des photos (brightness/saturate), flash blanc bref quand une nouvelle photo arrive en direct, halo pulsant autour du viseur selfie. Tout désactivé si prefers-reduced-motion.
- Logo texte "KLICHÉ" en display, lettrage espacé. Pied de page : "Propulsé par Kliché · Rocket Corporation".

# RÔLES ET PARCOURS

## 1. Invité (aucun compte, accès par QR : /e/[code-evenement])
a. Accueil brandé : nom de l'événement, visuel, sponsor, bouton "Retrouver mes photos".
b. Écran consentement OBLIGATOIRE avant tout selfie : texte expliquant que le selfie sert uniquement à retrouver ses photos de cet événement, suppression automatique sous 30 jours, conformité réglementation ivoirienne (ARTCI), case à cocher non pré-cochée, bouton grisé tant que non cochée. Option secondaire "Parcourir la galerie sans selfie" (accès à la galerie publique si l'organisateur l'a activée).
c. Capture selfie via caméra du navigateur (getUserMedia), viseur ovale avec halo pulsant, conseils ("Bonne lumière", "Visage dégagé", "Souris").
d. Écran de recherche animé, puis galerie personnelle : uniquement SES photos (Rekognition SearchFacesByImage, seuil de similarité 85 %+), grille 2 colonnes, aperçus filigranés "KLICHÉ" + logo événement, badge et flash quand de nouvelles photos correspondantes arrivent (polling ou Supabase Realtime).
e. Visionneuse plein écran : cadre sponsor en bas de photo, boutons "Partager sur WhatsApp" (lien wa.me avec texte pré-rempli incluant le hashtag officiel et le lien de la photo), "Télécharger" (HD si l'organisateur l'a incluse, sinon aperçu filigrané + mention "HD bientôt disponible"), "Copier le lien".
f. La session invité persiste (cookie) : s'il revient, sa galerie est directement là.

## 2. Photographe (compte simple, invité par email par l'organisateur)
Page /studio : sélection de l'événement, zone drag-and-drop d'upload multiple avec file d'attente, barre de progression, compteur envoyées/traitées/livrées. À chaque photo reçue côté serveur : (1) redimensionnement + version aperçu avec filigrane et cadre sponsor (bibliothèque sharp), version HD conservée en privé ; (2) IndexFaces dans la Collection Rekognition de l'événement ; (3) rattachement automatique aux invités déjà enregistrés dont le visage correspond.

## 3. Organisateur / Admin Rocket (compte protégé, /admin)
a. Tableau de bord live par événement : photos capturées, invités enregistrés, taux de récupération, partages cliqués, délai moyen upload→livraison, flux d'activité en direct.
b. Gestion événement : nom, date, lieu, hashtag, visuel de couverture, nom + logo sponsor, HD incluse ou non, galerie publique oui/non, génération du QR code (affichage plein écran pour les écrans de salle + téléchargement PNG haute résolution pour impression).
c. Gestion équipe : inviter des photographes par email, voir leur volume d'envoi.
d. Rapport sponsor : page imprimable (mise en page propre pour "Imprimer en PDF") avec les KPIs et un court argumentaire de visibilité généré à partir des chiffres.

# BASE DE DONNÉES (Supabase, à créer via migrations SQL)
tables : events (code unique court pour le QR), guests (selfie_face_id Rekognition, event_id, cookie/session, consent_at, purge programmée à 30 j), photos (event_id, photographer_id, storage_path_hd privé, storage_path_preview public, status), photo_faces (photo_id, face_id, guest_id nullable, similarity), photographers, shares (compteur de clics de partage), admins.
RLS activée partout : un invité ne voit que ses photos, un photographe que ses événements, l'admin tout.
Tâche de purge : suppression des visages Rekognition et selfies à J+30 (fonction planifiée Supabase).

# QUALITÉ
- Gestion d'erreurs en français clair pour l'utilisateur final (jamais de jargon).
- Images servies optimisées (next/image), lazy loading, app rapide sur connexion 3G.
- Variables d'environnement dans .env.local (ne jamais les committer) : tu me listeras exactement lesquelles créer et où trouver chaque valeur.
- Écris des tests basiques sur les routes critiques (upload, recherche par selfie).

# MÉTHODE DE TRAVAIL (important)
Procède en jalons, et ARRÊTE-TOI à la fin de chacun pour me faire tester avant de continuer :
J1. Squelette Next.js + DA + page d'accueil Kliché → je vérifie le rendu.
J2. Supabase branché + création d'un événement test dans /admin + page invité /e/[code] avec accueil et consentement.
J3. Upload photographe + traitement filigrane/cadre + affichage galerie publique.
J4. Rekognition : selfie invité + galerie personnelle en temps réel.
J5. Partage WhatsApp, QR code, tableau de bord live, rapport sponsor.
J6. Déploiement Vercel + nom de domaine + tests sur téléphone réel.
À chaque jalon : dis-moi en 3 lignes ce qui est fait, comment le tester, et ce qui vient ensuite.
```

---

## PARTIE D — Après le prompt : ton rôle à chaque jalon

- **J1-J2** : tu regardes le rendu dans ton navigateur (Claude Code te donnera l'adresse locale, en général http://localhost:3000) et tu réagis comme un directeur artistique : « agrandis le titre », « l'or est trop clair », etc.
- **J3-J4** : tu testes avec de vraies photos (fais un mini shooting test). C'est là qu'on règle la qualité de la reconnaissance.
- **J5** : tu vérifies le parcours complet sur TON téléphone.
- **J6 — mise en ligne** : Claude Code te guidera pour pousser le code sur GitHub et connecter Vercel. Achète le domaine (ex. kliche.ci auprès d'un registrar ivoirien, ou kliche.app) — ~10 000-25 000 FCFA/an.
- **Ensuite** : événement pilote → retours → tu reviens dans Claude Code : « Phase 2 : ajoute le paiement CinetPay pour la HD ». Le contexte du projet est dans le code, il saura continuer.

## Budget de fonctionnement Phase 1
Vercel 0 F · Supabase 0 F · Rekognition ≈ 1 500-3 000 F par événement de 2 000 photos · domaine ≈ 15 000 F/an. **Total quasi nul jusqu'aux pilotes.**

## Sécurité — 3 règles absolues
1. Ne jamais partager tes clés (AWS, Supabase `service_role`) ailleurs que dans le fichier `.env.local`.
2. Toujours garder l'écran de consentement : c'est ta protection légale ARTCI.
3. Avant chaque événement réel : test complet la veille + sauvegarde Supabase activée.
