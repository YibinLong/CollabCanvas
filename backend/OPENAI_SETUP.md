# OpenAI API Setup Guide

## Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in with your OpenAI account
3. Click **"Create new secret key"**
4. Give it a name (e.g., "CollabCanvas Dev")
5. **Copy the key** (starts with `sk-...`)
   - ⚠️ **IMPORTANT**: You can only see this once! Save it somewhere safe.

## Step 2: Add Key to Backend .env File

1. Open `/backend/.env` in your editor
2. Add this line (replace with your actual key):

```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

Example:
```bash
# Backend Environment Variables
PORT=4000
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...

# OpenAI API Key (NEW - for Phase 7)
OPENAI_API_KEY=sk-proj-abc123def456...
```

## Step 3: Verify Setup

Once you've added the key, restart your backend server:

```bash
cd backend
npm run dev
```

Then run the AI tests:

```bash
npm test -- ai.test.ts
```

## Cost Information

**OpenAI API Costs (as of 2024):**
- GPT-4 Turbo: ~$0.01 per 1,000 tokens (input) + $0.03 per 1,000 tokens (output)
- Average AI request: ~$0.001 - $0.005 per command
- For testing: Budget ~$2-5 for development and testing

**Free Trial:**
- New accounts get $5 in free credits
- This should be plenty for development

## Troubleshooting

### Error: "OpenAI API key is invalid"
- Double-check you copied the entire key (starts with `sk-`)
- Make sure there are no extra spaces or quotes
- Regenerate a new key if needed

### Error: "insufficient_quota"
- You've used up your free credits
- Add a payment method at https://platform.openai.com/account/billing
- Set spending limits to avoid surprises

### Tests timing out
- OpenAI API can take 1-3 seconds per request
- Tests have 10-second timeout - this is normal
- If it's slower, check your internet connection

## Security Notes

1. **NEVER commit your .env file to Git** (it's already in .gitignore)
2. **Don't share your API key** publicly
3. **Rotate your key** if you think it's been exposed
4. **Set spending limits** in OpenAI dashboard to avoid surprises

