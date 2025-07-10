'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Link2Icon } from 'lucide-react';

/**
 * CopyButton component for copying text to clipboard
 */
const CopyButton = () => {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // This runs only in the browser
    setCurrentUrl(window.location.href);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Button className="w-full text-white py-4 px-6 rounded-md flex items-center justify-center text-base mt-2 cursor-pointer"

      onClick={handleCopy}
    >
      <Link2Icon className="mr-2 h-4 w-4" />
      {copied ? '¡Liga copiada!' : 'Copiar url'}
    </Button>
  );
};

export default CopyButton;
