// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Stylus ^0.2.0

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]
extern crate alloc;

use alloc::vec;
use alloc::vec::Vec;
use alloc::string::String;
use openzeppelin_stylus::token::erc721::{self, Erc721, IErc721, extensions::IErc721Metadata};
use openzeppelin_stylus::utils::introspection::erc165::IErc165;
use stylus_sdk::abi::Bytes;
use stylus_sdk::alloy_primitives::{Address, FixedBytes, U256};
use stylus_sdk::prelude::*;
use stylus_sdk::storage::{StorageAddress, StorageU256, StorageString};
use stylus_sdk::msg;

#[entrypoint]
#[storage]
pub struct DEMONFT {
    erc721: Erc721,
    owner: StorageAddress,
    next_id: StorageU256,
    max_supply: StorageU256,
    name: StorageString,
    symbol: StorageString,
    base_uri: StorageString,
    token_uris_str: StorageString,
}

#[public]
impl DEMONFT {
    /// Initializes the contract. Sets the deployer as owner, name, symbol, base_uri, and max supply.
    pub fn init(&mut self, name: String, symbol: String, base_uri: String, max_supply: U256) {
        // Only allow init once
        if self.owner.get() != Address::ZERO {
            panic!("Already initialized");
        }
        self.owner.set(msg::sender());
        self.name.set_str(name.as_str());
        self.symbol.set_str(symbol.as_str());
        self.base_uri.set_str(base_uri.as_str());
        self.max_supply.set(max_supply);
        self.next_id.set(U256::ZERO);
    }

    /// Returns current total minted tokens.
    pub fn total_minted(&self) -> U256 {
        self.next_id.get()
    }

    /// Returns the contract owner.
    pub fn get_owner(&self) -> Address {
        self.owner.get()
    }

    /// Mints a new token to the specified address. Requires IPFS URI for token metadata.
    pub fn mint(&mut self, to: Address, uri: String) -> Result<U256, Vec<u8>> {
        let token_id = self.next_id.get();
        let supply_cap = self.max_supply.get();
        if supply_cap != U256::ZERO && token_id >= supply_cap {
            return Err(b"Max supply reached".to_vec());
        }

        // Call underlying Erc721 mint (unsafe, assume exists)
        self.erc721._mint(to, token_id)?;

        let mut current = self.token_uris_str.get_string();
        if !current.is_empty() {
            current.push('\n');
        }
        current.push_str(&uri);
        self.token_uris_str.set_str(current.as_str());

        self.next_id.set(token_id + U256::from(1));
        Ok(token_id)
    }
}

#[public]
impl IErc721 for DEMONFT {
    type Error = erc721::Error;

    #[selector(name = "balanceOf")]
    fn balance_of(&self, owner: Address) -> Result<U256, Self::Error> {
        Ok(self.erc721.balance_of(owner)?)
    }

    #[selector(name = "ownerOf")]
    fn owner_of(&self, token_id: U256) -> Result<Address, Self::Error> {
        Ok(self.erc721.owner_of(token_id)?)
    }

    #[selector(name = "safeTransferFrom")]
    fn safe_transfer_from_with_data(&mut self, from: Address, to: Address, token_id: U256, data: Bytes) -> Result<(), Self::Error> {
        Ok(self.erc721.safe_transfer_from_with_data(from, to, token_id, data)?)
    }

    #[selector(name = "safeTransferFrom")]
    fn safe_transfer_from(&mut self, from: Address, to: Address, token_id: U256) -> Result<(), Self::Error> {
        Ok(self.erc721.safe_transfer_from(from, to, token_id)?)
    }

    #[selector(name = "transferFrom")]
    fn transfer_from(&mut self, from: Address, to: Address, token_id: U256) -> Result<(), Self::Error> {
        Ok(self.erc721.transfer_from(from, to, token_id)?)
    }

    #[selector(name = "approve")]
    fn approve(&mut self, to: Address, token_id: U256) -> Result<(), Self::Error> {
        Ok(self.erc721.approve(to, token_id)?)
    }

    #[selector(name = "setApprovalForAll")]
    fn set_approval_for_all(&mut self, operator: Address, approved: bool) -> Result<(), Self::Error> {
        Ok(self.erc721.set_approval_for_all(operator, approved)?)
    }

    #[selector(name = "getApproved")]
    fn get_approved(&self, token_id: U256) -> Result<Address, Self::Error> {
        Ok(self.erc721.get_approved(token_id)?)
    }

    #[selector(name = "isApprovedForAll")]
    fn is_approved_for_all(&self, owner: Address, operator: Address) -> bool {
        self.erc721.is_approved_for_all(owner, operator)
    }
}

#[public]
impl IErc721Metadata for DEMONFT {
    type Error = erc721::Error;

    fn name(&self) -> String {
        self.name.get_string()
    }

    fn symbol(&self) -> String {
        self.symbol.get_string()
    }

    fn token_uri(&self, token_id: U256) -> Result<String, Self::Error> {
        // Check if token exists
        let _ = self.erc721.owner_of(token_id)?;
        let full = self.token_uris_str.get_string();
        let bytes = full.as_bytes();
        let mut pos = 0;
        let mut current_token = U256::ZERO;
        while let Some(offset) = bytes[pos..].iter().position(|&b| b == b'\n') {
            let start = pos;
            pos += offset;
            if current_token == token_id {
                let uri_bytes = &bytes[start..pos];
                return Ok(String::from_utf8_lossy(uri_bytes).into_owned());
            }
            current_token += U256::from(1);
            pos += 1; // skip \n
        }
        // Last one without \n
        if current_token == token_id && pos < bytes.len() {
            let uri_bytes = &bytes[pos..];
            Ok(String::from_utf8_lossy(uri_bytes).into_owned())
        } else {
            Ok(String::new())
        }
    }
}

#[public]
impl IErc165 for DEMONFT {
    fn supports_interface(&self, interface_id: FixedBytes<4>) -> bool {
        self.erc721.supports_interface(interface_id)
    }
}
