'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import QRCode component to avoid SSR issues
const QRCode = dynamic(() => import('react-qr-code'), {
  ssr: false,
  loading: () => <div className="text-gray-500">Loading QR code...</div>
});

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  style?: React.CSSProperties;
}

export default function QRCodeDisplay({
  value,
  size = 200,
  style = { height: "auto", maxWidth: "100%", width: "100%" }
}: QRCodeDisplayProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="text-gray-500">Loading QR code...</div>;
  }

  if (!value) {
    return <div className="text-gray-500">No data available for QR code</div>;
  }

  return (
    <QRCode
      value={value}
      size={size}
      style={style}
    />
  );
}
