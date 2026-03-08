/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOKETI_HOST: string;
  readonly VITE_SOKETI_PORT: string;
  readonly VITE_SOKETI_APP_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
