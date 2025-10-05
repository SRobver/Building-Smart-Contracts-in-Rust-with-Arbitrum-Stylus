// Configuration constants for NFT dApp
const CONFIG = {
  // Network Configuration
  NETWORKS: {
    ARBITRUM_SEPOLIA: {
      chainId: 421614,
      chainName: "Arbitrum Sepolia",
      nativeCurrency: {
        name: "Sepolia Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
      blockExplorerUrls: ["https://sepolia.arbiscan.io/"],
    },
  },

  // Contract Configuration
  CONTRACT: {
    ADDRESS: "0x3F8e82036B9627b98DD223F869F7C74F60D2A511", // Update this with your deployed contract address
    RPC_URL: "https://sepolia-rollup.arbitrum.io/rpc",
  },

  // IPFS Configuration (Pinata)
  IPFS: {
    PINATA_API_KEY: "", // To be set by user
    PINATA_SECRET_KEY: "", // To be set by user
    GATEWAY_URL: "https://gateway.pinata.cloud/ipfs/",
  },

  // Contract Initialization Parameters
  CONTRACT_INIT: {
    DEFAULT_NAME: "DemoNFT",
    DEFAULT_SYMBOL: "DEMO",
    DEFAULT_BASE_URI: "ipfs://",
    DEFAULT_MAX_SUPPLY: 10000,
  },

  // UI Constants
  UI: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    METADATA_TEMPLATE: {
      name: "",
      description: "",
      image: "",
      attributes: [],
    },
  },
}

// Network chain ID for Arbitrum Sepolia
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614

// Make CONFIG available globally
window.CONFIG = CONFIG
