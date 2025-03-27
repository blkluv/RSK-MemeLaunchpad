# RSK Meme Token Launchpad

## Overview
RSK Meme Token Launchpad is a decentralized platform on **Rootstock (RSK) Testnet** that enables users to easily create and launch their own meme tokens. The platform simplifies token creation and fundraising by allowing users to set supply limits and sell tokens for BTC. It is part of the growing **Bitcoin DeFi** ecosystem, leveraging RSK’s smart contract capabilities.

## Features
- **Token Creation**: Launch custom tokens with a few clicks.
- **Initial Supply & Max Supply**: Define token supply parameters.
- **BTC-based Token Sales**: Sell tokens directly for BTC.
- **Decentralized & Secure**: Built on RSK Testnet for security and transparency.

## Setup Instructions

### Prerequisites
Ensure you have the following installed on your system:
- Node.js (>= 16.x)
- NPM or Yarn
- Metamask or an RSK-compatible wallet
- Rootstock Testnet RPC configured

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/soloking1412/RSK-MemeLaunchpad
   cd RSK-MemeLaunchpad
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   Create a `.env` file and configure the necessary keys:
   ```env
   REACT_APP_RPC_URL=https://public-node.testnet.rsk.co
   REACT_APP_PRIVATE_KEY=your_private_key
   ```

4. **Run the development server:**
   ```bash
   npm start
   ```
   The app should now be running at `http://localhost:3000`

### Deploying Smart Contracts
1. **Compile and deploy contracts:**
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network rskTestnet
   ```

2. **Update frontend with deployed contract address**
   Modify `config.js` to include the deployed contract address.

3. **Deploy frontend:**
   ```bash
   npm run build
   ```
   Host the `build/` folder on **IPFS, Vercel, or Netlify**.

## Contributing
Feel free to contribute by submitting pull requests or opening issues. Join our community to discuss improvements and integrations!

## License
MIT License

---

# The Future of Bitcoin DeFi: RSK Meme Token Launchpad (Testnet)

### Introduction
The **RSK Meme Token Launchpad** is designed to simplify the process of creating and launching tokens on the **Rootstock (RSK) Testnet**, the first smart contract platform secured by Bitcoin’s network. This project enables anyone to create their own meme coin, raise funds using BTC, and participate in the expanding Bitcoin DeFi ecosystem.

### How It Works
1. **Users connect their wallets** to the launchpad (RSK-compatible wallets like Metamask configured for Rootstock Testnet).
2. **They input token details**, including name, symbol, initial supply, max supply, and BTC launch price.
3. **The smart contract deploys the token**, making it publicly available for purchase with BTC.
4. **Investors can buy tokens** via the launchpad interface.

### Why It Matters for Bitcoin DeFi
Bitcoin lacks native smart contract functionality, but **Rootstock (RSK)** brings Ethereum-like capabilities while remaining secured by Bitcoin’s network. By enabling token launches on RSK Testnet, this platform:
- **Brings DeFi to Bitcoin users** without needing to leave the Bitcoin ecosystem.
- **Expands financial opportunities** for token creators and investors.
- **Enhances Bitcoin’s utility** beyond simple payments by integrating smart contracts.

### Future Enhancements
- **Liquidity Pools & DEX Integration** for token trading.
- **Staking & Yield Farming** for token holders.
- **NFT Launchpad** to extend the platform’s capabilities.

RSK Meme Token Launchpad is paving the way for a new era of Bitcoin DeFi, making token creation and fundraising more accessible than ever. Whether you're a meme coin enthusiast or a DeFi builder, this platform is your gateway to the Bitcoin-powered decentralized economy on Rootstock Testnet.

