import React from 'react';
import MemeTokenLaunchpad from './components/MemeTokenLaunchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from './config';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

const queryClient = new QueryClient();

function App() {
  return (
    <div className="App min-h-screen bg-black flex flex-col items-center justify-center text-center text-mint">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            {/* Futuristic Header */}
            <header className="App-header">
              <h1 className="text-4xl sm:text-5xl font-extrabold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-mint to-purple animate-pulse">
                🚀 MemeToken Launchpad 🔥
              </h1>
              <p className="mt-3 text-lg text-orange-400">
                Build, Deploy & 🚀 Send Your Meme to the Moon 🌙
              </p>
            </header>

            {/* Main App Component */}
            <main className="w-full max-w-3xl mt-8">
              <MemeTokenLaunchpad />
            </main>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  );
}

export default App;