"use client";
import React, { useState, useEffect } from 'react';
import { Rocket, Coins, Menu, X } from 'lucide-react';
import { formatUnits, parseEther, parseUnits, formatEther } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { launchpadabi } from '../abi';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";

const LAUNCHPAD_ADDRESS = '0xed628AEe5CF655631e01420647b8e99823b05C6b';
const LAUNCHPAD_ABI = launchpadabi;

const MemeTokenLaunchpad = () => {
  const [launches, setLaunches] = useState([]);
  const [promptOpen, setPromptOpen] = useState(false);
  const [btcAmount, setBtcAmount] = useState(null);
  const [currentIndex, setcurrentIndex] = useState(null);
  const [newTokenForm, setNewTokenForm] = useState({
    name: '',
    symbol: '',
    initialSupply: '',
    maxSupply: '',
    launchPrice: ''
  });

  const { address } = useAccount();
  const { data: launchesData, refetch: refetchLaunches } = useReadContract({
    address: LAUNCHPAD_ADDRESS,
    abi: LAUNCHPAD_ABI,
    functionName: 'getActiveLaunches',
  });
  const { data: txHash, writeContract } = useWriteContract();
  const readRemainingSupply = useReadContract({
    address: LAUNCHPAD_ADDRESS,
    abi: LAUNCHPAD_ABI,
    functionName: 'getRemainingSupply',
  });
  const readUserPurchaseAmount = useReadContract({
    address: LAUNCHPAD_ADDRESS,
    abi: LAUNCHPAD_ABI,
    functionName: 'getUserPurchaseAmount',
  });

  // Simplified and consolidated effect hook
  useEffect(() => {
    if (launchesData) {
      setLaunches(launchesData);
    }
  }, [launchesData]);

  const handlePromptOpen = (index) => {
    setcurrentIndex(index);
    setPromptOpen(true);
  };

  const handlePromptClose = () => {
    setPromptOpen(false);
  };

  const handleConfirmPurchase = () => {
    handlePromptClose();
    if (!btcAmount || !currentIndex) return;
    try {
      const tokenAmountIn18Decimals = parseUnits(btcAmount.toString(), 18);
      writeContract({
        address: LAUNCHPAD_ADDRESS,
        abi: LAUNCHPAD_ABI,
        functionName: 'purchaseTokens',
        args: [currentIndex, tokenAmountIn18Decimals],
        value: parseEther(btcAmount)
      });
    } catch (error) {
      console.error("Error purchasing token", error);
      alert(`Error purchasing token: ${error.message}`);
    }
  };

  const createTokenLaunch = async (e) => {
    e.preventDefault();
    if (!address) {
      alert("Please connect wallet first");
      return;
    }
    if (parseFloat(newTokenForm.maxSupply) < parseFloat(newTokenForm.initialSupply)) {
      alert("Max supply must be greater than or equal to initial supply");
      return;
    }
    try {
      writeContract({
        address: LAUNCHPAD_ADDRESS,
        abi: LAUNCHPAD_ABI,
        functionName: 'createTokenLaunch',
        args: [
          newTokenForm.name,
          newTokenForm.symbol,
          parseUnits(newTokenForm.initialSupply, 18),
          parseUnits(newTokenForm.maxSupply, 18),
          parseUnits(newTokenForm.launchPrice, 18)
        ],
        value: parseEther('0.00003')
      });
      setNewTokenForm({ name: '', symbol: '', initialSupply: '', maxSupply: '', launchPrice: '' });
    } catch (error) {
      console.error("Error creating token launch", error);
      alert(`Error creating token: ${error.message}`);
    }
  };

  useEffect(() => {
    if (txHash) {
      alert(`Transaction submitted: ${txHash}`);
      refetchLaunches();
    }
  }, [txHash, refetchLaunches]);

  const allItems = [
    { type: 'create' },
    ...launches.map((launch, index) => ({ type: 'launch', data: launch, index }))
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Bar for Wallet Connect and Logo */}
      <div className="flex justify-between items-center p-4 bg-white shadow-md z-10">
        <div className="flex items-center space-x-2">
          <Rocket className="text-orange-500" size={28} />
          <h1 className="text-xl font-bold text-orange-600">Meme Launch</h1>
        </div>
        <ConnectButton showBalance={false} />
      </div>

      {/* Main vertical scroll container */}
      <div className="flex-1 overflow-y-scroll snap-y snap-mandatory bg-gray-100">
        {/* Render Create Token Card as the first item */}
        <div className="flex-shrink-0 w-full h-full flex items-center justify-center p-4 snap-start">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6 border border-orange-100">
            <h2 className="text-2xl font-semibold mb-6 text-orange-600 flex items-center">
              <Rocket className="mr-2 text-orange-500" size={20} />
              Create Your Meme Token
            </h2>
            <form onSubmit={createTokenLaunch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
                <input
                  type="text"
                  placeholder="e.g. Moon Rocket"
                  value={newTokenForm.name}
                  onChange={(e) => setNewTokenForm({ ...newTokenForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. MOON"
                  value={newTokenForm.symbol}
                  onChange={(e) => setNewTokenForm({ ...newTokenForm, symbol: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Supply</label>
                <input
                  type="number"
                  placeholder="e.g. 1000000"
                  value={newTokenForm.initialSupply}
                  onChange={(e) => setNewTokenForm({ ...newTokenForm, initialSupply: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Supply</label>
                <input
                  type="number"
                  placeholder="e.g. 10000000"
                  value={newTokenForm.maxSupply}
                  onChange={(e) => setNewTokenForm({ ...newTokenForm, maxSupply: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Launch Price (BTC per token)</label>
                <input
                  type="number"
                  placeholder="e.g. 0.0001"
                  value={newTokenForm.launchPrice}
                  onChange={(e) => setNewTokenForm({ ...newTokenForm, launchPrice: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-medium"
                disabled={!address}
              >
                Launch Token
              </button>
              {!address && (
                <p className="text-sm text-orange-600 text-center">Connect your wallet to launch a token</p>
              )}
            </form>
          </div>
        </div>

        {/* Render each active launch as a full-screen card */}
        {launches.map((launch, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full h-full flex items-center justify-center p-4 snap-start relative"
          >
            <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6 border border-orange-100">
              <h3 className="font-bold text-3xl text-orange-700 mb-2">{launch.name}</h3>
              <p className="text-lg text-orange-500 font-semibold mb-4">({launch.symbol})</p>

              <div className="space-y-2 text-gray-700">
                <p>Initial Supply: <span className="font-medium">{formatUnits(launch.initialSupply, 18)}</span></p>
                <p>Max Supply: <span className="font-medium">{formatUnits(launch.maxSupply, 18)}</span></p>
                <p>Remaining: <span className="font-medium text-orange-600">{formatUnits(launch.remainingSupply, 18)}</span></p>
                <p>Price: <span className="font-medium">{formatUnits(launch.launchPrice, 18)} BTC per token</span></p>
                <p>BTC Raised: <span className="font-medium">{formatEther(launch.totalRaised)}</span></p>
                {/* Simplified ownership display - this would require a separate hook or more complex state */}
                {/* For this example, we'll keep it simple */}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handlePromptOpen(index)}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-medium text-lg"
                  disabled={!address || !launch.isLaunched}
                >
                  <Coins className="inline mr-2" size={20} /> Buy Tokens
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={promptOpen} onClose={handlePromptClose}>
        <DialogTitle>Enter BTC Amount</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="BTC Amount"
            type="number"
            fullWidth
            onChange={(e) => setBtcAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePromptClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmPurchase} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MemeTokenLaunchpad;