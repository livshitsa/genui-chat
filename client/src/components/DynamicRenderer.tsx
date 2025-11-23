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
              body { margin: 0; padding: 0; overflow: auto; padding-bottom: 160px; background-color: transparent; }
              #root { display: flex; justify-content: center; align-items: center; min-height: 100vh; width: 100%; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel">
              const { useState, useEffect, useRef, Component } = React;

              class ErrorBoundary extends Component {
                constructor(props) {
                  super(props);
                  this.state = { hasError: false, error: null };
                }

                static getDerivedStateFromError(error) {
                  return { hasError: true, error };
                }

                componentDidCatch(error, errorInfo) {
                  console.error("ErrorBoundary caught an error", error, errorInfo);
                }

                render() {
                  if (this.state.hasError) {
                    return (
                      <div className="p-6 max-w-md mx-auto bg-red-50/10 border border-red-500/20 rounded-xl text-red-200 font-sans">
                        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                          </svg>
                          Component Rendering Error
                        </h2>
                        <p className="text-sm opacity-80 mb-4">The generated component could not be displayed due to an error.</p>
                        <pre className="bg-black/30 p-3 rounded-lg text-xs overflow-x-auto text-red-300 font-mono">
                          {this.state.error && this.state.error.toString()}
                        </pre>
                      </div>
                    );
                  }

                  return this.props.children;
                }
              }
              
              // Try-catch block for the component definition itself to catch syntax errors in the generated code
              try {
                ${code}

                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(
                  <ErrorBoundary>
                    <GeneratedComponent />
                  </ErrorBoundary>
                );
              } catch (err) {
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(
                  <div className="p-6 max-w-md mx-auto bg-red-50/10 border border-red-500/20 rounded-xl text-red-200 font-sans">
                    <h2 className="text-lg font-semibold mb-2">Syntax Error</h2>
                    <p className="text-sm opacity-80 mb-4">Failed to parse the generated component.</p>
                    <pre className="bg-black/30 p-3 rounded-lg text-xs overflow-x-auto text-red-300 font-mono">
                      {err.toString()}
                    </pre>
                  </div>
                );
              }
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
