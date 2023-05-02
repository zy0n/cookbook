[![Node.js CI Actions Status](https://github.com/Railgun-Community/cookbook/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/Railgun-Community/cookbook/actions)

# RAILGUN Cookbook

Write a recipe in minutes to convert your dApp to a zkApp.

## Get the Recipe Builder

`yarn add @railgun-community/cookbook`

## Bake a Recipe and call it with RAILGUN Quickstart

```
// Set up initial parameters.
const sellToken = {tokenAddress: 'DAI'};
const buyToken = {tokenAddress: 'WETH'};
const slippagePercentage = 0.01;

// Use RAILGUN Cookbook to generate auto-validated multi-call transactions from a recipe.
const swap = new ZeroXSwapRecipe(sellToken, buyToken, slippagePercentage);

// Pass inputs that will be unshielded from private balance.
const amount = BigNumber.from(10).pow(18).mul(3000); // 3000 DAI
const unshieldERC20Amounts = [{ tokenAddress: 'DAI', amount }];
const recipeInput = {networkName, unshieldERC20Amounts};
const {populatedTransactions, shieldERC20Addresses} = await swap.getRecipeOutput(recipeInput);

// Use RAILGUN Quickstart to generate a private [unshield -> call -> re-shield] enclosing the recipe.
const crossContractCallsSerialized = populatedTransactions.map(
    serializeUnsignedTransaction,
)
const {gasEstimateString} = await gasEstimateForUnprovenCrossContractCalls(
    ...
    crossContractCallsSerialized,
    ...
)
const {error} = await generateCrossContractCallsProof(
    ...
    crossContractCallsSerialized,
    ...
)
const {serializedTransaction} = await populateProvedCrossContractCalls(
    ...
    crossContractCallsSerialized,
    ...
);

// Submit transaction to RPC.
// Note: use @railgun-community/waku-relayer-client to submit through Relayer.
const transaction = deserializeTransaction(serializedTransaction);
await wallet.sendTransaction(transaction);
```

## Write your own Custom Recipe and Steps

TODO

# Testing

## Run unit tests

`yarn test` to run tests without Ganache Fork.

## Run integration tests (beta)

`yarn test-fork` to run all tests, including Ganache Fork tests.

These tests are currently in beta - there are a number of issues with test setup.

If you see one of the following error messages, please run the test suite again:

1. "socket hang up"
2. "Error: RPC connection error."
