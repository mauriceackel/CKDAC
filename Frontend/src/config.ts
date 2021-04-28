/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  interface Window {
    env?: { backendBaseUrl: string; authBaseUrl: string };
  }
}

export const BACKEND_BASE_URL =
  window.env?.backendBaseUrl ?? 'https://localhost:8443/api';
export const AUTH_BASE_URL =
  window.env?.authBaseUrl ?? 'https://localhost:8443/auth';
