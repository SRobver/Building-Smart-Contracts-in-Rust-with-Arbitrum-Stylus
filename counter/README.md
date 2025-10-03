Stylus Hello World Template
This repository provides a beginner-friendly starter kit for developing Arbitrum Stylus smart contracts in Rust using the stylus-sdk. It features a Rust implementation of a simple counter contract, mirroring the following Solidity example:
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
uint256 public number;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }

}

For a minimal setup with the Stylus SDK, run:
cargo stylus new --minimal <YOUR_PROJECT_NAME>

Getting Started
Prerequisites
Ensure you have the following installed:

Rust toolchain (version 1.80 or later recommended)
VS Code (recommended for development)
Docker (required for running the Nitro devnode)
Foundry's Cast (for interacting with contracts)
Nitro devnode (for local testing)

Installing cargo-stylus
Install the Stylus CLI toolkit:
cargo install --force cargo-stylus cargo-stylus-check

Add WebAssembly as a build target:
rustup default 1.80
rustup target add wasm32-unknown-unknown --toolchain 1.80

Verify installation:
cargo stylus --help

Cloning the Template
Clone the repository and navigate to the project directory:
git clone https://github.com/OffchainLabs/stylus-hello-world && cd stylus-hello-world

Setting Up a Nitro Devnode
To run a local Arbitrum node for testing, set up a Nitro devnode:

Ensure Docker is running.
Run the Nitro devnode:

docker run --rm -it -p 8547:8547 -p 8548:8548 offchainlabs/nitro-node-dev:latest --init

This starts a local Arbitrum node with an RPC endpoint at http://localhost:8547. The devnode includes a pre-funded account with the private key:
0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659

Corresponding address: 0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0e.
For more details, refer to the Arbitrum Docs on running a local dev node.
Generating ABI
Generate a Solidity ABI for your Rust contract:
cargo stylus export-abi

Example output:
// SPDX-License-Identifier: MIT-OR-APACHE-2.0
pragma solidity ^0.8.23;

interface ICounter {
function number() external view returns (uint256);
function setNumber(uint256 new_number) external;
function mulNumber(uint256 new_number) external;
function addNumber(uint256 new_number) external;
function increment() external;
}

The export-abi feature is enabled in Cargo.toml:
[features]
export-abi = ["stylus-sdk/export-abi"]

Checking Contract Validity
Verify that your contract compiles to valid WASM and is deployable:
cargo stylus check

Note: Ensure the Nitro devnode (Docker) is running.
Success output:
Finished release [optimized] target(s) in 1.88s
Reading WASM file at stylus-hello-world/target/wasm32-unknown-unknown/release/stylus-hello-world.wasm
Compressed WASM size: 8.9 KB
Program succeeded Stylus onchain activation checks with Stylus version: 1

If the check fails, consult the Invalid Stylus WASM Contracts explainer.
Deploying the Contract
Estimating Gas
Estimate gas for deployment and activation using the pre-funded private key:
cargo stylus deploy \
 --endpoint='http://localhost:8547' \
 --private-key="0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659" \
 --estimate-gas

Example output:
deployment tx gas: 7123737
gas price: "0.100000000" gwei
deployment tx total cost: "0.000712373700000000" ETH

Full Deployment
Deploy and activate the contract on the local Nitro devnode:
cargo stylus deploy \
 --endpoint='http://localhost:8547' \
 --private-key="0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659"

Example output:
deployed code at address: 0x33f54de59419570a9442e788f5dd5cf635b3c7ac
deployment tx hash: 0xa55efc05c45efc63647dff5cc37ad328a47ba5555009d92ad4e297bf4864de36
wasm already activated!

Save the deployment address for future interactions.
Interacting with the Contract
Stylus contracts are EVM-compatible and can be interacted with using tools like Foundry's Cast or ethers-rs.
Calling the Contract
Check the counter's current value:
cast call --rpc-url 'http://localhost:8547' \
 --private-key 0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659 \
 [deployed-contract-address] "number()(uint256)"

Example output: 0 (initial counter value).
Sending a Transaction
Increment the counter:
cast send --rpc-url 'http://localhost:8547' \
 --private-key 0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659 \
 [deployed-contract-address] "increment()"

Example output:
blockHash 0xfaa2cce3b9995f3f2e2a2f192dc50829784da9ca4b7a1ad21665a25b3b161f7c
blockNumber 20
contractAddress
cumulativeGasUsed 97334
effectiveGasPrice 100000000
from 0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0e
gasUsed 97334
logs []
logsBloom 0x000...
status 1 (success)
transactionHash 0x28c6ba8a0b9915ed3acc449cf6c645ecc406a4b19278ec1eb67f5a7091d18f6b
transactionIndex 1
type 2

Verify the increment by calling number()(uint256) again.
Testing the Contract
Use the Stylus testing framework with TestVM to simulate the Stylus execution environment locally without deployment. Example test in tests/counter.rs: #[cfg(test)]
mod test {
use super::_;
use alloy_primitives::address;
use stylus_sdk::testing::_;

    #[test]
    fn test_counter_operations() {
        let vm = TestVM::default();
        let mut contract = Counter::from(&vm);

        // Test initial state
        assert_eq!(contract.number().unwrap(), U256::ZERO);

        // Test increment
        contract.increment().unwrap();
        assert_eq!(contract.number().unwrap(), U256::from(1));

        // Test set number
        contract.set_number(U256::from(5)).unwrap();
        assert_eq!(contract.number().unwrap(), U256::from(5));
    }

}

Add the following to Cargo.toml to enable testing:
[dev-dependencies]
stylus-sdk = { version = "0.8.4", features = ["stylus-test"] }

Run tests:
cargo test

The testing framework supports:

Simulating transaction context and block information
Testing contract storage operations
Verifying state transitions
Mocking contract-to-contract interactions
Testing scenarios without deployment costs

For advanced testing, see the Testing contracts with Stylus guide.
Customization Options
cargo stylus applies default WASM optimizations. For advanced control, see the cargo stylus README. To minimize WASM size, refer to optimization tips.
Exploring the Internals
The stylus-sdk simplifies Solidity transitions by expanding macros to plain Rust for WASM compilation. View expanded code with:
cargo install cargo-expand
cargo expand --all-features --release --target=<YOUR_ARCHITECTURE>

Find <YOUR_ARCHITECTURE> with rustc -vV | grep host (e.g., aarch64-apple-darwin for M1 Macs, x86_64-unknown-linux-gnu for x86 Linux).
