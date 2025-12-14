/**
 * Password Validation Utility
 * Validates password strength based on specific criteria
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one number (0-9)
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one special character (!@#$%^&*)
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number (0-9)");
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter (A-Z)");
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter (a-z)");
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&* etc.)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

