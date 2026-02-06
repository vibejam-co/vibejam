import type { backend as BackendType } from './backend';

let backendPromise: Promise<BackendType> | null = null;
let backendValue: BackendType | null = null;

export const getBackend = async (): Promise<BackendType> => {
  if (backendValue) return backendValue;
  if (!backendPromise) {
    backendPromise = import('./backend').then((mod) => {
      backendValue = mod.backend;
      return backendValue;
    });
  }
  return backendPromise;
};
