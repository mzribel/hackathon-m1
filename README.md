# Hackathon M1

Application Ionic/VueJS/Capacitor permettant de prendre des photos et d'afficher leur position sur une carte interactive, testé sur un Google Pixel 9A.

Le projet suit tous les points demandés par le sujet : 
* Prendre des photos avec la caméra du téléphone ;
* Pouvoir visualiser et gérer ses photos sur une galerie ;
* Voir ses photos en grand, et les informations de où et quand elles ont été prises ;
* Pouvoir liker les photos ;
* Pouvoir accéder à ses photos via un marqueur à partir de la carte interactive.

## Démonstration 

Une vidéo de démonstration peut être trouvée [ici](https://youtu.be/pEkIdjM8sPU).

Notes supplémentaires (manquantes ou pas claires sur la vidéo) :
- La popup pour visualiser l'image en grand est accessible par la carte et par la galerie. Elle contient la date, la position (si active lors de la prise), ainsi que les options de like et de suppression de l'image ;
- Si plusieurs épingles se superposent sur la carte, elles sont groupées et la petite popup contient un carousel avec toutes les images prises à cet endroit (swiperJS) ;
- Lorsque la localisation est active, la carte s'initialise sur la position de l'utilisateur ; sinon, elle s'initialise sur Paris ;
- Localisation activée ou non, à l'ouverture de l'application si certaines images contiennent une localisation, les épingles sont tout de même placées sur la carte ;
- L'activation du toggle "Favorites" sur la page de galerie synchronise les deux onglets (on voit le même nombre d'images sur la carte que sur la galerie, les photos mises en favori) ;
- Il n'y a pas d'erreur si l'utilisateur refuse les permissions ; simplement, les fonctionnalités ne sont naturellement pas accessibles.

## Prérequis 

* NodeJS (développé avec la 22.20.0)
* @Ionic/cli (`npm install -g @ionic/cli`)
* @Capacitor/cli (`npm install -g @capacitor/cli`)
* Android Studio

## Installation

Installation des dépendances :
```sh
npm install
```

Ajout de la plateforme Android :
```sh
npx cap add android
```

## Lancement en mode web (navigateur)

```sh
ionic serve
```

## Lancement sur Android

Build de l'application : 
```sh
npm run build
```

Synchronisation avec Android :
```sh
npx cap sync android
```

Lancement dans Android Studio : 
```
npx cap open android
```

