import { twMerge } from 'tailwind-merge';
import { getEmotionColor } from '@/libs/emotionConfig';
import { JSX } from 'react';

interface EmotionBadgeProps {
  emotion: string | null | undefined;
  className?: string;
}

export function EmotionBadge({ emotion, className }: EmotionBadgeProps): JSX.Element | null {
  if (!emotion) return null;
  const colors = getEmotionColor(emotion);
  return (
    <span className={twMerge(
      'px-2.5 py-1 text-[7px] font-black uppercase tracking-widest rounded-lg border',
      colors.bg, colors.text, colors.border,
      className
    )}>
      {emotion}
    </span>
  );
}

