import React, { useState, useEffect } from "react";
import { firebase } from "src/firebase";
import { UserCursorPositions, GameSessionUserState } from "src/utils/nonogram_types";
import { useOfflineUser, isUserSessionInactive } from "src/utils/users";

const cursorSize = 20;

export function CollaboratorCursors(props: {
  gameSessionRef: firebase.database.Reference | null;
  userSessions: Record<UserId, GameSessionUserState>;
}) {
  const { gameSessionRef, userSessions } = props;
  const [cursors, setCursors] = useState<UserCursorPositions>({});
  const user = useOfflineUser();

  useEffect(() => {
    if (!gameSessionRef) {
      setCursors({});
      return;
    }

    const cursorsRef = gameSessionRef.child("cursors");
    cursorsRef.on("value", (snap) => {
      setCursors(snap.val() ?? {});
    });

    return () => {
      cursorsRef.off();
    };
  }, [gameSessionRef]);

  return (
    <React.Fragment>
      {Object.entries(cursors).map(([userId, { x, y }]) => {
        const userSession = userSessions[userId];
        if (
          !userSession ||
          isUserSessionInactive(userSession) ||
          userId === user.id // Don't render a cursor for yourself
        ) {
          return null;
        }

        return (
          <svg
            key={userId}
            style={{
              position: "absolute",
              left: `calc(${100 * x}% - ${cursorSize / 4}px)`,
              top: `${100 * y}%`,
              zIndex: 100,
            }}
            fill={userSession.color}
            width={cursorSize}
            height={cursorSize}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M6 0l14.4 13.4-6 .6h-1l.5 1 3.5 7.8-2.6 1.2-3.4-7.9-.4-1-.8.8L6 19.8V0" />
          </svg>
        );
      })}
    </React.Fragment>
  );
}
