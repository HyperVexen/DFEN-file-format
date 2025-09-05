import React, { useMemo } from 'react';
import { parseDfn } from '../services/dfnParser';

interface PreviewProps {
  dfnText: string;
}

export const Preview: React.FC<PreviewProps> = ({ dfnText }) => {
  const htmlOutput = useMemo(() => parseDfn(dfnText), [dfnText]);

  return (
    <div 
      className="prose prose-invert max-w-none h-full w-full bg-[#1e1e1e] rounded-md p-4 overflow-y-auto"
      dangerouslySetInnerHTML={{ __html: htmlOutput }}
    />
  );
};
