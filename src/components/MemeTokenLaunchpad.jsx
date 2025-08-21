"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Rocket, Coins, Menu, X } from "lucide-react";
import { formatUnits, parseEther, parseUnits, formatEther } from "ethers";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useReadContracts,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { launchpadabi } from "../abi";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

const LAUNCHPAD_ADDRESS = "0xed628AEe5CF655631e01420647b8e99823b05C6b";
const LAUNCHPAD_ABI = launchpadabi;

export default function MemeTokenLaunchpad() {
  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Launchpad state
  const [launches, setLaunches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [rbtcAmount, setRbtcAmount] = useState(""); // string for TextField

  // Create form
  const [newTokenForm, setNewTokenForm] = useState({
    name: "",
    symbol: "",
    initialSupply: "",
    maxSupply: "",
    launchPrice: "",
  });

  const { address } = useAccount();

  // --- Reads ---------------------------------------------------------------

  // Active launches
  const {
    data: launchesData,
    refetch: refetchLaunches,
    status: launchesStatus,
  } = useReadContract({
    address: LAUNCHPAD_ADDRESS,
    abi: LAUNCHPAD_ABI,
    functionName: "getActiveLaunches",
  });

  useEffect(() => {
    if (launchesData) setLaunches(launchesData);
  }, [launchesData]);

  // Build batched read lists (remaining supply + user purchase)
  const remainingContracts = useMemo(
    () =>
      (launches || []).map((_, i) => ({
        address: LAUNCHPAD_ADDRESS,
        abi: LAUNCHPAD_ABI,
        functionName: "getRemainingSupply",
        args: [i],
      })),
    [launches]
  );

  const userPurchaseContracts = useMemo(
    () =>
      address
        ? (launches || []).map((_, i) => ({
            address: LAUNCHPAD_ADDRESS,
            abi: LAUNCHPAD_ABI,
            functionName: "getUserPurchaseAmount",
            args: [address, i],
          }))
        : [],
    [launches, address]
  );

  const { data: remainingResults } = useReadContracts({
    contracts: remainingContracts,
    allowFailure: false,
  });

  const { data: userPurchaseResults } = useReadContracts({
    contracts: userPurchaseContracts,
    allowFailure: false,
    query: { enabled: !!address && launches.length > 0 },
  });

  // Map results into quick lookups
  const remainingSupplies = useMemo(() => {
    const out = {};
    (remainingResults || []).forEach((val, i) => (out[i] = val));
    return out;
  }, [remainingResults]);

  const userPurchases = useMemo(() => {
    const out = {};
    (userPurchaseResults || []).forEach((val, i) => (out[i] = val));
    return out;
  }, [userPurchaseResults]);

  // --- Writes --------------------------------------------------------------
  const { data: txHash, writeContract, status: writeStatus } = useWriteContract();

  // Create a token launch
  const handleCreateLaunch = async (e) => {
    e.preventDefault();
    if (!address) {
      alert("Please connect your wallet first.");
      return;
    }
    const { name, symbol, initialSupply, maxSupply, launchPrice } = newTokenForm;

    // Basic validation
    if (!name || !symbol || !initialSupply || !maxSupply || !launchPrice) {
      alert("Please fill in all fields.");
      return;
    }
    if (Number(maxSupply) < Number(initialSupply)) {
      alert("Max supply must be greater than or equal to initial supply.");
      return;
    }
    try {
      await writeContract({
        address: LAUNCHPAD_ADDRESS,
        abi: LAUNCHPAD_ABI,
        functionName: "createTokenLaunch",
        args: [
          name.trim(),
          symbol.trim(),
          parseUnits(initialSupply.toString(), 18),
          parseUnits(maxSupply.toString(), 18),
          parseUnits(launchPrice.toString(), 18), // price per token in RBTC (1e-18)
        ],
        value: parseEther("0.00003"), // your creation fee in RBTC
      });

      // reset form on submit
      setNewTokenForm({
        name: "",
        symbol: "",
        initialSupply: "",
        maxSupply: "",
        launchPrice: "",
      });
    } catch (err) {
      console.error(err);
      alert(err?.message ?? "Failed to create launch.");
    }
  };

  // Buy dialog
  const openDialog = (index) => {
    setCurrentIndex(index);
    setRbtcAmount("");
    setDialogOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!address) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!rbtcAmount || Number(rbtcAmount) <= 0) {
      alert("Enter a positive RBTC amount.");
      return;
    }
    try {
      // Contract expects tokenAmount (18 decimals) + msg.value in RBTC
      const tokenAmount = parseUnits(rbtcAmount.toString(), 18);
      await writeContract({
        address: LAUNCHPAD_ADDRESS,
        abi: LAUNCHPAD_ABI,
        functionName: "purchaseTokens",
        args: [currentIndex, tokenAmount],
        value: parseEther(rbtcAmount.toString()),
      });
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert(err?.message ?? "Failed to purchase.");
    }
  };

  // Refetch on tx
  useEffect(() => {
    if (!txHash) return;
    // Simple feedback
    alert(`Transaction submitted: ${txHash}`);
    refetchLaunches();
  }, [txHash, refetchLaunches]);

  // --- UI ------------------------------------------------------------------
  return (
    <div className="min-h-screen w-full">
      {/* Top Bar */}
      <nav className="w-full bg-transparent">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket size={22} className="text-[#00ffb7]" />
            <h1 className="text-xl font-extrabold text-[#00ffb7] flex items-center gap-2">
              RWA RSK Meme Launchpad
            </h1>
          </div>

          <div className="hidden sm:block">
            <ConnectButton />
          </div>

          {/* Mobile wallet + menu toggle */}
          <div className="sm:hidden flex items-center gap-2">
            <ConnectButton />
            <button
              aria-label="Toggle menu"
              className="rounded-md p-2"
              onClick={() => setMobileMenuOpen((s) => !s)}
            >
              {mobileMenuOpen ? <X className="text-white" /> : <Menu className="text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile menu (optional links) */}
        {mobileMenuOpen && (
          <div className="max-w-5xl mx-auto px-4 pb-4 flex flex-col gap-2 sm:hidden">
            <a href="#create" className="text-[#ff7a00]">Create Token</a>
            <a href="#launches" className="text-[#ff7a00]">Active Launches</a>
          </div>
        )}
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 pb-24 space-y-10">
        {/* Create / Mint Section */}
        <section
          id="create"
          className="bg-[#0f0f0f] border border-[#222] rounded-2xl p-6 shadow-[0_0_20px_rgba(0,255,183,0.15)]"
        >
          <h2 className="text-2xl font-bold text-[#00ffb7] flex items-center gap-2">
            <Rocket size={18} className="text-[#ff7a00]" />
            Create Your Meme Token
          </h2>

          <form onSubmit={handleCreateLaunch} className="mt-5 grid grid-cols-1 gap-4">
            <input
              className="w-full rounded-lg bg-black border border-[#4c1d95] px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ffb7]"
              placeholder="Token Name (e.g. Moon Rocket)"
              value={newTokenForm.name}
              onChange={(e) => setNewTokenForm({ ...newTokenForm, name: e.target.value })}
              required
            />
            <input
              className="w-full rounded-lg bg-black border border-[#4c1d95] px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ffb7]"
              placeholder="Token Symbol (e.g. MOON)"
              value={newTokenForm.symbol}
              onChange={(e) => setNewTokenForm({ ...newTokenForm, symbol: e.target.value })}
              required
            />
            <input
              type="number"
              min="0"
              className="w-full rounded-lg bg-black border border-[#4c1d95] px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ffb7]"
              placeholder="Initial Supply (e.g. 1000000)"
              value={newTokenForm.initialSupply}
              onChange={(e) => setNewTokenForm({ ...newTokenForm, initialSupply: e.target.value })}
              required
            />
            <input
              type="number"
              min={newTokenForm.initialSupply || 0}
              className="w-full rounded-lg bg-black border border-[#4c1d95] px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ffb7]"
              placeholder="Max Supply (e.g. 10000000)"
              value={newTokenForm.maxSupply}
              onChange={(e) => setNewTokenForm({ ...newTokenForm, maxSupply: e.target.value })}
              required
            />
            <input
              type="number"
              step="any"
              min="0"
              className="w-full rounded-lg bg-black border border-[#4c1d95] px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ffb7]"
              placeholder="Launch Price (RBTC per token, e.g. 0.0001)"
              value={newTokenForm.launchPrice}
              onChange={(e) => setNewTokenForm({ ...newTokenForm, launchPrice: e.target.value })}
              required
            />

            <button
              type="submit"
              disabled={!address || writeStatus === "pending"}
              className="mt-2 w-full rounded-lg bg-[#ff7a00] py-3 font-extrabold text-black hover:bg-[#ff8f2e] disabled:opacity-60"
            >
              {writeStatus === "pending" ? "Launching..." : "Launch Token 🚀"}
            </button>
            {!address && (
              <p className="text-sm text-[#ff7a00] text-center">
                Connect your wallet to launch a token.
              </p>
            )}
          </form>
        </section>

        {/* Active Launches */}
        <section
          id="launches"
          className="bg-[#0f0f0f] border border-[#222] rounded-2xl p-6 shadow-[0_0_20px_rgba(155,93,229,0.12)]"
        >
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Coins size={18} className="text-[#9b5de5]" />
            Active RWA Launches
          </h2>

          {launchesStatus === "pending" ? (
            <p className="py-10 text-center text-gray-400">Loading launches…</p>
          ) : !launches || launches.length === 0 ? (
            <p className="py-10 text-center text-gray-400">No active RWA launches</p>
          ) : (
            <div className="mt-4 space-y-4 max-h-[28rem] overflow-y-auto pr-1">
              {launches.map((launch, index) => {
                const remaining = remainingSupplies[index];
                const userAmt = userPurchases[index];

                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-[#222] bg-black/60 hover:border-[#333] transition"
                  >
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-lg text-white">
                        {launch.name} <span className="text-gray-400">({launch.symbol})</span>
                      </h3>

                      <p className="text-sm text-gray-300">
                        Initial Supply: {formatUnits(launch.initialSupply, 18)}
                      </p>
                      <p className="text-sm text-gray-300">
                        Max Supply: {formatUnits(launch.maxSupply, 18)}
                      </p>
                      <p className="text-sm text-gray-300">
                        Remaining:{" "}
                        {remaining !== undefined ? formatUnits(remaining, 18) : "…"}
                      </p>
                      <p className="text-sm text-gray-300">
                        Price: {formatUnits(launch.launchPrice, 18)} RBTC per token
                      </p>
                      <p className="text-sm text-gray-300">
                        RBTC Raised: {formatEther(launch.totalRaised)}
                      </p>
                      {!!userAmt && userAmt > 0 && (
                        <p className="text-sm text-[#00ffb7]">
                          You own: {formatUnits(userAmt, 18)} tokens
                        </p>
                      )}
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={() => openDialog(index)}
                        disabled={!address || !launch.isLaunched}
                        className="px-4 py-2 rounded-lg bg-[#00ffb7] text-black font-bold hover:bg-[#67ffd4] disabled:opacity-60"
                      >
                        Buy RBTC Tokens
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Purchase dialog (shared) */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Enter RBTC Amount</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="RBTC Amount"
            type="number"
            fullWidth
            value={rbtcAmount}
            onChange={(e) => setRbtcAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmPurchase} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-gray-500">
        <div className="max-w-5xl mx-auto px-4">
          © {new Date().getFullYear()} RWA Meme Launchpad · Rootstock (RBTC)
        </div>
      </footer>
    </div>
  );
}