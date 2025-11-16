import { UserProfile } from "@app/backend";
import { createContext, ReactNode, useContext } from "react";

interface UserContext {
  user: UserProfile;
}

const UserContext = createContext<UserContext | null>(null);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

export function UserProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: UserProfile;
}) {
  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
}
