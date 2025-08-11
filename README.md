# AI Agent Dapp — Swap (PiperX) + Register IP (Story)

## Quickstart
1. Copy `.env.local.example` to `.env.local` and fill values (Pinata JWT, RPC, WalletConnect id, PiperX aggregator address).
2. `npm i`
3. `npm run dev`
4. Open http://localhost:3000, connect to **Story Aeneid (1315)**, test Swap and Register IP.

## Notes
- Paste **PiperX Aggregator ABI** into `src/lib/abi/aggregator_abi.ts` from the latest official docs.
- Use **WIP** address when swapping native IP.
- API routes upload to IPFS via Pinata on the server (no JWT in browser).
- `Register IP` uses `mintAndRegisterIp` with a public SPG collection on Aeneid for demo.