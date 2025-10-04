# Building Smart Contracts in Rust with Arbitrum Stylus

## Introduction

This repository provides a comprehensive guide to building secure, efficient smart contracts on the Ethereum Virtual Machine (EVM) using Rust and Arbitrum Stylus. Stylus is Arbitrum's innovative layer-2 scaling solution that enables developers to write smart contracts in languages beyond Solidity, leveraging WebAssembly (WASM) for enhanced performance and safety.

In this tutorial, we'll build a demo ERC-721 (NFT) token contract - a non-fungible token standard that allows for unique digital assets on the blockchain. ERC-721 tokens are widely used for digital collectibles, gaming items, real estate deeds, and more. We're using Rust with Stylus because it provides compile-time safety guarantees, zero-cost abstractions, and significantly lower gas costs compared to traditional Solidity contracts (typically 20-50% cheaper). The tutorial demonstrates professional development practices with modular architecture, comprehensive testing, and deployment to a local Arbitrum devnet.

**What You'll Achieve:**

- A production-ready ERC-721 NFT smart contract implementation in Rust
- Type-safe development with strong memory and ownership guarantees
- Gas-efficient WebAssembly contracts compiled from Rust code
- Hands-on Stylus SDK usage with EVM compatibility
- Local development environment setup and deployment
- Comprehensive testing and interaction examples

By the end of this guide, you'll have a fully functional NFT contract deployed to a local Arbitrum chain, with the knowledge to extend it for real-world applications.

---

## 🛠️ Prerequisites and Setup

Ensure your environment is ready for Rust smart contract development. You'll need tools for coding, testing, and running a local Arbitrum chain.

### Required Tools

| Tool                   | Purpose                                         | Installation                                                                                                                             |
| ---------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Rust Toolchain**     | Stable (1.81+ recommended) for WASM compilation | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh`<br>Verify: `rustup --version`, `rustc --version`, `cargo --version`    |
| **Docker**             | Runs the Nitro devnode (local Arbitrum chain)   | Install from [docker.com](https://www.docker.com). Ensure Docker Desktop is running.                                                     |
| **Foundry (Cast CLI)** | Interacts with contracts (e.g., call, send)     | `curl -L https://foundry.paradigm.xyz \| bash` then `foundryup`                                                                          |
| **VS Code** (optional) | IDE with Rust extensions                        | Install extensions: `rust-analyzer` (autocompletion, diagnostics), `Error Lens` (inline errors), `Even Better TOML` (Cargo.toml editing) |

**Tip**: On Windows, use WSL2 for smoother Rust/Docker compatibility. Keep Rust updated with `rustup update stable`.

---

## 🚀 Step 1: Launch the Arbitrum Devnode

Stylus contracts run on Arbitrum, so we'll use the Nitro devnode to simulate a local chain with a pre-funded wallet.

1. Clone and start the devnode:
   ```bash
   git clone https://github.com/OffchainLabs/nitro-devnode.git
   cd nitro-devnode
   ./run-dev-node.sh
   ```

This launches an Arbitrum chain at http://localhost:8547 (RPC endpoint) and provides a pre-funded wallet: `0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659`.

Wait for "Node is ready" in logs. Stop with `docker compose down`.

**Verify the node:**

```bash
cast block-number --rpc-url http://localhost:8547
```

Should return 0 or higher, confirming the chain is live.

## 🔧 Step 2: Install Cargo Stylus CLI

The Cargo Stylus CLI compiles Rust to WASM, validates contracts, and handles deployment to Arbitrum.

**Install:**

```bash
cargo install --force cargo-stylus
```

**Configure Rust for WASM:**

```bash
rustup default stable
rustup target add wasm32-unknown-unknown
```

**Verify:**

```bash
cargo stylus --help
```

Lists commands: new, check, deploy, estimate-gas, etc.

**Note**: If toolchain issues arise, run `rustup override set stable` in your project directory.

## 📦 Step 3: Scaffold a Stylus Project

Create a new project to house our DemoNFT ERC-721 contract.

**Generate the project:**

```bash
cargo stylus new demo-nft
cd demo-nft
```

**Structure:**

```
demo-nft/
├── Cargo.toml          # Dependencies and config
├── rust-toolchain.toml # Pins Rust version
├── src/
│   ├── lib.rs          # Contract entrypoint
│   └── main.rs         # Off-chain testing (optional)
├── examples/           # Sample contracts (delete if unused)
└── README.md
```

**Update Cargo.toml:**

```toml
[package]
name = "demo-nft"
version = "0.1.0"
edition = "2021"

[dependencies]
stylus-sdk = "0.4"
alloy-primitives = "0.7"
alloc = { version = "0.0.0", optional = true }

[lib]
crate-type = ["cdylib", "rlib"]

[features]
export-abi = ["stylus-sdk/export-abi"]
```

**Tip**: Remove `examples/counter.rs` to focus on ERC-721. Run `cargo check` for initial validation.

## 🧩 Step 4: Implement the ERC-721 NFT Contract

We'll build a complete, production-ready ERC-721 NFT contract implementation in Rust. This section covers the step-by-step development process, from basic structure to advanced features. Our approach uses modular design with separation of concerns for maintainability and reusability.

The ERC-721 standard defines the interface for non-fungible tokens on Ethereum. Each token is unique and indivisible, perfect for representing digital collectibles, artwork, or any asset that requires uniqueness verification. We'll implement core methods like minting, transferring, and approving tokens, while leveraging Rust's type safety to prevent common blockchain vulnerabilities.

**Architecture Overview:**

- `erc721.rs`: Generic ERC-721 logic (ownership tracking, transfers, approvals) - reusable across different NFT contracts
- `lib.rs`: DemoNFT-specific configuration and entrypoint - contract customization
- Separation of business logic from contract specifics for better code organization

### 🔹 src/erc721.rs: Generic ERC-721 Engine

Create `src/erc721.rs` for reusable NFT logic. Add `mod erc721;` to `src/lib.rs`.

**Imports:**

```rust
extern crate alloc;
use alloc::string::String;
use alloy_primitives::{Address, U256};
use alloy_sol_types::sol;
use core::marker::PhantomData;
use stylus_sdk::{msg, prelude::*, stylus_core::log};
```

**Token Configuration Trait:**

```rust
pub trait Erc721Params {
    const NAME: &'static str;
    const SYMBOL: &'static str;
}
```

**Storage Layout:**

```rust
sol_storage! {
    pub struct Erc721<T> {
        mapping(uint256 => address) owner_of;
        mapping(address => uint256) balance_of;
        mapping(uint256 => address) token_approvals;
        PhantomData<T> phantom;
    }
}
```

**Events and Errors:**

```rust
sol! {
    event Transfer(address indexed from, address indexed to, uint256 indexed token_id);
    error NotOwner(address caller, uint256 token_id);
    error AlreadyMinted(uint256 token_id);
    error NotApproved(address caller, uint256 token_id);
}
```

**Internal Logic:**

```rust
impl<T: Erc721Params> Erc721<T> {
    pub fn mint(&mut self, to: Address, token_id: U256) -> Result<(), Erc721Error> {
        if self.owner_of.get(token_id) != Address::zero() {
            return Err(Erc721Error::AlreadyMinted(token_id));
        }
        self.owner_of.set(token_id, to);
        self.balance_of.set(to, self.balance_of.get(to) + U256::from(1));
        Transfer(Address::zero(), to, token_id).emit();
        Ok(())
    }

    pub fn transfer_from(&mut self, from: Address, to: Address, token_id: U256) -> Result<(), Erc721Error> {
        let owner = self.owner_of.get(token_id);
        if owner != from || owner == Address::zero() {
            return Err(Erc721Error::NotOwner(from, token_id));
        }
        let caller = msg::sender();
        if caller != owner && self.token_approvals.get(token_id) != caller {
            return Err(Erc721Error::NotApproved(caller, token_id));
        }
        self.token_approvals.set(token_id, Address::zero());
        self.owner_of.set(token_id, to);
        self.balance_of.set(from, self.balance_of.get(from) - U256::from(1));
        self.balance_of.set(to, self.balance_of.get(to) + U256::from(1));
        Transfer(from, to, token_id).emit();
        Ok(())
    }

    pub fn approve(&mut self, spender: Address, token_id: U256) -> Result<(), Erc721Error> {
        let owner = self.owner_of.get(token_id);
        if owner != msg::sender() || owner == Address::zero() {
            return Err(Erc721Error::NotOwner(msg::sender(), token_id));
        }
        self.token_approvals.set(token_id, spender);
        Ok(())
    }
}
```

**Public ERC-721 Interface:**

```rust
#[public]
impl<T: Erc721Params> Erc721<T> {
    pub fn name() -> String { T::NAME.to_string() }
    pub fn symbol() -> String { T::SYMBOL.to_string() }
    pub fn owner_of(&self, token_id: U256) -> Address { self.owner_of.get(token_id) }
    pub fn balance_of(&self, owner: Address) -> U256 { self.balance_of.get(owner) }
}
```

### 🔸 src/lib.rs: DemoNFT Entrypoint

**Implementation Steps:**

1. **Import required modules:** Bring in ERC-721 traits, error types, and Stylus primitives.
2. **Define contract parameters:** Configure the NFT's name and symbol.
3. **Create contract struct:** Use Stylus storage macros to define contract state.
4. **Implement public methods:** Expose mint, transfer, and approval functionality.
5. **Add security considerations:** Include ownership checks and access control in production.

**Code:**

```rust
extern crate alloc;
mod erc721;
use alloy_primitives::{Address, U256};
use stylus_sdk::prelude::*;
use crate::erc721::{Erc721, Erc721Params, Erc721Error};

// Contract configuration
struct DemoNFTParams;
impl Erc721Params for DemoNFTParams {
    const NAME: &'static str = "DemoNFT";
    const SYMBOL: &'static str = "DNFT";
}

// Entrypoint definition
sol_storage! {
    #[entrypoint]
    struct DemoNFT {
        #[borrow]
        Erc721<DemoNFTParams> erc721;
    }
}

// Public interface implementation
#[public]
#[inherit(Erc721<DemoNFTParams>)]
impl DemoNFT {
    /// Mint a new NFT to specified address
    pub fn mint(&mut self, to: Address, token_id: U256) -> Result<(), Erc721Error> {
        self.erc721.mint(to, token_id)
    }

    /// Transfer NFT ownership (requires approval if not owner)
    pub fn transfer_from(&mut self, from: Address, to: Address, token_id: U256) -> Result<(), Erc721Error> {
        self.erc721.transfer_from(from, to, token_id)
    }

    /// Approve another address to transfer this NFT
    pub fn approve(&mut self, spender: Address, token_id: U256) -> Result<(), Erc721Error> {
        self.erc721.approve(spender, token_id)
    }
}
```

**Security Considerations:**

- Only contract owner should be able to mint tokens
- Implement access control (e.g., Ownable pattern)
- Add input validation for addresses and token IDs
- Use safe transfer patterns in production deployments

## 🧪 Step 5: Build, Validate, and Deploy

Compile and deploy the contract to the local devnet.

**Build:**

```bash
cargo stylus build
```

Produces WASM in `target/stylus/`. Use `cargo clippy` for linting.

**Validate:**

```bash
cargo stylus check --endpoint http://localhost:8547
```

Ensures contract compatibility with Stylus.

**Estimate Gas:**

```bash
cargo stylus deploy --endpoint http://localhost:8547 \
 --private-key 0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659 \
 --estimate-gas
```

Example output:

```
deployment tx gas: 7500000
gas price: "0.100000000" gwei
deployment tx total cost: "0.000750000000000000" ETH
```

**Deploy:**

```bash
cargo stylus deploy --endpoint http://localhost:8547 \
 --private-key 0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659
```

Example output:

```
deployed code at address: 0x33f54de59419570a9442e788f5dd5cf635b3c7ac
deployment tx hash: 0xa55efc05c45efc63647dff5cc37ad328a47ba5555009d92ad4e297bf4864de36
wasm already activated!
```

**Interact:** Mint an NFT with token ID 1:

```bash
cast send <address> "mint(address,uint256)" <your_address> 1 --private-key <key> --rpc-url http://localhost:8547
```

**Debugging:** If deployment fails, check WASM size (<256KB) with `cargo stylus trace`.

## 🤝 Interacting with the Contract

Use `examples/nft.rs` to interact via ethers-rs:

**Code:**

```
use ethers::prelude::\*;
abigen!(
DemoNFT,
r#"[
function name() external view returns (string memory)
function symbol() external view returns (string memory)
function ownerOf(uint256 tokenId) external view returns (address)
function balanceOf(address owner) external view returns (uint256)
function mint(address to, uint256 tokenId) external
function transferFrom(address from, address to, uint256 tokenId) external
function approve(address spender, uint256 tokenId) external
]"#
);

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
let provider = Provider::<Http>::try_from(std::env::var("RPC_URL")?)?;
let client = Arc::new(SignerMiddleware::new(
provider.clone(),
Wallet::from_bytes(&hex::decode(std::fs::read_to_string(std::env::var("PRIV_KEY_PATH")?)?)?)?,
));
let address = std::env::var("STYLUS_CONTRACT_ADDRESS")?.parse::<Address>()?;
let nft = DemoNFT::new(address, client.clone());

    let name = nft.name().call().await?;
    println!("NFT name: {}", name);
    let balance = nft.balance_of(client.address()).call().await?;
    println!("Balance of caller: {}", balance);

    let token_id = U256::from(1);
    let tx = nft.mint(client.address(), token_id).send().await?.await?;
    println!("Minted token {}: {:?}", token_id, tx);

    let owner = nft.owner_of(token_id).call().await?;
    println!("Owner of token {}: {:?}", token_id, owner);

    Ok(())

```

**Set up .env:**

```bash
RPC_URL=http://localhost:8547
STYLUS_CONTRACT_ADDRESS=<deployed_contract_address>
PRIV_KEY_PATH=<path_to_private_key_file>
```

**Run:**

```bash
cargo run --example nft --target=<YOUR_ARCHITECTURE>
```

Find `<YOUR_ARCHITECTURE>` with `rustc -vV | grep host`.

## 🔗 Resources

| Resource             | Link/Description                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Arbitrum Stylus Docs | [docs.arbitrum.io/stylus](https://docs.arbitrum.io/stylus)                                 |
| Stylus Examples      | [github.com/OffchainLabs/stylus-examples](https://github.com/OffchainLabs/stylus-examples) |
| Stylus SDK           | [crates.io/crates/stylus-sdk](https://crates.io/crates/stylus-sdk)                         |
| Cargo Stylus CLI     | [github.com/OffchainLabs/stylus-cli](https://github.com/OffchainLabs/stylus-cli)           |
| Alloy Primitives     | [docs.rs/alloy-primitives](https://docs.rs/alloy-primitives)                               |
| Arbitrum Discord     | [discord.gg/arbitrum](https://discord.gg/arbitrum) (#stylus channel)                       |

🚀 Next Steps

Unit Tests: Add tests in tests/ with cargo test. Use Foundry for EVM simulations.
Frontend: Build a dApp with ethers.js or wagmi (scaffold via create-eth-app).
Enhancements:
Access Control: Add only_owner for mint.
Safe Transfers: Implement safeTransferFrom (ERC-721 standard).
Metadata: Add tokenURI for NFT metadata (e.g., JSON with image links).
Upgrades: Use proxies for upgradability.

Testnet Deployment: Target Arbitrum Sepolia with faucet ETH.
Optimize: Profile gas with cargo stylus trace. Rust contracts are ~20-50% cheaper than Solidity.

Why Stylus + Rust?

Performance: WASM is faster and cheaper than EVM.
Safety: Rust's borrow checker prevents unauthorized transfers and logic errors.
Tooling: Cargo, clippy, and rust-analyzer streamline development.
Interoperability: Call Solidity contracts via Alloy.

Build, audit, and deploy with confidence—Stylus is ready for Arbitrum One! For issues, join the Arbitrum Discord.

```

```
