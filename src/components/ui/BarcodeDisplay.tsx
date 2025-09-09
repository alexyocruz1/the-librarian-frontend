'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Barcode component to avoid SSR issues
const Barcode = dynamic(() => import('react-barcode'), {
  ssr: false,
  loading: () => <div className="text-gray-500">Loading barcode...</div>
});

type BarcodeFormat = "CODE128" | "CODE39" | "CODE128A" | "CODE128B" | "CODE128C" | "EAN13" | "EAN8" | "EAN5" | "EAN2" | "UPC" | "UPCE" | "ITF14" | "ITF" | "MSI" | "MSI10" | "MSI11" | "MSI1010" | "MSI1110" | "pharmacode" | "codabar" | "GenericBarcode";

interface BarcodeDisplayProps {
  value: string;
  format?: BarcodeFormat;
  width?: number;
  height?: number;
  displayValue?: boolean;
  margin?: number;
}

export default function BarcodeDisplay({
  value,
  format = "CODE128",
  width = 2,
  height = 100,
  displayValue = true,
  margin = 10
}: BarcodeDisplayProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="text-gray-500">Loading barcode...</div>;
  }

  if (!value) {
    return <div className="text-gray-500">No barcode available</div>;
  }

  return (
    <Barcode
      value={value}
      format={format}
      width={width}
      height={height}
      displayValue={displayValue}
      margin={margin}
    />
  );
}
