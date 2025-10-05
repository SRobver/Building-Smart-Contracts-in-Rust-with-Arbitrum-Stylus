# DemoNFT dApp Frontend

## Introduction

This frontend provides a complete Web3 user interface for interacting with the DemoNFT ERC-721 smart contract built with Rust and Arbitrum Stylus. The application demonstrates modern decentralized application (dApp) development practices, offering a responsive and user-friendly experience for minting and managing non-fungible tokens on the Arbitrum blockchain.

**Key Features:**

- **Wallet Integration:** Seamless MetaMask connection with automatic network switching to Arbitrum Sepolia
- **Contract Initialization:** UI to initialize the contract with custom parameters (name, symbol, base URI, max supply)
- **IPFS Integration:** Upload NFT images and metadata directly to IPFS using Pinata API
- **Contract Interaction:** Complete read and write functions for the DemoNFT contract
- **Token Management:** Mint new NFTs from IPFS metadata URIs, view balances, and transfer existing tokens
- **Real-time Updates:** Dynamic UI updates based on contract state and user actions
- **Enhanced Error Handling:** Comprehensive error handling with context-specific messages
- **Responsive Design:** Mobile-first approach with dark theme for crypto applications

## Setup

1. Make sure you have MetaMask or another Ethereum wallet installed
2. Serve the frontend files using a local HTTP server (important for wallet integration)

```bash
cd nft-dapp/frontend
python -m http.server 8000
# or use any HTTP server
```

3. Open http://localhost:8000 in your browser

4. Update the `CONTRACT_ADDRESS` in `app.js` with your deployed contract address

5. Make sure your wallet is connected to the Arbitrum Sepolia testnet

## Contract Deployment

Before using the frontend, deploy the NFT contract using the instructions in the main README:

1. Use `cargo stylus deploy` to deploy to Arbitrum Sepolia
2. Initialize the contract with `init` function
3. Update `CONTRACT_ADDRESS` in `app.js` with the deployed address

## Usage

1. **Deploy Contract First:** Deploy the NFT contract using the main README instructions, then visit the frontend
2. **Contract Status Check:** The app automatically checks if the contract is initialized
3. **Initialize Contract:** If needed, use the "Initialize Contract" section to set up the contract parameters
4. **Connect Wallet:** Click "Connect Wallet" to connect MetaMask (automatically switches to Arbitrum Sepolia)
5. **View Contract Info:** See contract details and your NFT balance in the "Contract Info" section
6. **Create NFT with IPFS:**
   - Go to "Upload to IPFS" section
   - Fill in NFT name and description
   - Select an image file (JPG, PNG, GIF, WebP, max 5MB)
   - Click "Upload to IPFS" to create metadata
   - Copy the URI or click "Mint NFT" directly
7. **Mint NFTs:** Use the "Mint New NFT" section with IPFS metadata URIs
8. **Manage NFTs:** View your owned NFTs and transfer them to other addresses

## Final Setup Steps

### 1. Deploy the Contract

Before the frontend will work, you must deploy the NFT contract:

```bash
cd nft-dapp

# Update .env with your Sepolia ETH private key
# Get Sepolia ETH here:
# - https://sepoliafaucet.com/
# - https://www.infura.io/faucet/sepolia
# - https://cloud.google.com/application/web3/faucet/ethereum/sepolia

# Deploy the contract
cargo stylus deploy
```

This will output a deployed contract address.

### 2. Update Frontend Configuration

In `frontend/config.js`, update the contract address:

```javascript
CONTRACT: {
  ADDRESS: "0xYOUR_DEPLOYED_CONTRACT_ADDRESS_HERE",
  // ...
}
```

### 3. Initialize Contract (First Use)

After connecting wallet:

- The app will automatically check if contract is initialized
- If not, use the "Initialize Contract" section to set up the contract parameters
- Fill in name, symbol, base URI, and max supply

### 4. Optional: Pinata IPFS Setup

For IPFS file uploads, add your Pinata API keys to `config.js`:

```javascript
IPFS: {
  PINATA_API_KEY: "your_api_key_here",
  PINATA_SECRET_KEY: "your_secret_key_here",
  // ...
}
```

Without Pinata keys, you can still mint NFTs by manually entering IPFS metadata URIs.

## What Was Built

✅ **Complete NFT dApp Frontend with:**

- Automatic network switching to Arbitrum Sepolia
- Contract deployment and initialization UI
- IPFS file upload and metadata generation
- Full ERC-721 minting and transfer functionality
- Responsive dark theme with real-time feedback
- Comprehensive error handling
- Wallet connection and balance displays

## Styling

The design uses:

- Dark theme suitable for crypto applications
- Modern gradients and shadows
- Responsive grid layout
- Clean typography with CSS variables

## Development

- HTML: `index.html`
- CSS: `style.css`
- JavaScript: `app.js` (uses ethers.js CDN)

The code is vanilla JavaScript for minimalism and ease of deployment.
