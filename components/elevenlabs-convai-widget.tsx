'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const AGENT_ID = 'agent_2201kw4r61tmf8mvppbqxdeeppjs';

export function ElevenLabsConvaiWidget({
  className,
  label = 'Voice Assistant',
}: {
  className?: string;
  label?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    if (!document.querySelector('script[src*="convai-widget-embed"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      document.body.appendChild(script);
    }

    const container = containerRef.current;
    container.innerHTML = '';

    const widget = document.createElement('elevenlabs-convai');
    widget.setAttribute('agent-id', AGENT_ID);
    widget.setAttribute('aria-label', label);
    container.appendChild(widget);
  }, [label]);

  return <div ref={containerRef} className={cn('inline-flex', className)} />;
}
