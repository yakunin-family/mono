import { Teacher } from "@app/backend";
import { createContext, ReactNode, useContext } from "react";

interface UserContext {
  teacher: Teacher;
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
  teacher,
}: {
  children: ReactNode;
  teacher: Teacher;
}) {
  return (
    <UserContext.Provider value={{ teacher }}>{children}</UserContext.Provider>
  );
}
