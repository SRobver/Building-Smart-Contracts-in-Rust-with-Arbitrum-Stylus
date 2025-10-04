# DemoNFT dApp Frontend

## Introduction

This frontend provides a complete Web3 user interface for interacting with the DemoNFT ERC-721 smart contract built with Rust and Arbitrum Stylus. The application demonstrates modern decentralized application (dApp) development practices, offering a responsive and user-friendly experience for minting and managing non-fungible tokens on the Arbitrum blockchain.

**Key Features:**

- **Wallet Integration:** Seamless MetaMask connection with EIP-1193 provider support
- **Contract Interaction:** Read and write functions to interact with the DemoNFT contract
- **Token Management:** Mint new NFTs, view balances, and transfer existing tokens
- **Real-time Updates:** Dynamic UI updates based on contract state and user actions
- **Error Handling:** Comprehensive error handling with user-friendly messages
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

1. Click "Connect Wallet" to connect your MetaMask
2. View contract information in the "Contract Info" section
3. Mint a new NFT by providing an IPFS URI for the metadata
4. Your owned NFTs will be displayed, and you can transfer them to other addresses

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
