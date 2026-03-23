"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { useRouter } from "next/navigation";

import AuthForm from "@/components/AuthForm";

const LoginPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 lg:p-12 shadow-3xl relative z-10"
      >
        <div className="flex flex-col items-center text-center space-y-6 mb-8">
          <button 
            onClick={() => router.back()}
            className="absolute top-8 left-8 p-3 bg-white/5 rounded-2xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
          >
            <HiOutlineArrowLeft size={20} />
          </button>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-x-2 text-emerald-500 font-black uppercase tracking-[0.4em] text-[10px]">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>Neural Authentication</span>
            </div>
            <h1 className="text-white text-4xl font-black italic uppercase tracking-tighter">
              Welcome <span className="text-emerald-500 underline decoration-emerald-500/10">Back</span>
            </h1>
            <p className="text-neutral-500 text-sm font-medium opacity-80 max-w-[280px]">Re-establish your link to the global neural grid.</p>
          </div>
        </div>

        <div className="space-y-6">
          <AuthForm view="sign_in" />
          
          <div className="pt-6 border-t border-white/5 flex flex-col items-center space-y-4">
            <p className="text-neutral-600 text-[10px] font-bold uppercase tracking-widest">
              New to the grid?
            </p>
            <Link 
              href="/signup"
              className="text-white text-xs font-black italic uppercase tracking-tighter hover:text-emerald-500 transition-colors"
            >
              Initialize New Signal
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Footer info */}
      <div className="mt-8 flex items-center gap-x-4 opacity-30">
        <div className="text-[10px] font-black italic text-white uppercase tracking-[0.2em]">Black Sheep v1.2</div>
        <div className="w-1 h-1 bg-neutral-700 rounded-full" />
        <div className="text-[10px] font-black italic text-neutral-500 uppercase tracking-[0.2em]">Secure Node</div>
      </div>
    </div>
  );
}

export default LoginPage;
