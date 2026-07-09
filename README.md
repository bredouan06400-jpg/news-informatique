# Site News Informatique — récap hardware quotidien + application (PWA)

Site statique + application web progressive (PWA) présentant le récapitulatif des
actualités hardware, mis à jour **chaque jour** par un agent Claude planifié.

- 🌐 **Site en ligne (gratuit, GitHub Pages)** : https://bredouan06400-jpg.github.io/news-informatique/
- 📦 **Dépôt** : https://github.com/bredouan06400-jpg/news-informatique
- 📱 **Application iOS/Android** : c'est le même site, installable (PWA) — QR code dans
  la section « Application mobile » de la page (`assets/qr/qr-app.png`).
- 🔔 **Alertes** : `data/latest.json` sert de signal ; l'app affiche une bannière +
  notification quand une nouvelle édition/mise à jour est publiée.

## Structure

Emplacement du projet : `F:\Projet info IA\Projet site web AI claude\`

```
Projet site web AI claude/          (= dépôt Git → GitHub Pages)
├── index.html            ← page d'accueil (édition de la semaine en cours)
├── manifest.webmanifest  ← manifeste PWA (nom, icônes, couleurs)
├── sw.js                 ← service worker (hors-ligne + cache) ; VERSION à incrémenter à chaque MAJ
├── data/latest.json      ← signal d'alerte « nouvelles news » lu par l'application
├── assets/
│   ├── js/app.js         ← installation PWA, bannière et notifications
│   ├── qr/qr-app.png     ← QR code d'installation (pointe vers le site en ligne)
│   └── img/              ← icônes de l'app + images des news (crédits en légende)
└── archives/             ← anciennes éditions (AAAA-SNN.html)
```

## Ouvrir le site

Double-cliquer sur `index.html` (tout fonctionne en local), ou servir le dossier :

```powershell
& "G:\Projet jeux\Moteur Graphique\UE_5.8\Engine\Binaries\ThirdParty\Python3\Win64\python.exe" -m http.server 8787 --directory "F:\Projet info IA\Projet site web AI claude"
# puis ouvrir http://localhost:8787
```

## Publication

Chaque `git push` sur `main` redéploie automatiquement le site sur GitHub Pages (~1 min).

**Robot autonome (GitHub Actions)** — `.github/workflows/update-news.yml` : tous les
3 jours à 7h UTC (9h Paris l'été), GitHub exécute `scripts/update_news.py` **dans le
cloud, sans PC ni Claude** : lecture des flux RSS des sources, filtrage hardware des
3-4 derniers jours, régénération de la section « ⚡ Dernières actualités » d'index.html
(entre les marqueurs `AUTO-NEWS-START/END`), mise à jour de `data/latest.json` (alerte
PWA) et de la version du service worker, puis commit + push. Lancement manuel possible
depuis l'onglet Actions du dépôt (« Run workflow »).

**Sections éditoriales** (À la une, GPU, CPU…) : enrichies à la demande via Claude Code
(« mets à jour le site news ») ; la tâche planifiée Claude
« maj-hebdo-site-news-informatique » existe toujours mais est **en pause**.

## Mise à jour hebdomadaire (procédure)

1. Copier `index.html` vers `archives/2026-S26.html` (numéro de la semaine sortante).
2. Collecter les news de la semaine écoulée (lundi→dimanche) sur : VideoCardz,
   Cowcotland, Hardware & Co, Tom's Hardware, TechPowerUp, Phoronix, The Verge.
3. Ne retenir que : lancements officiels, benchmarks significatifs, drivers majeurs,
   failles critiques, mouvements de prix, rumeurs très crédibles (marquées « Rumeur »),
   annonces d'entreprises majeures.
4. Télécharger 1 image par grande section (GPU/CPU/Mémoire/Écran) dans `assets/img/`
   et créditer la source dans la légende (`figcaption`).
5. Ajouter 1–2 vidéos YouTube pertinentes (iframe `youtube.com/embed/<id>`).
6. Mettre à jour le titre (numéro de semaine + dates), la date de « Dernière mise à
   jour » et la section « À surveiller ».

> Astuce : demander à Claude Code « mets à jour le site news pour la semaine écoulée »
> reproduit toute cette procédure automatiquement.

## Notes

- Vignettes « Rumeur » (jaune) obligatoires pour tout contenu non officiel.
- Rester factuel et neutre ; pas de tests de produits > 6 mois ; pas de republication
  sans valeur ajoutée.
- Les images restent la propriété de leurs ayants droit (usage revue de presse) —
  à remplacer avant toute mise en ligne publique si nécessaire.
