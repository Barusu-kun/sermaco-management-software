# Système de Gestion de Planning et Transport — v2.1

Système multiplateforme :

| Composant            | Plateforme cible          | Technologie                              |
|----------------------|---------------------------|------------------------------------------|
| **Serveur (API)**    | 🐧 Linux (service)        | Node.js + Express + Prisma + PostgreSQL  |
| **Dispatch**         | 🪟 Windows (app desktop)  | React + **Electron** → installateur .exe |
| **Chauffeur**        | 🤖 Android / 🍎 iOS       | React + **Capacitor** (app native)       |

```
planning-transport/
├── api/            # Serveur backend (déployé sur Linux)
├── mock-server/    # Serveur API FACTICE — tester le frontend sans base ni serveur
├── web/            # UI Dispatch (React) — embarquée dans l'app Electron
├── desktop/        # App Windows Electron (+ installateur .exe)
├── mobile/         # App Chauffeur (React + Capacitor Android/iOS)
├── deploy/linux/   # Script d'installation serveur + service systemd
├── install.bat     # Installateur Windows : construit le .exe Dispatch
├── docker-compose.yml
└── .env.example
```

---

## 🧪 Tester le frontend SANS serveur ni base de données

Le dossier **`mock-server/`** est un faux serveur API en mémoire (aucune base
PostgreSQL, aucun serveur Linux requis). Il répond exactement comme l'API réelle,
avec des données de démonstration positionnées **autour de la date du jour**.

### 1. Démarrer le mock
```bat
mock-server\start.bat          REM Windows (double-clic possible)
```
```bash
cd mock-server && npm install && npm start      # → http://localhost:3000
```

### 2. Tester une interface
**Interface Dispatch** (dans le navigateur, le plus simple) :
```bash
cd web && npm install && npm run dev            # → http://localhost:5173
```
Le proxy renvoie `/api` vers le mock. Connectez-vous : **OP-001 / 1234**.

**App desktop Electron** : lancez le `.exe`, et à l'écran de configuration entrez
`http://localhost:3000/api/v1`.

**App Chauffeur** :
```bash
cd mobile && npm install && npm run dev          # → http://localhost:5174
```
Connectez-vous **CH-001 / 0000** (sur l'app native, renseignez le serveur
`http://10.0.2.2:3000/api/v1` pour l'émulateur Android, ou l'IP de votre PC).

> Les données du mock sont réinitialisées à chaque redémarrage. Les créations /
> modifications / suppressions fonctionnent pendant la session.

---

## 🪟 Client Dispatch Windows (.exe)

### Construire l'installateur
Double-cliquez sur **`install.bat`** (ou en ligne de commande) :

```bat
install.bat
```

Cela installe les dépendances, compile l'interface et génère :

```
desktop\release\Planning-Transport-Dispatch-Setup-2.1.0.exe
```

> Prérequis : [Node.js 20+](https://nodejs.org). Première exécution : téléchargement
> d'Electron (~115 Mo), soyez patient.

### Installer / utiliser
1. Lancez le fichier `...-Setup-2.1.0.exe` → installation classique Windows (choix du dossier, raccourcis).
2. Au **premier démarrage**, saisissez l'URL de l'API de votre serveur Linux
   (ex. `http://192.168.1.50:3000/api/v1`) — bouton **Tester** pour vérifier la connexion.
3. Connectez-vous en tant que Dispatch (`OP-001` / `1234`).

> Reconfigurer le serveur plus tard : menu **Fichier ▸ Configurer le serveur…**
> (ou relancez `desktop\build-windows-installer.bat` pour reconstruire).

---

## 🐧 Serveur Linux

### Installation en service systemd
Sur le serveur Linux, depuis la racine du projet :

```bash
cd deploy/linux
chmod +x install-server.sh
sudo ./install-server.sh --seed        # --seed = charge les données de démo
```

Le script installe les dépendances, synchronise la base (`prisma db push`),
puis enregistre et démarre le service **`planning-api`** :

```bash
sudo systemctl status planning-api
sudo journalctl -u planning-api -f
curl http://localhost:3000/health
```

> Prérequis : Node.js 20+ et un PostgreSQL accessible via `DATABASE_URL`
> (le script vous invite à éditer `api/.env` si absent).

### Alternative Docker (Linux ou dev)
```bash
cp .env.example .env      # ajustez DB_PASSWORD et JWT_SECRET
docker compose up -d --build
docker compose exec api npm run db:seed
```
| Service        | URL                          |
|----------------|------------------------------|
| API            | http://localhost:3000        |
| Dispatch (web) | http://localhost:8080        |
| PWA Chauffeur  | http://localhost:8081        |

---

## 📱 App Chauffeur Android / iOS (Capacitor)

Depuis `mobile/` :

```bash
npm install

# Android (nécessite Android Studio + SDK)
npm run cap:add:android
npm run android:build          # build web + sync + ouvre Android Studio
# → dans Android Studio : Build ▸ Generate Signed Bundle / APK

# iOS (nécessite un Mac + Xcode)
npm run cap:add:ios
npm run ios:build              # build web + sync + ouvre Xcode
```

À l'ouverture de l'app, dépliez **Serveur** sur l'écran de connexion et saisissez
l'URL de l'API (ex. `http://192.168.1.50:3000/api/v1`), puis connectez-vous
(`CH-001` / PIN `0000`).

> L'app peut aussi rester une **PWA** installable : `npm run build` puis servez `dist/`
> (voir service `mobile` du docker-compose, http://localhost:8081).

---

## 🧑‍💻 Développement local (hot reload)

```bash
# 1. Serveur
cd api && cp .env.example .env && npm install
npx prisma db push && npm run db:seed && npm run dev     # :3000

# 2. Dispatch (navigateur, proxy /api → :3000)
cd web && npm install && npm run dev                     # :5173

# 3. Chauffeur (navigateur)
cd mobile && npm install && npm run dev                  # :5174

# App desktop en dev (charge le build web local)
cd desktop && npm install && npm start
```

## 🔑 Comptes de démonstration

| Rôle      | Identifiant | Secret              | Client            |
|-----------|-------------|---------------------|-------------------|
| Dispatch  | `OP-001`    | mot de passe `1234` | Windows / web     |
| Chauffeur | `CH-001`    | PIN `0000`          | Android / iOS     |
| Chauffeur | `CH-002`    | *(aucun PIN)*       | Android / iOS     |

> ℹ️ Le schéma ne prévoit pas de colonne `password` : la connexion Dispatch vérifie
> `code_id` + `pin_code` (haché bcrypt) comme mot de passe.

---

## ✨ Fonctionnalités

- **Auth JWT + RBAC** (DISPATCH / CHAUFFEUR), PIN chiffrés (bcrypt), rate limiting, Helmet, CORS.
- **URL serveur configurable** côté client desktop (Electron) et mobile (Capacitor) — pas de recompilation pour changer de serveur.
- **Génération applicative des identifiants** (`CH-001`, `SERV-2026-001`).
- **Détection de chevauchement d'horaires** par chauffeur (création, édition, drag & drop).
- **Journal d'audit** applicatif (`audit_log`) sur `personnel` et `services`.
- **Calendrier** FullCalendar : Jour/Semaine/Mois, drag & drop, code couleur par client.
- **CRUD** Personnel (soft delete) et Clients.
- **Statistiques** (Recharts) + **exports Excel/CSV** (téléchargement via lien, token en query).
- **App Chauffeur** : agenda du jour, bouton GPS, validation optionnelle, PWA offline.

## 🧪 Tests

```bash
cd api && npm test        # smoke tests (health, 404, 401) — sans base de données
```

## 🔒 Notes de sécurité

- Rate limiting sur `/auth/*` (5 req/min) + global.
- Les codes PIN ne sont **jamais** renvoyés par l'API.
- Requêtes paramétrées via Prisma (protection injection SQL).
- En production, exposez l'API en **HTTPS** (Nginx + Let's Encrypt) ; les apps client
  supportent une URL `https://…`. L'app Android autorise le cleartext (HTTP) pour les
  déploiements LAN — à désactiver en production.

## 📦 Livrables générés

| Livrable                                              | Emplacement                    |
|-------------------------------------------------------|--------------------------------|
| Installateur Windows Dispatch                         | `desktop/release/*.exe`        |
| APK / AAB Android                                     | via Android Studio (`mobile/`) |
| App iOS                                               | via Xcode (`mobile/`)          |
| Service serveur Linux                                 | `systemd: planning-api`        |
# sermaco-management-software
# sermaco-management-software
