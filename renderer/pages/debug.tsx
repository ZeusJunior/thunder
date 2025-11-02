import React, { useEffect, useState } from 'react';
import Head from 'next/head';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const info = window.electron.getDebugInfo();
    setDebugInfo(info);
  }, []);

  return (
    <>
      <Head>
        <title>Debug! - Thunder</title>
      </Head>
      <div>
        <pre>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </>
  );
}
