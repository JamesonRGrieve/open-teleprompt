'use client';
import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import axios from 'axios';
import useSWR from 'swr';
import { getCookie } from 'cookies-next';
import DocumentList from './DocumentList';
import Teleprompter from './Teleprompter';
export default function Home() {
  const {
    data: documents,
    isLoading,
    error,
  } = useSWR('/documents', async () => {
    return (
      await axios.get(`${process.env.NEXT_PUBLIC_AUTH_SERVER}/v1/google/docs/list`, {
        headers: {
          Authorization: getCookie('jwt'),
        },
      })
    ).data;
  });
  const [selectedDocument, setSelectedDocument] = useState(null);
  return (
    <Box position='absolute' top='0' left='0' right='0' bottom='0' display='flex' flexDirection='column' alignItems='center'>
      {!selectedDocument && (
        <>
          <Typography variant='h1' my='1rem'>
            Welcome to OpenTeleprompt
          </Typography>
          {isLoading ? (
            <Typography variant='body1'>Loading documents...</Typography>
          ) : (
            <DocumentList documents={documents} setSelectedDocument={setSelectedDocument} />
          )}
        </>
      )}
      {selectedDocument && <Teleprompter googleDoc={selectedDocument} setSelectedDocument={setSelectedDocument} />}
    </Box>
  );
}
