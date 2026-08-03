/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PARABA_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
