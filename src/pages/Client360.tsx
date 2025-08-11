import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Client360Explorer } from '@/components/Client360/Client360Explorer';

export const Client360Page: React.FC = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const routeUserId = params.userId;
  const queryUserId = searchParams.get('userId') || undefined;
  const initialUserId = routeUserId || queryUserId;

  return (
    <main id="main-content" className="p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Client 360</h1>
      <Client360Explorer initialUserId={initialUserId} />
    </main>
  );
};

export default Client360Page;
