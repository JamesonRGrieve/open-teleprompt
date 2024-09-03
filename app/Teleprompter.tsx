'use client';
import { Box, IconButton, Typography } from '@mui/material';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import React from 'react';
import useSWR from 'swr';
import MarkdownBlock from '@agixt/interactive/MarkdownBlock';
import { GoogleDoc } from './api/v1/google/GoogleConnector';
import { ArrowBack } from '@mui/icons-material';
import { ScrollSync } from './ScrollSync';

export type TeleprompterProps = {
  document: GoogleDoc;
  setSelectedDocument: any;
};

export default function Teleprompter({ document, setSelectedDocument }: TeleprompterProps) {
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
    <>
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
      <ScrollSync />
    </>
  );
}
