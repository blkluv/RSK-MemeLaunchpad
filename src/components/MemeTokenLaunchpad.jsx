"use client";
import React, { useState, useEffect } from "react";
import { Rocket, Coins, Menu, X } from "lucide-react";
import { formatUnits, parseEther, parseUnits, formatEther } from "ethers";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { launchpadabi } from "../abi";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

const MemeTokenLaunchpad = () => {
  const [launches, setLaunches] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userPurchases, setUserPurchases] = useState({});
  const [remainingSupplies, setRemainingSupplies] = useState({});
  const [newTokenForm, setNewTokenForm] = useState({
    name: "",
    symbol: "",
    initialSupply: "",
    maxSupply: "",
    launchPrice: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rbtcAmount, setRbtcAmount] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);

  const LAUNCHPAD_ADDRESS = "0xed628AEe5CF655631e01420647b8e99823b05C6b";
  const LAUNCHPAD_ABI = launchpadabi;

  // Wagmi hooks
  const { address } = useAccount();
  const { data: launchesData, refetch: refetchLaunches } = useReadContract({
    address: LAUNCHPAD_ADDRESS,
    abi: LAUNCHPAD_ABI,
    functionName: "getActiveLaunches",
  });

  const { data: txHash, writeContract } = useWriteContract();

  // Update launches
  useEffect(() => {
    if (launchesData) {
      setLaunches(launchesData);
    }
  }, [launchesData]);

  // Fetch remaining supply for each launch
  const fetchRemainingSupply = async (index) => {
    const { data } = await readRemainingSupply({ args: [index] });
    return data;
  };

  const fetchUserPurchaseAmount = async (index) => {
    if (!address) return 0;
    const { data } = await readUserPurchaseAmount({ args: [address, index] });
    return data;
  };

  // Wagmi read hooks
  const readRemainingSupply = useReadContract({
    address: LAUNCHPAD_ADDRESS,
    abi: LAUNCHPAD_ABI,
    functionName: "getRemainingSupply",
  });

  const readUserPurchaseAmount = useReadContract({
    address: LAUNCHPAD_ADDRESS,
    abi: LAUNCHPAD_ABI,
    functionName: "getUserPurchaseAmount",
  });

  // Update supplies + purchases
  const updateRemainingSupplies = async () => {
    if (!launches.length) return;
    const updates = {};
    for (let i = 0; i < launches.length; i++) {
      try {
        updates[i] = await fetchRemainingSupply(i);
      } catch (error) {
        console.error(`Error fetching supply for ${i}:`, error);
      }
    }
    setRemainingSupplies(updates);
  };

  const fetchUserPurchases = async () => {
    if (!address || !launches.length) return;
    const purchases = {};
    for (let i = 0; i < launches.length; i++) {
      try {
        purchases[i] = await fetchUserPurchaseAmount(i);
      } catch (error) {
        console.error(`Error fetching purchase for ${i}:`, error);
      }
    }
    setUserPurchases(purchases);
  };

  useEffect(() => {
    if (launches.length > 0) {
      updateRemainingSupplies();
      fetchUserPurchases();
    }
  }, [launches, address]);

  // Dialog actions
  const openDialog = (index) => {
    setCurrentIndex(index);
    setDialogOpen(true);
  };

  const handleConfirmPurchase = () => {
    try {
      const tokenAmount = parseUnits(rbtcAmount.toString(), 18);

      writeContract({
        address: LAUNCHPAD_ADDRESS,
        abi: LAUNCHPAD_ABI,
        functionName: "purchaseTokens",
        args: [currentIndex, tokenAmount],
        value: parseEther(rbtcAmount),
      });

      setDialogOpen(false);
    } catch (error) {
      console.error("Error purchasing token", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Transaction feedback
  useEffect(() => {
    if (txHash) {
      alert(`Transaction submitted: ${txHash}`);
      refetchLaunches();
    }
  }, [txHash]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="container px-4 py-3 mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Rocket className="mr-2 text-orange-500" size={28} />
            <h1 className="text-xl font-bold text-orange-600">
              RWA RSK Meme Launchpad
            </h1>
          </div>
          <ConnectButton />
        </div>
      </nav>

      <div className="container px-4 py-6 mx-auto">
        <div id="launches" className="p-6 border rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-orange-600 mb-6 flex items-center">
            <Coins className="mr-2 text-orange-500" /> Active RWA Launches
          </h2>
          {!launches || launches.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              No active RWA launches
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {launches.map((launch, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:shadow-md"
                >
                  <h3 className="font-bold text-orange-700">
                    {launch.name} <span>({launch.symbol})</span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    Remaining:{" "}
                    {remainingSupplies[index]
                      ? formatUnits(remainingSupplies[index], 18)
                      : "..."}
                  </p>
                  <p className="text-sm text-gray-600">
                    Price: {formatUnits(launch.launchPrice, 18)} RBTC per token
                  </p>
                  <button
                    onClick={() => openDialog(index)}
                    className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Buy RBTC Tokens
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shared Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Enter RBTC Amount</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="RBTC Amount"
            type="number"
            fullWidth
            onChange={(e) => setRbtcAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmPurchase} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MemeTokenLaunchpad;