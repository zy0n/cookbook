import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { UnshieldMultiTransferRecipe } from '../unshield-multi-transfer';
import {
  RecipeERC20Info,
  RecipeInput,
  RecipeOutput,
  StepInput,
} from '../../../models/export-models';
import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';
import { setRailgunFees } from '../../../init';
import { BigNumber } from 'ethers';
import { ERC20Transfer } from '../../../steps/adapt/transfer-erc20-token-multi-step';
import { getShieldFee, getUnshieldFee } from '../../../utils/fee';
chai.use(chaiAsPromised);
const { expect } = chai;

const networkName = NetworkName.Ethereum;
const toAddress = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
const toAddress2 = '0x5b33D097820A0197cdF939E050cF57ECbA11279A';
const toUnshieldAmount = BigNumber.from('12000');
const toSpendAmount = BigNumber.from('5000');
const toSpendAmount2 = BigNumber.from('5250');
const expectedFinalBalance = toUnshieldAmount
  .sub(toSpendAmount)
  .sub(toSpendAmount2);
const erc20Info: RecipeERC20Info = {
  tokenAddress: '0xe76c6c83af64e4c60245d8c7de953df673a7a33d',
  decimals: 18,
};
describe('unshield-multi-transfer-recipe', () => {
  before(() => {
    setRailgunFees(networkName, '25', '25');
  });

  it('Should Unshield and then transfer tokens.', async () => {
    // const transferTokens: ERC20Transfer[] = [
    //   {
    //     toAddress,
    //     tokenInfo: erc20Info,
    //     amount: toSpendAmount,
    //   },
    //   {
    //     toAddress: toAddress2,
    //     tokenInfo: erc20Info,
    //     amount: toSpendAmount2,
    //   },
    // ];
    const recipe = new UnshieldMultiTransferRecipe();

    await recipe.createTransfer(
      toAddress,
      toSpendAmount,
      erc20Info.tokenAddress,
      erc20Info.decimals,
    );

    await recipe.createTransfer(
      toAddress2,
      toSpendAmount2,
      erc20Info.tokenAddress,
      erc20Info.decimals,
    );

    const firstStepInput: StepInput = {
      networkName,
      erc20Amounts: [
        {
          ...erc20Info,
          expectedBalance: toUnshieldAmount,
          minBalance: toUnshieldAmount,
          approvedSpender: undefined,
        },
      ],
      nfts: [],
    };

    // @ts-expect-error
    const steps = await recipe.getFullSteps(firstStepInput);

    expect(steps.map(step => step.config.name)).to.deep.equal([
      'Unshield',
      'Transfer ERC20 Token Multi',
      'Shield',
    ]);

    // Check outputs
    const recipeInput: RecipeInput = {
      networkName: networkName,
      erc20Amounts: [
        {
          ...erc20Info,
          amount: BigNumber.from('12000'),
        },
      ],
      nfts: [],
    };
    const output = await recipe.getRecipeOutput(recipeInput);

    // Transferred
    expect(output.stepOutputs[0].spentERC20Amounts).to.deep.equal([]);
    expect(output.stepOutputs[1].spentERC20Amounts).to.deep.equal(
      [
        {
          amount: toSpendAmount,
          recipient: toAddress,
          ...erc20Info,
        },
        {
          amount: toSpendAmount2,
          recipient: toAddress2,
          ...erc20Info,
        },
      ],
      'Checking Multi Transfer outputs',
    );

    // Unspent Change

    const unshieldBalanceFee = getUnshieldFee(networkName, toUnshieldAmount);

    const unshieldBalanceWithFee = toUnshieldAmount.sub(unshieldBalanceFee);
    const shieldBalanceFee = getShieldFee(
      networkName,
      unshieldBalanceWithFee.sub(toSpendAmount).sub(toSpendAmount2),
    );
    const shieldBalanceWithFee = expectedFinalBalance
      .sub(shieldBalanceFee)
      .sub(unshieldBalanceFee);
    // chceck unshield outputs
    expect(output.stepOutputs[0].outputERC20Amounts).to.deep.equal(
      [
        {
          ...erc20Info,
          isBaseToken: undefined,
          approvedSpender: undefined,
          expectedBalance: unshieldBalanceWithFee,
          minBalance: unshieldBalanceWithFee,
        },
      ],
      'Check Unshield Outputs',
    );

    // check transfer outputs
    expect(output.stepOutputs[1].outputERC20Amounts).to.deep.equal(
      [
        {
          ...erc20Info,
          isBaseToken: undefined,
          approvedSpender: undefined,
          expectedBalance: expectedFinalBalance.sub(unshieldBalanceFee), // pre sheild fee
          minBalance: expectedFinalBalance.sub(unshieldBalanceFee),
        },
      ],
      'Check Transfer Outputs',
    );

    // check shield outputs
    expect(output.stepOutputs[2].outputERC20Amounts).to.deep.equal(
      [
        {
          ...erc20Info,
          isBaseToken: undefined,
          approvedSpender: undefined,
          expectedBalance: shieldBalanceWithFee,
          minBalance: shieldBalanceWithFee,
        },
      ],
      'Check Shield Outputs',
    );
    expect(output.nfts).to.deep.equal([]);

    // const unspetMinBalance = maxBalanceWithFee
    //   .sub(amount)
    //   .sub(amount)
    //   .sub(minBalanceFee);
    // check unspent outputs.
    expect(output.erc20Amounts).to.deep.equal([
      {
        ...erc20Info,
        isBaseToken: undefined,
        amount: shieldBalanceWithFee,
      },
    ]);

    expect(output.feeERC20AmountRecipients).to.deep.equal([
      {
        ...erc20Info,
        amount: unshieldBalanceFee,
        recipient: 'RAILGUN Unshield Fee',
      },
      {
        ...erc20Info,
        amount: shieldBalanceFee,
        recipient: 'RAILGUN Shield Fee',
      },
    ]);

    // should pull the transaction apart, deserialize it
    // check amounts as above. otherwise
    expect(output.populatedTransactions).to.deep.equal([
      {
        data: '0xc2e9ffd8000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e76c6c83af64e4c60245d8c7de953df673a7a33d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000000013880000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e76c6c83af64e4c60245d8c7de953df673a7a33d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000005b33d097820a0197cdf939e050cf57ecba11279a0000000000000000000000000000000000000000000000000000000000001482',
        to: '0x4025ee6512DBbda97049Bcf5AA5D38C54aF6bE8a',
      },
    ]);
    expect(output.populatedTransactions[0].to).to.equal(
      NETWORK_CONFIG[networkName].relayAdaptContract,
    );
  });
});
