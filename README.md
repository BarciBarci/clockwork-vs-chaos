# Slickworks — Plate Foundry

Ein eigenständiger, browserbasierter **Szenario-Editor für doppelseitige Öllinien-Platten**.
Platten legen, drehen, wenden, Marker setzen, Regeln schreiben, Szenario als JSON sichern
und als druckbares Dossier ausgeben.

Alles, was du siehst, wird **zur Laufzeit als SVG gezeichnet**. Im Repository liegt kein
einziges Rasterbild und keine Grafikdatei außer dem eigenen Logo.

```sh
./serve.sh            # http://localhost:8085
```

Ein lokaler Server ist nötig, weil der Editor `localStorage` als Übergabe an die
Druckseite nutzt. `file://` funktioniert im Chrome nicht zuverlässig.

---

## Warum das eigenständig ist

Das ist der Kern deiner Frage, deshalb vorneweg — ehrlich und ohne Rechtsberatung zu
spielen:

**Ich kann dir keine Garantie geben, dass irgendetwas „copyrightfrei“ ist.** Was ich kann,
ist die Dinge weglassen, die typischerweise streitig sind, und die Dinge behalten, die
regelmäßig nicht geschützt sind. Das ist der Aufbau:

### Was hier bewusst *nicht* drin ist

| Nicht enthalten | Warum |
| --- | --- |
| Scans, Traces oder nachgezeichnete Original-Kacheln | Das ist die geschützte Grafik selbst |
| Das Logo oder der Name „Mechs vs. Minions“ | Name und Logo sind markenrechtlich geschützt (Riot Games) |
| Regelbuch-, Karten- und Missionstexte | Texte sind urheberrechtlich geschützt, auch kurze |
| Die Original-Schriftarten | Fonts sind lizenzierte Software |
| Die konkreten Platten-Anordnungen des Originals | Siehe „Der riskanteste Punkt“ unten |
| Farbwerte, Texturen, Lichtsetzung des Originals | Das ist der „Look“, nicht die Mechanik |

Es wurde **keine Datei** aus dem Archiv-Repository übernommen. Kein `cp`, kein Export,
kein Screenshot als Vorlage.

### Was übernommen wurde — und warum das zulässig ist

Übernommen ist ausschließlich das **Regelkonzept**, nicht seine Darstellung:

- Es gibt doppelseitige Platten — eine „sichere“ Seite, eine „heiße“ Seite.
- Es gibt Öllinien, denen Figuren folgen.
- Es gibt farbige Felder an bestimmten Positionen.
- Es gibt ein quadratisches Raster.

Spielregeln und Spielmechaniken sind nach herrschender Auffassung **keine geschützten
Werke** — geschützt ist die konkrete Form, in der sie ausgedrückt werden (Idee/Ausdruck).
Ein Ölfeld an Koordinate (2,1) ist eine Funktion, keine schöpferische Leistung. Die
grafische Umsetzung dieses Ölfelds ist es sehr wohl.

> Das ist die gängige Einordnung, keine Rechtsberatung. Vor einer kommerziellen
> Veröffentlichung: Anwalt fragen und Markenrecherche machen (DPMA, EUIPO, USPTO) — für
> den Namen „Slickworks“ und für dein eigenes Logo.

### Wie das Layout bewusst anders aussieht

Damit nichts „eingescannt“ wirkt, ist die Gestaltung an einer anderen Tradition
orientiert als das Original:

| Ebene | Original-Ästhetik | Hier |
| --- | --- | --- |
| Grundhaltung | gemalt, Fantasy-Industrie, Licht und Schatten | technische Zeichnung, Bauplan |
| Innenraster | freie Komposition | festes **4 × 4**-Zellenraster, sichtbare Hilfslinien |
| Öllinie | gemalter Ölfluss | Rohrleitung: dicke schwarze Linie mit gestrichelter Flusslinie |
| Lava | gemalte Textur | 45°-Schraffur, zwei Farben, kein Bild |
| Farbfelder | gemalte Flächen | flache Rauten/Quadrate mit weißer Innenkante |
| Palette | warmes Braun/Kupfer | Ocker, Grünspan, Krapp auf kühlem Papierweiß |
| Produktion | Rasterbilder | reines SVG, unendlich skalierbar |

Das 4 × 4-Raster ist der stärkste Hebel: es erzwingt ein anderes Plattenspiel als jede
frei komponierte Kachel, ohne die Mechanik zu verändern.

### Der riskanteste Punkt

Wenn du eine **konkrete Original-Platte 1:1 nachbaust** — gleiche Öllinie, gleiche
Farbfelder an denselben Zellen — wandert die Frage von „Mechanik“ zu „Gestaltung“.
Das kann man verteidigen, ist aber der Teil, der am ehesten angegriffen wird.

Deshalb ist der Platten-Satz hier **prozedural erzeugt**: aus einem Seed entsteht ein
Layout, das es vorher nicht gab. Wenn du ein bestimmtes Layout brauchst, ändere den Seed
oder baue eigene Platten — kopiere keine.

---

## Der Platten-Generator

```js
Slickworks.makeTile('X1', 'mein-seed');
```

Jede Platte hat zwei Seiten, jede Seite wird getrennt aus dem Seed erzeugt:

```js
{
  oil:   [[0,1], [1,1], [2,1], [2,2]],   // orthogonale Öllinie, Rand zu Rand
  zones: [{ x: 3, y: 0, colour: 'ochre' }], // Farbfelder, nie auf der Öllinie
  vents: [{ x: 1, y: 3 }],                  // 0–1 Lüftung
  ember: [{ x: 0, y: 0 }]                   // nur auf der Ember-Seite
}
```

- **Öllinie**: startet auf einem Randfeld, läuft orthogonal, endet wieder am Rand.
  Kein Feld wird doppelt besucht, keine Diagonalen.
- **Farbfelder**: 2–4 Stück, nie auf der Öllinie, rotierend Ocker / Grünspan / Krapp.
- **Ember-Seite**: zusätzlich 3–5 heiße Zellen, nie auf Öllinie, Farbfeld oder Lüftung.

Der Kartenstapel `P01…P12` ist deterministisch — gleicher Stand bei jedem Laden, aber
ohne Bezug zu einem veröffentlichten Spiel.

## Bedienung

| Aktion | So geht's |
| --- | --- |
| Platte legen | Platte links wählen, ins Raster klicken |
| Drehen | Platte wählen, `R` oder 0°/90°/180°/270° |
| Seite wechseln | `F` oder Foundry/Ember oben |
| Gelegte Platte drehen | ⟳ beim Überfahren der Zelle |
| Gelegte Platte wenden | ⇅ beim Überfahren der Zelle |
| Platte entfernen | ✕ beim Überfahren der Zelle |
| Marker setzen | Marker wählen, auf eine **gelegte** Platte klicken |
| Marker löschen | „Marker löschen“ wählen, auf den Marker klicken |
| Szenario sichern | „JSON speichern“ |
| Dossier | „Dossier drucken“ → Druckdialog → Als PDF speichern |

Marker werden in der Zelle platziert, auf die der Zeiger zeigt; bei gedrehter Platte
rechnet der Editor die Klickposition in den Plattenraum zurück, damit der Marker am
gezeichneten Feld klebt.

## Dateiformat

```json
{
  "format": "slickworks-scenario",
  "version": 1,
  "title": "Ember Line 04",
  "author": "…",
  "objective": "…",
  "rules": "…",
  "board": [
    { "tileId": "P03", "rot": 1, "face": "ember",
      "pieces": [{ "type": "rig", "x": 2, "y": 1, "rot": 0 }] },
    null
  ]
}
```

`board` hat immer 25 Einträge (5 × 5, zeilenweise). `null` = leer. `rot` ist 0–3
(90°-Schritte im Uhrzeigersinn), `x`/`y` sind Zellen im 4 × 4-Innenraster der Platte.

## Aufbau

```
.
├── index.html          Editor
├── dossier.html        Druckseite
├── serve.sh            lokaler Server
├── assets/
│   ├── logo.svg        eigenes Logo
│   └── styles.css
└── js/
    ├── tiles.js        RNG, Plattenmodell, Generator, Stapel
    ├── render.js       reine SVG-Zeichnung
    ├── app.js          Editor-Logik
    └── print.js        Dossier
```

Keine Dependencies, kein Build-Schritt, kein Framework.

## Auf GitHub stellen

```sh
git init
git add .
git commit -m "Slickworks: originärer Platten-Editor"
gh repo create slickworks --public --source=. --push
```

## Lizenz

- **Code** (`js/`, `*.html`, `*.css`, `serve.sh`): MIT — siehe `LICENSE`.
- **Grafik und erzeugte Platten-Layouts** (`assets/logo.svg`, alles was `render.js`
  zeichnet, die generierten Daten): CC0 1.0 — siehe `ASSETS-LICENSE.md`.

Der Name „Slickworks“ und das Logo sind nicht Teil der Lizenz. Wenn du das Projekt
forkst, nimm einen eigenen Namen.
