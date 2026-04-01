"use client";

import { create } from "zustand";

interface UserStore {
  userId: string;
  setUserId: (id: string) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  userId: "test_user_123",
  setUserId: (id: string) => set({ userId: id }),
}));
