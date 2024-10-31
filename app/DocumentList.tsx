import React from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';

export type GoogleDoc = {
  id: string;
  name: string;
  starred: boolean;
  modifiedTime: string;
  size: number;
};

export type DocumentListProps = {
  documents: GoogleDoc[];
  setSelectedDocument: (doc: GoogleDoc) => void;
};

export default function DocumentList({ documents, setSelectedDocument }: DocumentListProps) {
  return (
    <div className='w-full overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Name</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Starred</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Modified</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Size</th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {documents.map((doc) => (
            <tr key={doc.id} className='hover:bg-gray-50'>
              <td className='px-6 py-4 whitespace-nowrap cursor-pointer' onClick={() => setSelectedDocument(doc)}>
                <div className='text-sm text-gray-900'>{doc.name}</div>
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                {doc.starred ? (
                  <FaStar className='text-blue-500 text-lg' />
                ) : (
                  <FaRegStar className='text-gray-400 text-lg' />
                )}
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <div className='text-sm text-gray-500'>{new Date(doc.modifiedTime).toLocaleString()}</div>
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <div className='text-sm text-gray-500'>{(doc.size / 1024).toFixed(2)} KB</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
