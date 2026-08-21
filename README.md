# Capygotchi

Ein installierbares, interaktives Pixel-Capybara für iPhone und Browser. Emmi spricht Deutsch, entwickelt ihre Bedürfnisse in Echtzeit weiter und speichert ihren Zustand ausschließlich auf dem jeweiligen Gerät.

**[Capygotchi jetzt öffnen →](https://hallojohannes.github.io/Capygotchi/)**

## Was Emmi kann

- Futter per Touch zur Schnute ziehen und beim Fressen zusehen
- Ball und Frisbee werfen, Seifenblasen jagen und am Zerrseil spielen
- Das Fell selbst bürsten, trockenrubbeln und Emmi sichtbar in den Teich springen lassen
- Kuscheln, reden, Sonnenbaden und gemeinsam das Gehege erkunden
- Mehrstufige Gespräche mit wählbaren Antworten und situationsabhängigen Reaktionen
- Schlafmodus mit echter Erholung über Zeit
- Streicheln per Tipp auf das Capybara
- Deutsche Sprachausgabe, Pixel-Töne und optionale Haptik
- Level, Stimmung und sechs fortlaufende Bedürfnisse
- Tagebuch mit gemeinsamen Erinnerungen
- „Während du weg warst“-Bericht beim Wiederöffnen
- Persönliche Widmung von Johannes vor der ersten Namensvergabe; vorgeschlagener Name ist Emmi
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
