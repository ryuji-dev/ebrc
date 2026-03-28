# 📋 Project: Authentication Process Enhancement (UX/UI & Validation)

## 1. UX/UI Improvements
- **Notifications**: Implement **'Sonner'** for all toast notifications (success, error, warning). Replace standard alerts or existing toast libraries with Sonner for a more polished look.
- **Form Validation**: Use **'Zod'** to implement schema-based validation for all auth inputs (Sign-up, Log-in, Password Reset). 
  - Ensure clear error messages are displayed for invalid email formats, password length, etc.

## 2. Expanded Auth Features
- **Find ID / Reset Password**: 
  - Implement a "Find ID" flow (if applicable) or a robust "Forgot Password" flow.
  - **Password Reset Verification**: Review and ensure the current password reset logic is fully functional. Please verify the integration with Supabase Auth (email link → reset page → password update).
- **Default Role Assignment**: Confirm that every new user is automatically assigned the `user` role in the database upon successful registration. 
  - *Note: Admin roles will be manually assigned via the DB by the developer.*

## 3. Detailed Task Requirements
1. **Zod Schemas**: Create reusable Zod schemas for `loginSchema`, `signupSchema`, and `resetPasswordSchema`.
2. **Sonner Integration**: Wrap the main layout with the Sonner provider and trigger `toast.success()` or `toast.error()` during the auth lifecycle (e.g., "Welcome back!", "Check your email", "Invalid credentials").
3. **Password Reset Flow**: 
   - Ensure the `update password` page is protected and only accessible via a valid reset token/session.
   - Verify that the UI handles expired or invalid reset links gracefully.
4. **Clean Slate**: Ensure these changes align with the previously requested `admin/user` simplified role system.