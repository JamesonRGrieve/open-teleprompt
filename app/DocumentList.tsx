import React from 'react';
import { GoogleDoc } from './api/v1/google/GoogleConnector';
import { Box, Chip, Link, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { Star, StarBorder } from '@mui/icons-material';
export type DocumentListProps = {
  documents: GoogleDoc[];
  setSelectedDocument: any;
};

export default function DocumentList({ documents, setSelectedDocument }: DocumentListProps) {
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ cursor: 'pointer' }} onClick={() => setSelectedDocument(params.row)}>
          {params.value}
        </Box>
      ),
    },
    {
      field: 'starred',
      headerName: 'Starred',
      width: 100,
      renderCell: (params) => (params.value ? <Star color='primary' /> : <StarBorder />),
    },
    {
      field: 'modifiedTime',
      headerName: 'Modified',
      width: 200,
      valueGetter: (params: GridValueGetterParams) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'size',
      headerName: 'Size',
      width: 120,
      valueGetter: (params: GridValueGetterParams) => `${(params.value / 1024).toFixed(2)} KB`,
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid rows={documents} columns={columns} />
    </Box>
  );
}
