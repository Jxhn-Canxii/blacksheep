import { RiBubbleChartLine } from "react-icons/ri";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
      <div className="relative">
        {/* Animated Rings */}
        <div className="absolute inset-0 w-24 h-24 border-2 border-emerald-500/20 rounded-full animate-ping" />
        <div className="absolute inset-0 w-24 h-24 border-t-2 border-emerald-500 rounded-full animate-spin" />
        
        {/* Logo/Icon */}
        <div className="relative w-24 h-24 flex items-center justify-center bg-neutral-900 rounded-full border border-white/5 shadow-2xl">
          <RiBubbleChartLine size={40} className="text-emerald-500 animate-pulse" />
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="mt-12 flex flex-col items-center gap-y-2">
        <h2 className="text-white text-sm font-black italic uppercase tracking-[0.5em] animate-pulse">
          Synchronizing
        </h2>
        <div className="flex gap-x-1">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" />
        </div>
      </div>
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
