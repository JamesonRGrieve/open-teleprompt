'use client';
import { Box, IconButton, Typography } from '@mui/material';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import React, { useEffect, useRef } from 'react';
import useSWR from 'swr';
import MarkdownBlock from '@agixt/interactive/MarkdownBlock';
import { GoogleDoc } from './api/v1/google/GoogleConnector';
import { ArrowBack } from '@mui/icons-material';
import { EventSourcePolyfill } from 'event-source-polyfill';
export type TeleprompterProps = {
  document: GoogleDoc;
  setSelectedDocument: any;
};

export default function Teleprompter({ document, setSelectedDocument }: TeleprompterProps) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    eventSourceRef.current = new EventSourcePolyfill('/api/v1/scroll', {
      headers: {
        Authorization: getCookie('jwt'),
      },
    });

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      fetch('/api/v1/scroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getCookie('jwt'),
        },
        body: JSON.stringify({ position: scrollPosition }),
      });
    };

    const handleReceivedScroll = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log('Received update: ', data);
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

  const { data, isLoading, error } = useSWR(`/docs/${document.id}`, async () => {
    return document
      ? (
          await axios.get(`${process.env.NEXT_PUBLIC_AUTH_SERVER}/v1/google/docs?id=${document.id}`, {
            headers: {
              Authorization: getCookie('jwt'),
            },
          })
        ).data
      : null;
  });
  return (
    <Box px='14rem'>
      <Typography variant='h2' display='flex' alignItems='center' justifyContent='center'>
        {' '}
        <IconButton
          onClick={() => {
            setSelectedDocument(null);
          }}
        >
          <ArrowBack />
        </IconButton>
        {document.name}
      </Typography>
      {error ? (
        <Typography variant='body1'>{error.message}</Typography>
      ) : (
        <MarkdownBlock content={isLoading ? 'Loading document...' : data} />
      )}
    </Box>
  );
}
