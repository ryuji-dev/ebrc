# 🐛 Bug Analysis & Fix Request

## Issue Summary

On the Reading Plan Management screen, some users have a **completion timestamp recorded, yet their progress is not showing 100%** — instead displaying values like 65% or 42%.

---

## Specific Data from Screenshot

| Name | Progress | Read / Total | Completion Time |
|------|----------|--------------|-----------------|
| 남궁현우 (Namgung Hyunwoo) | 42% | 392 / 929 | 2026.03.29. 22:54:17 ✅ |
| 강주아 (Kang Jua) | 65% | 608 / 929 | 2026.03.29. 23:07:40 ✅ |

---

## Suspected Root Causes

### 1. Mismatch in Completion Criteria
Check whether the condition that records the completion timestamp and the condition that calculates progress percentage are using **different standards**.

> e.g., Completion is triggered by a specific event, while progress is calculated based on chapters read.

### 2. Progress Calculation Logic Error
Verify whether the `read count / total count` calculation has an **incorrect denominator** (total 929), or whether read data is not fully reflected when a completion event is triggered.

### 3. Data Synchronization Issue
Check whether, upon a completion event, the read data is **not immediately and fully committed** to the database, resulting in partial data loss.

### 4. Completion Flag and Progress Data Stored Separately
Check whether completion status is stored as a **separate flag/field**, and whether the progress aggregation query is failing to reference that flag.

---

## Requested Actions

- [ ] Identify which of the above causes actually applies in the codebase.
- [ ] Fix the logic so that **any user with a recorded completion timestamp displays 100% progress**, OR ensure that when a completion event occurs, the read data is fully synchronized to reflect 100%.
- [ ] After the fix, **unify the completion criteria** to prevent the same issue from recurring.

---

## Files to Review

Please attach or share the following relevant files for analysis:

- Progress calculation logic
- Completion handler functions
- Database queries related to reading progress

---

*Please attach the relevant code files along with this prompt for the most accurate diagnosis.*