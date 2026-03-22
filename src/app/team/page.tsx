import Header from "@/components/Header";
import { HiUserGroup } from "react-icons/hi2";
import Image from "next/image";

export default function TeamPage() {
  const teamMembers = [
    {
      name: "John The Great",
      role: "Lead Developer / Founder",
      bio: "Visionary behind Black Sheep, focusing on creating a serene, anonymous space for global resonance.",
      image: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      name: "Alice Wonderland",
      role: "UI/UX Designer",
      bio: "Crafts the premium, dark-mode aesthetic and smooth micro-animations that make Black Sheep unique.",
      image: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      name: "Bob Builder",
      role: "Backend Architect",
      bio: "Ensures the PostgreSQL database and Supabase integrations are secure, scalable, and blazingly fast.",
      image: "https://randomuser.me/api/portraits/men/86.jpg"
    }
  ];

  return (
    <div className="bg-neutral-900 min-h-screen text-white rounded-[2rem] overflow-hidden">
      <Header className="bg-neutral-900/80 backdrop-blur-3xl sticky top-0 z-50 shadow-[0_5px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-x-3">
          <HiUserGroup size={24} className="text-emerald-500" />
          <h1 className="font-black italic text-xl uppercase tracking-tighter">
            Development <span className="text-emerald-500">Team</span>
          </h1>
        </div>
      </Header>

      <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-4xl mx-auto pb-32">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase">
            Meet the <span className="text-emerald-500">Architects</span>
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto italic font-medium">
            "Behind the anonymous void, a dedicated team works tirelessly to maintain the grid. We are the shepherds of the Black Sheep."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => (
            <div 
              key={index}
              className="bg-neutral-800/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group shadow-lg"
            >
              <div className="w-24 h-24 mx-auto mb-6 relative rounded-full overflow-hidden border-2 border-emerald-500/30 group-hover:border-emerald-500 group-hover:scale-105 transition-all duration-300">
                {/* Fallback to simple bg if external image fails, but using regular img for simplicity since domains might not be configured in next.config.mjs */}
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  {member.name}
                </h3>
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
                  {member.role}
                </p>
                <p className="text-sm text-neutral-400 pt-3 italic leading-relaxed">
                  "{member.bio}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
