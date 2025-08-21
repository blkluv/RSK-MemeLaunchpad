import React, { useState, useEffect } from 'react';
import { Rocket, Coins, Menu, X } from 'lucide-react';
import { formatUnits, parseEther, parseUnits, formatEther } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { launchpadabi } from '../abi';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
const MemeTokenLaunchpad = () => {
  const [launches, setLaunches] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userPurchases, setUserPurchases] = useState({});
  const [newTokenForm, setNewTokenForm] = useState({
    name: '',
    symbol: '',
    initialSupply: '',
    maxSupply: '',
    launchPrice: ''
  });
  const [promptOpen, setPromptOpen] = useState(false);
  const [btcAmount, setBtcAmount] = useState(null);
  const [currentIndex, setcurrentIndex] = useState(null);

  const handlePromptOpen = () => {
    setPromptOpen(true);
  };
  
  const handlePromptClose = () => {
    setPromptOpen(false);
  };
  
  const handleConfirm = (amount) => {
    setBtcAmount(amount);
    try {
      const tokenAmountIn18Decimals = parseUnits(amount.toString(), 18);
      
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
  
  const LAUNCHPAD_ADDRESS = '0xed628AEe5CF655631e01420647b8e99823b05C6b'; 
  const LAUNCHPAD_ABI = launchpadabi;

  // Wagmi hooks
  const { address } = useAccount();
  const { data: launchesData, refetch: refetchLaunches } = useReadContract({
    address: LAUNCHPAD_ADDRESS,
    abi: LAUNCHPAD_ABI,
    functionName: 'getActiveLaunches',
  });

  const { data: txHash, writeContract } = useWriteContract();

  // Set launches when data changes
  useEffect(() => {
    if (launchesData) {
      setLaunches(launchesData);
    }
  }, [launchesData]);

  // Fetch remaining supply for a specific launch
  const fetchRemainingSupply = async (index) => {
    const { data } = await readRemainingSupply({ args: [index] });
    return data;
  };

  // Fetch user purchase amount for a specific launch
  const fetchUserPurchaseAmount = async (index) => {
    if (!address) return 0;
    
    const { data } = await readUserPurchaseAmount({ args: [address, index] });
    return data;
  };

  // Wagmi hooks for fetching remaining supply and user purchase amount
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

  // Update all remaining supplies
  const updateRemainingSupplies = async () => {
    if (!launches.length) return;
    
    for (let i = 0; i < launches.length; i++) {
      try {
        const remaining = await fetchRemainingSupply(i);
        const element = document.getElementById(`remaining-${i}`);
        if (element) {
          element.textContent = formatUnits(remaining, 18);
        }
      } catch (error) {
        console.error(`Error fetching remaining supply for index ${i}:`, error);
      }
    }
  };

  // Fetch all user purchases
  const fetchUserPurchases = async () => {
    if (!address || !launches.length) return;
    
    const purchases = {};
    
    for (let i = 0; i < launches.length; i++) {
      try {
        const amount = await fetchUserPurchaseAmount(i);
        purchases[i] = amount;
      } catch (error) {
        console.error(`Error fetching user purchases for index ${i}:`, error);
      }
    }
    
    setUserPurchases(purchases);
  };

  // Create New Token Launch
  const createTokenLaunch = async (e) => {
    e.preventDefault();
    if (!address) {
      alert("Please connect wallet first");
      return;
    }

    // Validate max supply is greater than or equal to initial supply
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
      
      // Reset form
      setNewTokenForm({
        name: '',
        symbol: '',
        initialSupply: '',
        maxSupply: '',
        launchPrice: ''
      });
    } catch (error) {
      console.error("Error creating token launch", error);
      alert(`Error creating token: ${error.message}`);
    }
  };


  // Purchase Token
  const purchaseToken = async (index) => {
    if (!address) {
      alert("Please connect wallet first");
      return;
    }

    handlePromptOpen();
    setcurrentIndex(index);
    // try {
    //   handlePromptOpen();
      
    //   const tokenAmountIn18Decimals = parseUnits(btcAmount.toString(), 18);
      
    //   writeContract({
    //     address: LAUNCHPAD_ADDRESS,
    //     abi: LAUNCHPAD_ABI,
    //     functionName: 'purchaseTokens',
    //     args: [launchIndex, tokenAmountIn18Decimals],
    //     value: parseEther(btcAmount)
    //   });
    // } catch (error) {
    //   console.error("Error purchasing token", error);
    //   alert(`Error purchasing token: ${error.message}`);
    // }
  };

  // Effect for transaction success
  useEffect(() => {
    if (txHash) {
      alert(`Transaction submitted: ${txHash}`);
      refetchLaunches();
    }
  }, [txHash]);

  // Effect to update data when launches change
  useEffect(() => {
    if (launches.length > 0) {
      updateRemainingSupplies();
      fetchUserPurchases();
    }
  }, [launches, address]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="container px-4 py-3 mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Rocket className="mr-2 text-orange-500" size={28} />
              <h1 className="hidden text-xl font-bold text-orange-600 md:text-2xl md:block">RWA RSK Meme Launchpad</h1>
              <h1 className="text-xl font-bold text-orange-600 md:hidden">RWA Meme Launch</h1>
            </div>
            
            <div className="items-center hidden space-x-4 md:flex">
              <ConnectButton />
            </div>
            
            <div className="flex items-center md:hidden">
              <ConnectButton />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="ml-2 text-orange-600"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="px-4 py-2 bg-white shadow-inner md:hidden">
            <a href="#create" className="block py-2 text-orange-600 hover:text-orange-700" 
               onClick={() => setMobileMenuOpen(false)}>Create RWA Token</a>
            <a href="#launches" className="block py-2 text-orange-600 hover:text-orange-700"
               onClick={() => setMobileMenuOpen(false)}>Active RWA Launches</a>
          </div>
        )}
      </nav>
      
      <div className="container px-4 py-6 mx-auto">
        {/* Main Content */}
        <div className="flex flex-col space-y-6 md:flex-row md:space-x-6 md:space-y-0">
          {/* Create Token Section */}
          <div id="create" className="w-full p-6 bg-white border border-orange-100 shadow-lg md:w-1/2 rounded-xl">
            <h2 className="flex items-center mb-6 text-2xl font-semibold text-orange-600">
              <Rocket className="mr-2 text-orange-500" size={20} />
              Create Your RWA Meme Token
            </h2>
            <form onSubmit={createTokenLaunch} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">RWA Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Moon Rocket" 
                  value={newTokenForm.name}
                  onChange={(e) => setNewTokenForm({...newTokenForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required 
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Token Symbol</label>
                <input 
                  type="text" 
                  placeholder="e.g. MOON" 
                  value={newTokenForm.symbol}
                  onChange={(e) => setNewTokenForm({...newTokenForm, symbol: e.target.value})}
                  className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required 
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Initial RWA Supply</label>
                <input 
                  type="number" 
                  placeholder="e.g. 1000000" 
                  value={newTokenForm.initialSupply}
                  onChange={(e) => setNewTokenForm({...newTokenForm, initialSupply: e.target.value})}
                  className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required 
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Max RWA Supply</label>
                <input 
                  type="number" 
                  placeholder="e.g. 10000000" 
                  value={newTokenForm.maxSupply}
                  onChange={(e) => setNewTokenForm({...newTokenForm, maxSupply: e.target.value})}
                  className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required 
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Launch RWA Price (BTC per token)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 0.0001" 
                  value={newTokenForm.launchPrice}
                  onChange={(e) => setNewTokenForm({...newTokenForm, launchPrice: e.target.value})}
                  className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full py-3 font-medium text-white transition bg-orange-500 rounded-lg hover:bg-orange-600"
                disabled={!address}
              >
                Launch Token
              </button>
              {!address && (
                <p className="text-sm text-center text-orange-600">Connect your wallet to launch a RWA token</p>
              )}
            </form>
          </div>

          {/* Active Launches Section */}
          <div id="launches" className="w-full p-6 bg-white border border-orange-100 shadow-lg md:w-1/2 rounded-xl">
            <h2 className="flex items-center mb-6 text-2xl font-semibold text-orange-600">
              <Coins className="mr-2 text-orange-500" size={20} />
              Active RWA Token Launches
            </h2>
            {!launches || launches.length === 0 ? (
              <p className="py-10 text-center text-gray-500">No active RWA launches</p>
            ) : (
              <div className="pr-1 space-y-4 overflow-y-auto max-h-96">
                {launches.map((launch, index) => (
                  <div 
                    key={index} 
                    className="p-4 transition border border-orange-100 rounded-lg hover:shadow-md"
                  >
                    <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
                      <div className="mb-3 md:mb-0">
                        <h3 className="font-bold text-orange-700">{launch.name} <span className="text-orange-500">({launch.symbol})</span></h3>
                        <p className="text-sm text-gray-600">
                          Initial Supply: {formatUnits(launch.initialSupply, 18)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Max Supply: {formatUnits(launch.maxSupply, 18)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Remaining: <span id={`remaining-${index}`}>
                            {formatUnits(launch.remainingSupply, 18)}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Price: {formatUnits(launch.launchPrice, 18)} BTC per token
                        </p>
                        <p className="text-sm text-gray-600">
                          BTC Raised: {formatEther(launch.totalRaised)}
                        </p>
                        {userPurchases[index] && userPurchases[index] > 0 && (
                          <p className="text-sm text-green-600">
                            You own: {formatUnits(userPurchases[index], 18)} tokens
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => purchaseToken(index)}
                        className="w-full px-4 py-2 text-white transition bg-orange-500 rounded-lg hover:bg-orange-600 md:w-auto"
                        disabled={!address || !launch.isLaunched}
                      >
                        <Coins className="inline mr-2" size={16} /> Buy RWA Tokens
                      </button>
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
                            <Button onClick={() => { handleConfirm(btcAmount); handlePromptClose(); }} color="primary">
                              Confirm
                            </Button>
                          </DialogActions>
                        </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-6 mt-10 bg-white border-t border-orange-100">
        <div className="container px-4 mx-auto text-sm text-center text-gray-500">
          <p>&copy; 2025 RWA Meme Launchpad. All rights reserved.</p>
          {txHash && <p className="mt-2">Latest Transaction: {txHash}</p>}
        </div>
      </footer>
    </div>
  );
};

export default MemeTokenLaunchpad;