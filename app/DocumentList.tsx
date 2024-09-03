import React from 'react';
import { GoogleDoc } from './api/v1/google/GoogleConnector';
import { Box, Link, Typography } from '@mui/material';

export type DocumentListProps = {
  documents: GoogleDoc[];
  setSelectedDocumentID: any;
};

export default function DocumentList({ documents, setSelectedDocumentID }: DocumentListProps) {
  return (
    <Box display='flex' flexDirection='column'>
      {documents.map((document) => (
        <Box key={document.id}>
          <Link
            onClick={(event) => {
              setSelectedDocumentID(document.id);
            }}
          >
            <Typography variant='body1'>{document.name}</Typography>
          </Link>
        </Box>
      ))}
    </Box>
  );
}
