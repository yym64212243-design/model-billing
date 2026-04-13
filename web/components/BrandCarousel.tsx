'use client';

import { useEffect, useState } from 'react';
import ProviderLogo from './ProviderLogo';

const PROVIDERS = ['openai', 'anthropic', 'google', 'claude', 'gemini', 'meta', 'mistral', 'perplexity'];

export default function BrandCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % PROVIDERS.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="inline-block overflow-hidden rounded-full transition-all duration-500">
      <ProviderLogo provider={PROVIDERS[index]} size={22} />
    </span>
  );
}
