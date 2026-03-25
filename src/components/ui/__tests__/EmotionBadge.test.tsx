import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { EmotionBadge } from '../EmotionBadge';
import { FEELINGS } from '@/enums/emotions';
import { getEmotionColor } from '@/libs/emotionConfig';

describe('EmotionBadge', () => {
  // Feature: black-sheep-completion, Property 1: EmotionBadge renders with correct color classes
  it('Property 1: renders with correct color classes for all known emotions', () => {
    // Validates: Requirements 1.1, 1.3, 1.5
    fc.assert(
      fc.property(fc.constantFrom(...FEELINGS), (emotion) => {
        const { container } = render(<EmotionBadge emotion={emotion} />);
        const span = container.firstChild as HTMLElement;
        expect(span).not.toBeNull();

        const colors = getEmotionColor(emotion);
        expect(span.className).toContain(colors.bg);
        expect(span.className).toContain(colors.text);
        expect(span.className).toContain(colors.border);
        expect(span.textContent).toBe(emotion);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: black-sheep-completion, Property 2: EmotionBadge suppresses output for falsy emotion
  it('Property 2: suppresses output for falsy emotion values', () => {
    // Validates: Requirements 1.4
    fc.assert(
      fc.property(
        fc.constantFrom('' as string | undefined | null, undefined as string | undefined | null, null as string | undefined | null),
        (emotion) => {
          const { container } = render(<EmotionBadge emotion={emotion} />);
          expect(container.firstChild).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

