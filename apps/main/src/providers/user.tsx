// auth.tsx
import schema from "@mono/backend/convex/schema.js";
import { Infer } from "convex/values";
import { createContext, ReactNode, useContext } from "react";

type User = Infer<typeof schema.tables.userProfiles.validator>;

interface UserContext {
  user: User;
}

const UserContext = createContext<UserContext | null>(null);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function UserProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: User;
}) {
  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
}
