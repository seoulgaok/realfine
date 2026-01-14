"use client";

import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from './config';
import { type ReactNode } from 'react';

interface WagmiProviderProps {
  children: ReactNode;
}

export function WagmiProvider({ children }: WagmiProviderProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      {children}
    </WagmiConfig>
  );
}