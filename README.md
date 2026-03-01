# 📡 ProblemRadar

**AI-powered problem discovery platform for entrepreneurs.**  
Scan Reddit, forums, reviews, and social media to find real problems and startup opportunities.

---

## Features

- 🔍 **Web Research** — Scans real sources (Reddit, X/Twitter, forums, reviews, news, blogs)
- 🧠 **AI Analysis** — Clusters and scores problems by opportunity, severity, frequency
- 🔬 **Deep Dive** — In-depth analysis per problem: market size, competitors, risks, validation steps
- 💡 **Idea Generator** — Select problems → get concrete startup ideas with business models
- ⚔️ **Competitive Landscape** — Maps existing players, strengths/weaknesses, market gaps
- ✨ **Autocomplete** — AI-powered search suggestions as you type
- 💰 **Subscription Tiers** — Free (3 scans/mo), Pro ($29/mo), Team ($79/mo)
- 📥 **Export** — Download research as JSON
- 📁 **History** — Browse past research sessions

---

## Quick Start (5 minutes)

### 1. Get your API key

Go to [console.anthropic.com](https://console.anthropic.com/) and create an API key.

### 2. Clone and install

```bash
git clone <your-repo-url>
cd problem-radar
npm install
```

### 3. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're live! 🎉

---

## Deploy to Vercel (free)

### Option A: One-click deploy

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "New Project" → Import your repo
4. Add environment variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-your-key-here`
5. Click "Deploy"

Your site will be live at `your-project.vercel.app` in ~60 seconds.

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
# Follow the prompts, then:
vercel env add ANTHROPIC_API_KEY
# Paste your key, then redeploy:
vercel --prod
```

---

## Project Structure

```
problem-radar/
├── app/
│   ├── api/
│   │   ├── research/route.js      # Main scan endpoint
│   │   ├── autocomplete/route.js   # Search suggestions
│   │   ├── deepdive/route.js       # Deep analysis
│   │   ├── ideas/route.js          # Idea generation
│   │   └── competitive/route.js    # Competitor mapping
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   └── ProblemRadar.js             # Main UI component
├── lib/
│   ├── anthropic.js                # Anthropic API client
│   └── prompts.js                  # AI prompts
├── .env.example
├── next.config.js
├── package.json
├── tailwind.config.js
└── README.md
```

---

## Architecture

```
User Browser → Next.js Frontend → Next.js API Routes → Anthropic API (with web search)
                                        ↑
                                  API key is here
                                  (server-side only,
                                   never exposed to browser)
```

Your Anthropic API key stays safely on the server. The browser only talks to your Next.js API routes.

---

## Cost Estimate

| Usage          | Scans/month | API Cost  | Revenue (Pro) |
|---------------|-------------|-----------|---------------|
| Light         | 50          | ~$5       | $29           |
| Medium        | 200         | ~$20      | $29-79        |
| Heavy         | 500         | ~$50      | $79+          |

Each scan costs ~$0.05-0.15 in API usage. Deep dives and idea generation are similar.
At $29/mo per Pro user, you have healthy margins even at heavy usage.

---

## Adding Stripe Payments (next step)

To make the subscription tiers real, add Stripe:

1. `npm install stripe @stripe/stripe-js`
2. Create products in [Stripe Dashboard](https://dashboard.stripe.com)
3. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_KEY` to env
4. Create `/api/checkout/route.js` for payment sessions
5. Create `/api/webhook/route.js` for subscription events
6. Store user plan in a database (Supabase, Planetscale, etc.)

---

## Custom Domain

1. Buy a domain (Namecheap, Google Domains, etc.) — ~€10/year
2. In Vercel dashboard → Settings → Domains → Add your domain
3. Update DNS records as Vercel instructs
4. SSL is automatic

---

## License

MIT
