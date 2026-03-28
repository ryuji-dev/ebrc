# EBRC Renewal Project TODO List
These are the primary remaining tasks for the renewal of the EBRC (Chongshin Univ. Bible Reading Club) app.

## Critical Priority (Blockers)
[ ] Create and Configure Supabase Project: Create a new dedicated Supabase project for EBRC and migrate the data schema.

[ ] Configure Environment Variables (.env.local):

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

These values must be set for npm run build to succeed and for the pages to display correctly.

## Core Functionality Validation (Optimization)
[ ] Test Optimistic Updates: Verify that checking off Bible chapters reflects instantly in the UI. (Completed, needs review)

[ ] Login & Member Management: Test Admin features for approximately 30 members. (Ported from biblian365)

## Design & Branding Customization
[ ] Final Design Audit: Ensure the Indigo theme and logo.png are applied naturally across all pages.

[ ] EBRC-Specific Copy: Finalize and reflect specific text according to club operating rules (e.g., reading rewards, leader titles, etc.).

## Deployment & Infrastructure (Cloudflare)
[ ] Cloudflare Pages Integration:

Sign up at dash.cloudflare.com

Connect GitHub repository and set up automated deployment.

[ ] Domain Connection: Link the dedicated EBRC domain to Cloudflare DNS.

[ ] Final Performance Metrics: Verify initial load times and data persistence speeds after deploying to the Cloudflare Edge Network.