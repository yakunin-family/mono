import { useEffect, useState } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";

interface CursorPosition {
  x: number;
  y: number;
}

interface UserInfo {
  name: string;
  color: string;
}

interface CursorData {
  id: number;
  user: UserInfo;
  cursor: CursorPosition;
}

interface RemoteCursorsProps {
  provider: HocuspocusProvider;
}

/**
 * RemoteCursors component displays real-time mouse cursors for all remote users.
 * Cursors are rendered as SVG pointers with user name labels.
 */
export function RemoteCursors({ provider }: RemoteCursorsProps) {
  const [cursors, setCursors] = useState<Map<number, CursorData>>(new Map());

  useEffect(() => {
    const awareness = provider.awareness;
    if (!awareness) return;

    const updateCursors = () => {
      const states = awareness.getStates();
      const newCursors = new Map<number, CursorData>();

      states.forEach((state, clientId) => {
        // Skip own cursor
        if (clientId === awareness.clientID) return;

        const { user, cursor } = state;

        // Only add cursors with valid data
        if (user && cursor && cursor.x !== undefined && cursor.y !== undefined) {
          newCursors.set(clientId, {
            id: clientId,
            user: user as UserInfo,
            cursor: cursor as CursorPosition,
          });
        }
      });

      setCursors(newCursors);
    };

    awareness.on("change", updateCursors);
    updateCursors(); // Initial render

    return () => {
      awareness.off("change", updateCursors);
    };
  }, [provider]);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {Array.from(cursors.values()).map((cursor) => (
        <Cursor key={cursor.id} cursor={cursor} />
      ))}
    </div>
  );
}

interface CursorProps {
  cursor: CursorData;
}

/**
 * Individual cursor component with smooth transitions
 */
function Cursor({ cursor }: CursorProps) {
  return (
    <div
      className="absolute transition-all duration-100 ease-out"
      style={{
        left: `${cursor.cursor.x}%`,
        top: `${cursor.cursor.y}%`,
        transform: "translate(-2px, -2px)", // Offset to align cursor tip
      }}
    >
      {/* Cursor SVG Icon */}
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
      >
        <path
          d="M5.65376 12.3673H5.46026L5.07154 9.61302L8.43259 6.38732L4.07154 13.4612L5.65376 12.3673Z"
          fill={cursor.user.color}
        />
        <path
          d="M5.65376 12.3673L8.82324 15.5368L11.9927 12.3673L8.82324 9.19788L5.65376 12.3673Z"
          fill={cursor.user.color}
        />
        <path
          d="M12 8.82324L15.1694 11.9927L12 15.1622L8.83052 11.9927L12 8.82324Z"
          fill={cursor.user.color}
        />
        <path
          d="M3 3L3 28L9 21L11.5 28.5L15 27L12.5 19.5L20 19L3 3Z"
          fill={cursor.user.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* User Name Label */}
      <div
        className="ml-5 -mt-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium text-white shadow-sm"
        style={{ backgroundColor: cursor.user.color }}
      >
        {cursor.user.name}
      </div>
    </div>
  );
}
