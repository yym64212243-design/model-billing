'use client';

import { useEffect, useState } from 'react';
import ProviderLogo from './ProviderLogo';

const BRANDS = [
  { name: 'OpenAI',    provider: 'openai' },
  { name: 'Claude',    provider: 'claude' },
  { name: 'Google',    provider: 'google' },
  { name: 'Meta',      provider: 'meta' },
  { name: 'Mistral',   provider: 'mistral' },
  { name: 'Gemini',    provider: 'gemini' },
  { name: 'Anthropic', provider: 'anthropic' },
  { name: 'Perplexity', provider: 'perplexity' },
  { name: 'OpenAI',    provider: 'openai' },
  { name: 'Claude',    provider: 'claude' },
  { name: 'Google',    provider: 'google' },
  { name: 'Meta',      provider: 'meta' },
];

const SLOTS = [
  { top: '6%',  left: '6%'  },
  { top: '10%', left: '80%' },
  { top: '30%', left: '1%'  },
  { top: '26%', left: '93%' },
  { top: '54%', left: '4%'  },
  { top: '50%', left: '90%' },
  { top: '74%', left: '10%' },
  { top: '70%', left: '84%' },
  { top: '90%', left: '28%' },
  { top: '88%', left: '70%' },
  { top: '16%', left: '40%' },
  { top: '82%', left: '54%' },
];

export default function FloatingBrands() {
  const [tick, setTick] = useState(0);
  /** 不依赖 Tailwind：避免 CSS 未加载时整层铺满屏、Logo 失控放大 */
  const [desktopFloat, setDesktopFloat] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setDesktopFloat(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return (
    <div
      className="floating-brands-root pointer-events-none absolute inset-0 hidden lg:block"
      aria-hidden="true"
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        inset: 0,
        display: desktopFloat ? 'block' : 'none',
      }}
    >
      {SLOTS.map((pos, i) => {
        const idx = (i + tick) % BRANDS.length;
        const brand = BRANDS[idx];
        const phase = (i + tick) % 4;
        const bright = phase < 2;

        return (
          <div
            key={i}
            className="absolute transition-all duration-[1500ms] ease-in-out"
            style={{
              top: pos.top,
              left: pos.left,
              opacity: bright ? 0.75 : 0.15,
              transform: `scale(${bright ? 1 : 0.7})`,
            }}
          >
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200/80">
              <ProviderLogo provider={brand.provider} size={26} />
              <span className="whitespace-nowrap text-xs font-medium text-gray-600">
                {brand.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
