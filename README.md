# Site News Informatique — récap hebdo hardware

Page d'accueil statique (HTML/CSS pur, aucune dépendance) présentant le récapitulatif
des actualités hardware de la semaine. Édition courante : **Semaine 26 (22–28 juin 2026)**.

## Structure

Emplacement du projet : `F:\Projet info IA\Projet site web AI claude\`

```
Projet site web AI claude/
├── index.html          ← page d'accueil (édition de la semaine)
├── assets/
│   └── img/            ← images téléchargées depuis les sources (crédits en légende)
│       ├── gpu_rtx50_computex.jpg    (NVIDIA — RTX 50 partenaires, Computex 2026)
│       ├── cpu_5800x3d.jpg           (Tom's Hardware — Ryzen 7 5800X3D)
│       ├── ram_ddr5_prix.jpg         (HardwareCooking — DDR5)
│       └── ecran_rog_pg32ucwm.png    (ASUS — ROG Swift OLED PG32UCWM)
└── archives/           ← anciennes éditions (index.html renommé en AAAA-SNN.html)
```

## Ouvrir le site

Double-cliquer sur `index.html` (tout fonctionne en local), ou servir le dossier :

```powershell
& "G:\Projet jeux\Moteur Graphique\UE_5.8\Engine\Binaries\ThirdParty\Python3\Win64\python.exe" -m http.server 8787 --directory "F:\Projet info IA\Projet site web AI claude"
# puis ouvrir http://localhost:8787
```

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
