'use client';

import React, { useEffect, useRef } from 'react';

export default function AdsterraBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = containerRef.current;
    if (!wrapper) return;

    wrapper.innerHTML = '';

    // Create a same-origin iframe so Adsterra receives the real site domain/referrer
    // and can execute document.write() synchronously for the 728x90 banner.
    const iframe = document.createElement('iframe');
    iframe.width = '728';
    iframe.height = '90';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.width = '728px';
    iframe.style.height = '90px';
    wrapper.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 728px;
      height: 90px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }
  </style>
</head>
<body>
  <script>
    atOptions = {
      'key' : 'b2a93467dc77728718626bcfd20b7620',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  <\/script>
  <script src="https://bicea.org/22/b2a93467dc77728718626bcfd20b7620"><\/script>
</body>
</html>`);
      doc.close();
    }
  }, []);

  return (
    <div
      className="w-full h-[52px] sm:h-[60px] shrink-0 bg-[#FAFBF9] border-t border-[#E6E8E5] flex items-center justify-center overflow-hidden select-none"
      aria-label="Banner Advertisement"
    >
      <div
        ref={containerRef}
        className="w-[728px] h-[90px] flex items-center justify-center origin-center scale-[0.50] sm:scale-[0.64] md:scale-[0.75]"
      />
    </div>
  );
}
