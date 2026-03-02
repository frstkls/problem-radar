# ProblemRadar — CLAUDE.md

## Wat is dit project?
ProblemRadar is een AI-powered marktonderzoekstool voor entrepreneurs. Gebruikers voeren een niche in, de app zoekt via Tavily live webresultaten (Reddit, forums, reviews), en Claude analyseert die data naar gestructureerde problemen + kansen.

---

## Stack
- **Next.js 14** (App Router), geen TypeScript
- **React 18** — één grote client component (`components/ProblemRadar.js`)
- **Claude** (`claude-haiku-4-5-20251001`) — alle AI calls via `lib/anthropic.js`
- **Tavily** — live websearch, resultaten als context aan Claude
- **Stripe** — betalingen en subscriptions
- **Resend** — nieuwsbrief
- **Stateless** — geen database; sessie via signed cookie (`pr_sess`), client state via `localStorage`

---

## Bestandsstructuur

```
app/
  page.js                        # Rendert alleen <ProblemRadar />
  layout.js                      # HTML shell + metadata
  globals.css                    # CSS custom properties (dark mode: :root / html.dark)
  admin/page.js                  # Admin panel (nieuwsbrief beheer)
  api/
    research/route.js            # POST — Tavily search + Claude scan
    deepdive/route.js            # POST — diepgaande analyse per probleem (Pro)
    ideas/route.js               # POST — startup ideeën genereren (Pro)
    competitive/route.js         # POST — competitive landscape (Pro)
    autocomplete/route.js        # POST — query autocomplete
    me/route.js                  # GET — sessie ophalen (plan, scansLeft)
    newsletter/
      subscribe/route.js         # POST subscribe, GET count (admin)
      send/route.js              # POST broadcast versturen (admin)
    stripe/
      checkout/route.js          # POST — Stripe checkout sessie aanmaken
      success/route.js           # GET — na betaling sessie upgraden
      webhook/route.js           # POST — Stripe webhook (cancel, update, failed)
    dev/
      reset-scans/route.js       # GET — reset scanteller (alleen dev)

components/
  ProblemRadar.js                # Volledige UI (~870 regels)

lib/
  anthropic.js                   # callClaude, callClaudeLight, extractJSON, sanitizeInput
  prompts.js                     # Alle Claude prompts (scan, deepDive, ideas, competitive, autocomplete)
  session.js                     # Cookie-gebaseerde sessie (signing via HMAC-SHA256)
  stripe.js                      # Stripe client + PRICES + getBaseUrl
  tavily.js                      # Tavily search client + buildSearchQueries + fetchContext
  resend.js                      # Resend client + AUDIENCE_ID + FROM
```

---

## Belangrijke conventies

### Imports
Gebruik altijd **relatieve paden** — er is geen `jsconfig.json`, dus `@/` werkt niet:
```js
// ✓ Correct
import { callClaude } from "../../../lib/anthropic";

// ✗ Breekt de build
import { callClaude } from "@/lib/anthropic";
```

### Stijl
Alle styling is inline via een `C`-object (CSS custom properties voor dark mode). Geen Tailwind in components. Dark mode werkt via `html.dark` class + CSS vars in `globals.css`.

### Geen database
Alles is stateless. Gebruikersdata staat in:
- **Cookie** `pr_sess` — plan, scansUsed, Stripe IDs (gesigned, httpOnly)
- **localStorage** — `pr_last_session` (query/results/deepDives/ideas/competitive), `pr_bookmarks`, `pr_dark`

### JSON parsing
`extractJSON` in `lib/anthropic.js` gebruikt een depth-counting parser (robuuster dan indexOf). Claude-responses bevatten soms tekst rondom de JSON — altijd via deze parser gaan.

### Sanitization
Alle user input sanitizen via `sanitizeInput(str, maxLen)` vóór het aan Claude doorgeven.

---

## Scan flow (hoe resultaten tot stand komen)

1. Gebruiker voert query in → `POST /api/research`
2. **Tavily** doet 4 parallelle searches op basis van geselecteerde bronnen (Reddit, forums, reviews, etc.)
3. Snippets worden samengevoegd als `context` string
4. Claude krijgt die echte webdata als context en analyseert alleen dat — verzint niets
5. Fallback: als `TAVILY_API_KEY` niet gezet is → Claude gebruikt trainingsdata (🟡 badge)
6. Response bevat `liveData: true/false` → UI toont 🟢 of 🟡 badge

---

## Pricing / toegangslogica

| Feature | Free | Pro ($29) | Team ($79) |
|---------|------|-----------|------------|
| Scans | 3/maand | Onbeperkt | Onbeperkt |
| Resultaten per scan | 6 | 10 | 10 |
| Deep Dive | ✗ | ✓ | ✓ |
| Idea Generator | ✗ | ✓ | ✓ |
| Competitive | ✗ | ✓ | ✓ |
| CSV export | ✗ | ✓ | ✓ |

De `gate(feat, fn)` functie in `ProblemRadar.js` bewaakt toegang client-side. Alle Pro-routes checken ook server-side via `isPro(session)`.

**Let op:** Team workspace en shared library zijn nog niet gebouwd — staan als "coming soon" in de pricing.

---

## Omgevingsvariabelen

```env
# Verplicht in productie
ANTHROPIC_API_KEY=sk-ant-...
SESSION_SECRET=minimaal-32-tekens-willekeurige-string
NEXT_PUBLIC_URL=https://jouwdomein.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...

# Tavily (live websearch)
TAVILY_API_KEY=tvly-...

# Resend (nieuwsbrief)
RESEND_API_KEY=re_...
RESEND_AUDIENCE_ID=...
RESEND_FROM=ProblemRadar <hello@jouwdomein.com>
ADMIN_SECRET=sterk-wachtwoord-voor-/admin
```

---

## Tijdelijke test-overrides (terugzetten na testen!)

Bij het testen zijn soms limieten tijdelijk verhoogd of bypassed. Controleer altijd:

- `app/api/research/route.js` — scan limiet moet `>= 3` zijn (niet 20)
- `app/api/ideas/route.js` — `isPro(session)` check moet aanwezig zijn
- `app/api/deepdive/route.js` — `isPro(session)` check moet aanwezig zijn
- `app/api/competitive/route.js` — `isPro(session)` check moet aanwezig zijn
- `components/ProblemRadar.js` — `gate` functie moet `if (isPro)` bevatten
- `app/api/me/route.js` — scansLeft berekening moet `3` als basis gebruiken

---

## Deployen

```bash
npm run build    # Controleer op errors
git add ...
git commit -m "..."
git push
vercel --prod    # Deploy naar productie
```

Vercel project: `problem-radar-fix` (frstkls-projects)
Productie URL: `https://problem-radar-fix.vercel.app`
