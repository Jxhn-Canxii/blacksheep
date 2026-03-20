"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUser } from "@/providers/UserProvider";
import { motion } from "framer-motion";
import { HiOutlineUser, HiOutlineGlobeAlt, HiOutlineIdentification, HiOutlineArrowLeft, HiOutlineCheckBadge, HiOutlineCamera } from "react-icons/hi2";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { toast } from "react-hot-toast";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user, userDetails: profile, refreshProfile } = useUser();
  
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url || "");
      setWebsite(profile.website || "");
    }
  }, [profile]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      toast.success("Signal image uploaded!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
        website,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signal updated successfully!");
      if (refreshProfile) await refreshProfile();
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="bg-neutral-900 rounded-[3rem] h-full w-full flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-white text-2xl font-black uppercase italic mb-4">Unauthorized Signal</h2>
        <p className="text-neutral-500 mb-8">You must be synchronized to access profile settings.</p>
        <button onClick={() => router.push("/")} className="text-emerald-500 underline font-black uppercase tracking-widest text-xs">Return Home</button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-950 rounded-[2rem] h-full w-full overflow-hidden overflow-y-auto relative border border-white/5 shadow-2xl flex flex-col scrollbar-hide">
      <Header className="bg-transparent p-6 lg:p-8">
        <div className="flex items-center gap-x-4">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white/5 rounded-xl text-white hover:bg-emerald-500 hover:text-black transition-all border border-white/5 active:scale-95"
          >
            <HiOutlineArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white text-3xl lg:text-4xl font-black italic tracking-tighter uppercase drop-shadow-2xl">
              Neural <span className="text-emerald-500 underline decoration-emerald-500/10">Identity</span>
            </h1>
            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Calibrate your signal frequency.</p>
          </div>
        </div>
      </Header>

      <div className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Profile Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-neutral-900/60 backdrop-blur-3xl p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="relative group mb-6">
                <div className="w-28 h-28 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl font-black text-emerald-500 shadow-2xl overflow-hidden relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    username?.charAt(0).toUpperCase() || <HiOutlineUser />
                  )}
                  
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-emerald-500"></div>
                    </div>
                  )}
                </div>
                
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute -bottom-2 -right-2 p-2.5 bg-emerald-500 text-black rounded-xl shadow-xl cursor-pointer hover:bg-emerald-400 transition-all active:scale-90 z-30 border-4 border-neutral-900"
                >
                  <HiOutlineCamera size={16} />
                </label>
                
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>

              <div className="space-y-1">
                <h2 className="text-white text-xl font-black italic uppercase tracking-tight truncate w-full">
                  {fullName || "Unknown Entity"}
                </h2>
                <p className="text-emerald-500 font-bold tracking-[0.2em] uppercase text-[9px] opacity-80">
                  @{username || "neural_link"}
                </p>
              </div>

              <div className="grid grid-cols-2 w-full gap-4 pt-8 border-t border-white/5 mt-8">
                <div className="flex flex-col items-center">
                   <span className="text-white font-black italic">Active</span>
                   <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Status</span>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-white font-black italic">#{user?.id.slice(0, 4)}</span>
                   <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Neural ID</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10">
               <p className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest leading-relaxed">
                 Your signal is visible to all members of the Stress Collective. Keep your frequency authentic.
               </p>
            </div>
          </div>

          {/* Settings Form */}
          <div className="lg:col-span-8">
            <div className="bg-neutral-900/40 backdrop-blur-2xl p-8 lg:p-10 rounded-3xl border border-white/5 shadow-2xl">
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] flex items-center gap-x-2">
                        <HiOutlineIdentification size={12} className="text-emerald-500" />
                        Designation
                      </label>
                      {/* <span className="text-[8px] font-black text-neutral-700 uppercase tracking-widest italic">Locked Signal</span> */}
                    </div>
                    <input
                      type="text"
                      value={username}
                      disabled
                      placeholder="Unique identifier"
                      className="w-full bg-black/20 text-neutral-500 px-5 py-3.5 rounded-xl border border-white/5 cursor-not-allowed font-medium text-sm opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] ml-1 flex items-center gap-x-2">
                      <HiOutlineUser size={12} className="text-emerald-500" />
                      Human Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Display name"
                      className="w-full bg-black/40 text-white px-5 py-3.5 rounded-xl border border-white/5 focus:outline-none focus:border-emerald-500/30 transition-all font-medium text-sm placeholder:italic placeholder:opacity-20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] ml-1 flex items-center gap-x-2">
                    <HiOutlineGlobeAlt size={12} className="text-emerald-500" />
                    Neural Portal
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://your-signal.com"
                    className="w-full bg-black/40 text-white px-5 py-3.5 rounded-xl border border-white/5 focus:outline-none focus:border-emerald-500/30 transition-all font-medium text-sm placeholder:italic placeholder:opacity-20"
                  />
                </div>

                <div className="pt-6">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-500 shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-x-2.5 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black"></div>
                    ) : (
                      <>
                        <HiOutlineCheckBadge size={18} />
                        Update Neural Signature
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
      
      {/* Decorative background blurs */}
      <div className="fixed -bottom-20 -left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
