/**
 * Client-side authentication utilities for SoulScript
 * Handles localStorage-based authentication for multiple user sessions
 */

/**
 * Fetch with authentication header
 * @param url The URL to fetch
 * @param options Additional fetch options
 * @returns Fetch response
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
  };
  
  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Check if user is authenticated
 * @returns Boolean indicating if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
}

/**
 * Log out user by removing auth token
 */
export function logout() {
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
}

/**
 * Store authentication token
 * @param token JWT token
 */
export function storeAuthToken(token: string) {
  localStorage.setItem('auth_token', token);
}
