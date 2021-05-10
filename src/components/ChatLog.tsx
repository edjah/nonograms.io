/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useEffect, useRef, useState } from "react";
import { colors } from "src/theme";
import * as utils from "src/utils/common";
import { ChatMessage, GameSessionUserState } from "src/utils/nonogram_types";
import { isUserSessionInactive } from "src/utils/users";

// TODO: make these styles not hardcoded pixel values, and make them responsive.
const chatLogStyle = css`
  display: flex;
  flex-direction: column;
  justify-content: center;

  .activeUsers {
    display: flex;
    flex-direction: column;
    align-items: center;

    .header {
      font-size: 20px;
    }

    ul {
      padding-left: 0px;
      list-style-position: inside;
      list-style-type: square;
    }
  }

  .chatContainer {
    border: 1px solid ${colors.black};
    border-radius: 3px;
    width: 250px;
    padding: 10px;

    .messages {
      height: 330px;
      overflow-y: scroll;
      word-wrap: break-word;

      .message {
        margin-bottom: 20px;

        time {
          display: block;
          color: ${colors.gray};
          margin-bottom: 3px;
        }
      }
    }

    .newMessagesNotification {
      margin-top: 10px;
      color: ${colors.gray};
    }

    input {
      margin-top: 10px;
      box-sizing: border-box;
      padding: 8px;
      line-height: 1.4;
      width: 100%;
    }
  }
`;

export const ChatLog = React.memo(
  (props: {
    currentUserId: string;
    users: Record<UserId, GameSessionUserState>;
    messages: Array<ChatMessage>;
    onSendMessage: (message: string) => void;
  }) => {
    const messagesRef = useRef<HTMLDivElement | null>(null);
    const [messageToSend, setMessageToSend] = useState("");
    const [isReadingOldMessages, setIsReadingOldMessages] = useState(false);
    const [numSeenMessages, setNumSeenMessages] = useState(props.messages.length);
    const numNewMessages = props.messages.length - numSeenMessages;

    useEffect(() => {
      if (!isReadingOldMessages && messagesRef.current) {
        setNumSeenMessages(props.messages.length);
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    }, [isReadingOldMessages, props.messages.length]);

    return (
      <div css={chatLogStyle}>
        <div className="activeUsers">
          <div className="header">Active players</div>
          <ul>
            {Object.entries(props.users).map(([userId, user]) => {
              if (isUserSessionInactive(user)) {
                return null;
              }
              return (
                <li key={userId} style={{ color: user.color }}>
                  {user.name}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="chatContainer">
          <div
            className="messages"
            ref={messagesRef}
            onScroll={() => {
              if (messagesRef.current) {
                const { clientHeight, scrollHeight, scrollTop } = messagesRef.current;
                if (clientHeight + scrollTop < scrollHeight) {
                  setIsReadingOldMessages(true);
                } else {
                  setIsReadingOldMessages(false);
                }
              }
            }}
          >
            {props.messages.map(({ userId, timestamp, message }) => {
              const user = userId in props.users ? props.users[userId] : null;
              const messageDateTime = new Date(timestamp);
              const displayedTime =
                timestamp < Date.now() - 24 * 3600 * 1000
                  ? messageDateTime.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : messageDateTime.toLocaleTimeString(undefined, { timeStyle: "short" });

              return (
                <div className="message" key={userId + "-" + timestamp}>
                  <div className="user" style={{ color: user?.color }}>
                    {user?.name ?? "Unknown user"}
                  </div>
                  <time
                    dateTime={messageDateTime.toISOString()}
                    title={messageDateTime.toLocaleString()}
                  >
                    {displayedTime}
                  </time>
                  <div className="message">{message}</div>
                </div>
              );
            })}
          </div>
          {isReadingOldMessages && numNewMessages > 0 && (
            <div className="newMessagesNotification">
              {utils.englishPluralize(numNewMessages, "new message")}
            </div>
          )}
          <input
            value={messageToSend}
            placeholder="Send a message"
            onChange={(event) => setMessageToSend(event.target.value)}
            onKeyUp={(event) => {
              if (event.key === "Enter") {
                props.onSendMessage(messageToSend);
                setMessageToSend("");

                // Scroll to the bottom of the messages after the state has been updated
                setTimeout(() => {
                  if (messagesRef.current) {
                    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                  }
                }, 0);
              }
            }}
          />
        </div>
      </div>
    );
  }
);
