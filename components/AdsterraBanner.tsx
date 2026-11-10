'use client';

import React, { useEffect, useRef } from 'react';

export default function AdsterraBanner() {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = bannerRef.current;
    if (!container || container.childNodes.length > 0) return;

    const confScript = document.createElement('script');
    confScript.type = 'text/javascript';
    confScript.innerHTML = `
      atOptions = {
        'key' : 'b2a93467dc77728718626bcfd20b7620',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://bicea.org/22/b2a93467dc77728718626bcfd20b7620';
    invokeScript.async = true;

    container.appendChild(confScript);
    container.appendChild(invokeScript);
  }, []);

  const srcDocHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
  }
  .ad-scale-wrap {
    width: 728px;
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform-origin: center center;
    transform: scale(0.52);
  }
  @media (min-width: 640px) {
    .ad-scale-wrap {
      transform: scale(0.62);
    }
  }
</style>
</head>
<body>
  <div class="ad-scale-wrap">
    <script>
      atOptions = {
        'key' : 'b2a93467dc77728718626bcfd20b7620',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    </script>
    <script src="https://bicea.org/22/b2a93467dc77728718626bcfd20b7620"></script>
  </div>
</body>
</html>`;

  return (
    <div
      className="w-full h-[50px] sm:h-[58px] shrink-0 bg-[#F4F8F5] border-t border-[#DCE6DF] flex items-center justify-center overflow-hidden select-none"
      aria-label="Sponsored Banner"
    >
      <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
        <iframe
          title="Adsterra Banner"
          srcDoc={srcDocHtml}
          className="w-full h-full border-0 overflow-hidden pointer-events-auto"
          scrolling="no"
        />
        <div ref={bannerRef} className="sr-only" aria-hidden="true" />
      </div>
    </div>
  );
}
