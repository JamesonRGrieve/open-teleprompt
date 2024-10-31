'use client';
import React, { useState } from 'react';
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
    <div className='absolute inset-0 flex flex-col items-center'>
      {!selectedDocument && (
        <>
          <h1 className='text-4xl font-bold my-4'>Welcome to OpenTeleprompt</h1>
          {isLoading ? (
            <p className='text-base'>Loading documents...</p>
          ) : (
            <DocumentList documents={documents} setSelectedDocument={setSelectedDocument} />
          )}
        </>
      )}
      {selectedDocument && <Teleprompter googleDoc={selectedDocument} setSelectedDocument={setSelectedDocument} />}
    </div>
  );
}
