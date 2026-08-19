const env = require('../config/env');

/**
 * Password validation utility with configurable requirements
 */
class PasswordValidator {
  constructor() {
    this.minLength = parseInt(env.PASSWORD_MIN_LENGTH) || 8;
    this.requireUppercase = env.PASSWORD_REQUIRE_UPPERCASE === 'true';
    this.requireNumber = env.PASSWORD_REQUIRE_NUMBER === 'true';
    this.requireSpecial = env.PASSWORD_REQUIRE_SPECIAL === 'true';
  }

  /**
   * Validate password against configured requirements
   * @param {string} password - Password to validate
   * @returns {object} - { valid: boolean, errors: string[] }
   */
  validate(password) {
    const errors = [];

    if (!password || typeof password !== 'string') {
      return { valid: false, errors: ['Password is required'] };
    }

    // Check minimum length
    if (password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters long`);
    }

    // Check for uppercase letter
    if (this.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for number
    if (this.requireNumber && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for special character
    if (this.requireSpecial && !/[!@#$%^&*()_+\-={}[\];':"|\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password',
      '12345678',
      'qwerty',
      'abc123',
      'password1',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      '1234567890',
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get password strength score (0-4)
   * @param {string} password
   * @returns {object} - { score: number, feedback: string }
   */
  getStrength(password) {
    if (!password) {
      return { score: 0, feedback: 'No password provided' };
    }

    let score = 0;
    const feedback = [];

    // Length
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Complexity
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score++;
      feedback.push('Mixed case');
    }
    if (/\d/.test(password)) {
      feedback.push('Contains numbers');
    }
    if (/[!@#$%^&*()_+\-={}[\];':"|\\|,.<>/?]/.test(password)) {
      score++;
      feedback.push('Contains special characters');
    }

    const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

    return {
      score: Math.min(score, 4),
      strength: strengthLevels[Math.min(score, 4)],
      feedback: feedback.join(', ') || 'Add complexity',
    };
  }

  /**
   * Generate password requirements message
   * @returns {string}
   */
  getRequirementsMessage() {
    const requirements = [];

    requirements.push(`At least ${this.minLength} characters`);
    if (this.requireUppercase) requirements.push('One uppercase letter');
    if (this.requireNumber) requirements.push('One number');
    if (this.requireSpecial) requirements.push('One special character (!@#$%^&*...)');

    return 'Password must contain: ' + requirements.join(', ');
  }
}

// Create singleton instance
const passwordValidator = new PasswordValidator();

module.exports = passwordValidator;
