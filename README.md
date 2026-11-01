# Slickworks — Plate Foundry

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
| **Gras** (front) | helles Papier | schwarze Ölfelder, farbige Felder |
| **Lava** (back) | dunkles Gestein | orangefarbene Lava-Felder, farbige Felder |

Zelltypen:

| Code | Bedeutung | Darstellung |
| --- | --- | --- |
| `oil` | Ölfeld | **vollflächig schwarzes Quadrat** |
| `lava` | Lava (nur Lava-Seite) | vollflächig oranges Quadrat |
| `orange` `red` `green` `blue` | farbiges Feld | vollflächiges Farbquadrat |
| `crystal` | Kristall | Cyan-Quadrat mit Raute |
| *(leer)* | – | Grund der Seite |

Die Anordnungen der fünf Plattenpaare `T1`–`T5` sind aus dem Plattensatz
übernommen, weil ein Szenario-Editor nutzlos ist, wenn er nicht zum Tisch passt.
Gezeichnet wird aber nichts Abfotografiertes: alle Felder sind flache
Vektorgeometrie, kein Bitmap, keine Textur, keine Schrift.

## Bedienung

| Aktion | So geht's |
| --- | --- |
| Platte legen | Platte links wählen, ins Raster klicken |
| Seite wählen | `Gras` / `Lava` oben oder `F` |
| Drehen | `R` oder 0°/90°/180°/270° |
| Gelegte Platte drehen | ⟳ beim Überfahren der Zelle |
| Gelegte Platte wenden | ⇅ beim Überfahren der Zelle |
| Platte entfernen | ✕ beim Überfahren der Zelle |
| Marker setzen | Marker wählen, auf eine **gelegte** Platte klicken |
| Marker löschen | „Marker löschen“ wählen, auf den Marker klicken |
| Szenario sichern | „JSON speichern“ |
| Dossier | „Dossier drucken“ → Druckdialog → Als PDF speichern |

Marker werden in der Zelle platziert, auf die der Zeiger zeigt. Bei gedrehter
Platte rechnet der Editor die Klickposition in den Plattenraum zurück, damit der
Marker am gezeichneten Feld klebt.

## Dateiformat

```json
{
  "format": "slickworks-scenario",
  "version": 2,
  "title": "Ember Line 04",
  "author": "…",
  "objective": "…",
  "rules": "…",
  "board": [
    { "tileId": "T3", "rot": 1, "face": "back",
      "pieces": [{ "type": "rig", "x": 2, "y": 1, "rot": 0 }] },
    null
  ]
}
```

`board` hat immer 25 Einträge (5 × 5 Platten, zeilenweise). `null` = leer.
`rot` ist 0–3 (90°-Schritte im Uhrzeigersinn), `x`/`y` sind Zellen im
6 × 6-Innenraster der Platte.

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
fragen und Markenrecherche für „Slickworks“ machen (DPMA, EUIPO, USPTO).

## Lizenz

- **Code** (`js/`, `*.html`, `*.css`, `serve.sh`): MIT — siehe `LICENSE`.
- **Gezeichnete Grafik** (`assets/logo.svg`, alles was `render.js` erzeugt): CC0 1.0
  — siehe `ASSETS-LICENSE.md`. Die übernommenen Plattenanordnungen sind darin
  ausdrücklich **nicht** als eigenes Werk beansprucht.

Der Name „Slickworks“ und das Logo sind nicht Teil der Lizenz. Wenn du das Projekt
forkst, nimm einen eigenen Namen.

## Auf GitHub stellen

```sh
git init
git add .
git commit -m "Slickworks: Szenario-Editor im 6x6-Plattenraster"
gh repo create slickworks --public --source=. --push
```
