'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const AGENT_ID = 'agent_2201kw4r61tmf8mvppbqxdeeppjs';
const WIDGET_SCRIPT_URL = 'https://unpkg.com/@elevenlabs/convai-widget-embed@0.14.8/dist/index.js';

export function ElevenLabsConvaiWidget({
  className,
  label = 'Voice Assistant',
  agentId = AGENT_ID,
}: {
  className?: string;
  label?: string;
  agentId?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const container = containerRef.current;
    let isMounted = true;

    const cleanupWidget = () => {
      if (widgetRef.current?.parentNode) {
        widgetRef.current.parentNode.removeChild(widgetRef.current);
      }
      widgetRef.current = null;
    };

    const renderWidget = () => {
      if (!isMounted || !container) return;

      cleanupWidget();
      container.innerHTML = '';

      if (!window.customElements?.get('elevenlabs-convai')) {
        setHasError(true);
        setIsReady(false);
        return;
      }

      const widget = document.createElement('elevenlabs-convai');
      widget.setAttribute('agent-id', agentId);
      widget.setAttribute('aria-label', label);
      widget.setAttribute('data-testid', 'elevenlabs-convai-widget');
      container.appendChild(widget);
      widgetRef.current = widget;
      setHasError(false);
      setIsReady(true);
    };

    const loadScript = () => {
      if (document.querySelector(`script[src="${WIDGET_SCRIPT_URL}"]`)) {
        const tryRender = () => {
          if (window.customElements?.get('elevenlabs-convai')) {
            renderWidget();
            return;
          }

          window.setTimeout(() => {
            if (isMounted) {
              tryRender();
            }
          }, 120);
        };

        tryRender();
        return;
      }

      const script = document.createElement('script');
      script.src = WIDGET_SCRIPT_URL;
      script.async = true;
      script.type = 'text/javascript';
      script.onload = () => {
        if (isMounted) {
          renderWidget();
        }
      };
      script.onerror = () => {
        if (isMounted) {
          setHasError(true);
          setIsReady(false);
        }
      };
      document.body.appendChild(script);
    };

    container.innerHTML = '';
    setHasError(false);
    setIsReady(false);
    loadScript();

    return () => {
      isMounted = false;
      cleanupWidget();
      container.innerHTML = '';
    };
  }, [agentId, label]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'inline-flex min-h-10 items-center justify-center rounded-full',
        className,
      )}
    >
      {!isReady && !hasError ? (
        <span className="text-sm font-medium text-slate-500">Loading voice assistant…</span>
      ) : null}
      {hasError ? (
        <span className="text-sm font-medium text-amber-600">Voice assistant unavailable</span>
      ) : null}
    </div>
  );
}
