import React, { useEffect, useState } from 'react';
import Head from 'next/head';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const info = await window.ipc.invoke('debug-info');
      setDebugInfo(info);
    };
    fetchInfo();
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
