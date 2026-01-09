# Image-to-3D (4 images → modèle 3D)

## But
Interface web qui prend 4 images, lance une génération 3D côté serveur (Socket.IO) et affiche l'évolution du modèle en temps réel.

## Structure
- `public/` : frontend statique (index.html)
- `server/` : backend Node.js (server.js)
- `.github/workflows/deploy-gh-pages.yml` : workflow pour publier `public/` sur GitHub Pages (branche `gh-pages`)

## Déploiement local (test)
1. Cloner le repo.
2. Lancer le backend :
   ```bash
   cd server
   npm install
   npm start

