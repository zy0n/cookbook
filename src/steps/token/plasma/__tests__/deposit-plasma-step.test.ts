import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { DepositPlasmaTokenStep } from '../deposit-plasma-step';
import { BigNumber } from 'ethers';
import { RecipeERC20Info, StepInput } from '../../../../models/export-models';
import { NetworkName } from '@railgun-community/shared-models';

chai.use(chaiAsPromised);
const { expect } = chai;

const networkName = NetworkName.Ethereum;

const erc20Info: RecipeERC20Info = {
  tokenAddress: '0xe76C6c83af64e4C60245D8C7dE953DF673a7A33D',
  decimals: 18,
};
const amount = BigNumber.from('10000');

describe('deposit-plasma-step', () => {
  it('Should create deposit-plasma step with amount', async () => {
    const step = new DepositPlasmaTokenStep(amount);
    const { plasmaAddress } = step.getPlasmaInfo(networkName);
    const wethInfo = step.getWethInfo();

    const stepInput: StepInput = {
      networkName,
      erc20Amounts: [
        {
          tokenAddress: wethInfo.tokenAddress,
          decimals: wethInfo.decimals,
          expectedBalance: BigNumber.from('12000'),
          minBalance: BigNumber.from('12000'),
          approvedSpender: plasmaAddress,
        },
      ],
      nfts: [],
    };
    const output = await step.getValidStepOutput(stepInput);

    expect(output.name).to.equal('Deposit PlasmaToken');
    expect(output.description).to.equal(
      'Wraps WETH for Plasma Token. This deposit earns rewards on flashLending fees.',
    );

    // Transferred
    expect(output.spentERC20Amounts).to.deep.equal([
      {
        amount,
        recipient: plasmaAddress,
        tokenAddress: wethInfo.tokenAddress,
        decimals: 18,
      },
    ]);

    // Change
    expect(output.outputERC20Amounts).to.deep.equal([
      {
        approvedSpender: undefined,
        expectedBalance: amount,
        minBalance: amount,
        tokenAddress: plasmaAddress,
        decimals: 18,
      },
      {
        approvedSpender: plasmaAddress,
        expectedBalance: BigNumber.from('2000'),
        minBalance: BigNumber.from('2000'),
        tokenAddress: wethInfo.tokenAddress,
        decimals: 18,
      },
    ]);

    expect(output.spentNFTs).to.equal(undefined);
    expect(output.outputNFTs).to.deep.equal([]);

    expect(output.feeERC20AmountRecipients).to.equal(undefined);

    expect(output.populatedTransactions).to.deep.equal([
      {
        data: '0xb6b55f250000000000000000000000000000000000000000000000000000000000002710',
        to: plasmaAddress,
      },
    ]);
    expect(output.populatedTransactions[0].to).to.equal(plasmaAddress);
  });

  it('Should create deposit-plasma step without amount', async () => {
    const step = new DepositPlasmaTokenStep();
    const { plasmaAddress } = step.getPlasmaInfo(networkName);
    const wethInfo = step.getWethInfo();

    const stepInput: StepInput = {
      networkName,
      erc20Amounts: [
        {
          tokenAddress: wethInfo.tokenAddress,
          decimals: wethInfo.decimals,
          expectedBalance: BigNumber.from('12000'),
          minBalance: BigNumber.from('12000'),
          approvedSpender: plasmaAddress,
        },
      ],
      nfts: [],
    };
    const output = await step.getValidStepOutput(stepInput);

    // Transferred
    expect(output.spentERC20Amounts).to.deep.equal([
      {
        amount: BigNumber.from('12000'),
        recipient: plasmaAddress,
        tokenAddress: wethInfo.tokenAddress,
        decimals: 18,
      },
    ]);

    // Change
    expect(output.outputERC20Amounts).to.deep.equal([
      {
        approvedSpender: undefined,
        expectedBalance: BigNumber.from('12000'),
        minBalance: BigNumber.from('12000'),
        tokenAddress: plasmaAddress,
        decimals: 18,
      },
    ]);

    expect(output.spentNFTs).to.equal(undefined);
    expect(output.outputNFTs).to.deep.equal([]);

    expect(output.feeERC20AmountRecipients).to.equal(undefined);

    expect(output.populatedTransactions).to.deep.equal([
      {
        data: '0xb6b55f250000000000000000000000000000000000000000000000000000000000002ee0',
        to: plasmaAddress,
      },
    ]);
  });

  it('Should test deposit-plasma step error cases', async () => {
    const step = new DepositPlasmaTokenStep(amount);
    const { plasmaAddress } = step.getPlasmaInfo(networkName);
    const wethInfo = step.getWethInfo();

    // No matching erc20 inputs
    const stepInputNoERC20s: StepInput = {
      networkName,
      erc20Amounts: [],
      nfts: [],
    };
    await expect(step.getValidStepOutput(stepInputNoERC20s)).to.be.rejectedWith(
      'Deposit PlasmaToken step is invalid. No step inputs match filter.',
    );

    // Too low balance for invalidToken input
    const stepInputInvalidToken: StepInput = {
      networkName,
      erc20Amounts: [
        {
          tokenAddress: erc20Info.tokenAddress,
          decimals: erc20Info.decimals,
          expectedBalance: BigNumber.from('12000'),
          minBalance: BigNumber.from('12000'),
          approvedSpender: plasmaAddress,
        },
      ],
      nfts: [],
    };
    await expect(
      step.getValidStepOutput(stepInputInvalidToken),
    ).to.be.rejectedWith(
      'Deposit PlasmaToken step is invalid. No step inputs match filter.',
    );

    // Too low balance for erc20 input
    const stepInputLowBalance: StepInput = {
      networkName,
      erc20Amounts: [
        {
          tokenAddress: wethInfo.tokenAddress,
          decimals: wethInfo.decimals,
          expectedBalance: BigNumber.from('2000'),
          minBalance: BigNumber.from('2000'),
          approvedSpender: plasmaAddress,
        },
      ],
      nfts: [],
    };
    await expect(
      step.getValidStepOutput(stepInputLowBalance),
    ).to.be.rejectedWith(
      'Deposit PlasmaToken step is invalid. Specified amount 10000 exceeds balance 2000.',
    );
  });
});
