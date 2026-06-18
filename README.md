# 🐟 Poissonnerie TATA - Système de Gestion ERP

Application web moderne de gestion complète pour la Poissonnerie TATA, développée avec React 19 et TypeScript.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)

## 📋 Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [Scripts disponibles](#scripts-disponibles)
- [Déploiement](#déploiement)
- [Contribution](#contribution)
- [Licence](#licence)

## 🎯 Aperçu

**Poissonnerie TATA ERP** est une solution complète de gestion d'entreprise conçue spécifiquement pour les poissonneries et commerces de produits frais. L'application offre une interface moderne et intuitive pour gérer tous les aspects de l'activité commerciale.

### Caractéristiques principales

- 📊 **Tableau de bord** : Vue d'ensemble des KPIs (ventes, dépenses, bénéfices)
- 💰 **Gestion de caisse** : Enregistrement des ventes en temps réel
- 📦 **Gestion des stocks** : Suivi des produits, alertes de stock bas
- 👥 **Gestion clients** : Fiches clients avec système de crédit
- 🏢 **Gestion fournisseurs** : Suivi des achats et paiements
- 💸 **Gestion des dépenses** : Catégorisation et suivi des charges
- 📄 **Facturation** : Génération et téléchargement de factures PDF
- 🔔 **Notifications** : Système d'alertes en temps réel
- 👨‍💼 **Gestion des employés** : Fiches employés et gestion des salaires
- 🚨 **Avaries** : Déclaration et suivi des pertes de marchandises
- 📈 **Rapports** : Rapports détaillés (journaliers, mensuels, stocks, dettes)
- 👤 **Gestion des utilisateurs** : Système de rôles (Admin, Gestionnaire, Caissier)
- ⚙️ **Paramètres système** : Configuration personnalisable de l'établissement

## ✨ Fonctionnalités

### 🏪 Gestion commerciale

- **Point de vente (POS)** : Interface rapide pour la vente en caisse
- **Ventes comptant et crédit** : Gestion flexible des paiements
- **Factures professionnelles** : Génération automatique avec logo et mentions légales
- **Historique des transactions** : Consultation et export des ventes

### 📊 Analyses et rapports

- **Rapports journaliers** : Ventes, encaissements, crédits, bénéfices
- **Rapports mensuels** : Analyses de performance avec graphiques
- **Rapport de stock** : État complet des produits disponibles
- **Rapport des dettes** : Suivi des clients débiteurs
- **Rapport fournisseurs** : Soldes et historique des achats
- **Export multi-format** : PDF, Word, CSV

### 🎨 Interface utilisateur

- **Design moderne** : Interface épurée et professionnelle
- **Thème personnalisé** : Couleurs bleu marine et jaune or
- **Responsive design** : Compatible desktop, tablette et mobile
- **Animations fluides** : Transitions et interactions soignées
- **Dark mode ready** : Architecture préparée pour le mode sombre

### 🔐 Sécurité

- **Authentification JWT** : Système de tokens sécurisé
- **Gestion des rôles** : Contrôle d'accès basé sur les permissions
- **Sessions sécurisées** : Auto-déconnexion et validation des tokens
- **Protection CSRF** : Requêtes API sécurisées

## 🛠️ Technologies

### Frontend

- **React 19.0** - Bibliothèque UI avec les dernières fonctionnalités
- **TypeScript 5.6** - Typage statique pour plus de fiabilité
- **Vite 6.0** - Build tool ultra-rapide
- **React Router 7.1** - Navigation et routing
- **Axios** - Client HTTP pour les requêtes API
- **React Hot Toast** - Notifications élégantes
- **React Icons** - Bibliothèque d'icônes (Feather Icons)
- **Recharts** - Graphiques et visualisations de données
- **TailwindCSS** - Framework CSS utility-first

### Outils de développement

- **ESLint** - Linter JavaScript/TypeScript
- **Vite** - Serveur de développement HMR
- **PostCSS** - Traitement CSS

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 ou **yarn** >= 1.22.0
- **Git** (pour le clonage du repository)

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/poissonnerie-tata-frontend.git
cd poissonnerie-tata-frontend
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
VITE_API_URL=http://localhost:4000/api
```

Pour la production :

```env
VITE_API_URL=https://votre-api-backend.com/api
```

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `VITE_API_URL` | URL de l'API backend | `http://localhost:4000/api` |

### Configuration Axios

Le fichier `src/api/axios.js` configure automatiquement :
- L'URL de base de l'API
- Les intercepteurs pour les tokens JWT
- La gestion automatique des erreurs 401 (déconnexion)

## 💻 Utilisation

### Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Construire pour la production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`

### Prévisualiser la version de production

```bash
npm run preview
```

### Linter le code

```bash
npm run lint
```

## 📁 Structure du projet

```
frontend/
├── public/                   # Fichiers publics statiques
│   ├── favicon.svg          # Icône de l'application
│   └── icons.svg            # Sprites d'icônes
├── src/
│   ├── api/                 # Configuration et appels API
│   │   ├── axios.js         # Configuration Axios
│   │   ├── authAPI.js       # API d'authentification
│   │   ├── clientAPI.js     # API clients
│   │   ├── productAPI.js    # API produits
│   │   ├── saleAPI.js       # API ventes
│   │   ├── supplierAPI.js   # API fournisseurs
│   │   ├── expenseAPI.js    # API dépenses
│   │   ├── invoiceAPI.js    # API factures
│   │   ├── reportAPI.js     # API rapports
│   │   ├── damageApi.js     # API avaries
│   │   ├── employeeApi.js   # API employés
│   │   ├── notificationApi.js # API notifications
│   │   └── systemAPI.js     # API système
│   ├── assets/              # Images et fichiers média
│   ├── components/          # Composants réutilisables
│   │   ├── common/          # Composants génériques
│   │   │   ├── Badge.jsx    # Badge de statut
│   │   │   ├── Button.jsx   # Bouton personnalisé
│   │   │   ├── Input.jsx    # Champ de saisie
│   │   │   ├── Loader.jsx   # Indicateur de chargement
│   │   │   ├── Modal.jsx    # Boîte de dialogue
│   │   │   └── Table.jsx    # Tableau de données
│   │   └── layout/          # Composants de mise en page
│   │       ├── Layout.tsx   # Layout principal
│   │       ├── Navbar.tsx   # Barre de navigation
│   │       └── Sidebar.tsx  # Menu latéral
│   ├── context/             # Contextes React
│   │   ├── AuthContext.jsx  # Contexte d'authentification
│   │   └── SystemContext.jsx # Contexte système
│   ├── hooks/               # Hooks personnalisés
│   │   ├── useAuth.js       # Hook d'authentification
│   │   └── useAutoRefresh.js # Hook de rafraîchissement auto
│   ├── pages/               # Pages de l'application
│   │   ├── auth/            # Pages d'authentification
│   │   │   └── Login.tsx    # Page de connexion
│   │   ├── dashboard/       # Tableau de bord
│   │   │   └── Dashboard.tsx
│   │   ├── sales/           # Gestion des ventes
│   │   │   └── Sales.tsx
│   │   ├── caisse/          # Point de vente
│   │   │   └── Caisse.tsx
│   │   ├── products/        # Gestion des produits
│   │   │   └── Products.tsx
│   │   ├── clients/         # Gestion des clients
│   │   │   └── Clients.tsx
│   │   ├── credits/         # Gestion des crédits
│   │   │   └── Credits.tsx
│   │   ├── suppliers/       # Gestion des fournisseurs
│   │   │   └── Suppliers.tsx
│   │   ├── expenses/        # Gestion des dépenses
│   │   │   └── Expenses.tsx
│   │   ├── invoices/        # Gestion des factures
│   │   │   └── Invoices.tsx
│   │   ├── damages/         # Gestion des avaries
│   │   │   └── Damages.tsx
│   │   ├── employees/       # Gestion des employés
│   │   │   └── Employees.tsx
│   │   ├── reports/         # Rapports
│   │   │   └── Reports.tsx
│   │   ├── users/           # Gestion des utilisateurs
│   │   │   └── Users.tsx
│   │   └── settings/        # Paramètres
│   │       └── Settings.tsx
│   ├── types/               # Définitions TypeScript
│   │   └── modules.d.ts     # Déclarations de types
│   ├── utils/               # Utilitaires
│   │   └── formatAmount.ts  # Formatage des montants
│   ├── App.jsx              # Composant racine
│   ├── main.jsx             # Point d'entrée
│   ├── index.css            # Styles globaux
│   └── global.d.ts          # Types globaux
├── .env                     # Variables d'environnement
├── .gitignore              # Fichiers ignorés par Git
├── eslint.config.js        # Configuration ESLint
├── index.html              # Template HTML
├── package.json            # Dépendances et scripts
├── tsconfig.json           # Configuration TypeScript
├── tsconfig.app.json       # Config TypeScript app
├── vite.config.js          # Configuration Vite
├── vercel.json             # Configuration Vercel
└── README.md               # Ce fichier
```

## 📜 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Compile l'application pour la production |
| `npm run preview` | Prévisualise la version de production |
| `npm run lint` | Vérifie le code avec ESLint |

## 🚀 Déploiement

### Déploiement sur Vercel

1. **Connectez votre repository GitHub à Vercel**

2. **Configurez les variables d'environnement dans Vercel** :
   - `VITE_API_URL` : URL de votre API backend

3. **Déployez** :
   ```bash
   vercel --prod
   ```

### Déploiement sur Netlify

1. **Créez un fichier `netlify.toml`** :
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Configurez les variables d'environnement dans Netlify**

3. **Déployez via Git ou CLI**

### Déploiement manuel

```bash
# Construire l'application
npm run build

# Le dossier dist/ contient les fichiers statiques
# Uploadez ce dossier sur votre hébergeur
```

## 🔧 Résolution des problèmes

### Erreur de connexion à l'API

Vérifiez que :
- Le backend est démarré et accessible
- La variable `VITE_API_URL` est correctement configurée
- Les CORS sont configurés sur le backend

### Erreurs TypeScript pendant le build

```bash
# Nettoyer le cache et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Port déjà utilisé

Modifiez le port dans `vite.config.js` :
```javascript
export default defineConfig({
  server: {
    port: 3000, // Changez ici
  },
})
```

## 👥 Rôles et permissions

### Administrateur (admin)
- Accès complet à toutes les fonctionnalités
- Gestion des utilisateurs
- Configuration système
- Tous les rapports

### Gestionnaire (gestionnaire)
- Gestion des ventes
- Gestion des stocks
- Gestion clients/fournisseurs
- Rapports (lecture seule)

### Caissier (caissier)
- Point de vente uniquement
- Enregistrement des ventes
- Consultation limitée

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add: amazing feature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 Conventions de code

- Utilisez TypeScript pour les nouveaux composants
- Suivez les règles ESLint définies
- Commentez le code complexe
- Utilisez des noms de variables descriptifs
- Respectez la structure de dossiers établie

## 📄 Licence

Ce projet est sous licence privée. Tous droits réservés © 2026 Poissonnerie TATA.

## 👨‍💻 Auteurs

- **Équipe de développement Poissonnerie TATA**

## 📞 Contact

Pour toute question ou support :
- Email : support@poissonnerie-tata.com
- Téléphone : +224 XXX XXX XXX

## 🙏 Remerciements

- React team pour React 19
- Vite team pour l'excellent build tool
- Toute la communauté open-source

---

**Fait Boubacar Bah et Abdoul Razzaï Barry pour la Poissonnerie TATA**
