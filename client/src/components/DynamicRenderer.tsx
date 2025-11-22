import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface DynamicRendererHandle {
  scrollToBottom: () => void;
}

interface DynamicRendererProps {
  code: string;
}

const DynamicRenderer = forwardRef<DynamicRendererHandle, DynamicRendererProps>(({ code }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.scrollTo({
          top: iframeRef.current.contentDocument?.body.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }));

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <style>
              body { margin: 0; padding: 0; overflow: auto; padding-bottom: 160px; }
              #root { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel">
              const { useState, useEffect, useRef } = React;
              
              ${code}

              const root = ReactDOM.createRoot(document.getElementById('root'));
              root.render(<GeneratedComponent />);
            </script>
            <script>
              (function() {
                // Resize iframe to fit content
                const resizeObserver = new ResizeObserver(entries => {
                  const height = document.body.scrollHeight;
                  window.parent.postMessage({ type: 'resize', height }, '*');
                });
                resizeObserver.observe(document.body);
              })();
            </script>
          </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [code]);

  return (
    <iframe
      ref={iframeRef}
      title="Dynamic Component"
      className="w-full h-full border-0"
      style={{ minHeight: '100%' }}
    />
  );
});

export default DynamicRenderer;
