"use strict";

const { ethers } = require("ethers");
const path = require("path");
const abi = require(path.join(__dirname, "../abi/Hashmark.json"));

let _provider = null;
let _contract = null;
let _signer = null;

/**
 * Lazily initialise and return { provider, contract, signer }.
 * signer is null when PRIVATE_KEY is not set.
 */
function getContractSetup() {
  if (_provider) return { provider: _provider, contract: _contract, signer: _signer };

  const rpcUrl     = process.env.RPC_URL     || "http://127.0.0.1:8545";
  const privateKey = process.env.PRIVATE_KEY || "";
  // Extract only the 0x+40-hex address in case the env value has extra text appended (e.g. bad Vercel paste)
  const rawAddress      = process.env.CONTRACT_ADDRESS || "";
  const addrMatch       = rawAddress.match(/0x[0-9a-fA-F]{40}/);
  const contractAddress = addrMatch ? addrMatch[0] : "";

  if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
    console.warn("[contract] CONTRACT_ADDRESS not set — on-chain calls will fail.");
  }

  _provider = new ethers.JsonRpcProvider(rpcUrl);

  if (privateKey) {
    _signer   = new ethers.Wallet(privateKey, _provider);
    _contract = new ethers.Contract(contractAddress, abi, _signer);
    console.log(`[contract] Using signer wallet: ${_signer.address}`);
  } else {
    _contract = new ethers.Contract(contractAddress, abi, _provider);
    console.log("[contract] Read-only mode (no PRIVATE_KEY). Authenticate requires client wallet.");
  }

  return { provider: _provider, contract: _contract, signer: _signer };
}

module.exports = { getContractSetup };
