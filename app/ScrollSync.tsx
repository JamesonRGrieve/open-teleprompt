'use client';

import { useEffect } from 'react';
import io from 'socket.io-client';

export function ScrollSync() {
  useEffect(() => {
    const socket = io();

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      socket.emit('scroll', { position: scrollPosition });
    };

    const handleReceivedScroll = (data) => {
      window.scrollTo(0, data.position);
    };

    window.addEventListener('scroll', handleScroll);
    socket.on('scroll', handleReceivedScroll);

    // Initialize socket connection
    fetch('/api/socket');

    return () => {
      window.removeEventListener('scroll', handleScroll);
      socket.off('scroll', handleReceivedScroll);
      socket.disconnect();
    };
  }, []);

  return null;
}
