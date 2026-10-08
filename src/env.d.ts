interface ImportMetaEnv {
  /** Optional override for the demo-request endpoint set in Site settings. */
  readonly PUBLIC_DEMO_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
