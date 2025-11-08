import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { DebugInfo } from '../../main/types';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const info = await window.electron.getDebugInfo();
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
