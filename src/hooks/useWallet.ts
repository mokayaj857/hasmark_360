import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

export interface WalletState {
  address:     string | null;
  provider:    ethers.BrowserProvider | null;
  signer:      ethers.JsonRpcSigner | null;
  chainId:     number | null;
  chainName:   string;
  balance:     string | null;
  connecting:  boolean;
  error:       string | null;
  installed:   boolean;
}

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      on(event: string, fn: (...args: unknown[]) => void): void;
      removeListener(event: string, fn: (...args: unknown[]) => void): void;
    };
  }
}

const CHAIN_NAMES: Record<number, string> = {
  1:        "Ethereum Mainnet",
  5:        "Goerli Testnet",
  11155111: "Sepolia Testnet",
  137:      "Polygon Mainnet",
  80001:    "Mumbai Testnet",
  8453:     "Polkadot Mainnet",
  84532:    "Polkadot Testnet",
  1337:     "Hardhat Local",
  31337:    "Hardhat Local",
};

export function getChainName(id: number): string {
  return CHAIN_NAMES[id] ?? `Chain ${id}`;
}

const INITIAL: WalletState = {
  address: null, provider: null, signer: null,
  chainId: null, chainName: "", balance: null,
  connecting: false, error: null,
  installed: typeof window !== "undefined" && !!window.ethereum,
};

export function useWallet() {
  const [state, setState] = useState<WalletState>(INITIAL);

  /* ── connect ── */
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(s => ({ ...s, error: "MetaMask not installed. Get it at metamask.io" }));
      return;
    }
    setState(s => ({ ...s, connecting: true, error: null }));
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer  = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const rawBal  = await provider.getBalance(address);
      const balance = parseFloat(ethers.formatEther(rawBal)).toFixed(4);
      const chainId = Number(network.chainId);
      setState({
        address, provider, signer, chainId,
        chainName: getChainName(chainId),
        balance, connecting: false, error: null, installed: true,
      });
    } catch (err: unknown) {
      const code = (err as { code?: number }).code;
      const msg  = code === 4001
        ? "You rejected the connection request."
        : (err as Error).message ?? "Wallet connection failed.";
      setState(s => ({ ...s, connecting: false, error: msg }));
    }
  }, []);

  /* ── disconnect ── */
  const disconnect = useCallback(() => setState(INITIAL), []);

  /* ── auto-reconnect if already permitted ── */
  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum
      .request?.({ method: "eth_accounts" })
      .then(async (accs: unknown) => {
        const list = accs as string[];
        if (!list?.length) return;
        const provider = new ethers.BrowserProvider(window.ethereum!);
        const signer   = await provider.getSigner();
        const network  = await provider.getNetwork();
        const rawBal   = await provider.getBalance(list[0]);
        const balance  = parseFloat(ethers.formatEther(rawBal)).toFixed(4);
        const chainId  = Number(network.chainId);
        setState({
          address: list[0], provider, signer, chainId,
          chainName: getChainName(chainId),
          balance, connecting: false, error: null, installed: true,
        });
      })
      .catch(() => {/* silent */});
  }, []);

  /* ── listen for account / chain changes ── */
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accs: unknown) => {
      const list = accs as string[];
      if (!list?.length) disconnect();
      else setState(s => ({ ...s, address: list[0] }));
    };
    const onChain = () => window.location.reload();
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum?.removeListener("accountsChanged", onAccounts);
      window.ethereum?.removeListener("chainChanged", onChain);
    };
  }, [disconnect]);

  return { ...state, connect, disconnect };
}
