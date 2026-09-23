# Carte des entraves auto du Grand Montreal

Application statique de visualisation des entraves automobiles dans le Grand Montreal.

## Documentation

- [Documentation du projet](docs/README.md) : utilisation, configuration locale, sources, snapshots et publication GitHub Pages.
- [Guide utilisateur des prompts Copilot](docs/GUIDE_PROMPTS.md) : choix des commandes, exemples, permissions et parcours de travail.

Le README complet est maintenant dans le dossier `docs/`. Ce fichier reste le point d'entree du depot pour GitHub et les references existantes.

Pour les agents : toute consigne demandant de lire ou de mettre a jour le README du projet vise la documentation complete dans [docs/README.md](docs/README.md). Conservez cette page comme index, sans y recopier la documentation.

## Demarrage local

Depuis la racine du projet, et non depuis `docs/` :

```bash
python -m http.server 5500
```

Ouvrez <http://localhost:5500/index.html>.
