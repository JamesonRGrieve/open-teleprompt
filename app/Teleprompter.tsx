'use client';
import { Typography } from '@mui/material';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import React from 'react';
import useSWR from 'swr';
import MarkdownBlock from '@agixt/interactive/MarkdownBlock';

export type TeleprompterProps = {
  documentID: string;
};

export default function DocumentList({ documentID }: TeleprompterProps) {
  const { data, isLoading, error } = useSWR(`/docs/${documentID}`, async () => {
    return (
      await axios.get(`${process.env.NEXT_PUBLIC_AUTH_SERVER}/v1/google/docs?id=${documentID}`, {
        headers: {
          Authorization: getCookie('jwt'),
        },
      })
    ).data;
  });
  return (
    <>
      <Typography variant='h1'>{documentID}</Typography>
      {error ? (
        <Typography variant='body1'>{error.message}</Typography>
      ) : (
        <MarkdownBlock content={isLoading ? 'Loading document...' : data} />
      )}
    </>
  );
}
