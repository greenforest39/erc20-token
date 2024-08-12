# Token

Custom ERC20 Token Contract

# Local Development

The following assumes the use of `node@>=10`.

## Install Dependencies

`npm install`

## Compile Contracts

`npx hardhat compile`

## Run Tests

`npx hardhat test`

# Deployment

`npx hardhat run scripts/deploy.js --network NETWORK`

`NETWORK` can be `mainnet`, `rinkeby` or `ropsten`, any network you want to deploy to.

# How to use

Here are custom methods of our `Token` contract.

### registerBackUpAddress(address backup)

Register backup address for a token holder.

### emergencyTransfer(address from, uint8 v, bytes32 r, bytes32 s)

Transfer tokens from `from` to its registered backup address using his signature.

Any user with the signature can call this method.

### transfer(address to, uint256 amount)

Transfer `amount` of tokens to `to` address.

If the `to` is blacklisted, the tokens are then transferred to previously used backup address.
