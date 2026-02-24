/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_PLACES_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
