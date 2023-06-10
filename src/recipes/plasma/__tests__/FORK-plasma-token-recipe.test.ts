import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { PlasmaTokenRecipe } from '../plasma-token-recipe';
import { BigNumber } from 'ethers';
import { RecipeInput } from '../../../models/export-models';
import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';
import { setRailgunFees } from '../../../init';
import { getGanacheProvider } from '../../../test/shared.test';
import {
  MOCK_SHIELD_FEE_BASIS_POINTS,
  MOCK_UNSHIELD_FEE_BASIS_POINTS,
} from '../../../test/mocks.test';
import {
  executeRecipeStepsAndAssertUnshieldBalances,
  shouldSkipForkTest,
} from '../../../test/common.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const networkName = NetworkName.Ethereum;

const toAddress = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
const amount = BigNumber.from('10000');
const tokenAddress = NETWORK_CONFIG[networkName].baseToken.wrappedAddress;

describe('FORK-plasma-token-recipe', function run() {
  this.timeout(120000);

  before(async function run() {
    if (shouldSkipForkTest(networkName)) {
      this.skip();
      return;
    }
    setRailgunFees(
      networkName,
      MOCK_SHIELD_FEE_BASIS_POINTS,
      MOCK_UNSHIELD_FEE_BASIS_POINTS,
    );
  });

  it('[FORK] Should run plasma-token-recipe with amount', async function run() {
    if (shouldSkipForkTest(networkName)) {
      this.skip();
      return;
    }

    const recipe = new PlasmaTokenRecipe('Wrap', amount);
    const recipeInput: RecipeInput = {
      networkName,
      erc20Amounts: [
        {
          tokenAddress,
          decimals: 18,
          amount: BigNumber.from('12000'),
        },
      ],
      nfts: [],
    };

    const provider = getGanacheProvider();
    const initialToAddressETHBalance = await provider.getBalance(toAddress);

    const recipeOutput = await recipe.getRecipeOutput(recipeInput);
    await executeRecipeStepsAndAssertUnshieldBalances(
      recipe.config.name,
      recipeInput,
      recipeOutput,
      2_800_000, // expectedGasWithin50K
    );

    // REQUIRED TESTS:

    // 1. Add New Private Balance expectations.
    // N/A

    // 2. Add External Balance expectations.

    // const toAddressETHBalance = await provider.getBalance(toAddress);
    // const expectedToAddressETHBalance = initialToAddressETHBalance.sub(amount); // Sent amount
    // expect(toAddressETHBalance.toString()).to.equal(
    //   expectedToAddressETHBalance.toString(),
    // );
  });

  it('[FORK] Should run plasma-token-recipe without amount', async function run() {
    if (shouldSkipForkTest(networkName)) {
      this.skip();
      return;
    }

    const recipe = new PlasmaTokenRecipe('Wrap');
    const recipeInput: RecipeInput = {
      networkName,
      erc20Amounts: [
        {
          tokenAddress,
          decimals: 18,
          amount: BigNumber.from('12000'),
        },
      ],
      nfts: [],
    };
    const provider = getGanacheProvider();
    const initialToAddressETHBalance = await provider.getBalance(toAddress);

    const recipeOutput = await recipe.getRecipeOutput(recipeInput);

    // expect(recipeOutput.stepOutputs).to.deep.equal([]);

    await executeRecipeStepsAndAssertUnshieldBalances(
      recipe.config.name,
      recipeInput,
      recipeOutput,
      2_800_000, // expectedGasWithin50K
    );

    // REQUIRED TESTS:

    // 1. Add New Private Balance expectations.
    // N/A

    // 2. Add External Balance expectations.

    // const toAddressETHBalance = await provider.getBalance(toAddress);
    // const expectedToAddressETHBalance = initialToAddressETHBalance.sub('11970'); // Full unshield balance minus fee
    // expect(toAddressETHBalance.toString()).to.equal(
    //   expectedToAddressETHBalance.toString(),
    //   'to-address ETH balance is incorrect',
    // );
  });
});
