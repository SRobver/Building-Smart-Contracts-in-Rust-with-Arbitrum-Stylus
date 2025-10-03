# Build with Stylus: Rust Edition

This guide walks you through creating a production-grade ERC-20 token smart contract, "CandyToken" (🍬), using Rust on Arbitrum's Stylus platform. Stylus leverages WebAssembly (WASM) for high-performance, EVM-compatible smart contracts, combining Rust's type safety with Arbitrum's scalability. We'll scaffold a modular project, implement a reusable ERC-20 engine, validate it, and deploy to a local Arbitrum devnet.

**What You'll Achieve:**

- A type-safe, reusable ERC-20 implementation with mint, burn, and transfer logic.
- Hands-on experience with Stylus SDK (`sol_storage!`, Alloy primitives).
- A deployed contract on a local chain, ready for testing or frontend integration.

---

## 🛠️ Prerequisites and Setup

Ensure your environment is ready for Rust smart contract development. You'll need tools for coding, testing, and running a local Arbitrum chain.

### Required Tools

| Tool                   | Purpose                                         | Installation                                                                                                                             |
| ---------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Rust Toolchain**     | Stable (1.81+ recommended) for WASM compilation | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh`<br>Verify: `rustup --version`, `rustc --version`, `cargo --version`    |
| **Docker**             | Runs the Nitro devnode (local Arbitrum chain)   | Install from [docker.com](https://www.docker.com). Ensure Docker Desktop is running.                                                     |
| **Foundry (Cast CLI)** | Interacts with contracts (e.g., call, send)     | `curl -L https://foundry.paradigm.xyz \| bash`<br>then `foundryup`                                                                       |
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

- Launches an Arbitrum chain at `http://localhost:8547` (RPC endpoint).
- Provides a pre-funded wallet: `0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659`.
- Wait for "Node is ready" in logs. Stop with `docker compose down`.

2. Verify the node:
   ```bash
   cast block-number --rpc-url http://localhost:8547
   ```
   - Should return `0` or higher, confirming the chain is live.

---

## 🔧 Step 2: Install Cargo Stylus CLI

The Cargo Stylus CLI compiles Rust to WASM, validates contracts, and handles deployment to Arbitrum.

1. Install:

   ```bash
   cargo install --force cargo-stylus
   ```

2. Configure Rust for WASM:

   ```bash
   rustup default stable
   rustup target add wasm32-unknown-unknown
   ```

3. Verify:
   ```bash
   cargo stylus --help
   ```
   - Lists commands: `new`, `check`, `deploy`, `estimate-gas`, etc.

**Note**: If toolchain issues arise, run `rustup override set stable` in your project directory.

---

## 📦 Step 3: Scaffold a Stylus Project

Create a new project to house our CandyToken ERC-20 contract.

1. Generate the project:

   ```bash
   cargo stylus new candy-token
   cd candy-token
   ```

   **Structure**:

   ```
   candy-token/
   ├── Cargo.toml          # Dependencies and config
   ├── rust-toolchain.toml # Pins Rust version
   ├── src/
   │   ├── lib.rs         # Contract entrypoint
   │   └── main.rs        # Off-chain testing (optional)
   ├── examples/           # Sample contracts (delete if unused)
   └── README.md
   ```

2. Update `Cargo.toml` (ensure these dependencies):

   ```toml
   [dependencies]
   stylus-sdk = "0.4"
   alloy-primitives = "0.7"
   alloc = { version = "0.0.0", optional = true }

   [lib]
   crate-type = ["cdylib", "rlib"]  # For WASM and testing
   ```

**Tip**: Remove `examples/counter.rs` to focus on ERC-20. Run `cargo check` for initial validation.

---

## 🧩 Step 4: Implement the ERC-20 Token

We'll split the contract into two modules for modularity:

- `erc20.rs`: Generic ERC-20 logic (balances, transfers, events).
- `lib.rs`: CandyToken-specific configuration and entrypoint.

Rust's type safety prevents bugs (e.g., overflows), and Stylus SDK integrates seamlessly with EVM storage and calls.

### 🔹 `src/erc20.rs`: Generic ERC-20 Engine

Create `src/erc20.rs` for reusable token logic. Add `mod erc20;` to `src/lib.rs`.

#### Imports

```rust
extern crate alloc;
use alloc::string::String;
use alloy_primitives::{Address, U256};
use alloy_sol_types::sol;
use core::marker::PhantomData;
use stylus_sdk::{prelude::*, stylus_core::log};
```

- `alloc`: Supports WASM's no-std environment.
- `alloy_primitives`: Ethereum types (`Address`, `U256`).
- `sol_storage!` and `sol!`: Stylus macros for storage and ABI.

#### Token Configuration Trait

```rust
pub trait Erc20Params {
    const NAME: &'static str;
    const SYMBOL: &'static str;
    const DECIMALS: u8;
}
```

- Defines token metadata, enabling reuse for any ERC-20.

#### Storage Layout

```rust
sol_storage! {
    pub struct Erc20<T> {
        mapping(address => uint256) balances;
        mapping(address => mapping(address => uint256)) allowances;
        uint256 total_supply;
        PhantomData<T> phantom;  // Type-safe linkage
    }
}
```

- Mirrors Solidity mappings for balances and allowances.
- `PhantomData`: Binds storage to the token's params.

#### Events and Errors

```rust
sol! {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error InsufficientBalance(address from, uint256 have, uint256 want);
    error InsufficientAllowance(address owner, address spender, uint256 have, uint256 want);
}
```

- Events for EVM compatibility; errors for detailed reverts.

#### Internal Logic

Safe operations with checked arithmetic:

```rust
impl<T: Erc20Params> Erc20<T> {
    pub fn _transfer(&mut self, from: Address, to: Address, value: U256) -> Result<(), Erc20Error> {
        let from_balance = self.balances.get(from);
        if from_balance < value {
            return Err(Erc20Error::InsufficientBalance(from, from_balance, value));
        }
        self.balances.set(from, from_balance - value);
        self.balances.set(to, self.balances.get(to) + value);
        Transfer(from, to, value).emit();
        Ok(())
    }

    pub fn mint(&mut self, to: Address, value: U256) -> Result<(), Erc20Error> {
        self.total_supply.set(self.total_supply.get() + value);
        self.balances.set(to, self.balances.get(to) + value);
        Transfer(Address::zero(), to, value).emit();
        Ok(())
    }

    pub fn burn(&mut self, from: Address, value: U256) -> Result<(), Erc20Error> {
        let from_balance = self.balances.get(from);
        if from_balance < value {
            return Err(Erc20Error::InsufficientBalance(from, from_balance, value));
        }
        self.balances.set(from, from_balance - value);
        self.total_supply.set(self.total_supply.get() - value);
        Transfer(from, Address::zero(), value).emit();
        Ok(())
    }
}
```

#### Public ERC-20 Interface

```rust
#[public]
impl<T: Erc20Params> Erc20<T> {
    pub fn name() -> String { T::NAME.to_string() }
    pub fn symbol() -> String { T::SYMBOL.to_string() }
    pub fn decimals() -> u8 { T::DECIMALS }

    pub fn total_supply(&self) -> U256 { self.total_supply.get() }
    pub fn balance_of(&self, owner: Address) -> U256 { self.balances.get(owner) }

    pub fn transfer(&mut self, to: Address, value: U256) -> Result<bool, Erc20Error> {
        self._transfer(msg::sender(), to, value)?;
        Ok(true)
    }

    pub fn transfer_from(&mut self, from: Address, to: Address, value: U256) -> Result<bool, Erc20Error> {
        let allowance = self.allowances.get(from).get(msg::sender());
        if allowance < value {
            return Err(Erc20Error::InsufficientAllowance(from, msg::sender(), allowance, value));
        }
        self.allowances.get(from).set(msg::sender(), allowance - value);
        self._transfer(from, to, value)?;
        Ok(true)
    }

    pub fn approve(&mut self, spender: Address, value: U256) -> bool {
        self.allowances.get(msg::sender()).set(spender, value);
        Approval(msg::sender(), spender, value).emit();
        true
    }

    pub fn allowance(&self, owner: Address, spender: Address) -> U256 {
        self.allowances.get(owner).get(spender)
    }
}
```

### 🔹 `src/lib.rs`: CandyToken Entrypoint

Define the specific token and its entrypoint.

#### Imports

```rust
extern crate alloc;
mod erc20;
use alloy_primitives::{Address, U256};
use stylus_sdk::prelude::*;
use crate::erc20::{Erc20, Erc20Params, Erc20Error};
```

#### Token Metadata

```rust
struct CandyTokenParams;
impl Erc20Params for CandyTokenParams {
    const NAME: &'static str = "CandyToken";
    const SYMBOL: &'static str = "CANDY";
    const DECIMALS: u8 = 18;
}
```

#### Contract Entrypoint

```rust
sol_storage! {
    #[entrypoint]
    struct CandyToken {
        #[borrow]
        Erc20<CandyTokenParams> erc20;
    }
}
```

#### Public Methods

```rust
#[public]
#[inherit(Erc20<CandyTokenParams>)]
impl CandyToken {
    pub fn mint(&mut self, value: U256) -> Result<(), Erc20Error> {
        self.erc20.mint(msg::sender(), value)
    }

    pub fn mint_to(&mut self, to: Address, value: U256) -> Result<(), Erc20Error> {
        self.erc20.mint(to, value)
    }

    pub fn burn(&mut self, value: U256) -> Result<(), Erc20Error> {
        self.erc20.burn(msg::sender(), value)
    }
}
```

**Security Note**: Add an `owner` field and `only_owner` checks for `mint_to` in production.

---

## 🧪 Step 5: Build, Validate, and Deploy

Compile and deploy the contract to the local devnet.

1. **Build**:

   ```bash
   cargo stylus build
   ```

   - Produces WASM in `target/stylus/`. Use `cargo clippy` for linting.

2. **Validate**:

   ```bash
   cargo stylus check --endpoint http://localhost:8547
   ```

   - Ensures contract compatibility with Stylus.

3. **Estimate Gas**:

   ```bash
   cargo stylus deploy --endpoint http://localhost:8547 \
     --private-key 0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659 \
     --estimate-gas
   ```

   - Example output:
     ```
     deployment tx gas: 7123737
     gas price: "0.100000000" gwei
     deployment tx total cost: "0.000712373700000000" ETH
     ```

4. **Deploy**:
   ```bash
   cargo stylus deploy --endpoint http://localhost:8547 \
     --private-key 0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659
   ```
   - Example output:
     ```
     deployed code at address: 0x33f54de59419570a9442e788f5dd5cf635b3c7ac
     deployment tx hash: 0xa55efc05c45efc63647dff5cc37ad328a47ba5555009d92ad4e297bf4864de36
     wasm already activated!
     ```

**Interact**: Mint tokens:

```bash
cast send <address> "mint(uint256)" 1000000000000000000 --private-key <key> --rpc-url http://localhost:8547
```

**Debugging**: If deployment fails, check WASM size (<256KB) with `cargo stylus trace`.

---

## 🔗 Resources

| Resource             | Link/Description                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Arbitrum Stylus Docs | [docs.arbitrum.io/stylus](https://docs.arbitrum.io/stylus)                                 |
| Stylus Examples      | [github.com/OffchainLabs/stylus-examples](https://github.com/OffchainLabs/stylus-examples) |
| Stylus SDK           | [crates.io/crates/stylus-sdk](https://crates.io/crates/stylus-sdk)                         |
| Cargo Stylus CLI     | [github.com/OffchainLabs/stylus-cli](https://github.com/OffchainLabs/stylus-cli)           |
| Alloy Primitives     | [docs.rs/alloy-primitives](https://docs.rs/alloy-primitives/latest/alloy_primitives/)      |
| Arbitrum Discord     | [discord.gg/arbitrum](https://discord.gg/arbitrum) (#stylus channel)                       |

---

## 🚀 Next Steps

1. **Unit Tests**: Add tests in `tests/` with `cargo test`. Use Foundry for EVM simulations.
2. **Frontend**: Build a dApp with ethers.js or wagmi (scaffold via `create-eth-app`).
3. **Enhancements**:
   - **Access Control**: Add `only_owner` for `mint_to`.
   - **Pausable**: Implement a pause mechanism.
   - **Extensions**: Add EIP-2612 (`permit`) for gasless approvals.
   - **Upgrades**: Use proxies for upgradability.
4. **Testnet Deployment**: Target Arbitrum Sepolia with faucet ETH.
5. **Optimize**: Profile gas with `cargo stylus trace`. Rust contracts are ~20-50% cheaper than Solidity.

**Why Stylus + Rust?**

- **Performance**: WASM is faster and cheaper than EVM.
- **Safety**: Rust's borrow checker prevents reentrancy and overflow bugs.
- **Tooling**: Cargo, clippy, and rust-analyzer streamline development.
- **Interoperability**: Call Solidity contracts via Alloy.

Build, audit, and deploy with confidence—Stylus is ready for Arbitrum One! For issues, check the repo or join the Arbitrum Discord.

---
