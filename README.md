# Clockwork vs Chaos — Plate Foundry

Szenario-Editor für doppelseitige Öllinien-Platten im **6 × 6-Raster**.
Platten legen, drehen, wenden, Marker setzen, Regeln schreiben, Szenario als JSON
sichern und als druckbares Dossier ausgeben.

```sh
./serve.sh            # http://localhost:8085
```

Ein lokaler Server ist nötig, weil der Editor `localStorage` als Übergabe an die
Druckseite nutzt.

---

## Die Platten

Jede Platte ist **6 × 6 Zellen** groß und doppelseitig:

| Seite | Grund | Merkmal |
| --- | --- | --- |
| **Front** | helles Papier | schwarze Ölfelder, farbige Felder |
| **Back** | hellrote Ebene | dunkelgraue Gebirgsfelder, kräftige Lava, farbige Felder |

Zelltypen:

| Code | Bedeutung | Darstellung |
| --- | --- | --- |
| `oil` | Ölfeld | **vollflächig schwarzes Quadrat** |
| `lava` | Lava (nur Back) | oranges Quadrat mit gelbem Kern |
| `rock` | Gebirgsfeld (nur Back) | dunkelgraues Quadrat |
| `orange` `red` `green` `blue` | farbiges Feld | Farbquadrat mit **Richtungspfeil** |
| `crystal` | Kristall | Cyan-Quadrat mit Raute |
| *(leer)* | – | Grund der Seite |

Der Pfeil im Farbfeld ist die Richtung der Rune: 0 = Nord, 1 = Ost, 2 = Süd,
3 = West. Er dreht mit der Platte mit.

Die Anordnungen der fünf Plattenpaare `T1`–`T5` sind aus dem Plattensatz
übernommen, weil ein Szenario-Editor nutzlos ist, wenn er nicht zum Tisch passt.
Gezeichnet wird aber nichts Abfotografiertes: alle Felder sind flache
Vektorgeometrie, kein Bitmap, keine Textur, keine Schrift.

## Bedienung

| Aktion | So geht's |
| --- | --- |
| Tile legen | Tile aus dem `Tiles`-Panel ins Raster **ziehen**, oder anklicken und Zelle anklicken |
| Tile nur einmal | Es gibt insgesamt fünf Tiles. Liegt ein Tile auf dem Raster, ist sein Platz in der Palette gesperrt (abgedunkelt, grüner Haken) — erst `✕` am Tile gibt es wieder frei |
| Tile vergrößern | **Doppelklick** auf ein gelegtes Tile — es öffnet sich groß, und erst dort werden Pieces gesetzt |
| Tile verschieben | gelegtes Tile an einer freien Stelle anfassen und auf eine andere Zelle ziehen |
| Seite wählen | `Front` / `Back` oben oder `F` |
| Drehen | `R` oder 0°/90°/180°/270° |
| Gelegtes Tile drehen | ⟳ beim Überfahren der Zelle, oder ⟳ im großen Tile |
| Gelegtes Tile wenden | ⇅ beim Überfahren der Zelle, oder ⇅ im großen Tile |
| Tile entfernen | ✕ beim Überfahren der Zelle |
| Piece setzen | Tile per Doppelklick öffnen, Piece in der Leiste wählen, auf das Raster im großen Tile klicken |
| Piece positionieren | Mit `Move` ein gelegtes Piece anfassen und schieben — im Raster oder im großen Tile |
| Piece löschen | `Remove piece` (großes Tile) bzw. `Delete piece` (Panel) wählen und das Piece anklicken |
| Kompass drehen | auf den Kompass unter dem Raster klicken (90°-Schritte) |
| Special Rules | Kästchen `Special Rules` anhaken, Text schreiben, optional Themenchips anklicken |
| Other Rules | Kästchen `Other Rules / Escalations` anhaken und Text schreiben |
| Bild einfügen | `Choose image` — wird auf 1600 px verkleinert, als JPEG im Szenario gespeichert |
| Szenario sichern | `Save JSON` |
| Dossier | `Print dossier` → Druckdialog → Als PDF speichern |

### Das große Tile

Ein Doppelklick auf eine gelegte Platte öffnet sie bildschirmfüllend über einem
6 × 6-Raster. Dort ist jede Zelle groß genug, um Pieces exakt zu setzen:

| Werkzeug | Wirkung |
| --- | --- |
| `Move` | Gelegtes Piece anfassen und schieben. Standardwerkzeug beim Öffnen |
| Ein Piece (z. B. `The Bomb`) | Klick setzt das Piece auf die getroffene Zelle; es bleibt am Zeiger und lässt sich im selben Zug noch verschieben. Danach springt das Werkzeug automatisch auf `Move` zurück, damit der nächste Klick nichts doppelt setzt. Ein weiteres Piece setzt du, indem du es erneut in der Leiste wählst |
| `Remove piece` | Entfernt das oberste Piece unter dem Zeiger |
| ⟳ / ⇅ | Dreht bzw. wendet die offene Platte; Pieces behalten dabei ihre Lage auf der Platte |

<kbd>Esc</kbd> oder `Done` schließt das Tile. Raster und großes Tile zeigen
denselben Datensatz — was oben passiert, ist sofort auch unten zu sehen.

Pieces werden in der Zelle platziert, auf die der Zeiger zeigt. Bei gedrehtem
Tile rechnet der Editor die Klickposition in den Plattenraum zurück, damit das
Piece am gezeichneten Feld klebt.

Der Kompass übernimmt die Farben des Originals: Nadel nach Norden rot, Osten
grün, Süden orange, Westen blau — dieselben vier Farben wie die Runen.

Das Dossier hat diese Seiten: Titel, Karte mit Ziel, Regeln, **Special Rules**
(nur wenn angehakt, mit den Themen Bomb / Boss / Flame Wall-School / Shards-
Tokens / Hazards), **Other Rules / Escalations** (nur wenn angehakt), verwendete
Tiles und — falls ein Bild hinterlegt ist — eine abschließende Seite
**Board Setup**.

Die **Oberfläche ist englisch** (wie das Original-Werkzeug); diese
Dokumentation bleibt deutsch.

### Pieces

Bezeichnungen und Grundflächen stammen unverändert aus dem Original-Werkzeug
(i18n-Dictionary und Asset-Matrix des ausgelieferten Editors):

| Piece | Fläche | Original-Schlüssel |
| --- | --- | --- |
| School | 3 × 6, 12 von 18 Zellen | `school` |
| Lava Wall | 3 × 6, 12 von 18 Zellen | `lava` |
| Gear Ring | 1 × 1 | `gear` |
| Boss Mech | 2 × 2 | `minion-1` |
| Minion | 1 × 1 | `minion-2` |
| Player Mech | 1 × 1 | `minion-3` |
| The Bomb | 1 × 1 | `bomb` |
| Goal Zone | 1 × 1 | `tape` |
| Crystal Shard | 1 × 1 | `shard` |

Die Wandfelder sind **keine vollen Rechtecke**: Belegungsmatrix und Grundfläche
stammen aus dem Original, inklusive der Aussparungen. Die Maske (3 × 6) lautet

```
X . .
X X .
X X X
X X X
X X .
X . .
```

und wird beim Zeichnen als Silhouette ausgeschritten; die Platte scheint durch
die Lücken. Beim Platzieren wird die Fläche am Plattenrand eingepasst, beim
Löschen genügt ein Klick auf irgendeine belegte Zelle.

## Dateiformat

```json
{
  "format": "clockwork-scenario",
  "version": 2,
  "title": "Ember Line 04",
  "author": "…",
  "objective": "…",
  "rules": "…",
  "special": { "on": true, "text": "…", "topics": ["Bomb", "Boss"] },
  "other": { "on": false, "text": "" },
  "image": "data:image/jpeg;base64,…",
  "compass": 1,
  "board": [
    { "tileId": "T3", "rot": 1, "face": "back",
      "pieces": [{ "type": "rig", "x": 2, "y": 1, "rot": 0 }] },
    null
  ]
}
```

`board` hat immer 25 Einträge (5 × 5 Platten, zeilenweise). `null` = leer.
`rot` ist 0–3 (90°-Schritte im Uhrzeigersinn), `compass` ebenfalls 0–3,
`x`/`y` sind Zellen im 6 × 6-Innenraster der Platte.

## Wie die Anordnungen ermittelt wurden

Nicht geschätzt, sondern gemessen:

1. **Rasterweite.** Die aufgezeichneten Rasterlinien der Platten liegen bei
   0, 333, 667, 1000, 1333, 1666, 2000 px einer 2000-px-Kachel — also **6 × 6**,
   nicht 5 × 5.
2. **Feldpositionen.** Pro Zelle wurde die Sättigung im Zellkern gemessen.
   Medaillons liegen bei S ≈ 0.29–0.36, Gras bei 0.46–0.58, Kristall bei 0.71 —
   sauber getrennt.
3. **Feldfarben.** Dominanter Farbton im Zellkern, Übereinstimmung 0.66–1.00
   pro Feld.
4. **Öl.** Anteil sehr dunkler Pixel pro Zelle; Schwelle 0.45. Rauschwerte lagen
   bei 0.00–0.16, echte Ölfelder bei 0.55–0.97.
5. **Lava.** Anteil leuchtender Pixel (Farbton 5–35°, S > 0.85, V > 0.80);
   Schwelle 0.30.
6. **Gebirgsfelder.** Anteil blaustichiger Pixel (B ≥ R) pro Zelle; Schwelle
   0.15. Die rote Ebene ist rotstichig (B < R), die Felsformationen sind
   blaugrau — der Anteil trennt sauber (Ebene 0.00–0.11, Fels 0.15–0.60).
7. **Runen-Richtung.** Pro Farbe dient eine Rune als Referenz. Für jedes Feld
   wird die Farbmaske gegen die Referenz in allen vier Drehlagen verglichen
   (IoU nach Schwerpunkt-Ausrichtung). Der beste Treffer lag bei allen 76 Runen
   zwischen 0.34 und 1.00, jede falsche Drehlage bei höchstens 0.20 — die
   Zuordnung ist also eindeutig. Gegenprobe mit einem unabhängigen
   Spitzen-Vektor-Verfahren: identisches Ergebnis für alle Felder.

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
    ├── tiles.js        Plattensatz (exakte Anordnungen)
    ├── render.js       reine SVG-Zeichnung
    ├── app.js          Editor-Logik
    └── print.js        Dossier
```

Keine Dependencies, kein Build-Schritt, kein Framework.

## Urheberrecht

Die Anordnungen der Platten sind übernommen. Das ist der Punkt, den man kennen
sollte:

- **Übernommen:** die funktionale Belegung — welche Zelle Öl, welche ein
  Farbfeld welcher Farbe ist, und welche Seite Lava trägt. Das ist die
  Information, ohne die ein Editor für das physische Spiel nicht funktioniert.
- **Nicht übernommen:** Grafik, Logo, Name, Regel- und Kartentexte, Schriftarten.
  Gezeichnet wird ausschließlich flache Geometrie (Quadrate, Rauten, Kreise).
- **Eigener Name und eigenes Logo**, damit keine Kennzeichenrechte berührt werden.

Eine Garantie, dass das rechtlich nicht angreifbar ist, kann ich nicht geben —
das ist keine Rechtsberatung. Vor einer kommerziellen Veröffentlichung: Anwalt
fragen und Markenrecherche für „Clockwork vs Chaos“ machen (DPMA, EUIPO, USPTO).

## Lizenz

- **Code** (`js/`, `*.html`, `*.css`, `serve.sh`): MIT — siehe `LICENSE`.
- **Gezeichnete Grafik** (`assets/logo.svg`, alles was `render.js` erzeugt): CC0 1.0
  — siehe `ASSETS-LICENSE.md`. Die übernommenen Plattenanordnungen sind darin
  ausdrücklich **nicht** als eigenes Werk beansprucht.

Der Name „Clockwork vs Chaos“ und das Logo sind nicht Teil der Lizenz. Wenn du das Projekt
forkst, nimm einen eigenen Namen.

## Auf GitHub stellen

```sh
git init
git add .
git commit -m "Clockwork vs Chaos: Szenario-Editor im 6x6-Plattenraster"
gh repo create clockwork-vs-chaos --public --source=. --push
```
