export function getAuthErrorMessage(rawMessage?: string): string {
  if (!rawMessage) {
    return 'Something went wrong. Please try again.';
  }

  const message = rawMessage.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }

  if (message.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }

  if (message.includes('user already registered')) {
    return 'An account with this email already exists.';
  }

  if (message.includes('password should be at least')) {
    return 'Password is too short. Please use at least 6 characters.';
  }

  if (message.includes('unable to validate email address')) {
    return 'Please enter a valid email address.';
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }

  return 'Unable to complete authentication. Please try again.';
}
