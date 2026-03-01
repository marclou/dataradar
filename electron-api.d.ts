export {};

declare global {
  interface Window {
    dataradarKeyStore?: {
      getApiKey: () => Promise<string | null>;
      setApiKey: (apiKey: string) => Promise<void>;
      clearApiKey: () => Promise<void>;
    };
    dataradarVisibility?: {
      onVisibilityChange: (callback: (visible: boolean) => void) => void;
    };
  }
}
