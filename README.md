# Capygotchi

Eine installierbare, interaktive Pixel-Capybara-Bibliothek für iPhone und Browser. Jedes Capy spricht Deutsch, entwickelt seine Bedürfnisse in Echtzeit weiter und besitzt einen eigenen lokalen Spielstand.

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
- Ein sichtbar wachsendes, feineres 56 × 34-Pixel-Capy mit vier Wachstumsstufen
- Eine große, wiedererkennbare Landschaft mit Schlafhütte, Teich, Wildwiese, Damwild-Gehege, Gemüsegarten und gemütlichem Wintergarten
- Das Capy entscheidet selbst, ob es sich gerade an der Hütte, auf der Wildwiese, im Garten oder im Wintergarten aufhält
- Selbstständige zwei- bis dreistündige Solo-Reisen zu echten und fantastischen Orten – inklusive anklickbarer Reisepostkarte, Ortswissen und Mitbringsel
- Überraschungsreisen auf Wunsch: Du packst den Rucksack, das Capy sucht das Ziel selbst aus und kommt eigenständig zurück
- Eine Sammlung mit 22 Reisefunden: exklusive Kleidungsplätze für Mütze, Brille, Schal, Oberteil und Pfoten sowie platzierbare Gegenstände für die Spielwelt
- Milchaufschäumer, Gießkanne, Brettspiel, Picknickdecke, Radio und weitere Fundstücke werden in ihrem passenden Landschaftsbereich sichtbar
- Vier Gemüsebeete mit Karotten, Tomaten, Gurken und Minikürbissen; Pflanzen wachsen auch bei geschlossener App weiter und die Ernte kann direkt verfüttert werden
- Tierfreunde wie Hilda, Fips, Lotte, Piek, Wolke und Greta kommen zu Besuch und können ein Capy auf Reisen begleiten
- Ungefähres Live-Wetter für Deutschland aus Hamburg, Berlin, Frankfurt und München mit jahreszeitlichem Offline-Fallback
- Zeitweise Markt-Snacks: geliebte Gewürzgurken und ausdrücklich gehasste Zwiebeln mit eigenen sichtbaren Reaktionen
- Tagebuch mit gemeinsamen Erinnerungen
- „Während du weg warst“-Bericht beim Wiederöffnen
- Mehrere Capys in einer Bibliothek anlegen und jederzeit zwischen ihren getrennten Spielständen wechseln
- Fünf Tagesquests pro Capy mit eigenem Quest-Tagebuch, Glitzerbelohnungen und Tages-Serie
- Sechs komplexere Minispiele: Glitzerjagd, Merkspiel, Kaffee-Timing, zwiebelfreies Grillfest, Stadt-Tour und Seerosen-Rhythmus
- Gemeinsame Herausforderungen, die Füttern, Spielen, Pflegen, Gespräche und Ausflüge miteinander verbinden
- Die erste Quest erscheint genau eine Minute nach der Adoption; weitere Abenteuer verteilen sich über den Tag
- Vier wählbare Fellfarben für eine unverwechselbare Capy-Familie
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

Die App hat kein Nutzerkonto und keinen Server für Spielstände. Namen, Fortschritte, Quests, Reisen, Inventare, Gärten und die gesamte Capy-Bibliothek bleiben lokal auf dem Gerät. Nur für die Landschaft fragt die App ohne Standortfreigabe einen ungefähren Deutschland-Mittelwert bei [Open-Meteo](https://open-meteo.com/) ab. Bestehende Spielstände werden bei neuen Versionen migriert und nicht mehr zurückgesetzt.
