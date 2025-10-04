// Load environment variables
const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS || "0x3F8e82036B9627b98DD223F869F7C74F60D2A511"
const RPC_URL = process.env.RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc"

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
    mintForm.addEventListener("submit", handleMint)
    transferForm.addEventListener("submit", handleTransfer)
    transferForm.addEventListener("reset", closeModal)
  } else {
    showError("Please install MetaMask or another Ethereum wallet", "wallet")
  }
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

// Connect wallet
async function connectWallet() {
  try {
    setLoading(connectBtn, true, "connect")
    await window.ethereum.request({ method: "eth_requestAccounts" })
    provider = new ethers.BrowserProvider(window.ethereum)
    signer = provider.getSigner()

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

// Load contract information
async function loadContractInfo() {
  try {
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

// Initialize on load
document.addEventListener("DOMContentLoaded", init)
