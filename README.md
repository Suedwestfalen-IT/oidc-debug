# OIDC Debug App

Reine Frontend-Anwendung (Svelte + Vite) zum Debuggen von OIDC-Logins mit
optionalem Step-up-Flow (ACR/LoA: bronze/silver/gold). Kein Backend, keine
Datenbank, keine Server-Konfiguration – der OIDC-Provider wird direkt in der
App eingestellt und im Browser (`localStorage`) gespeichert. Funktioniert mit
jedem Standard-konformen OIDC-Provider (Keycloak, Authentik, Auth0, Entra ID,
Zitadel, ...) über OIDC-Discovery (`<issuer>/.well-known/openid-configuration`).

## Konfiguration – kein `.env`, kein Rebuild

Die App fragt beim ersten Start nach Issuer-URL, Client-ID und optionalen
zusätzlichen Scopes. Diese Werte werden im `localStorage` des Browsers
gespeichert – nicht in einer Datei, nicht als Build- oder Docker-Variable.
Über das Zahnrad-Icon (Login-Screen oder Navbar) lässt sich die Konfiguration
jederzeit ändern oder per Button vollständig zurücksetzen.

Das bedeutet: ein einmal gebautes Image bzw. ein einmal deployter Static-Build
funktioniert für jeden beliebigen Provider – die Person, die die Seite öffnet,
konfiguriert ihren eigenen Provider direkt im Browser, ganz ohne Zugriff auf
Server oder Deployment.

## Warum kein Backend?

Der OIDC-Client dieser App ist ein **Public Client** (kein Client-Secret,
läuft vollständig im Browser). Die JWKS eines Providers sind grundsätzlich
öffentlich, und die Signaturprüfung eines JWT braucht kein Geheimnis – nur
den öffentlichen Schlüssel und die WebCrypto-API des Browsers. Ein Backend
hätte hier keinen Sicherheitsvorteil geboten, nur zusätzliche
Betriebskomplexität (Server, CORS, Zertifikate, Konfigurationsverteilung).
Die Signaturprüfung läuft daher direkt im Browser über die Bibliothek
[`jose`](https://github.com/panva/jose).

**Wichtig:** Das ist eine Debug-/Lern-App für den eigenen Client. Eine echte
geschützte Ressource (eigene API) muss Access Tokens immer selbst
serverseitig validieren – das ändert sich durch dieses Muster nicht. Ein
Public Client kann grundsätzlich nicht beweisen, dass er unverändert läuft;
für autorisierte Backend-Zugriffe bleibt serverseitige Tokenprüfung Pflicht.

## Features

- **Provider-Einstellungen**: Issuer-URL, Client-ID, zusätzliche Scopes –
  direkt in der App editierbar, in `localStorage` gespeichert, per Button
  zurücksetzbar (Zahnrad-Icon)
- **Login** via OIDC Authorization Code Flow (`oidc-client-ts`)
- **Step-up-Authentifizierung** (optional): Buttons für bronze/silver/gold
  triggern einen Re-Login mit angefordertem ACR-Level – wahlweise per
  `acr_values`-Parameter oder per OIDC-`claims`-Parameter (`essential: true`).
  Providerabhängig, ob/wie ACR unterstützt wird.
- **Debug-Ansicht**: ID-Token-Claims, dekodiertes Access Token, UserInfo-Endpoint-
  Antwort, signaturgeprüfte Sicht (JWKS via Discovery, Prüfung via `jose`/WebCrypto
  direkt im Browser), Raw Tokens – aktualisiert sich nach jedem Auth-Vorgang

## Architektur

```
frontend/   Svelte 4 + Vite + Bootstrap, oidc-client-ts, jose
```

Kein Server-Anteil, keine Build-Zeit-Konfiguration. Alle drei "Sichten" auf
die Claims kommen direkt aus dem Browser: dekodiert (unvalidiert) aus dem
Token selbst, vom Provider via UserInfo-Endpoint, und signaturgeprüft via
JWKS + `jose`.

## Start

```bash
docker compose up --build
```

Danach `http://localhost:9055` öffnen und den Provider im angezeigten
Einstellungsformular konfigurieren.

Alternativ ganz ohne Docker:

```bash
cd frontend
npm install
npm run dev
```

## Provider-Voraussetzungen

- **Public Client** mit Redirect-URI `<frontend-origin>/` und **Web Origins**
  `<frontend-origin>`. Die Web-Origins-Einstellung ist hier besonders wichtig,
  da der Browser direkt (ohne Backend als Vermittler) folgende Endpunkte des
  Providers per CORS aufrufen muss:
  - `<issuer>/.well-known/openid-configuration` (Discovery)
  - der darin verlinkte `jwks_uri` (Signaturprüfung)
  - der darin verlinkte `userinfo_endpoint` (Debug-Ansicht)

  Bei Keycloak reicht dafür i. d. R. die normale "Web Origins"-Einstellung
  des Clients; bei anderen Providern ggf. globale CORS-Einstellungen prüfen.
- Der Provider muss ein OIDC-Discovery-Dokument unter
  `<issuer>/.well-known/openid-configuration` bereitstellen (Standard bei
  praktisch jedem OIDC-Provider)
- ACR/Step-up ist optional: nur relevant, wenn der Provider ACR-Werte
  unterstützt. Ohne ACR-Konzept bleibt der `acr`-Claim einfach leer, die
  Badges zeigen dann `–`
