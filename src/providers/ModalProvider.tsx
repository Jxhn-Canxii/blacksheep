"use client";

import { useEffect, useState } from "react";

import ProfileReminderModal from "@/components/modals/ProfileReminderModal";

const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <ProfileReminderModal />
    </>
  );
}

export default ModalProvider;

