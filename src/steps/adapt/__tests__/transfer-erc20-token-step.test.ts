import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  ERC20Transfer,
  TransferERC20TokenMultiStep,
} from '../transfer-erc20-token-multi-step';
import { BigNumber } from 'ethers';
import { RecipeERC20Info, StepInput } from '../../../models/export-models';
import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';

chai.use(chaiAsPromised);
const { expect } = chai;

const networkName = NetworkName.Ethereum;
const toAddress = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
const toAddress2 = '0x5b33D097820A0197cdF939E050cF57ECbA11279A';
const amount = BigNumber.from('5000');
const erc20Info: RecipeERC20Info = {
  tokenAddress: '0xe76C6c83af64e4C60245D8C7dE953DF673a7A33D',
  decimals: 18,
};
describe('transfer-erc20-token-multi-step', () => {
  it('Should create transfer-erc20-token-multi step with amount', async () => {
    const testTransfers: ERC20Transfer[] = [
      {
        toAddress,
        tokenInfo: erc20Info,
        amount,
      },
      {
        toAddress: toAddress2,
        tokenInfo: erc20Info,
        amount,
      },
    ];

    const step = new TransferERC20TokenMultiStep(testTransfers);

    const stepInput: StepInput = {
      networkName,
      erc20Amounts: [
        {
          ...erc20Info,
          expectedBalance: BigNumber.from('12000'),
          minBalance: BigNumber.from('12000'),
          approvedSpender: undefined,
        },
      ],
      nfts: [],
    };
    const output = await step.getValidStepOutput(stepInput);

    expect(output.name).to.equal('Transfer ERC20 Token Multi');
    expect(output.description).to.equal(
      'Transfers a set of ERC20 tokens to many external public addresses.',
    );

    // Transferred
    expect(output.spentERC20Amounts).to.deep.equal([
      {
        amount,
        recipient: toAddress,
        ...erc20Info,
      },
      {
        amount,
        recipient: toAddress2,
        ...erc20Info,
      },
    ]);

    // Unspent Change
    expect(output.outputERC20Amounts).to.deep.equal([
      {
        ...erc20Info,
        approvedSpender: undefined,
        expectedBalance: BigNumber.from('2000'),
        minBalance: BigNumber.from('2000'),
      },
    ]);

    expect(output.spentNFTs).to.deep.equal([]);
    expect(output.outputNFTs).to.deep.equal([]);

    expect(output.feeERC20AmountRecipients).to.deep.equal([]);

    expect(output.populatedTransactions).to.deep.equal([
      {
        data: '0xc2e9ffd8000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e76c6c83af64e4c60245d8c7de953df673a7a33d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000000013880000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e76c6c83af64e4c60245d8c7de953df673a7a33d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000005b33d097820a0197cdf939e050cf57ecba11279a0000000000000000000000000000000000000000000000000000000000001388',
        to: '0x4025ee6512DBbda97049Bcf5AA5D38C54aF6bE8a',
      },
    ]);
    expect(output.populatedTransactions[0].to).to.equal(
      NETWORK_CONFIG[networkName].relayAdaptContract,
    );
  });

  it('Should create transfer-erc20-token-multi step without amount', async () => {
    const testTransfers: ERC20Transfer[] = [
      {
        toAddress,
        tokenInfo: erc20Info,
        amount,
      },
      {
        toAddress: toAddress2,
        tokenInfo: erc20Info,
      },
    ];

    const step = new TransferERC20TokenMultiStep(testTransfers);

    const stepInput: StepInput = {
      networkName,
      erc20Amounts: [
        {
          ...erc20Info,
          expectedBalance: BigNumber.from('12000'),
          minBalance: BigNumber.from('12000'),
          approvedSpender: undefined,
        },
      ],
      nfts: [],
    };
    const output = await step.getValidStepOutput(stepInput);

    // Transferred
    expect(output.spentERC20Amounts).to.deep.equal([
      {
        amount,
        recipient: toAddress,
        ...erc20Info,
      },
      {
        amount: BigNumber.from('12000').sub(amount),
        recipient: toAddress2,
        ...erc20Info,
      },
    ]);

    // Change
    expect(output.outputERC20Amounts).to.deep.equal([]);

    expect(output.spentNFTs).to.deep.equal([]);
    expect(output.outputNFTs).to.deep.equal([]);

    expect(output.feeERC20AmountRecipients).to.deep.equal([]);

    expect(output.populatedTransactions).to.deep.equal([
      {
        data: '0xc2e9ffd8000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e76c6c83af64e4c60245d8c7de953df673a7a33d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000000013880000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e76c6c83af64e4c60245d8c7de953df673a7a33d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000005b33d097820a0197cdf939e050cf57ecba11279a0000000000000000000000000000000000000000000000000000000000000000',
        to: '0x4025ee6512DBbda97049Bcf5AA5D38C54aF6bE8a',
      },
    ]);
  });

  // it('Should test transfer-base-token step error cases', async () => {
  //   const step = new TransferBaseTokenStep(toAddress, amount);

  //   // No matching erc20 inputs
  //   const stepInputNoERC20s: StepInput = {
  //     networkName,
  //     erc20Amounts: [
  //       {
  //         tokenAddress,
  //         decimals: 18,
  //         isBaseToken: false,
  //         expectedBalance: BigNumber.from('12000'),
  //         minBalance: BigNumber.from('12000'),
  //         approvedSpender: undefined,
  //       },
  //     ],
  //     nfts: [],
  //   };
  //   await expect(step.getValidStepOutput(stepInputNoERC20s)).to.be.rejectedWith(
  //     'Transfer Base Token step is invalid. No step inputs match filter.',
  //   );

  //   // Too low balance for erc20 input
  //   const stepInputLowBalance: StepInput = {
  //     networkName,
  //     erc20Amounts: [
  //       {
  //         tokenAddress,
  //         decimals: 18,
  //         isBaseToken: true,
  //         expectedBalance: BigNumber.from('2000'),
  //         minBalance: BigNumber.from('2000'),
  //         approvedSpender: undefined,
  //       },
  //     ],
  //     nfts: [],
  //   };
  //   await expect(
  //     step.getValidStepOutput(stepInputLowBalance),
  //   ).to.be.rejectedWith(
  //     'Transfer Base Token step is invalid. Specified amount 10000 exceeds balance 2000.',
  //   );
  // });
});
