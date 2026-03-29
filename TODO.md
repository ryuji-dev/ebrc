# 📋 Feature Request: Competition-Ready Bible Reading System

## 1. Goal
Implement a "Bible Reading Race" system where users must 'join' a plan, and their completion times are recorded with second-precision for fair ranking.

## 2. Database Schema Changes (Supabase/PostgreSQL)
Please provide the SQL migration and update the types for the following:
- **`user_plans` Table**: Create a table to manage user participation.
  - `user_id`, `plan_id`, `status` (active/completed), `joined_at` (timestamp).
- **Completion Timestamps**: Add the following fields to track the exact moment of completion:
  - `ot_completed_at`: Old Testament completion time (TIMESTAMP with second precision).
  - `nt_completed_at`: New Testament completion time (TIMESTAMP with second precision).
  - `total_completed_at`: Full Bible completion time.

## 3. Core Logic Requirements
- **Participation Flow**: Users must click a "Join/Participate" button before they can start checking off chapters for a specific plan.
- **Precision Tracking**: When a user checks the final chapter of the OT or NT, the system must automatically record the current server time into the respective `completed_at` field.
- **Admin Monitoring**: 
  - Create/Update an Admin Dashboard that lists all participating users.
  - Display real-time progress (%) for each user.
  - Show the exact completion time (e.g., `2026-03-29 17:05:23`) for those who have finished.
  - Sort the list by completion time to show the "Race Standings."

## 4. UI/UX Requirements
- **Admin View**: A table-based layout showing [User Name | Progress | OT Finish Time | NT Finish Time | Status].
- **User View**: A "Join this Plan" button for new plans, and a clear display of their own recorded finish times.
- **Formatting**: All timestamps in the Admin view must display hours, minutes, and seconds clearly.