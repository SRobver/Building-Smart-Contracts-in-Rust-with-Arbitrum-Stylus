// Use CONFIG for all environment values
const CONTRACT_ADDRESS = CONFIG.CONTRACT.ADDRESS
const RPC_URL = CONFIG.CONTRACT.RPC_URL

// Global variables
let provider, signer, contract

// Complete JSON ABI for DemoNFT contract
const ABI = [
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "symbol", type: "string" },
      { internalType: "string", name: "base_uri", type: "string" },
      { internalType: "uint256", name: "max_supply", type: "uint256" },
    ],
    name: "init",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalMinted",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getOwner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "string", name: "uri", type: "string" },
    ],
    name: "mint",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "operator", type: "address" },
      { internalType: "bool", name: "approved", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "operator", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
]

// DOM elements
const connectBtn = document.getElementById("connectWallet")
const contractNameEl = document.getElementById("contractName")
const contractSymbolEl = document.getElementById("contractSymbol")
const totalMintedEl = document.getElementById("totalMinted")
const userBalanceEl = document.getElementById("userBalance")
const initForm = document.getElementById("initForm")
const initStatusText = document.getElementById("initStatusText")
const initNameInput = document.getElementById("initName")
const initSymbolInput = document.getElementById("initSymbol")
const initBaseUriInput = document.getElementById("initBaseUri")
const initMaxSupplyInput = document.getElementById("initMaxSupply")
const uploadForm = document.getElementById("uploadForm")
const nftNameInput = document.getElementById("nftName")
const nftDescriptionInput = document.getElementById("nftDescription")
const nftImageInput = document.getElementById("nftImage")
const uploadProgress = document.getElementById("uploadProgress")
const progressBar = document.getElementById("progressBar")
const progressText = document.getElementById("progressText")
const uploadResult = document.getElementById("uploadResult")
const metadataUri = document.getElementById("metadataUri")
const mintForm = document.getElementById("mintForm")
const mintUriInput = document.getElementById("mintUri")
const nftList = document.getElementById("nftList")
const transferModal = document.getElementById("transferModal")
const transferForm = document.getElementById("transferForm")
const transferAddressInput = document.getElementById("transferAddress")

// Global state
let currentTransferTokenId = null
let currentLoadingOperations = new Set()

// Initialize app
async function init() {
  if (typeof window.ethereum !== "undefined") {
    connectBtn.addEventListener("click", connectWallet)
    initForm.addEventListener("submit", handleInit)
    uploadForm.addEventListener("submit", handleIPFSUpload)
    mintForm.addEventListener("submit", handleMint)
    transferForm.addEventListener("submit", handleTransfer)
    transferForm.addEventListener("reset", closeModal)
  } else {
    showError("Please install MetaMask or another Ethereum wallet", "wallet")
  }

  // Check initialization status on page load
  checkInitStatus()
}

// Utility functions
function showError(message, context = "general") {
  console.error(`[${context}] ${message}`)
  alert(message)
}

function showSuccess(message) {
  alert(message)
}

function setLoading(element, isLoading, operationId) {
  if (isLoading) {
    currentLoadingOperations.add(operationId)
    element.classList.add("loading")
  } else {
    currentLoadingOperations.delete(operationId)
    if (currentLoadingOperations.size === 0) {
      element.classList.remove("loading")
    }
  }
}

function isValidAddress(address) {
  try {
    return ethers.isAddress(address)
  } catch {
    return false
  }
}

function isValidURI(uri) {
  try {
    new URL(uri)
    return true
  } catch {
    return false
  }
}

function isImageURI(uri) {
  const imageExtensions = /\.(jpg|jpeg|png|gif|svg|webp)$/i
  return imageExtensions.test(uri)
}

// Switch to Arbitrum Sepolia network
async function switchToArbitrumSepolia() {
  try {
    const network = CONFIG.NETWORKS.ARBITRUM_SEPOLIA
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${network.chainId.toString(16)}` }],
    })
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        const network = CONFIG.NETWORKS.ARBITRUM_SEPOLIA
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${network.chainId.toString(16)}`,
              chainName: network.chainName,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: network.rpcUrls,
              blockExplorerUrls: network.blockExplorerUrls,
            },
          ],
        })
      } catch (addError) {
        console.error("Failed to add Arbitrum Sepolia network:", addError)
        showError("Failed to add Arbitrum Sepolia network to MetaMask", "network")
        throw addError
      }
    } else {
      console.error("Failed to switch to Arbitrum Sepolia:", switchError)
      showError("Please switch to Arbitrum Sepolia network in MetaMask", "network")
      throw switchError
    }
  }
}

// Connect wallet
async function connectWallet() {
  try {
    setLoading(connectBtn, true, "connect")

    // First switch to Arbitrum Sepolia
    await switchToArbitrumSepolia()

    await window.ethereum.request({ method: "eth_requestAccounts" })
    provider = new ethers.BrowserProvider(window.ethereum)
    signer = await provider.getSigner()

    const address = await signer.getAddress()
    connectBtn.textContent = `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`

    // Create contract instance with signer (v6 style)
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)

    await loadContractInfo()
    await loadUserNFTs()
  } catch (error) {
    console.error("Connection failed:", error)
    showError("Failed to connect wallet: " + error.message, "wallet")
  } finally {
    setLoading(connectBtn, false, "connect")
  }
}

// Check if contract is initialized
async function checkInitStatus() {
  try {
    // Create a read-only contract instance for checking status
    const readOnlyProvider = new ethers.JsonRpcProvider(RPC_URL)
    const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, readOnlyProvider)

    // Try to get contract name - if this fails, contract is not initialized
    await readOnlyContract.name()
    initStatusText.textContent = "✅ Initialized"
    initForm.style.display = "none"
  } catch (error) {
    console.error("Contract not initialized:", error)
    initStatusText.textContent = "❌ Not Initialized"
    initForm.style.display = "block"
  }
}

// Handle initialization form submission
async function handleInit(event) {
  event.preventDefault()

  const name = initNameInput.value.trim()
  const symbol = initSymbolInput.value.trim()
  const baseUri = initBaseUriInput.value.trim()
  const maxSupply = parseInt(initMaxSupplyInput.value)

  // Input validation
  if (!name || !symbol || !baseUri) {
    showError("Please fill in all required fields", "init")
    return
  }

  if (maxSupply <= 0) {
    showError("Max supply must be greater than 0", "init")
    return
  }

  const initBtn = initForm.querySelector("button")

  try {
    setLoading(initForm, true, "init")
    initBtn.disabled = true
    initBtn.textContent = "Initializing..."

    if (!contract) {
      throw new Error("Please connect your wallet first")
    }

    const tx = await contract.init(name, symbol, baseUri, maxSupply)
    console.log("Initialization transaction sent:", tx.hash)
    await tx.wait()

    showSuccess("Contract initialized successfully!")
    initStatusText.textContent = "✅ Initialized"
    initForm.style.display = "none"

    // Refresh contract info
    await loadContractInfo()
  } catch (error) {
    console.error("Initialization failed:", error)
    let errorMessage = "Initialization failed"
    if (error.message.includes("user rejected")) {
      errorMessage = "Transaction was rejected by user"
    } else if (error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for transaction"
    } else if (error.message.includes("already initialized")) {
      errorMessage = "Contract is already initialized"
    }
    // Provide more specific error messages for common issues
    if (error.code === "NETWORK_ERROR" || error.message.includes("Failed to fetch")) {
      errorMessage = "Network connection failed. Check your internet connection and try again."
    } else if (error.code === "ACTION_REJECTED") {
      errorMessage = "Transaction was rejected by user"
    } else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
      errorMessage = "Transaction gas estimation failed"
    } else if (error.code === "CALL_EXCEPTION") {
      errorMessage = "Contract call failed - contract may not be deployed or address is incorrect"
    } else if (error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for transaction"
    }

    showError(`${errorMessage}: ${error.message}`, "init")
  } finally {
    setLoading(initForm, false, "init")
    initBtn.disabled = false
    initBtn.textContent = "Initialize Contract"
  }
}

// Load contract information
async function loadContractInfo() {
  try {
    // First check if contract is initialized
    await checkInitStatus()

    const [name, symbol, totalMinted, userAddress] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.totalMinted(),
      signer.getAddress(),
    ])

    contractNameEl.textContent = name || "DemoNFT"
    contractSymbolEl.textContent = symbol || "DEMO"
    totalMintedEl.textContent = totalMinted.toString()

    const balance = await contract.balanceOf(userAddress)
    userBalanceEl.textContent = balance.toString()
  } catch (error) {
    console.error("Error loading contract info:", error)
    // If contract is not initialized, don't try to load other info
  }
}

// Handle mint form submission
async function handleMint(event) {
  event.preventDefault()

  const uri = mintUriInput.value.trim()

  // Input validation
  if (!uri) {
    showError("Please enter an NFT URI", "mint")
    return
  }

  if (!isValidURI(uri)) {
    showError("Please enter a valid URI (e.g., https://gateway.pinata.cloud/ipfs/...)", "mint")
    return
  }

  const mintBtn = mintForm.querySelector("button")

  try {
    setLoading(mintForm, true, "mint")
    mintBtn.disabled = true
    mintBtn.textContent = "Minting..."

    const userAddress = await signer.getAddress()
    const tx = await contract.mint(userAddress, uri)
    console.log("Transaction sent:", tx.hash)
    await tx.wait()

    showSuccess("NFT minted successfully!")
    mintUriInput.value = ""
    await loadContractInfo()
    await loadUserNFTs()
  } catch (error) {
    console.error("Mint failed:", error)
    let errorMessage = "Mint failed"
    if (error.message.includes("user rejected")) {
      errorMessage = "Transaction was rejected by user"
    } else if (error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for transaction"
    }
    showError(`${errorMessage}: ${error.message}`, "mint")
  } finally {
    setLoading(mintForm, false, "mint")
    mintBtn.disabled = false
    mintBtn.textContent = "Mint NFT"
  }
}

// Load user's NFTs
async function loadUserNFTs() {
  try {
    setLoading(nftList, true, "loadNFTs")
    const userAddress = await signer.getAddress()
    const balance = await contract.balanceOf(userAddress)
    const totalMinted = await contract.totalMinted()

    nftList.innerHTML = ""

    if (balance == 0) {
      nftList.innerHTML = "<p>You don't own any NFTs yet.</p>"
      return
    }

    let ownedNFTs = []
    // Optimized loop - start from higher IDs first (more likely to be recent NFTs)
    for (let tokenId = totalMinted - 1; tokenId >= 0 && ownedNFTs.length < balance; tokenId--) {
      try {
        const owner = await contract.ownerOf(tokenId)
        if (owner.toLowerCase() === userAddress.toLowerCase()) {
          ownedNFTs.push(tokenId)
        }
      } catch (e) {
        // Token might not exist
      }
    }

    for (const tokenId of ownedNFTs) {
      const uri = await contract.tokenURI(tokenId)
      const card = document.createElement("div")
      card.className = "nft-card"

      let mediaContent = ""
      if (isImageURI(uri)) {
        mediaContent = `<img src="${uri}" alt="NFT #${tokenId}" class="nft-image" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                        <div class="nft-uri-fallback" style="display:none;">📎</div>`
      } else {
        mediaContent = `<div class="nft-uri-fallback">📎</div>`
      }

      card.innerHTML = `
        ${mediaContent}
        <h3>Token #${tokenId.toString()}</h3>
        <p><strong>URI:</strong> <a href="${uri}" target="_blank" class="nft-uri">${uri.replace(
        /(.{50}).*/,
        "$1..."
      )}</a></p>
        <button class="btn-secondary" onclick="openTransferModal(${tokenId})">Transfer NFT</button>
      `
      nftList.appendChild(card)
    }
  } catch (error) {
    console.error("Error loading NFTs:", error)
    nftList.innerHTML = "<p>Error loading NFTs. Please try again.</p>"
  } finally {
    setLoading(nftList, false, "loadNFTs")
  }
}

// Modal functions
function openTransferModal(tokenId) {
  currentTransferTokenId = tokenId
  transferAddressInput.value = ""
  transferModal.style.display = "block"
  document.body.style.overflow = "hidden"
}

function closeModal() {
  transferModal.style.display = "none"
  document.body.style.overflow = "auto"
  transferAddressInput.value = ""
  currentTransferTokenId = null
}

// Close modal when clicking outside
window.onclick = function (event) {
  if (event.target == transferModal) {
    closeModal()
  }
}

// Handle transfer form submission
async function handleTransfer(event) {
  event.preventDefault()

  const toAddress = transferAddressInput.value.trim()

  // Input validation
  if (!toAddress) {
    showError("Please enter a recipient address", "transfer")
    return
  }

  if (!isValidAddress(toAddress)) {
    showError("Please enter a valid Ethereum address", "transfer")
    return
  }

  const fromAddress = await signer.getAddress()
  if (toAddress.toLowerCase() === fromAddress.toLowerCase()) {
    showError("Cannot transfer NFT to yourself", "transfer")
    return
  }

  const transferBtn = transferForm.querySelector(".btn-danger")

  try {
    setLoading(transferForm, true, "transfer")
    transferBtn.disabled = true
    transferBtn.textContent = "Transferring..."

    const tx = await contract.transferFrom(fromAddress, toAddress, currentTransferTokenId)
    console.log("Transfer transaction sent:", tx.hash)
    await tx.wait()

    showSuccess("NFT transferred successfully!")
    closeModal()
    await loadContractInfo()
    await loadUserNFTs()
  } catch (error) {
    console.error("Transfer failed:", error)
    let errorMessage = "Transfer failed"
    if (error.message.includes("user rejected")) {
      errorMessage = "Transaction was rejected by user"
    } else if (error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for transaction"
    }
    showError(`${errorMessage}: ${error.message}`, "transfer")
  } finally {
    setLoading(transferForm, false, "transfer")
    transferBtn.disabled = false
    transferBtn.textContent = "Transfer"
  }
}

// IPFS Upload Functions
async function handleIPFSUpload(event) {
  event.preventDefault()

  const name = nftNameInput.value.trim()
  const description = nftDescriptionInput.value.trim()
  const file = nftImageInput.files[0]

  // Input validation
  if (!name || !description || !file) {
    showError("Please fill in all fields and select an image", "upload")
    return
  }

  // File validation
  if (!CONFIG.UI.ALLOWED_FILE_TYPES.includes(file.type)) {
    showError("Please select a valid image file (JPG, PNG, GIF, WebP)", "upload")
    return
  }

  if (file.size > CONFIG.UI.MAX_FILE_SIZE) {
    showError("File size must be less than 5MB", "upload")
    return
  }

  const uploadBtn = uploadForm.querySelector("button")

  try {
    setLoading(uploadForm, true, "upload")
    uploadBtn.disabled = true
    uploadBtn.textContent = "Uploading..."

    uploadProgress.style.display = "block"
    progressText.textContent = "Uploading image to IPFS..."

    // Upload image to Pinata
    const imageHash = await uploadFileToIPFS(file)
    const imageUrl = `${CONFIG.IPFS.GATEWAY_URL}${imageHash}`

    progressBar.style.width = "50%"
    progressText.textContent = "Creating metadata..."

    // Create and upload metadata
    const metadata = {
      name: name,
      description: description,
      image: imageUrl,
      attributes: [],
    }

    const metadataHash = await uploadJSONToIPFS(metadata)
    const metadataUrl = `${CONFIG.IPFS.GATEWAY_URL}${metadataHash}`

    progressBar.style.width = "100%"
    progressText.textContent = "Upload complete!"

    // Show result
    metadataUri.textContent = metadataUrl
    uploadResult.style.display = "block"

    // Reset form
    nftNameInput.value = ""
    nftDescriptionInput.value = ""
    nftImageInput.value = ""

    showSuccess("NFT metadata uploaded successfully!")
  } catch (error) {
    console.error("Upload failed:", error)
    showError(`Upload failed: ${error.message}`, "upload")
  } finally {
    setLoading(uploadForm, false, "upload")
    uploadBtn.disabled = false
    uploadBtn.textContent = "Upload to IPFS"
    uploadProgress.style.display = "none"
  }
}

async function uploadFileToIPFS(file) {
  // For demo purposes, use Pinata's public API (no auth required for small files)
  // In production, you would use proper API keys
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      // Note: These are placeholder - user should set their own API keys
      pinata_api_key: CONFIG.IPFS.PINATA_API_KEY || "",
      pinata_secret_api_key: CONFIG.IPFS.PINATA_SECRET_KEY || "",
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Failed to upload file to IPFS")
  }

  const result = await response.json()
  return result.IpfsHash
}

async function uploadJSONToIPFS(metadata) {
  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: CONFIG.IPFS.PINATA_API_KEY || "",
      pinata_secret_api_key: CONFIG.IPFS.PINATA_SECRET_KEY || "",
    },
    body: JSON.stringify(metadata),
  })

  if (!response.ok) {
    throw new Error("Failed to upload metadata to IPFS")
  }

  const result = await response.json()
  return result.IpfsHash
}

// Utility functions for upload UI
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showSuccess("URI copied to clipboard!")
    })
    .catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      showSuccess("URI copied to clipboard!")
    })
}

async function mintFromUpload() {
  const uri = metadataUri.textContent
  if (!uri) {
    showError("No metadata URI available", "mint")
    return
  }

  // Fill the mint form with the URI and submit
  mintUriInput.value = uri
  handleMint({ preventDefault: () => {} })
}

// Initialize on load
document.addEventListener("DOMContentLoaded", init)
