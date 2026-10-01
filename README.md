# MOMSOFT Smart Factory

Frontend de suivi des paramètres machine pour le site de Sfax. Les quatre écrans du projet restent les mêmes : machines, critères de contrôle, visualisation et notifications. Le schéma MySQL, le diagramme et le document technique d’origine sont conservés.

## Démarrer

Avec Node.js 18 ou plus récent :

```sh
npm start
```

Ouvrir http://127.0.0.1:8000. Aucune installation ni compilation n’est nécessaire pour utiliser le frontend. Les cinq fichiers `index.html`, `style.css`, `app.js`, `data.js` et `favicon.svg` peuvent aussi être servis par n’importe quel hébergeur statique. Pour un aperçu rapide, `index.html` s’ouvre directement dans un navigateur.

## Fonctionnalités

- Navigation avec liens partageables, historique du navigateur, menu mobile et barre latérale rétractable.
- Recherche insensible aux accents, filtres par atelier, protocole, connexion, date ou statut, tri du parc machines et pagination.
- Ajout, modification et suppression des machines, critères et règles, avec validation et confirmation avant suppression.
- Détails des équipements et mesures, courbe SVG interactive avec seuils, sélection du paramètre et consultation des points au clavier.
- Notifications individuelles ou groupées marquées comme lues ; compteurs synchronisés.
- Export CSV de toute la liste filtrée, indépendamment de la page courante.
- Sauvegarde locale, synchronisation entre onglets, gestion des erreurs de stockage et restauration des exemples depuis le guide.

## Données et périmètre

Les exemples d’origine sont dans `data.js`. Les relevés datent du **4 mars 2026**. L’interface n’invente pas de nouvelles mesures et n’ouvre pas de connexion aux machines.

Les modifications sont sauvegardées dans le `localStorage` de ce navigateur sous la clé `momsoft.factory.v2`. Les données ne sont pas partagées entre utilisateurs ou appareils. Le stockage peut être indisponible dans certains modes privés ; dans ce cas, l’interface signale que les changements ne dureront que pendant la session. Effacer les données de navigation efface les modifications locales.

Les statuts des mesures sont calculés avec les critères actuels :

- **Hors tolérance** : une valeur dépasse un seuil minimum ou maximum.
- **Alerte** : une valeur approche un seuil à une distance égale au maximum entre la tolérance et 10 % de la plage. Cette marge est limitée à la moitié de la plage.
- **Conforme** : une valeur reste à l’intérieur des seuils et en dehors de la zone d’alerte.
- **Non évaluée** : le critère est inactif.

Pour un seuil unique, la plage utilisée pour la marge est la valeur absolue de ce seuil. Les statuts des mesures historiques sont recalculés après modification d’un critère ; les messages de notification archivés restent inchangés.

Supprimer une machine supprime ses critères, mesures, règles et notifications locales. Supprimer un critère supprime ses mesures et règles, mais conserve les notifications historiques. Une confirmation explique ces conséquences.

Le profil, les statuts de connexion et l’historique des notifications sont des exemples. Les règles peuvent être configurées, mais **aucun email ou SMS n’est envoyé**. La connexion à MySQL, la collecte MQTT / OPC UA / Modbus et l’envoi des alertes nécessitent un backend utilisant le schéma existant.

## Vérification

Les dépendances ne servent qu’aux tests :

```sh
npm install
npx playwright install chromium
npm run check
npm test
```

Pour utiliser un Chromium déjà installé :

```sh
BROWSER_PATH=/usr/bin/chromium npm test
```

Les tests ouvrent un serveur local sur un port libre et couvrent les filtres, formulaires, seuils, suppressions en cascade, sauvegardes, exports, notifications, graphique et navigation mobile. Aucun service externe n’est nécessaire.
