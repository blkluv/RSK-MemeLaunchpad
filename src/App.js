import React from 'react';
import MemeTokenLaunchpad from './components/MemeTokenLaunchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from './config';
import {
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
const queryClient = new QueryClient()
function App() {
  return (
  <div className="App">
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <MemeTokenLaunchpad />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </div>
  );
}

export default App;
