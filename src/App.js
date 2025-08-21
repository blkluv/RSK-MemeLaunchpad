import React from 'react';
import MemeTokenLaunchpad from './components/MemeTokenLaunchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from './config';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {/* Main App Component with a full-screen, vertical layout */}
          <div className="App w-screen h-screen">
            <MemeTokenLaunchpad />
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;