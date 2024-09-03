import React from 'react';
import { GoogleDoc } from './api/v1/google/GoogleConnector';
import { Box, Link, Typography } from '@mui/material';

export type DocumentListProps = {
  documents: GoogleDoc[];
  setSelectedDocument: any;
};

export default function DocumentList({ documents, setSelectedDocument }: DocumentListProps) {
  return (
    <Box display='flex' flexDirection='column'>
      {documents.map((document) => (
        <Box key={document.id}>
          <Link
            onClick={(event) => {
              setSelectedDocument(document);
            }}
          >
            <Typography variant='body1'>{document.name}</Typography>
          </Link>
        </Box>
      ))}
    </Box>
  );
}
