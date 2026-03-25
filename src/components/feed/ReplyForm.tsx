"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { apiPost } from "@/utils/logger";
import { toast } from "react-hot-toast";
import { HiReply } from "react-icons/hi";

interface ReplyFormProps {
  vent_id: string;
  parent_reply_id?: string;
  onSuccess?: () => void;
}

/**
 * ReplyForm Component
 * 
 * Minimal inline form for responding to specific stress bubbles.
 * Designed to fit within expanded cards on the feed or popups.
 */
const ReplyForm: React.FC<ReplyFormProps> = ({ vent_id, parent_reply_id, onSuccess }) => {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) {
      console.warn("Bot detected in reply.");
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < 3000) { // 3 seconds cooldown for replies
      toast.error("Vibrating too fast. Wait a moment...");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to reply.");
      return;
    }

    if (!content.trim()) return;

    setLoading(true);
    try {
      await apiPost('/api/replies', {
        content,
        user_id: user.id,
        vent_id,
        parent_reply_id: parent_reply_id || null,
      });
      setContent("");
      toast.success("Reply sent!");
      setLastSubmitTime(Date.now());
      if (onSuccess) onSuccess();
    } catch {
      toast.error("Failed to send reply.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      {/* Honeypot field - bots will fill this */}
      <input
        type="text"
        name="reply_neural_signature"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Send some support..."
        aria-label="Reply content"
        className="w-full bg-neutral-900/50 text-white p-4 pr-16 rounded-2xl border border-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus:border-emerald-500/50 min-h-[80px] text-sm shadow-inner transition-colors duration-300"
      />
      <div className="absolute bottom-3 right-3">
        <button
          disabled={loading || !content.trim()}
          type="submit"
          aria-label="Send reply"
          className="
            bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white
            p-3 rounded-xl transition-all duration-300 disabled:opacity-0 disabled:scale-0
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900
          "
        >
          <HiReply size={20} />
        </button>
      </div>
    </form>
  );
};

export default ReplyForm;

