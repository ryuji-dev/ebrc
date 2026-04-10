# Bug Investigation Prompt: Bible Reading Progress Stuck at 84%

## Project Overview

**App Name:** EBRC (에브리바디 성경읽기 챌린지 — Bible Reading Challenge)  
**Tech Stack:** Next.js (or React), Supabase (PostgreSQL backend)  
**Feature:** 성경통독표 (Bible Reading Tracker) — tracks reading progress across all 66 books of the Bible (Old & New Testament)

---

## Problem Description

The user's Bible reading progress percentage is **stuck at 84%** and does not increase further, even when chapters are marked as read.

From the UI screenshot:
- **2026년 진행률 (2026 Progress):** 84%
- **오늘 읽은 장 수 (Chapters read today):** 0장
- **누적 완료 (Cumulative completions):** 8회
- Multiple books appear partially or fully completed in the grid

The progress bar visually reflects 84% but will not advance to 85%, 90%, or 100% despite continued reading activity.

---

## Hypotheses to Investigate

### Hypothesis 1: Supabase Row/Column Data Limit (1000-character truncation or row limit)

Supabase (PostgreSQL) stores data in columns. If reading progress is stored as a **text/JSON string** in a single column, it may be hitting:

- A **VARCHAR limit** (e.g., `VARCHAR(1000)`) silently truncating data
- A **JSONB array** that exceeds an assumed size and stops accepting new entries
- A **TEXT column** that is accidentally being truncated on the frontend before saving

**Check:**
```sql
-- Check column type and length constraints
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'reading_progress'; -- replace with actual table name

-- Check actual stored data length
SELECT id, length(progress_data::text) as data_length, progress_data
FROM reading_progress
WHERE user_id = '<user_id>'; -- replace with actual user
```

---

### Hypothesis 2: Progress Calculation Logic Error (Off-by-one or total chapter count mismatch)

The progress percentage is likely calculated as:

```
progress % = (chapters_read / total_chapters) * 100
```

If `total_chapters` is hardcoded incorrectly or the calculation uses a **wrong denominator**, the percentage can plateau.

**Total chapters in the Bible:**
- Old Testament: **929 chapters**
- New Testament: **260 chapters**
- **Total: 1,189 chapters**

If the app uses a different total (e.g., 1,000 or 1,189 rounded), the math will be off.

**Check the frontend or backend calculation function for:**
```javascript
// Example bug: wrong total
const TOTAL_CHAPTERS = 1000; // ❌ incorrect
const progress = Math.round((chaptersRead / TOTAL_CHAPTERS) * 100);

// Correct version
const TOTAL_CHAPTERS = 1189; // ✅ correct
```

Also check if there's a `Math.floor()` or `Math.min(progress, 84)` cap somewhere.

---

### Hypothesis 3: Supabase RLS (Row Level Security) or Update Policy Blocking Writes

If Supabase RLS is enabled but misconfigured, **UPDATE queries may silently fail** after a certain point (e.g., if a condition changes as progress increases).

**Check:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'reading_progress';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'reading_progress';
```

Also check Supabase dashboard → Table Editor → RLS policies for the relevant table.

---

### Hypothesis 4: Frontend State Not Syncing After Certain Books

If the progress calculation happens **client-side** and certain books' completion states are not being included in the calculation (e.g., New Testament books missing from the state), the progress will plateau.

**Check:**
- Are all 66 books included in the progress state object?
- Is there a filter like `books.filter(b => b.testament === 'old')` accidentally limiting the count?
- Are newly completed chapters being saved to Supabase and then **re-fetched** correctly?

---

### Hypothesis 5: Integer Overflow or Rounding Issue

If chapters are stored as integers and cumulative progress is calculated using integer division:

```javascript
const progress = Math.floor((1000 / 1189) * 100); // = 84 ← exact plateau point!
```

This is suspiciously close. If the stored chapter count is capped or rounded to **1000**, then `floor(1000/1189 * 100) = 84`. This could be the root cause.

---

## Recommended Debugging Steps

1. **Log the raw data from Supabase** — print the full progress object returned from the DB and count the total chapters marked as read.

2. **Check the denominator** used in the progress calculation — confirm it's exactly `1189`.

3. **Inspect the Supabase table schema** — look for VARCHAR limits, JSONB size limits, or any constraints on the progress columns.

4. **Test a direct Supabase UPDATE** from the dashboard — manually mark a chapter as read and see if it persists.

5. **Check RLS policies** — try disabling RLS temporarily and see if progress updates resume.

6. **Add a debug display** in the UI showing:
   - Total chapters stored as read (raw count)
   - Total chapters denominator used
   - Exact float before rounding

---

## Files to Review

Please share the following code sections for further analysis:

- [ ] Supabase table schema (migration files or schema dump)
- [ ] Progress calculation function (frontend or API route)
- [ ] The function that saves chapter completion to Supabase
- [ ] The function that fetches and computes the `%` progress value
- [ ] Any constants file defining total chapter counts per book

---

## Expected Outcome

After identifying the root cause, the fix should allow the progress percentage to:
- Update correctly beyond 84%
- Reflect 100% when all 1,189 chapters have been marked as read
- Persist correctly in Supabase without data loss or truncation