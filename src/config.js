import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import {
  rootstockTestnet
} from 'wagmi/chains';


export const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [rootstockTestnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
