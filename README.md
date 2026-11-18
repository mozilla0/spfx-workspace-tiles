# Workspace Tiles · SPFx Webpart

SharePoint Framework Webpart, das eine Workspaces-Liste als Kachelübersicht darstellt — mit Suche, Filter, Sortierung, Owner-Avatar-Stack mit Profilfotos und optionalen Deep-Links in externe Systeme (ERP, Rechnungen, PSA).

<img width="1400" height="800" alt="image" src="https://github.com/user-attachments/assets/4bfd8501-6a7b-4174-9192-a024ad3320ef" />

## Features

- **Kachelansicht** einer SharePoint-Liste mit klickbaren Tiles (Link zur Site-URL)
- **Suche** über Titel, Alias und alle Owner-Namen
- **Filter** nach Kategorie (dynamisch aus den Listen-Daten ermittelt) und Sichtbarkeit (Public / Private)
- **Sortierung** nach Name A→Z, Z→A, Kundennummer auf-/absteigend (numerisch korrekt) oder Erstelldatum
- **Owner-Avatar-Stack** mit echten Profilfotos aus SharePoint, Fallback auf Initialen, +N Overflow ab 4 Ownern
- **Stats-Header** mit Total, Kunden, Public, Private
- **Deep-Links** zu externen Systemen für Kunden-Workspaces (konfigurierbar via Platzhalter `{id}`)
- **Cross-Site-fähig** — die Datenquelle kann auf einer anderen Site liegen als das Webpart
- **Kategorie-Farben** — Kunde/Intern/Projekt haben feste Farben, unbekannte Kategorien bekommen deterministisch eine Farbe aus einer kuratierten Palette

## Voraussetzungen

- Node.js **18.17.1** (SPFx 1.18.2 unterstützt Node 16 und 18)
- gulp-cli, yo, @microsoft/generator-sharepoint global installiert
- SharePoint Online App Catalog (Tenant oder Site Collection)

## Setup

```bash
npm install
gulp trust-dev-cert
gulp serve
```

Die Workbench-URL in `config/serve.json` auf eine Site mit der Workspaces-Liste anpassen.

## Build & Deploy

```bash
npm run package
```

Das Package landet unter `sharepoint/solution/workspace-tiles-webpart.sppkg`. Diese Datei in den App Catalog hochladen und bereitstellen. Danach auf einer beliebigen Site das Webpart hinzufügen.

## Konfiguration

Alle Einstellungen werden über das Property Pane des Webparts gesetzt:

| Feld | Zweck | Beispiel |
|------|-------|----------|
| `Site URL` | Site mit der Workspaces-Liste | `https://contoso.sharepoint.com/sites/workspaces` |
| `Listenname` | Anzeigename der Liste | `Workspaces` |
| `ERP-URL-Template` | Deep-Link zur ERP-Kundenseite | `https://erp.example.com/customer/{id}` |
| `Rechnungs-URL-Template` | Deep-Link zu den Rechnungen | `https://erp.example.com/invoices?customer={id}` |
| `PSA-URL-Template` | Deep-Link zum PSA-System | `https://psa.example.com/search?client={id}` |

Der Platzhalter `{id}` wird pro Tile durch die normalisierte Kundennummer ersetzt. Alias-Varianten:

- `CUS-10565` → bleibt `CUS-10565`
- `10480` (Legacy, nur Zahl) → wird zu `CUS-10480`
- `axon`, `P-0025181` oder andere nicht-numerische Aliase → Action-Links werden nicht angezeigt

Action-Links erscheinen nur bei `Kategorie = Kunde` und nur dann, wenn das jeweilige URL-Template gesetzt ist. Für reine Intranet-Nutzung alle drei Felder leer lassen.

## Erwartete Listenstruktur

| Spalte | Typ | Beispiel |
|--------|-----|----------|
| `Title` | Single line | AgonPro AG |
| `Alias` | Single line | CUS-10565 |
| `Kategorie` | Choice | Kunde / Intern / Projekt / … |
| `Owner` | Person or Group (Multi möglich) | Yannic Graber |
| `Visibility` | Choice | Public / Private |
| `Url` | Hyperlink | https://… |
| `Status` | Choice | Aktiv / … |

Interne Spaltennamen können abweichen (SharePoint encodet Umlaute und Sonderzeichen in `OData_*`). Falls die Daten nicht geladen werden, mit `/_api/web/lists/getbytitle('Workspaces')/fields` die tatsächlichen `InternalName`-Werte ermitteln und in `services/WorkspaceService.ts` den `.select(...)` entsprechend anpassen.

## Cross-Site-Zugriff

Das Webpart kann auf einer anderen Site platziert werden als die Datenquelle — PnPjs ruft die Liste über die konfigurierte `Site URL` ab. Voraussetzung: der eingeloggte User hat Read-Berechtigung auf die Workspaces-Liste.

## Owner-Fotos

Die Profilfotos werden über `/_layouts/15/userphoto.aspx?size=L&accountname=<email>` geladen. Die Email wird aus dem SharePoint-LoginName extrahiert (`i:0#.f|membership|user@domain` → `user@domain`). Falls kein Foto hinterlegt ist oder kein Email-Mapping möglich (z. B. bei Service-Accounts oder Security-Groups), wird automatisch auf einen Initialen-Avatar zurückgefallen.

## Technologie-Stack

- SPFx 1.18.2
- React 17 + TypeScript 4.7
- PnPjs 3.20
- Fluent UI React 8 (SearchBox, Dropdown, Spinner)

## Lizenz

MIT — siehe [LICENSE](./LICENSE).
