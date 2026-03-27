export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
};

export const getPasswordValidationErrors = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 8 || password.length > 128) {
    errors.push('Use 8-128 characters.');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Add a lowercase letter.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Add an uppercase letter.');
  }

  if (!/\d/.test(password)) {
    errors.push('Add a number.');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Add a special character.');
  }

  return errors;
};

export const isStrongPassword = (password: string): boolean => {
  return getPasswordValidationErrors(password).length === 0;
};
