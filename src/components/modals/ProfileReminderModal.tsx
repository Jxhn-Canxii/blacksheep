"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { usePathname, useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { HiOutlineSparkles, HiOutlineUserCircle } from "react-icons/hi2";

export default function ProfileReminderModal() {
  const { user, userDetails, isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't show if already on the profile settings page
    if (pathname === "/profile/settings") {
      setIsOpen(false);
      return;
    }

    if (!isLoading && user && userDetails) {
      const isIncomplete = !userDetails.full_name || !userDetails.username;
      
      if (isIncomplete) {
        // Show reminder after a short delay
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user, userDetails, isLoading, pathname]);

  const onChange = (open: boolean) => {
    setIsOpen(open);
  };

  const goToSettings = () => {
    setIsOpen(false);
    router.push("/profile/settings");
  };

  return (
    <Modal
      title="Incomplete Signal"
      description="Your neural signature is missing key frequencies."
      isOpen={isOpen}
      onChange={onChange}
    >
      <div className="flex flex-col items-center gap-y-6 py-4">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-[1.5rem] border border-emerald-500/20 flex items-center justify-center text-emerald-500">
          <HiOutlineUserCircle size={40} className="animate-pulse" />
        </div>
        
        <p className="text-neutral-400 text-center text-sm leading-relaxed">
          Complete your profile to fully synchronize with the collective. A complete signal helps others recognize your frequency.
        </p>

        <div className="w-full flex flex-col gap-y-3 pt-4">
          <button
            onClick={goToSettings}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-x-2 shadow-xl shadow-emerald-500/20"
          >
            <HiOutlineSparkles size={18} />
            Calibrate Profile
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-4 bg-transparent hover:bg-white/5 text-neutral-500 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
          >
            Stay Ghosted
          </button>
        </div>
      </div>
    </Modal>
  );
}

