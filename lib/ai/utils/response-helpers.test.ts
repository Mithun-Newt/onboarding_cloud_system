import { describe, it, expect } from 'vitest';
import { nullOrMessage } from '@/lib/ai/utils/response-helpers';

describe('nullOrMessage utility', () => {
  it('returns the original value when not null/undefined', () => {
    expect(nullOrMessage('value', 'N/A')).toBe('value');
  });

  it('returns the fallback message when value is null', () => {
    expect(nullOrMessage(null, 'N/A')).toBe('N/A');
  });

  it('returns the fallback message when value is undefined', () => {
    expect(nullOrMessage(undefined, 'N/A')).toBe('N/A');
  });
});
