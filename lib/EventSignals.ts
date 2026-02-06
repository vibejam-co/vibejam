import { getBackend } from './backendRuntime';
import { warnIfJamRuntimeInactive } from './jamRuntime';

export type EventSignalType =
  | 'jam_page_view'
  | 'theme_switch'
  | 'first_share'
  | 'first_signal_post'
  | 'follow_action';

export type EventSurface = 'public' | 'in-app' | 'internal' | 'unknown';

export interface EventSignalContext {
  jamId?: string;
  theme?: string;
  narrative?: string;
  credibility?: string;
  surface?: EventSurface;
}

export const normalizeEventContext = (context: Partial<EventSignalContext>): EventSignalContext => ({
  jamId: context.jamId,
  theme: context.theme || 'unknown',
  narrative: context.narrative || 'unknown',
  credibility: context.credibility || 'unknown',
  surface: context.surface || 'unknown'
});

export const emitEventSignal = (
  eventType: EventSignalType,
  context: Partial<EventSignalContext>,
  meta: Record<string, any> = {}
) => {
  warnIfJamRuntimeInactive('emitEventSignal');
  const isDev = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  const normalized = normalizeEventContext(context);
  void getBackend().then((backend) => {
    backend.trackEvent(eventType, {
      ...normalized,
      ...meta
    });
  });

  if (isDev) {
    console.info(`[EventSignals] ${eventType}`, {
      context: normalized,
      meta
    });
  }
};
