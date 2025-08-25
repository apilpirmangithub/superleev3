/// <reference types="@rainbow-me/rainbowkit" />

// Extend global FormData interface for proper TypeScript support
declare global {
  interface FormData {
    get(name: string): FormDataEntryValue | null;
    entries(): IterableIterator<[string, FormDataEntryValue]>;
  }
}
