'use client';
import React, { useState } from 'react';
import { Button, Typography } from '@mui/material';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import DocumentList from './DocumentList';
import Teleprompter from './Teleprompter';
export default function Home() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentID, setSelectedDocumentID] = useState(null);
  return (
    <Typography variant='body1' textAlign='center'>
      Welcome to OpenTeleprompt
      {!selectedDocumentID &&
        (documents.length === 0 ? (
          <Button
            variant='contained'
            onClick={async (event) => {
              setDocuments(
                (
                  await axios.get(`${process.env.NEXT_PUBLIC_AUTH_SERVER}/v1/google/docs/list`, {
                    headers: {
                      Authorization: getCookie('jwt'),
                    },
                  })
                ).data,
              );
            }}
          >
            Load Documents
          </Button>
        ) : (
          <DocumentList documents={documents} setSelectedDocumentID={setSelectedDocumentID} />
        ))}
      {selectedDocumentID && <Teleprompter documentID={selectedDocumentID} />}
    </Typography>
  );
}
