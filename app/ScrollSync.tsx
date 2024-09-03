'use client';

import { useEffect, useRef } from 'react';

export function ScrollSync() {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    eventSourceRef.current = new EventSource('/api/v1/scroll');

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      fetch('/api/v1/scroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position: scrollPosition }),
      });
    };

    const handleReceivedScroll = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      window.scrollTo(0, data.position);
    };

    window.addEventListener('scroll', handleScroll);
    eventSourceRef.current.addEventListener('message', handleReceivedScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (eventSourceRef.current) {
        eventSourceRef.current.removeEventListener('message', handleReceivedScroll);
        eventSourceRef.current.close();
      }
    };
  }, []);

  return null;
}
