/// <reference types="vite/client" />
interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_IS_DEMO_APP: string; 
}