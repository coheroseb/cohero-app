# Opsætning af OneNote Integration i Cohero

For at få OneNote-integrationen til at virke, skal du oprette en App Registration i Microsoft Azure (Microsoft Entra ID) og tilføje de nødvendige miljøvariable til din `.env.local` fil.

## 1. Opret App i Azure Portal
1. Gå til [Azure Portal - App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
2. Klik på **"New registration"**.
3. Navn: `Cohero OneNote Integration` (eller lignende).
4. Supported account types: Vælg **"Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"**.
5. Redirect URI:
   - Vælg **"Web"** i dropdown.
   - Indtast: `https://cohero.dk/api/auth/callback/microsoft` (for produktion).
   - *Tip: Tilføj også `http://localhost:3000/api/auth/callback/microsoft` hvis du tester lokalt.*
6. Klik på **"Register"**.

## 2. Hent Client ID og Secret
1. Kopiér **"Application (client) ID"** fra oversigtssiden.
2. Gå til **"Certificates & secrets"** i venstre menu.
3. Klik på **"New client secret"**.
4. Tilføj en beskrivelse og klik **"Add"**.
5. Kopiér **"Value"** af den nye secret (vigtigt: det er kun nu du kan se den!).

## 3. Tilføj API Rettigheder (Permissions)
1. Gå til **"API permissions"**.
2. Klik på **"Add a permission"**.
3. Vælg **"Microsoft Graph"**.
4. Vælg **"Delegated permissions"**.
5. Søg efter og tilføj følgende:
   - `Notes.Read` (Giver adgang til at læse OneNote notesbøger og sider)
   - `User.Read` (Giver adgang til at se brugerens profil)
   - `offline_access` (Giver adgang til at refreshe tokens i baggrunden)
6. Klik på **"Add permissions"**.

## 4. Opdater miljøvariable
Tilføj følgende til din `.env.local` (og dit hosting-miljø):

```env
AZURE_CLIENT_ID=din_client_id_her
AZURE_CLIENT_SECRET=din_client_secret_her
AZURE_REDIRECT_URI=https://cohero.dk/api/auth/callback/microsoft
```

*Hvis du tester lokalt, så skift `AZURE_REDIRECT_URI` til `http://localhost:3000/api/auth/callback/microsoft` i din lokale `.env.local`.*

## 5. Test Integrationen
1. Genstart din server.
2. Gå til **Indstillinger -> Integrationer**.
3. Du bør nu se en "Forbind OneNote" knap.
4. Efter login kan du se dine notesbøger og synkronisere dem.
