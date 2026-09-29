/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  /** Public Google OAuth client id; unset → Google sign-in is hidden. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css';
declare module '*.png';
declare module '*.svg';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.webp';
declare module '*.gif';

declare module 'chartjs-plugin-crosshair' {
  import type { Plugin } from 'chart.js';
  export const CrosshairPlugin: Plugin;
  export const Interpolate: unknown;
}

declare module 'react-slick';
