import { useEffect } from 'react';

const useSocketEvent = (socket, events) => {

    useEffect(() => {
        Object.entries(events).forEach(([event, handler]) => {
            socket.on(event, handler);
        });
        return () => {
            Object.entries(events).forEach(([event, handler]) => {
                socket.off(event, handler);
            });
        }
    }, [socket, events])
}

export default useSocketEvent