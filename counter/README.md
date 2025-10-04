# Counter Contract with Arbitrum Stylus

## Introduction

This repository demonstrates building smart contracts on the Ethereum Virtual Machine (EVM) using Rust and Arbitrum Stylus. Stylus enables developers to write smart contracts in languages beyond Solidity, harnessing WebAssembly (WASM) for unparalleled performance and safety. This entry-level tutorial builds a simple counter contract, providing a gentle introduction to Stylus development while highlighting Rust's advantages over traditional Solidity contracts (typically 20-50% cheaper gas costs).

In this guide, we'll implement a basic counter contract that maintains a single unsigned integer state variable and provides methods to read, set, increment, add, and multiply its value. This mirrors the classic Solidity counter contract, but leverages Rust's type safety, zero-cost abstractions, and compile-time guarantees for secure, efficient development.

**What You'll Achieve:**

- A functional counter smart contract implementation in Rust
- Type-safe WebAssembly contracts that are gas-efficient and secure
- Hands-on Stylus SDK usage with EVM compatibility
- Local development environment setup and deployment
- Comprehensive testing and interaction examples

**What This Example Demonstrates:**

- **Counter Storage:** Persistent state management with the `sol_storage!` macro
- **Read Operations:** Gas-free `number()` getter to retrieve current value
- **Write Operations:** `setNumber(uint256)` to set a specific value, `increment()` to increase by 1, `addNumber()` and `mulNumber()` for arithmetic operations

**Why This Example:**
Counter contracts are the "Hello World" of smart contract development. They provide a low-entry barrier while demonstrating:

- Basic state management in WebAssembly
- Reading and writing contract storage efficiently
- Public method exposure with the `#[public]` attribute
- Event emission for off-chain monitoring
- Gas-efficient implementations free from reentrancy risks

**Learning Outcomes:**

- Understanding Stylus project structure and configuration (Cargo.toml, rust-toolchain.toml)
- Implementing contract storage using `sol_storage!` macros and Solidity integration
- Creating public methods with the `#[public]` attribute and error handling
- Local development workflows with Nitro devnode
- ABI generation for external interaction tools like ethers.js and Foundry
- Unit testing with Rust's native testing framework
- Contract deployment and gas estimation

By the end of this guide, you'll have a deployed counter contract on a local Arbitrum chain, equipped with the knowledge to scale to more complex smart contracts like tokens and decentralized exchanges.

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

## 📂 Project Structure

```
counter/
├── .env.example          # Environment variable templates
├── .gitignore           # Git ignore patterns
├── Cargo.lock           # Dependency lock file
├── Cargo.toml           # Package configuration and dependencies
├── README.md            # This guide
├── rust-toolchain.toml  # Rust version specification
├── examples/            # Interaction examples
│   └── counter.rs       # Rust client for contract interaction
└── src/                 # Source code
    ├── lib.rs           # Counter contract implementation
    └── main.rs          # Off-chain utilities (optional)
```

## Getting Started

### Prerequisites

- Rust toolchain
- VS Code
- Docker
- Foundry's cast
- Nitro devnode

### Installation

1. Install the Stylus CLI:

```bash
cargo install --force cargo-stylus
```

2. Enable WebAssembly compilation:

```bash
rustup default stable
rustup target add wasm32-unknown-unknown
```

3. Verify installation:

```bash
cargo stylus --help
```

4. Clone this repository:

```bash
git clone https://github.com/SRobver/Building-Smart-Contracts-in-Rust-with-Arbitrum-Stylus.git && cd counter
```

## 🧩 Contract Implementation

This section provides an overview of the counter contract implementation. The contract is intentionally simple to focus on core Stylus concepts while demonstrating Rust's type safety and performance benefits.

### Architecture Overview

- **Single Storage Variable:** A persistent `number` field using `sol_storage!` macro for EVM-compatible storage
- **Public Interface:** Five methods accessible externally: read, set, increment, add, multiply
- **Event Logging:** Emits events for state changes to enable off-chain monitoring
- **Error Handling:** Safe arithmetic operations to prevent underflow/overflow

### Key Code Components

**Storage Declaration:**

```rust
sol_storage! {
    #[entrypoint]
    pub struct Counter {
        uint256 number;
    }
}
```

**Public Methods:**

```rust
#[public]
impl Counter {
    pub fn number(&self) -> U256 {
        self.number.get()
    }

    pub fn increment(&mut self) {
        let number = self.number.get();
        self.number.set(number + U256::from(1));
    }

    pub fn set_number(&mut self, new_number: U256) {
        self.number.set(new_number);
    }

    pub fn add_number(&mut self, new_number: U256) -> Result<(), Vec<u8>> {
        let current = self.number.get();
        self.number.set(current + new_number);
        Ok(())
    }

    pub fn mul_number(&mut self, new_number: U256) -> Result<(), Vec<u8>> {
        let current = self.number.get();
        self.number.set(current * new_number);
        Ok(())
    }
}
```

**Security Considerations:**

- All write operations are protected (no access control in this simple example)
- Arithmetic operations are safe but unchecked for educational purposes
- In production, add overflow checks and access controls

## Testnet Details

Find all necessary testnet resources—faucets, RPC URLs, etc.—[here](https://docs.arbitrum.io/stylus/reference/testnet-information).

## Local Development Environment

Before deploying to testnet, you'll want to test your contract locally using the Arbitrum Nitro devnode.

**Launch Local Devnode:**

```bash
git clone https://github.com/OffchainLabs/nitro-devnode.git
cd nitro-devnode
./run-dev-node.sh
```

This starts a local Arbitrum chain at `http://localhost:8547` with a pre-funded wallet: `0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659`.

**Verify the devnode is running:**

```bash
cast block-number --rpc-url http://localhost:8547
```

Should return `0` or higher, confirming the local chain is active.

**Stop the devnode when done:**

```bash
docker compose down
```

Use this local environment to deploy and test your counter contract before moving to testnet.

## Contract Validation

Before deploying, validate your contract can be deployed and activated onchain:

```bash
cargo stylus check
```

Docker must be running for this command.

Example successful output:

```
Finished release [optimized] target(s) in 1.88s
Reading WASM file at stylus-hello-world/target/wasm32-unknown-unknown/release/stylus-hello-world.wasm
Compressed WASM size: 8.9 KB
Program succeeded Stylus onchain activation checks with Stylus version: 1
```

## Contract Deployment

### 1. Estimate Gas (without transaction)

```bash
cargo stylus deploy \
  --private-key-path=<PRIVKEY_FILE_PATH> \
  --estimate-gas
```

Example output:

```
Estimated gas for deployment: 1874876
```

### 2. Deploy Contract

```bash
cargo stylus deploy \
  --private-key-path=<PRIVKEY_FILE_PATH>
```

Successful output:

```
Compressed WASM size: 8.9 KB
Deploying program to address 0x457b1ba688e9854bdbed2f473f7510c476a3da09
Estimated gas: 1973450
Submitting tx...
Confirmed tx 0x42db…7311, gas used 1973450
Activating program at address 0x457b1ba688e9854bdbed2f473f7510c476a3da09
Estimated gas: 14044638
Submitting tx...
Confirmed tx 0x0bdb…3307, gas used 14044638
```

Your contract is now deployed and activated!

## ABI Generation

Generate the Solidity ABI for your contract:

```bash
cargo stylus export-abi
```

This will output:

```solidity
/**
 * This file was automatically generated by Stylus and represents a Rust program.
 * For more information, please see [The Stylus SDK](https://github.com/OffchainLabs/stylus-sdk-rs).
 */

// SPDX-License-Identifier: MIT-OR-APACHE-2.0
pragma solidity ^0.8.23;

interface ICounter {
    function number() external view returns (uint256);

    function setNumber(uint256 new_number) external;

    function mulNumber(uint256 new_number) external;

    function addNumber(uint256 new_number) external;

    function increment() external;
}
```

## Interacting with the Contract

### Rust Interaction Example

See `examples/counter.rs` for a complete example using ethers-rs:

```rust
abigen!(
    Counter,
    r#"[
        function number() external view returns (uint256)
        function setNumber(uint256 number) external
        function increment() external
    ]"#
);

// Configure environment with:
// RPC_URL, STYLUS_CONTRACT_ADDRESS, PRIV_KEY_PATH
// in a .env file or environment variables

let provider = alchemy_provider(&rpc_url).await?;
let client = LocalWallet::from_str(&priv_key, &provider.clone())?;
let counter = Counter::new(counter_address, &provider.into());

// Read current value
let current_value = counter.number().call().await?;
println!("Current counter value: {:?}", current_value);

// Update counter value
let _ = counter.increment().send().await?.await?;
let new_value = counter.number().call().await?;
println!("New counter value: {:?}", new_value);
```

Run with:

```bash
cargo run --example counter
```

### Foundry's Cast

#### Calling a Function

```bash
cast call \
  --rpc-url <RPC_URL> \
  --private-key <PRIVATE_KEY> \
  [contract-address] "number()(uint256)"
```

Example output:

```
0
```

#### Sending a Transaction

```bash
cast send \
  --rpc-url <RPC_URL> \
  --private-key <PRIVATE_KEY> \
  [contract-address] "increment()"
```

After incrementing, you can call the number() function again to see the updated value.

## 🧪 Testing

Comprehensive testing is crucial for smart contract reliability. This project includes unit tests that validate contract behavior in an isolated environment.

The test file (`tests/test_counter.rs`) demonstrates testing with Stylus SDK's testing utilities:

```rust
#[cfg(test)]
mod test {
    use super::*;
    use alloy_primitives::U256;
    use stylus_sdk::testing::*;

    #[test]
    fn test_counter_operations() {
        let vm = TestVM::default();
        let mut contract = Counter::from(&vm);

        // Initial state is zero
        assert_eq!(contract.number().unwrap(), U256::ZERO);

        // Test increment
        contract.increment().unwrap();
        assert_eq!(contract.number().unwrap(), U256::from(1));

        // Test set number
        contract.set_number(U256::from(5)).unwrap();
        assert_eq!(contract.number().unwrap(), U256::from(5));

        // Test add number
        contract.add_number(U256::from(3)).unwrap();
        assert_eq!(contract.number().unwrap(), U256::from(8));

        // Test multiply number
        contract.mul_number(U256::from(2)).unwrap();
        assert_eq!(contract.number().unwrap(), U256::from(16));
    }
}
```

Run tests with:

```bash
cargo test
```

**Testing Best Practices:**

- Test all public methods thoroughly
- Include edge cases (zero values, large numbers)
- Use descriptive test names
- Test state changes and return values
- Consider integration tests for complex scenarios

## 🔗 Resources

| Resource             | Link/Description                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Arbitrum Stylus Docs | [docs.arbitrum.io/stylus](https://docs.arbitrum.io/stylus)                                 |
| Stylus Examples      | [github.com/OffchainLabs/stylus-examples](https://github.com/OffchainLabs/stylus-examples) |
| Stylus SDK           | [crates.io/crates/stylus-sdk](https://crates.io/crates/stylus-sdk)                         |
| Cargo Stylus CLI     | [github.com/OffchainLabs/cargo-stylus](https://github.com/OffchainLabs/cargo-stylus)       |
| Alloy Primitives     | [docs.rs/alloy-primitives](https://docs.rs/alloy-primitives)                               |
| Arbitrum Discord     | [discord.gg/arbitrum](https://discord.gg/arbitrum) (#stylus channel)                       |

## 🚀 Next Steps

Now that you've mastered the basics with this counter contract, extend your skills with more advanced smart contracts:

1. **Access Control:** Add ownable or access control patterns for secure contract ownership
2. **Event Logging:** Emit events for all state changes to enable comprehensive off-chain tracking
3. **Gas Optimization:** Profile gas usage with `cargo stylus trace` and optimize WASM output
4. **NFT Contract:** Build an ERC-721 token contract using the sibling `nft-dapp` project
5. **Multi-Call Patterns:** Implement batch operations to reduce transaction costs
6. **Testing Frameworks:** Integrate Foundry for advanced EVM testing alongside Rust unit tests
7. **Frontend Integration:** Create a web interface using ethers.js or web3.js for user interactions

**Why Rust + Stylus?**

Stylus enables writing production-grade smart contracts in Rust, combining:

- **Performance:** WebAssembly execution up to 50% cheaper than Solidity
- **Safety:** Compile-time guarantees prevent unauthorized access and logic errors
- **Tooling:** Rich ecosystem with Cargo, rust-analyzer, and clippy for superior developer experience
- **Interoperability:** Seamless interaction with existing Ethereum infrastructure

Deploy confidently—Stylus is production-ready for Arbitrum One. For questions, join the Arbitrum Discord #stylus channel!

+++

## Customization Options

- Add dependencies in `Cargo.toml` for advanced features like pausable functionality
- Use `cargo stylus new --minimal` for a leaner setup if building from scratch
- For advanced WASM optimization, consult [cargo-stylus documentation](https://github.com/OffchainLabs/cargo-stylus)
