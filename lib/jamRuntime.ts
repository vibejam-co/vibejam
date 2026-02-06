let jamRuntimeActive = false;
let jamRuntimeSource: string | null = null;

const isDev = () => typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;

export const markJamRuntimeActive = (source: string): void => {
  jamRuntimeActive = true;
  jamRuntimeSource = source;
};

export const warnIfJamRuntimeInactive = (label: string): void => {
  if (!isDev()) return;
  if (jamRuntimeActive) return;
  console.warn(`[JamRuntime] ${label} accessed before Jam runtime activation.`, {
    expectedBoundary: 'JamPageV2',
    activeSource: jamRuntimeSource
  });
};
