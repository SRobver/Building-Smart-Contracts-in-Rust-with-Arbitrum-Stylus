# Building Smart Contracts in Rust with Arbitrum Stylus

This repository contains multiple **Rust smart contract examples** for [Arbitrum Stylus](https://docs.arbitrum.io/stylus) — Arbitrum’s next-gen environment for running WebAssembly (WASM) contracts alongside Solidity contracts.

With Stylus, developers can write contracts in **Rust, C/C++, Go, and other WASM-compatible languages**, while still enjoying full interoperability with the Ethereum ecosystem.

---

## Why Stylus + Rust?

* 🚀 **Performance**: Rust → WASM contracts are faster and ~20–50% cheaper than Solidity.
* 🔒 **Safety**: Rust’s strict memory and ownership model reduces common bugs.
* 🔗 **Interoperability**: Stylus contracts can call and be called by Solidity contracts seamlessly.
* 🛠 **Tooling**: Leverage Rust’s ecosystem (Cargo, Clippy, rust-analyzer).

---

## Repo Structure

This repo demonstrates **two contracts**, each in its own folder with a dedicated README:

* [`counter/`](./counter) → A simple **Counter contract** in Rust (hello world of smart contracts).
* [`nft-dapp/`](./nft-dapp) → A full **ERC-721 NFT contract** in Rust with minting, transfers, and approvals.

Each section below includes full setup, development, deployment, and interaction instructions.

---

# Stylus Quickstart (Rust Counter Example)

This guide helps you get started with **Arbitrum Stylus** by writing, deploying, and interacting with a simple **Counter** smart contract in Rust.

---

## 1. What is Stylus?

Stylus is Arbitrum’s WASM-based execution environment.
It allows you to write smart contracts in **Rust, C, C++, and more**, while maintaining full interoperability with Solidity contracts.

**Benefits:**

* Write contracts in familiar languages.
* Up to **20–50% lower gas fees**.
* Seamless calls between WASM and EVM contracts.
* Safe execution with Rust’s memory guarantees.

---

## 2. Prerequisites

Make sure you have the following installed:

* [Rust](https://www.rust-lang.org/tools/install) (>=1.80)
* Cargo Stylus CLI

  ```bash
  cargo install --force cargo-stylus
  rustup target add wasm32-unknown-unknown
  ```
* [Docker](https://docs.docker.com/get-docker/) (for Nitro devnode)
* [Foundry](https://book.getfoundry.sh/getting-started/installation) (for `cast` commands)
* VS Code + `rust-analyzer` (recommended)

---

## 3. Run a Local Stylus Node

Clone and start a local Nitro devnode:

```bash
git clone https://github.com/OffchainLabs/nitro-devnode.git
cd nitro-devnode
./run-dev-node.sh
```

RPC will be available at:

```
http://localhost:8547
```

Check the node:

```bash
cast block-number --rpc-url http://localhost:8547
```

---

## 4. Create a New Stylus Project

```bash
cargo stylus new hello-counter
cd hello-counter
```

This generates a Rust project with a sample `Counter` contract.

---

## 5. Check Contract Validity

Make sure your contract compiles and is Stylus-compatible:

```bash
cargo stylus check --endpoint http://localhost:8547
```

---

## 6. Deploy Contract

Deploy using your private key:

```bash
cargo stylus deploy \
  --endpoint http://localhost:8547 \
  --private-key <YOUR_PRIVATE_KEY>
```

After deployment, you’ll get the **contract address**.

---

## 7. Interact with the Contract

Check the stored number:

```bash
cast call <CONTRACT_ADDRESS> "number()" --rpc-url http://localhost:8547
```

Update the number:

```bash
cast send <CONTRACT_ADDRESS> "set_number(uint256)" 42 \
  --private-key <YOUR_PRIVATE_KEY> \
  --rpc-url http://localhost:8547
```

---

## 8. Next Steps

* Explore the [ERC-721 NFT Example](#erc-721-nft-example-in-rust-with-stylus) for advanced usage.
* Write and run tests with `cargo test`.
* Deploy to Arbitrum Sepolia or Arbitrum One.

---

# ERC-721 NFT Example in Rust with Stylus

This guide walks you through writing and deploying an **ERC-721 NFT smart contract in Rust** using Arbitrum Stylus.

---

## 1. Why Rust for NFTs?

* Memory safety and performance of Rust.
* Same contract logic as Solidity, but with **20–50% cheaper execution**.
* Seamless integration with Solidity contracts (can call each other).

---

## 2. Project Setup

```bash
cargo stylus new demo-nft
cd demo-nft
```

Edit `Cargo.toml` to include:

```toml
[dependencies]
stylus-sdk = "0.6"
alloy-primitives = "0.2"
```

---

## 3. Contract Structure

Example `lib.rs`:

```rust
#![no_std]

extern crate alloc;

use stylus_sdk::{
    prelude::*,
    abi::ethereum::erc721::{ERC721, ERC721Data, ERC721Error},
};

#[storage]
pub struct DemoNFT {
    #[borrow]
    data: ERC721Data,
}

#[external]
impl DemoNFT {
    pub fn init(&mut self, name: String, symbol: String) {
        self.data.init(name, symbol);
    }

    pub fn mint(&mut self, to: Address, token_id: U256) -> Result<(), ERC721Error> {
        self.data.mint(to, token_id)
    }

    pub fn burn(&mut self, token_id: U256) -> Result<(), ERC721Error> {
        self.data.burn(token_id)
    }
}
```

---

## 4. Compile & Check

```bash
cargo stylus check --endpoint http://localhost:8547
```

---

## 5. Deploy the NFT Contract

```bash
cargo stylus deploy \
  --endpoint http://localhost:8547 \
  --private-key <YOUR_PRIVATE_KEY>
```

---

## 6. Interact with the NFT

Mint an NFT:

```bash
cast send <CONTRACT_ADDRESS> "mint(address,uint256)" \
  0xYourWalletAddress 1 \
  --private-key <YOUR_PRIVATE_KEY> \
  --rpc-url http://localhost:8547
```

Check owner:

```bash
cast call <CONTRACT_ADDRESS> "ownerOf(uint256)" 1 \
  --rpc-url http://localhost:8547
```

---

## 7. Next Steps

* Add metadata extensions (`tokenURI`).
* Deploy to **Arbitrum Sepolia** testnet.
* Build marketplace or NFT game logic on top.

---

# 📘 Glossary

**ABI (Application Binary Interface):** Defines how data and functions are encoded/decoded for smart contracts.

**Address:** A unique identifier for accounts and contracts on Ethereum/Arbitrum.

**Arbitrum Nitro:** The underlying rollup tech powering Arbitrum, enabling fast and cheap L2 transactions.

**Cargo:** Rust’s package manager and build system.

**Cast:** A CLI tool from Foundry used to interact with Ethereum contracts and send transactions.

**EVM (Ethereum Virtual Machine):** The runtime environment for executing Solidity contracts.

**Gas:** A unit measuring computational effort required to execute operations on Ethereum/Arbitrum.

**RPC (Remote Procedure Call):** A way to communicate with blockchain nodes via HTTP/WebSocket endpoints.

**Stylus SDK:** The official Rust SDK for writing and deploying Stylus contracts.

**WASM (WebAssembly):** A portable low-level binary format that allows code written in languages like Rust or C++ to run efficiently in multiple environments.

---

💡 Want to go further? Check the [Stylus docs](https://docs.arbitrum.io/stylus) and join the [Arbitrum Discord](https://discord.gg/arbitrum) (`#stylus` channel).

