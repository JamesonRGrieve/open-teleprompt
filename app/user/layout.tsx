import React, { ReactNode } from 'react';

export default function UserLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className='flex flex-col justify-center items-center w-full h-full gap-4 overflow-y-scroll'>
      <h2 className='text-2xl font-semibold'>Authentication</h2>
      {children}
    </div>
  );
}
