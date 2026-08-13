import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@/shared/constants/socketEvents';

interface Params {
  chatId: string | undefined;
  socket: Socket;
  memberIdsRef: React.MutableRefObject<string[]>;
}

export function useTypingIndicator({ chatId, socket, memberIdsRef }: Params) {
  const [isTyping, setIsTyping] = useState(false);
  const isTypingRef = useRef(false);
  isTypingRef.current = isTyping;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitStopTyping = useCallback(() => {
    const id = chatId;
    const members = memberIdsRef.current;
    if (!id || members.length === 0) return;
    socket.emit(SOCKET_EVENTS.STOP_TYPING, { members, chatId: id });
  }, [chatId, memberIdsRef, socket]);

  const emitStartTyping = useCallback(() => {
    const id = chatId;
    const members = memberIdsRef.current;
    if (!id || members.length === 0) return;
    socket.emit(SOCKET_EVENTS.START_TYPING, { members, chatId: id });
  }, [chatId, memberIdsRef, socket]);

  const clearTypingState = useCallback(
    (notifyPeers: boolean) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (isTypingRef.current) {
        setIsTyping(false);
        if (notifyPeers) emitStopTyping();
      }
    },
    [emitStopTyping],
  );

  // Cleanup on unmount / chatId change: stop typing notification
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (isTypingRef.current) {
        const id = chatId;
        const members = memberIdsRef.current;
        if (id && members.length > 0) {
          socket.emit(SOCKET_EVENTS.STOP_TYPING, { members, chatId: id });
        }
      }
    };
  }, [chatId, memberIdsRef, socket]);

  // Reset isTyping state on chat switch
  useEffect(() => {
    setIsTyping(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [chatId]);

  return {
    isTyping,
    setIsTyping,
    isTypingRef,
    timeoutRef,
    clearTypingState,
    emitStartTyping,
    emitStopTyping,
  };
}
