export const FEELINGS = [
  "Anxious",
  "Angry",
  "Overwhelmed",
  "Sad",
  "Numb",
  "Restless",
  "Lonely",
  "Exhausted",
  "Stressed",
  "Frustrated",
  "Guilty",
  "Hopeless",
  "Uncertain",
  "Burnt Out",
  "Tense",
  "Disconnected",
  "Worried",
  "Tired",
  "Melancholy",
  "Apathetic",
  "Insecure",
  "Betrayed",
  "Grieving",
  "Pressure",
  "Isolated",
  "Misunderstood",
  "Suffocated",
  "Lost",
  "Fragile",
  "Invisible",
  "Neutral"
];

export const emotionColors: Record<string, { bg: string, border: string, text: string, shadow: string, marker: string }> = {
  // Joy / Positive
  joy: { bg: 'bg-yellow-500/80', border: 'border-yellow-400/50', text: 'text-yellow-100', shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.7)]', marker: '#eab308' },
  happy: { bg: 'bg-yellow-500/80', border: 'border-yellow-400/50', text: 'text-yellow-100', shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.7)]', marker: '#eab308' },
  
  // Anger / Frustration
  angry: { bg: 'bg-red-600/80', border: 'border-red-400/50', text: 'text-red-100', shadow: 'shadow-[0_0_20px_rgba(220,38,38,0.7)]', marker: '#dc2626' },
  frustrated: { bg: 'bg-red-500/80', border: 'border-red-400/50', text: 'text-red-100', shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.7)]', marker: '#ef4444' },
  tense: { bg: 'bg-red-400/80', border: 'border-red-300/50', text: 'text-red-50', shadow: 'shadow-[0_0_20px_rgba(248,113,113,0.7)]', marker: '#f87171' },
  
  // Stress / Anxiety
  stress: { bg: 'bg-orange-500/80', border: 'border-orange-400/50', text: 'text-orange-100', shadow: 'shadow-[0_0_20px_rgba(249,115,22,0.7)]', marker: '#f97316' },
  stressed: { bg: 'bg-orange-500/80', border: 'border-orange-400/50', text: 'text-orange-100', shadow: 'shadow-[0_0_20px_rgba(249,115,22,0.7)]', marker: '#f97316' },
  anxious: { bg: 'bg-orange-400/80', border: 'border-orange-300/50', text: 'text-orange-50', shadow: 'shadow-[0_0_20px_rgba(251,146,60,0.7)]', marker: '#fb923c' },
  overwhelmed: { bg: 'bg-orange-600/80', border: 'border-orange-500/50', text: 'text-orange-100', shadow: 'shadow-[0_0_20px_rgba(234,88,12,0.7)]', marker: '#ea580c' },
  pressure: { bg: 'bg-orange-700/80', border: 'border-orange-600/50', text: 'text-orange-100', shadow: 'shadow-[0_0_20px_rgba(194,65,12,0.7)]', marker: '#c2410c' },
  "burnt out": { bg: 'bg-stone-600/80', border: 'border-stone-500/50', text: 'text-stone-100', shadow: 'shadow-[0_0_20px_rgba(87,83,78,0.7)]', marker: '#57534e' },

  // Sadness / Melancholy
  sad: { bg: 'bg-blue-500/80', border: 'border-blue-400/50', text: 'text-blue-100', shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.7)]', marker: '#3b82f6' },
  melancholy: { bg: 'bg-blue-400/80', border: 'border-blue-300/50', text: 'text-blue-50', shadow: 'shadow-[0_0_20px_rgba(96,165,250,0.7)]', marker: '#60a5fa' },
  grieving: { bg: 'bg-blue-900/80', border: 'border-blue-800/50', text: 'text-blue-100', shadow: 'shadow-[0_0_20px_rgba(30,58,138,0.7)]', marker: '#1e3a8a' },
  hopeless: { bg: 'bg-slate-800/80', border: 'border-slate-700/50', text: 'text-slate-100', shadow: 'shadow-[0_0_20px_rgba(30,41,59,0.7)]', marker: '#1e293b' },
  fragile: { bg: 'bg-sky-300/80', border: 'border-sky-200/50', text: 'text-sky-900', shadow: 'shadow-[0_0_20px_rgba(125,211,252,0.7)]', marker: '#7dd3fc' },

  // Loneliness / Isolation
  lonely: { bg: 'bg-indigo-500/80', border: 'border-indigo-400/50', text: 'text-indigo-100', shadow: 'shadow-[0_0_20px_rgba(79,70,229,0.7)]', marker: '#4f46e5' },
  isolated: { bg: 'bg-indigo-700/80', border: 'border-indigo-600/50', text: 'text-indigo-100', shadow: 'shadow-[0_0_20px_rgba(67,56,202,0.7)]', marker: '#4338ca' },
  disconnected: { bg: 'bg-indigo-300/80', border: 'border-indigo-200/50', text: 'text-indigo-900', shadow: 'shadow-[0_0_20px_rgba(165,180,252,0.7)]', marker: '#a5b4fc' },
  misunderstood: { bg: 'bg-violet-500/80', border: 'border-violet-400/50', text: 'text-violet-100', shadow: 'shadow-[0_0_20px_rgba(139,92,246,0.7)]', marker: '#8b5cf6' },
  invisible: { bg: 'bg-violet-200/40', border: 'border-violet-100/30', text: 'text-violet-900', shadow: 'shadow-[0_0_20px_rgba(231,229,253,0.4)]', marker: '#ddd6fe' },

  // Tired / Exhausted
  tired: { bg: 'bg-zinc-500/80', border: 'border-zinc-400/50', text: 'text-zinc-100', shadow: 'shadow-[0_0_20px_rgba(113,113,122,0.7)]', marker: '#71717a' },
  exhausted: { bg: 'bg-zinc-700/80', border: 'border-zinc-600/50', text: 'text-zinc-100', shadow: 'shadow-[0_0_20px_rgba(63,63,70,0.7)]', marker: '#3f3f46' },
  numb: { bg: 'bg-zinc-400/60', border: 'border-zinc-300/40', text: 'text-zinc-800', shadow: 'shadow-[0_0_20px_rgba(161,161,170,0.4)]', marker: '#a1a1aa' },
  apathetic: { bg: 'bg-zinc-300/50', border: 'border-zinc-200/30', text: 'text-zinc-700', shadow: 'shadow-[0_0_20px_rgba(212,212,216,0.3)]', marker: '#d4d4d8' },

  // Uncertainty / Confusion
  uncertain: { bg: 'bg-teal-500/80', border: 'border-teal-400/50', text: 'text-teal-100', shadow: 'shadow-[0_0_20px_rgba(20,184,166,0.7)]', marker: '#14b8a6' },
  worried: { bg: 'bg-teal-400/80', border: 'border-teal-300/50', text: 'text-teal-50', shadow: 'shadow-[0_0_20px_rgba(45,212,191,0.7)]', marker: '#2dd4bf' },
  restless: { bg: 'bg-emerald-400/80', border: 'border-emerald-300/50', text: 'text-emerald-900', shadow: 'shadow-[0_0_20px_rgba(52,211,153,0.7)]', marker: '#34d399' },
  lost: { bg: 'bg-emerald-700/80', border: 'border-emerald-600/50', text: 'text-emerald-100', shadow: 'shadow-[0_0_20px_rgba(4,120,87,0.7)]', marker: '#047857' },

  // Insecurity / Guilt
  insecure: { bg: 'bg-rose-400/80', border: 'border-rose-300/50', text: 'text-rose-900', shadow: 'shadow-[0_0_20px_rgba(251,113,133,0.7)]', marker: '#fb7185' },
  guilty: { bg: 'bg-rose-700/80', border: 'border-rose-600/50', text: 'text-rose-100', shadow: 'shadow-[0_0_20px_rgba(190,18,60,0.7)]', marker: '#be123c' },
  betrayed: { bg: 'bg-rose-900/80', border: 'border-rose-800/50', text: 'text-rose-100', shadow: 'shadow-[0_0_20px_rgba(136,19,55,0.7)]', marker: '#881337' },

  // Others
  suffocated: { bg: 'bg-purple-700/80', border: 'border-purple-600/50', text: 'text-purple-100', shadow: 'shadow-[0_0_20px_rgba(126,34,206,0.7)]', marker: '#7e22ce' },
  neutral: { bg: 'bg-emerald-500/80', border: 'border-emerald-400/50', text: 'text-emerald-100', shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.7)]', marker: '#10b981' }
};

export const getEmotionColor = (emotion?: string) => {
  const e = emotion?.toLowerCase() || 'neutral';
  return emotionColors[e] || emotionColors.neutral;
};
