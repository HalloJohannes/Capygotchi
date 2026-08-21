# Capygotchi

Ein installierbares Pixel-Capybara für iPhone und Browser. Das Capygotchi spricht Deutsch, entwickelt seine Bedürfnisse in Echtzeit weiter und speichert seinen Zustand ausschließlich auf dem jeweiligen Gerät.

## Was bereits funktioniert

- Füttern mit verschiedenen Leckerbissen
- Ballfang-Minispiel
- Bürsten und Baden
- Schlafmodus mit echter Erholung über Zeit
- Streicheln per Tipp auf das Capybara
- Deutsche Sprachausgabe, Pixel-Töne und optionale Haptik
- Level, Stimmung und vier fortlaufende Bedürfnisse
- Offline-Betrieb als Progressive Web App
- Automatische Veröffentlichung über GitHub Pages

## Auf dem iPhone installieren

Die veröffentlichte Seite in Safari öffnen, auf **Teilen** tippen und **Zum Home-Bildschirm** wählen. Spielstände bleiben lokal in Safari beziehungsweise in der installierten Web-App.

## Entwicklung

Voraussetzung ist Node.js 22 oder neuer.

```bash
npm ci
npm run dev
npm test
```

Die eigenständige GitHub-Pages-App liegt in `public/capygotchi`. Der Workflow unter `.github/workflows/deploy-pages.yml` veröffentlicht diesen Ordner bei Änderungen auf `main`.

## Datenschutz

Die App hat kein Nutzerkonto und keinen Server für Spielstände. Name, Fortschritt und Einstellungen verlassen das Gerät nicht.
