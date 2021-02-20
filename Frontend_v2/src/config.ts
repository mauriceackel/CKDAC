/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  interface Window {
    env?: { backendBaseUrl: string; authBaseUrl: string };
  }
}

export const BACKEND_BASE_URL =
  window.env?.backendBaseUrl ?? 'https://api.ckdac.com';
export const AUTH_BASE_URL =
  window.env?.authBaseUrl ?? 'https://auth.ckdac.com';
