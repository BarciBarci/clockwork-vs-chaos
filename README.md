# Clockwork vs Chaos — a Mechs vs. Minions level generator

**by Barci + AI** – ein nicht-kommerzielles Fan-Projekt.

> **Nicht-kommerzielles Fan-Projekt.** *Mechs vs. Minions* ist ein Markenzeichen
> von Riot Games. Dieses Projekt steht in keiner Verbindung zu Riot Games und
> wird von dort nicht unterstützt oder gebilligt. Es enthält **keine**
> Spielgrafiken, Scans oder Regeltexte aus dem Spiel — alle Kacheln und Marker
> sind eigene Vektorgrafik.

Szenario-Editor für doppelseitige Öllinien-Platten im **6 × 6-Raster**.
Platten legen, drehen, wenden, Marker setzen, Regeln schreiben, Szenario als JSON
sichern und als druckbares Dossier ausgeben.

```sh
./serve.sh            # http://localhost:8085
```

**Live:** https://barcibarci.github.io/clockwork-vs-chaos/

Ein lokaler Server ist nötig, weil der Editor `localStorage` als Übergabe an die
Druckseite nutzt.

---

## Die Platten

Jede Platte ist **6 × 6 Zellen** groß und doppelseitig:

| Seite | Grund | Merkmal |
| --- | --- | --- |
| **Front** | **grünes Gras** mit Erdflecken, Grashalmen und Steinchen | schwarze Ölfelder, farbige Felder |
| **Back** | **hellrote Felsfläche** mit Rissen | dunkelgraue Gebirgsfelder, kräftige Lava, farbige Felder |

Beide Gründe sind als eigene Vektorgrafik gezeichnet (`js/render.js`, Funktion
`groundTexture`): ein Farbverlauf, ein gewundener Trampelpfad und
deterministisch gestreute Elemente, damit eine Platte bei jedem Zeichnen gleich
aussieht. Der Pfad ist bewusst gerichtet — daran sieht man sofort, ob eine
Platte gedreht ist.

Zelltypen:

| Code | Bedeutung | Darstellung |
| --- | --- | --- |
| `oil` | Ölfeld | **vollflächig schwarzes Quadrat** |
| `lava` | Lava (nur Back) | oranges Feld mit glühendem Kern |
| `rock` | Gebirgsfeld (nur Back) | dunkelgrauer Fels mit Facetten |
| `orange` `red` `green` `blue` | farbiges Feld | **runder Runenstein** mit farbig eingemeißelter Rune |
| `crystal` | Brunnen | runder Steinbrunnen mit leuchtendem Wasser |
| *(leer)* | – | Grund der Seite |

Die Rune zeigt die Richtung: 0 = Nord, 1 = Ost, 2 = Süd, 3 = West. Sie dreht
mit der Platte mit.

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
| Gelegtes Tile drehen | ⟳ beim Überfahren der Zelle (nicht im großen Tile) |
| Gelegtes Tile wenden | ⇅ beim Überfahren der Zelle, oder `Flip tile` im großen Tile |
| Tile entfernen | ✕ beim Überfahren der Zelle |
| Piece setzen | Tile per Doppelklick öffnen, Piece in der Leiste wählen, auf das Raster im großen Tile klicken |
| Piece positionieren | Mit `Move` ein gelegtes Piece anfassen und schieben — im Raster oder im großen Tile |
| Piece-Vorrat | Jedes Piece gibt es nur so oft, wie es in der Schachtel liegt. Ist der Vorrat aufgebraucht, wird der Eintrag abgedunkelt und mit ✓ markiert; erst wenn du ein Piece wieder entfernst, ist es erneut wählbar |
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
| `Move` | Gelegtes Piece anfassen und schieben. Zugleich die Auswahl: das zuletzt angefasste Piece bekommt einen weißen Rahmen. Standardwerkzeug beim Öffnen |
| Ein Piece (z. B. `The Bomb`) | Klick setzt das Piece auf die getroffene Zelle; es bleibt am Zeiger und lässt sich im selben Zug noch verschieben. Ist damit die letzte Kopie verbraucht, springt das Werkzeug auf `Move` zurück; sind noch Kopien übrig (Gear Ring, Player Mech, Crystal Shard), bleibt der Stempel aktiv |
| `Remove piece` | Entfernt das oberste Piece unter dem Zeiger |
| `⟳ Rotate piece` | Dreht das **ausgewählte Piece** auf der Stelle. Die Platte bleibt stehen; ein 3 × 6-Panel wird dabei zum 6 × 3-Panel, ein Mech schaut in eine andere Richtung. Tastenkürzel <kbd>R</kbd> |
| `⇅ Flip tile` | Wendet die offene Platte auf die andere Seite. Tastenkürzel <kbd>F</kbd> |

Die **Platte selbst** wird weiterhin über `⟳` auf dem Raster gedreht (beim
Überfahren der Zelle), nicht im großen Tile.

<kbd>Esc</kbd> oder `Done` schließt das Tile. Raster und großes Tile zeigen
denselben Datensatz — was oben passiert, ist sofort auch unten zu sehen.

### Piece-Vorrat

Gezählt wird über das ganze Szenario, nicht pro Tile — die Bauteile sind
physisch begrenzt:

| Piece | Stück |
| --- | --- |
| School, Lava Wall, Boss Mech, Minion, The Bomb, Goal Zone | 1 |
| Gear Ring, Player Mech, Crystal Shard | 4 |

Der Vorrat steht in `js/tiles.js` als `max` an jedem Eintrag von `PIECES` und
lässt sich dort in einer Zeile ändern. Bei mehreren Kopien (Gear Ring, Player
Mech, Crystal Shard) zeigt der Knopf die Restmenge; ist sie bei 0, wird er
abgedunkelt und mit ✓ markiert.

Pieces werden in der Zelle platziert, auf die der Zeiger zeigt. Bei gedrehtem
Tile rechnet der Editor die Klickposition in den Plattenraum zurück, damit das
Piece am gezeichneten Feld klebt.

Der Kompass übernimmt die Farben des Originals: Nadel nach Norden rot, Osten
grün, Süden orange, Westen blau — dieselben vier Farben wie die Runen.

Das Dossier hat diese Abschnitte: Titel, Karte mit Ziel, Regeln (mit
**Special Rules** und **Other Rules / Escalations**, sofern angehakt),
verwendete Tiles und — falls ein Bild hinterlegt ist — **Board Setup**.

Die Seitenumbrüche werden nicht fest vergeben: `js/print.js` legt jeden
Absatz als eigenen Block an, misst ihn in einer A4-Kopie und verteilt die
Blöcke so, dass keine Seite überläuft. Eine Überschrift bleibt dabei nie
allein am Seitenfuß stehen. Dadurch trägt **jede** Seite ihre eigene Kopfzeile
(Logo, „Clockwork vs Chaos", Szenariotitel) und Fußzeile („Scenario dossier ·
v1.0.0", Seitenzahl `03 / 05`).

Die Karte ist mit Koordinaten (A–E, 1–5) versehen, damit sich Felder in den
Regeln eindeutig ansprechen lassen. Darunter steht die **Kompassrose** mit dem
eingestellten Winkel — dieselbe Grafik wie im Editor.

Unter **Tiles used** steht zu jeder verwendeten Platte, welche Pieces darauf
liegen (Mehrfachstücke als `Gear Ring × 2`), damit sich der Tisch ohne den
Editor aufbauen lässt.

Gedruckt wird auf warmem Papier mit `print-color-adjust: exact`, damit Bänder,
Tabellen und Regel-Kästen auch als PDF farbig bleiben — im Druckdialog muss
dafür „Hintergrundgrafiken“ aktiv sein.

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
  "version": 3,
  "generator": "clockwork/plate-foundry",
  "generatorVersion": "1.0.0",
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

Jedes Piece trägt ein eigenes `rot`: 0 = wie gezeichnet, 1–3 = auf der Stelle
gedreht. Bei einem 3 × 6-Panel tauschen `w` und `h` dabei die Rolle, das Piece
belegt also bei ungeradem `rot` 6 × 3 Zellen.

## Version

Die Software trägt eine Version, die an drei Stellen auftaucht:

| Ort | Beispiel |
| --- | --- |
| Kopfleiste des Editors | `Level generator for Mechs vs. Minions · v1.0.0` |
| Fußzeile jeder Dossier-Seite | `Scenario dossier · v1.0.0` |
| Exportierte JSON | `"generatorVersion": "1.0.0"` |

Sie steht als einzelne Konstante in `js/tiles.js` (`PlateFoundry.VERSION`) und
wird von dort gelesen — für eine neue Ausgabe genügt es, diese eine Zeile zu
ändern. Die Format-Version (`"version": 3` in der JSON) ist davon unabhängig
und beschreibt den Aufbau der Datei.

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
├── NOTICE              Marken- und Rechteinhaber-Hinweis
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
- **Mechs vs. Minions** wird nur beschreibend genannt („ein Level-Generator für
  Mechs vs. Minions“). Der Name des Spiels und alle zugehörigen Marken gehören
  Riot Games; aus der Nennung folgt keine Verbindung zu Riot.

Riot Games veröffentlicht eine **Fan Content Policy** (auf riotgames.com unter
„Legal“); sie regelt, was für Fan-Inhalte erlaubt ist, und ist auf digitale
Riot-Spiele zugeschnitten — für ein Tool zu einem Brettspiel ist die Anwendung
nicht eindeutig. Wer es genauer wissen will, liest sie im Original.

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

## Rechtliches

Die vollständige Fassung steht in [`NOTICE`](NOTICE) — hier die Kernpunkte:

- **Was MIT und CC0 abdecken:** ausschließlich den Code und die in diesem Projekt
  gezeichnete Grafik. Keine der beiden Lizenzen überträgt Rechte am Spiel, am Namen
  *Mechs vs. Minions*, an Marken oder an sonstigem Material von Riot Games, Inc.
- **Was wem gehört:** *Mechs vs. Minions*, *Riot Games* und alle zugehörigen Namen,
  Logos, Figuren, Karten- und Regeltexte sind Marken bzw. geschütztes Material von
  Riot Games, Inc. Alle Rechte daran bleiben bei den jeweiligen Inhabern. Die
  Nennung erfolgt nur beschreibend; daraus folgt keine Verbindung zu Riot.
- **Was hier nicht drin ist:** keine Spielgrafiken, keine Scans oder Fotos, keine
  Regel- oder Kartentexte, keine Schriften aus dem Spiel — nur selbst gezeichnete
  flache Geometrie.
- **Fan-Projekt, nicht kommerziell:** kostenlos, ohne Werbung, ohne Bezahlschranke,
  ohne Spenden gegen Freischaltung.

### Wenn du Rechteinhaber bist

Wenn du Rechteinhaber bist und der Meinung bist, dass dieses Repository deine Rechte
verletzt, öffne bitte ein Issue:

**https://github.com/BarciBarci/clockwork-vs-chaos/issues**

Betroffene Inhalte werden dann umgehend entfernt oder das Repository wird offline
genommen — ohne dass ein förmlicher rechtlicher Schritt nötig ist. Es besteht keine
Absicht, gegen den Willen des Rechteinhabers weiter zu veröffentlichen.

## Auf GitHub

Das Projekt liegt unter
**https://github.com/BarciBarci/clockwork-vs-chaos** und ist über GitHub Pages
veröffentlicht:

**https://barcibarci.github.io/clockwork-vs-chaos/**

Ein `git push` auf `main` genügt, Pages baut die Seite danach selbst neu
(Einstellungen → Pages → Branch `main`, Ordner `/`).

Von Null aufsetzen:

```sh
git init
git add .
 git commit -m "Clockwork vs Chaos: Szenario-Editor im 6x6-Plattenraster"
 gh repo create clockwork-vs-chaos --public --source=. --push
 gh api -X POST repos/<user>/clockwork-vs-chaos/pages \
   -f 'source[branch]=main' -f 'source[path]=/'
```
