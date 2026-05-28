# Hashmark Backend

Node.js / Express API that bridges the React frontend and the `Hashmark.sol` smart contract.

## Quick start

```bash
cd back
cp .env.example .env   # fill in RPC_URL, CONTRACT_ADDRESS, optionally PRIVATE_KEY
npm install
npm run dev            # or: node server.js
```

Server starts on **http://localhost:4000**.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/health` | Liveness check |
| GET  | `/api/info` | Contract address + server wallet info |
| POST | `/api/hash/file` | Upload a file (field `file`), returns SHA-256 hash |
| POST | `/api/hash/raw` | Hash a raw string value |
| POST | `/api/authenticate` | Store a hash on-chain (requires `PRIVATE_KEY` in `.env`) |
| GET  | `/api/verify/:hash` | Check if a hash is authenticated on-chain |
| POST | `/api/data360/passport` | Build a verifiable Data360 passport from World Bank data |
| GET  | `/api/data360/passport/:hash` | Fetch a stored Data360 passport by hash |
| GET  | `/api/data360/verify/:hash` | Verify a Data360 passport hash + on-chain anchoring |

### POST /api/hash/file
```
Content-Type: multipart/form-data
Field: file (video/audio/binary)

→ { hash, filename, size, mimetype }
```

### POST /api/hash/raw
```json
{ "value": "some string" }
→ { "hash": "sha256hex..." }
```

### POST /api/authenticate
```json
{ "hash": "sha256hex..." }
→ { txHash, blockNumber, creator, timestamp, hash }
```
Returns **503** if `PRIVATE_KEY` is not set (client must sign via MetaMask).

### GET /api/verify/:hash
```
→ { authenticated: true,  creator, timestamp, hash }
→ { authenticated: false, hash }
```

### POST /api/data360/passport
```json
{
  "indicator": "WB_HNP_SP_POP_TOTL",
  "country": "WLD",
  "date": "2015:2023",
  "limit": 12
}
→ { passport, hash, verifyUrl, qrDataUrl }
```
The `verifyUrl` includes the query parameters (including `issuedAt`) so verification can rebuild the passport even on stateless deployments.

### GET /api/data360/verify/:hash
```
→ { hash, valid, passport, chain, verifyUrl, qrDataUrl }
```

---

## Environment variables

| Variable | Default | Required |
|----------|---------|----------|
| `PORT` | `4000` | no |
| `RPC_URL` | `http://127.0.0.1:8545` | yes (Hardhat / Infura / Alchemy) |
| `CONTRACT_ADDRESS` | — | yes |
| `PRIVATE_KEY` | — | no (disables server-side signing) |
| `CORS_ORIGIN` | `http://localhost:5173` | no |
| `DATA360_BASE_URL` | `https://data360api.worldbank.org` | no |
| `DATA360_API_KEY` | — | no |
| `DATA360_API_KEY_PARAM` | `api_key` | no |

---

## Deploying the contract

1. Install Hardhat in the project root and compile `src/Hashmark.sol`.
2. Deploy to your target network and note the contract address.
3. Set `CONTRACT_ADDRESS` and `RPC_URL` in `back/.env`.
4. Optionally set `PRIVATE_KEY` for server-side authentication.

The frontend at `/verify` lets users upload a video, compute its hash, and authenticate / verify against the contract.
