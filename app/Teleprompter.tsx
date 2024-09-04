'use client';
import { Box, IconButton, Slider, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import MarkdownBlock from '@agixt/interactive/MarkdownBlock';
import { GoogleDoc } from './api/v1/google/GoogleConnector';
import { ArrowBack, KeyboardArrowRight, KeyboardDoubleArrowRight, PlayArrow, StopCircle } from '@mui/icons-material';
import { EventSourcePolyfill } from 'event-source-polyfill';

export type TeleprompterProps = {
  googleDoc: GoogleDoc;
  setSelectedDocument: any;
};

export default function Teleprompter({ googleDoc, setSelectedDocument }: TeleprompterProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const mainRef = useRef(null);
  const [mainWindow, setMainWindow] = useState<Boolean>(false);
  const [autoScrolling, setAutoScrolling] = useState<Boolean>(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState<Number>(5);
  const playingIntervalRef = useRef<number | null>(null);
  const handleInputScroll = useCallback(() => {
    if (mainWindow) {
      console.log('Sending scroll request to: ', mainRef.current.scrollTop);
      const scrollPosition = mainRef.current.scrollTop;
      fetch('/api/v1/scroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getCookie('jwt'),
        },
        body: JSON.stringify({ position: scrollPosition }),
      });
    }
  }, [mainWindow]);

  const handleReceivedScroll = useCallback(
    (event: MessageEvent) => {
      console.log('Received scroll request: ', event.data);
      const data = JSON.parse(event.data);
      if (typeof data === 'boolean') {
        console.log('Updating role to ', event.data === 'true' ? 'main' : 'follower');
        setMainWindow(() => data); // Use functional update
      } else {
        if (!mainWindow) {
          console.log('As a follower, scrolling to position...');
          mainRef.current.scrollTo(0, Number(data.position));
          if (data.selectedDocument) {
            setSelectedDocument(data.selectedDocument);
          }
        }
      }
    },
    [setSelectedDocument],
  );

  const handleKillInterval = useCallback(() => {
    console.log('Killing interval...', playingIntervalRef);

    if (mainWindow && playingIntervalRef.current !== null) {
      setAutoScrolling(false);
      clearInterval(playingIntervalRef.current);
      playingIntervalRef.current = null;
    }
  }, [mainWindow]);
  const handleInterval = useCallback(() => {
    console.log('Recalculating handleInterval...', mainRef, playingIntervalRef.current);
    const currentScroll = mainRef.current.scrollTop;
    mainRef.current.scrollTo(0, Number(mainRef.current.scrollTop + autoScrollSpeed));
    if (mainRef.current.scrollTop == currentScroll) {
      console.log('Hit bottom, killing interval: ', playingIntervalRef.current);
      handleKillInterval();
    }
  }, [mainRef, mainWindow, autoScrollSpeed]);
  useEffect(() => {
    mainRef.current = document.querySelector('main');

    mainRef.current.addEventListener('scroll', handleInputScroll);
    eventSourceRef.current = new EventSourcePolyfill('/api/v1/scroll', {
      headers: {
        Authorization: getCookie('jwt'),
      },
    });
    eventSourceRef.current.addEventListener('message', handleReceivedScroll);

    return () => {
      mainRef.current.removeEventListener('scroll', handleInputScroll);
      if (eventSourceRef.current) {
        eventSourceRef.current.removeEventListener('message', handleReceivedScroll);
        eventSourceRef.current.close();
      }
      clearInterval(playingIntervalRef.current);
      playingIntervalRef.current = null;
    };
  }, [handleInputScroll, handleReceivedScroll]);

  const { data, isLoading, error } = useSWR(`/docs/${googleDoc.id}`, async () => {
    return googleDoc
      ? (
          await axios.get(`${process.env.NEXT_PUBLIC_AUTH_SERVER}/v1/google/docs?id=${googleDoc.id}`, {
            headers: {
              Authorization: getCookie('jwt'),
            },
          })
        ).data
      : null;
  });
  useEffect(() => {
    console.log(playingIntervalRef);
  }, [playingIntervalRef]);
  return (
    <>
      <Box px='14rem'>
        <Typography variant='h2' display='flex' alignItems='center' justifyContent='center'>
          <IconButton
            onClick={() => {
              setSelectedDocument(null);
            }}
          >
            <ArrowBack />
          </IconButton>
          {googleDoc.name} - {mainWindow ? 'Main Window' : 'Follower Window'}
        </Typography>
        {error ? (
          <>
            <Typography variant='body1'>Unable to load document from Google, an error occurred.</Typography>
            <Typography variant='body1'>{error.message}</Typography>
          </>
        ) : (
          <MarkdownBlock content={isLoading ? 'Loading Document from Google...' : data} />
        )}
      </Box>
      <Box
        width='10rem'
        height='6rem'
        position='fixed'
        display='flex'
        flexDirection='column'
        alignItems='center'
        top='6rem'
        left='2rem'
      >
        <Typography variant='caption' textAlign='center' width='100%'>
          Control Panel
        </Typography>

        {!autoScrolling ? (
          <>
            <IconButton
              onClick={() => {
                if (mainWindow && playingIntervalRef.current === null) {
                  setAutoScrolling(true);
                  const interval = setInterval(handleInterval, 500);
                  console.log('Interval created: ', interval);
                  playingIntervalRef.current = interval as unknown as number;
                }
              }}
            >
              <PlayArrow />
            </IconButton>
            <Stack spacing={2} direction='row' sx={{ alignItems: 'center', width: '100%' }}>
              <KeyboardArrowRight />
              <Slider
                aria-label='Volume'
                step={5}
                shiftStep={10}
                marks
                min={5}
                max={50}
                valueLabelDisplay='auto'
                value={autoScrollSpeed as number | number[]}
                onChange={(event, newValue) => setAutoScrollSpeed(newValue as number)}
              />
              <KeyboardDoubleArrowRight />
            </Stack>
          </>
        ) : (
          <IconButton onClick={handleKillInterval}>
            <StopCircle />
          </IconButton>
        )}
      </Box>
    </>
  );
}
