let provider, signer, contract
const CONTRACT_ADDRESS = "0x3F8e82036B9627b98DD223F869F7C74F60D2A511" // Replace with actual deployed contract address
const RPC_URL = "https://sepolia-rollup.arbitrum.io/rpc" // Arbitrum Sepolia for Stylus

// ABI including inherited functions
const ABI = [
  // Custom functions
  "function init(string name, string symbol, string base_uri, uint256 max_supply)",
  "function totalMinted() view returns (uint256)",
  "function getOwner() view returns (address)",
  "function mint(address to, string uri) returns (uint256)",
  // ERC-721 functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function setApprovalForAll(address operator, bool _approved)",
  // ERC-721 Metadata
  "function tokenURI(uint256 tokenId) view returns (string)",
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

// Initialize app
async function init() {
  if (typeof window.ethereum !== "undefined") {
    connectBtn.addEventListener("click", connectWallet)
    mintForm.addEventListener("submit", handleMint)
  } else {
    alert("Please install MetaMask or another Ethereum wallet")
  }
}

// Connect wallet
async function connectWallet() {
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" })
    provider = new ethers.providers.Web3Provider(window.ethereum)
    signer = provider.getSigner()

    const address = await signer.getAddress()
    connectBtn.textContent = `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

    // Add signer for transactions
    const contractWithSigner = contract.connect(signer)

    // Global contract variable should have signer
    contract = contractWithSigner

    await loadContractInfo()
    await loadUserNFTs()
  } catch (error) {
    console.error("Connection failed:", error)
    alert("Failed to connect wallet")
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

  const uri = mintUriInput.value
  if (!uri) return

  try {
    mintForm.querySelector("button").disabled = true
    mintForm.querySelector("button").textContent = "Minting..."

    const userAddress = await signer.getAddress()
    const tx = await contract.mint(userAddress, uri)
    await tx.wait()

    alert("NFT minted successfully!")
    mintUriInput.value = ""
    await loadContractInfo()
    await loadUserNFTs()
  } catch (error) {
    console.error("Mint failed:", error)
    alert(`Mint failed: ${error.message}`)
  } finally {
    mintForm.querySelector("button").disabled = false
    mintForm.querySelector("button").textContent = "Mint NFT"
  }
}

// Load user's NFTs
async function loadUserNFTs() {
  try {
    const userAddress = await signer.getAddress()
    const balance = await contract.balanceOf(userAddress)
    const totalMinted = await contract.totalMinted()

    nftList.innerHTML = ""

    if (balance == 0) {
      nftList.innerHTML = "<p>You don't own any NFTs yet.</p>"
      return
    }

    let ownedNFTs = []
    for (let tokenId = 0; tokenId < totalMinted; tokenId++) {
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
      card.innerHTML = `
        <h3>Token #${tokenId.toString()}</h3>
        <p><strong>URI:</strong> <a href="${uri}" target="_blank" class="nft-uri">${uri.replace(
        /(.{50}).*/,
        "$1..."
      )}</a></p>
        <button class="btn-secondary" onclick="transferNFT(${tokenId})">Transfer NFT</button>
      `
      nftList.appendChild(card)
    }
  } catch (error) {
    console.error("Error loading NFTs:", error)
    nftList.innerHTML = "<p>Error loading NFTs. Please try again.</p>"
  }
}

// Transfer NFT function
async function transferNFT(tokenId) {
  const toAddress = prompt("Enter recipient address:")
  if (!toAddress) return

  try {
    const tx = await contract.transferFrom(await signer.getAddress(), toAddress, tokenId)
    await tx.wait()
    alert("NFT transferred successfully!")
    await loadUserNFTs()
    await loadContractInfo()
  } catch (error) {
    console.error("Transfer failed:", error)
    alert(`Transfer failed: ${error.message}`)
  }
}

// Initialize on load
document.addEventListener("DOMContentLoaded", init)
