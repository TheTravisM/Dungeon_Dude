/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEBUG_PHYSICS?: string;
  readonly VITE_STARTING_LEVEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
