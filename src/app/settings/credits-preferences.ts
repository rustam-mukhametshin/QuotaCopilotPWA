import { Injectable, signal } from '@angular/core';

export const DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY = 'default-total-ai-credits';

function toPositiveNumber(value: number | null): number | null {
  return value !== null && Number.isFinite(value) && value > 0 ? value : null;
}

function readPositiveNumber(key: string): number | null {
  const saved = localStorage.getItem(key);
  return saved === null ? null : toPositiveNumber(Number(saved));
}

/** Global AI-credits preferences persisted in localStorage. */
@Injectable({ providedIn: 'root' })
export class CreditsPreferences {
  /** User-defined default total for months without a saved value; `null` when not set. */
  readonly defaultTotalAiCredits = signal<number | null>(
    readPositiveNumber(DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY),
  );

  setDefaultTotalAiCredits(value: number | null): void {
    const normalized = toPositiveNumber(value);
    if (normalized === null) {
      localStorage.removeItem(DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY);
    } else {
      localStorage.setItem(DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY, String(normalized));
    }
    this.defaultTotalAiCredits.set(normalized);
  }
}
