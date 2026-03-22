"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineLightBulb, HiXMark, HiCheck } from "react-icons/hi2";
import { RiSparklingFill, RiLineChartFill } from "react-icons/ri";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUser } from "@/providers/UserProvider";
import { toast } from "react-hot-toast";
import { FEELINGS } from "@/libs/emotionColors";

interface BlackSheepAssistantProps {
  vents: any[];
}

const BlackSheepAssistant = ({ vents }: BlackSheepAssistantProps) => {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [prediction, setPrediction] = useState<string>("");
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [lastEmotion, setLastEmotion] = useState<any>(null);
  
  // Ledger Check-in State
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [intensity, setIntensity] = useState(5);
  const [checkInNote, setNote] = useState("");
  const [checkInEmotion, setCheckInEmotion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync checkInEmotion with prediction when prediction changes
  useEffect(() => {
    if (prediction && !checkInEmotion) {
      setCheckInEmotion(prediction);
    }
  }, [prediction]);

  // Fetch last emotional ledger entry to personalize greetings
  useEffect(() => {
    if (!user) return;
    const fetchLastEmotion = async () => {
      const { data, error } = await supabase
        .from('emotional_ledger')
        .select('emotion, intensity, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        setLastEmotion(data);
      }
    };
    fetchLastEmotion();
  }, [user, supabase]);

  // Random Interval Check-in Logic
  useEffect(() => {
    if (!user) return;

    const checkInterval = setInterval(() => {
      // 20% chance to prompt for a check-in every 5 minutes
      const shouldPrompt = Math.random() < 0.2;
      if (shouldPrompt && !isOpen) {
        setIsOpen(true);
        setShowCheckIn(true);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(checkInterval);
  }, [user, isOpen]);

  const handleCheckIn = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          emotion: checkInEmotion || prediction,
          intensity,
          note: checkInNote
        })
      });

      if (!response.ok) throw new Error('Failed to save to server');
      
      toast.success("Emotional signal recorded on server.");
      setShowCheckIn(false);
      setNote("");
      // Refresh last emotion after check-in
      setLastEmotion({ emotion: checkInEmotion || prediction, intensity, created_at: new Date().toISOString() });
    } catch (error) {
      toast.error("Failed to record emotional signal.");
    }
    setSubmitting(false);
  };

  // Simple Emotion Prediction Logic
  const predictEmotion = (vents: any[]) => {
    if (!vents || vents.length === 0) return "Neutral";
    
    const emotions = vents.map(v => v.emotion).filter(Boolean);
    const counts: Record<string, number> = {};
    emotions.forEach(e => counts[e] = (counts[e] || 0) + 1);
    
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!dominant) return "Neutral";

    // Ensure we return the canonical casing from FEELINGS if possible
    const canonical = FEELINGS.find(f => f.toLowerCase() === dominant[0].toLowerCase());
    return canonical || dominant[0];
  };

  const getGreeting = (current: string, last: any) => {
    const e = current.toLowerCase();
    
    // If we have history, show we remember
    if (last) {
      const lastE = last.emotion.toLowerCase();
      if (lastE === e) {
        return `Still feeling ${current}? I'm here with you, Baara's got your back! 🐑`;
      }
      if ((lastE.includes('stress') || lastE.includes('anxious')) && (e.includes('happy') || e.includes('joy') || e === 'neutral')) {
        return "You're feeling better! I'm so glad the storm passed. ✨";
      }
    }

    if (e.includes('stress') || e.includes('pressure') || e.includes('overwhelmed') || e.includes('tense')) return "Take it easy, friend. I'm here for you! 🐑";
    if (e.includes('happy') || e.includes('joy') || e.includes('sparkling')) return "Your energy is sparkling today! Keep it up! ✨";
    if (e.includes('sad') || e.includes('lonely') || e.includes('melancholy') || e.includes('isolated')) return "Sending you a big warm woolly hug... 💖";
    if (e.includes('angry') || e.includes('frustrated') || e.includes('betrayed')) return "Let's breathe together. Release that fire... 🔥";
    if (e === 'neutral' || e === 'steady') return "Steady and calm. A perfect frequency! 🌊";
    return `I'm sensing some ${current} vibes from you. I'm here to listen. 🌈`;
  };

  const getLocalAdvice = (emotion: string) => {
    const e = emotion.toLowerCase();
    const advicePool: Record<string, string[]> = {
      joy: [
        "Savor this moment. High frequencies like this are what we live for! ✨",
        "Your light is infectious. Share a bit of that spark with someone today. 🌟",
        "Remember this feeling for when the clouds return. You are powerful! 💪",
        "Keep riding this wave. The universe is in sync with you right now. 🌊",
        "Joy is the ultimate rebellion. Stay happy, stay strong! 🐑",
        "This energy is rare—use it to create something beautiful today. 🎨",
        "Your resonance is perfect. Keep shining bright! 💎",
        "Don't forget to breathe and just BE in this happiness. 🧘",
        "The grid is glowing because of you. Keep that smile! 😊",
        "You've earned this peace. Let it wash over you completely. 🌈",
        "Happiness looks good on you. Wear it proudly! ✨"
      ],
      stress: [
        "Take a deep breath. One step at a time, the mountain will move. 🏔️",
        "The pressure is temporary, but your resilience is permanent. 💎",
        "Unplug for 5 minutes. The grid can wait, your peace cannot. 🔌",
        "Focus on what you can control. Let the rest drift away... 🌬️",
        "You're doing better than you think. Give yourself some grace. 🐑",
        "Inhale courage, exhale the weight. You've got this. 🧘",
        "Your frequency is a bit jagged—try some soft music to smooth it out. 🎵",
        "It's okay to say no to things that drain your battery. 🔋",
        "The storm is loud, but your core is silent and strong. ⚡",
        "Break the big tasks into tiny woolly pieces. Easy does it! 🧶",
        "You are not your stress. You are the observer of it. 👁️"
      ],
      angry: [
        "Channel that fire into something productive. Burn bright, don't burn out. 🔥",
        "Anger is a signal—listen to what it's trying to protect. 🛡️",
        "Take a walk. Let the physical movement drain the excess heat. 🚶",
        "Count to ten, then breathe. The fire will settle into a steady glow. 🕯️",
        "You have the right to be upset, but don't let it consume your peace. 🐑",
        "Cool down with some water. Physical cooling helps mental cooling. 💧",
        "Write it down, then tear it up. Release the resonance safely. 📝",
        "Speak when you're calm, so your message is heard, not just your volume. 🗣️",
        "Forgiveness isn't for them; it's to stop the fire from burning YOU. 🕊️",
        "Your energy is valuable—don't waste it on those who don't deserve it. 💎",
        "Breathe. The world is big, and this moment is small. 🌍"
      ],
      sad: [
        "It's okay to not be okay. Even the sky cries sometimes. 🌧️",
        "Be gentle with yourself today. You're processing a lot. 🐑",
        "Sadness is just love with nowhere to go. Hold space for it. 💖",
        "Reach out to a trusted link. Connection is the best medicine. 🔗",
        "Small comforts matter—a warm drink, a soft blanket, a quiet moment. ☕",
        "This too shall pass. The tide always goes out eventually. 🌊",
        "Your value isn't tied to your productivity or your mood. 💎",
        "Cry if you need to. It's the body's way of releasing the pressure. 💧",
        "Look for one tiny thing that's beautiful today. Just one. 🌸",
        "You are loved, even when you feel most alone. 🐑",
        "Rest your heart. It's been working hard. 🛌"
      ],
      lonely: [
        "I'm right here with you! You're never truly disconnected. 🐑",
        "Loneliness is a call for self-connection. Spend time with YOURSELF. ✨",
        "The grid is vast—someone out there shares your frequency. 📡",
        "Try joining a new Circle today. A fresh link might be what you need. ⭕",
        "Physical space doesn't mean emotional distance. Call someone. 📞",
        "Being alone and being lonely are different. Find peace in the quiet. 🧘",
        "You are part of a global collective. We feel you. 🌍",
        "Nature is a great companion. A tree doesn't ask for anything but presence. 🌳",
        "Do something kind for a stranger. It bridges the gap instantly. 🤝",
        "Your presence matters. You occupy a unique space in the universe. 🌌",
        "Baara is sending you a virtual hug right now! 💖"
      ],
      tired: [
        "Your battery is low. It's time for a deep recharge. 🔋",
        "Rest is not a reward; it's a requirement. Sleep well. 🛌",
        "Close your eyes for a moment. Let the neural noise fade away. 🔇",
        "You've done enough for today. Tomorrow is a new signal. 🌅",
        "Sometimes the most productive thing you can do is absolutely nothing. 🐑",
        "Listen to your body. If it says stop, then stop. 🛑",
        "Hydrate and rest. Your physical shell needs maintenance too. 💧",
        "Dim the lights. Let your senses settle down. 🌑",
        "A tired mind sees ghosts. Rest will bring back the truth. 👻",
        "Give yourself permission to be 'unproductive' for a while. 💎",
        "Baara will watch the grid while you sleep. Goodnight! 🌙"
      ],
      neutral: [
        "Steady and calm. This is the perfect baseline for growth. 🌊",
        "Enjoy the quiet. Neutrality is the bridge between extremes. 🌉",
        "Observe the world without judgment today. Just be a witness. 👁️",
        "It's a good day to organize your thoughts and your space. 🧹",
        "Balanced resonance is a sign of a strong core. Keep it up! 🐑",
        "Use this stability to plan your next big move. 🗺️",
        "Peace is a quiet joy. Don't mistake it for boredom. ✨",
        "Your frequency is clear and undistorted. Very professional! 📡",
        "Maintain this equilibrium. It's a powerful state of being. 🧘",
        "You are the eye of the storm right now. Stay centered. 🌀",
        "Baara likes your calm vibes. Very soothing! 🐑"
      ]
    };

    // Map specific emotions to categories
    let category = 'neutral';
    if (e.includes('joy') || e.includes('happy')) category = 'joy';
    else if (e.includes('stress') || e.includes('anxious') || e.includes('overwhelmed') || e.includes('pressure') || e.includes('tense') || e.includes('worried')) category = 'stress';
    else if (e.includes('angry') || e.includes('frustrated') || e.includes('betrayed')) category = 'angry';
    else if (e.includes('sad') || e.includes('melancholy') || e.includes('hopeless') || e.includes('grieving') || e.includes('fragile')) category = 'sad';
    else if (e.includes('lonely') || e.includes('isolated') || e.includes('disconnected') || e.includes('misunderstood') || e.includes('invisible')) category = 'lonely';
    else if (e.includes('tired') || e.includes('exhausted') || e.includes('burnt out') || e.includes('numb') || e.includes('apathetic')) category = 'tired';
    else if (e.includes('guilty') || e.includes('suffocated') || e.includes('lost') || e.includes('insecure') || e.includes('uncertain') || e.includes('restless')) category = 'neutral';

    const pool = advicePool[category] || advicePool.neutral;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  useEffect(() => {
    if (isOpen && !advice) {
      setAdvice(getLocalAdvice(prediction));
    }
  }, [isOpen, prediction]);

  const handleRefreshAdvice = () => {
    setLoading(true);
    setTimeout(() => {
      setAdvice(getLocalAdvice(prediction));
      setLoading(false);
    }, 600);
  };

  // Particle Animation (Hearts/Stars)
  const particles = [
    { id: 1, type: 'heart', top: '0%', left: '5%' },
    { id: 2, type: 'star', top: '10%', right: '-5%' },
    { id: 3, type: 'star', bottom: '5%', left: '10%' },
    { id: 4, type: 'heart', bottom: '0%', right: '5%' },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, rotate: 5 }}
            className="mb-4 w-80 bg-neutral-900/80 backdrop-blur-2xl border border-emerald-500/30 rounded-[2.5rem] p-7 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative"
          >
            {/* Animated Background Glow */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1] 
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500 rounded-full blur-[60px] pointer-events-none" 
            />
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-neutral-600 hover:text-white transition-colors z-[50]"
            >
              <HiXMark size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-5 relative z-10">
              {/* Mascot Container with Particles - REBALANCED SIZE */}
              <div className="w-44 h-44 relative -mt-28 z-30">
                <AnimatePresence>
                  {particles.map((p) => (
                    <motion.span
                      key={p.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.4, 1, 1.4],
                        opacity: [0, 1, 0.8, 1],
                        y: [0, -20, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        delay: p.id * 0.5 
                      }}
                      className="absolute text-2xl pointer-events-none z-20"
                      style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom }}
                    >
                      {p.type === 'heart' ? '💖' : '⭐'}
                    </motion.span>
                  ))}
                </AnimatePresence>

                {/* The Custom Mascot */}
                <motion.div
                  animate={{ 
                    y: [0, -12, 0],
                    rotate: [-3, 3, -3],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="w-full h-full"
                >
                  <img 
                    src="/mascot.png" 
                    alt="Black Sheep Mascot" 
                    className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.6)]"
                    onError={(e) => {
                      e.currentTarget.src = "https://api.dicebear.com/7.x/adventurer/svg?seed=BlackSheep&backgroundColor=transparent&flip=true";
                    }}
                  />
                </motion.div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex flex-col items-center gap-y-2">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-1">Baara</span>
                    <p className="text-[11px] font-bold text-neutral-200 px-4 leading-relaxed italic">
                      {getGreeting(prediction, lastEmotion)}
                    </p>
                  </div>
                  <div className="flex items-center gap-x-2">
                    <motion.h3 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] italic"
                    >
                      Emotion Detected
                    </motion.h3>
                    <div className="bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="text-[10px] font-black text-white italic tracking-tight">{prediction}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1 w-full border-t border-white/5">
                <div className="flex items-center justify-center gap-x-2 text-neutral-500">
                  <HiOutlineLightBulb size={14} className="text-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">Daily Resonance</span>
                </div>
                <div className="min-h-[50px] flex items-center justify-center">
                  {loading ? (
                    <div className="flex gap-x-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1.5 h-1.5 bg-emerald-500 rounded-full" 
                        />
                      ))}
                    </div>
                  ) : showCheckIn ? (
                    <div className="w-full space-y-3 px-2">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                          <span>Intensity</span>
                          <span className="text-emerald-500">{intensity}</span>
                        </div>
                        <input 
                          type="range" min="1" max="10" 
                          value={intensity} 
                          onChange={(e) => setIntensity(parseInt(e.target.value))}
                          className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                         <div className="flex justify-between items-center text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                           <span>Emotion Resonance</span>
                           <span className="text-emerald-500">{checkInEmotion || "None"}</span>
                         </div>
                         <div className="max-h-[80px] overflow-y-auto pr-1 glass-scroll flex flex-wrap gap-1">
                            {FEELINGS.map(f => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => setCheckInEmotion(f)}
                                className={twMerge(
                                  "px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest transition-all border border-white/5",
                                  checkInEmotion === f 
                                    ? "bg-emerald-500 text-black shadow-lg" 
                                    : "bg-black/40 text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800"
                                )}
                              >
                                {f}
                              </button>
                            ))}
                         </div>
                      </div>

                      <div className="flex gap-x-2">
                        <button 
                          onClick={handleCheckIn}
                          disabled={submitting}
                          className="flex-1 bg-emerald-500 text-black rounded-lg py-1 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-x-1"
                        >
                          {submitting ? "..." : <><HiCheck size={10} /> Record</>}
                        </button>
                        <button 
                          onClick={() => setShowCheckIn(false)}
                          className="px-3 bg-white/5 text-neutral-500 rounded-lg py-1 text-[9px] font-black uppercase tracking-widest hover:text-white transition-all"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  ) : (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] text-neutral-400 font-medium italic leading-relaxed px-4"
                    >
                      "{advice}"
                    </motion.p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-x-3 w-full">
                <button 
                  onClick={handleRefreshAdvice}
                  className="group text-[9px] font-black text-emerald-500 hover:text-white uppercase tracking-widest flex items-center gap-x-2 transition-all bg-emerald-500/5 hover:bg-emerald-500 px-4 py-2 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                >
                  <RiSparklingFill size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                  Refresh
                </button>
                <button 
                  onClick={() => router.push('/profile/ledger')}
                  className="group text-[9px] font-black text-neutral-500 hover:text-white uppercase tracking-widest flex items-center gap-x-2 transition-all bg-white/5 hover:bg-neutral-800 px-4 py-2 rounded-xl border border-white/5"
                >
                  <RiLineChartFill size={12} />
                  Ledger
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (isOpen) {
            setShowCheckIn(true);
          } else {
            setIsOpen(true);
          }
        }}
        className="w-32 h-32 flex items-center justify-center transition-all relative group outline-none"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? "opened" : "closed"}
            initial={{ y: 20, opacity: 0 }}
            animate={{ 
              y: [0, -8, 0],
              opacity: 1 
            }}
            transition={{
              y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              },
              opacity: { duration: 0.2 }
            }}
            exit={{ y: -20, opacity: 0 }}
            className="w-full h-full flex items-center justify-center p-1"
          >
            <img 
              src="/mascot.png" 
              alt="Mascot Toggle" 
              className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(16,185,129,0.4)]"
              onError={(e) => {
                e.currentTarget.src = "https://api.dicebear.com/7.x/adventurer/svg?seed=BlackSheep&backgroundColor=transparent&flip=true";
              }}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Floating Glow Effect */}
        <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl rounded-full" />
      </motion.button>
    </div>
  );
};

export default BlackSheepAssistant;
