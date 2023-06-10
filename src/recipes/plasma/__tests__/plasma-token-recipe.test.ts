import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { PlasmaTokenRecipe } from '../plasma-token-recipe';
import { BigNumber } from 'ethers';
import { RecipeInput } from '../../../models/export-models';
import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';
import { setRailgunFees } from '../../../init';
import {
  MOCK_SHIELD_FEE_BASIS_POINTS,
  MOCK_UNSHIELD_FEE_BASIS_POINTS,
} from '../../../test/mocks.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const networkName = NetworkName.Ethereum;
const toAddress = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
const amount = BigNumber.from(10000);

const tokenAddress = NETWORK_CONFIG[networkName].baseToken.wrappedAddress;

describe('plasma-token-recipe', () => {
  before(() => {
    setRailgunFees(
      networkName,
      MOCK_SHIELD_FEE_BASIS_POINTS,
      MOCK_UNSHIELD_FEE_BASIS_POINTS,
    );
  });

  it('Should create plasma-token-recipe with amount', async () => {
    const recipe = new PlasmaTokenRecipe('Wrap', amount);

    const recipeInput: RecipeInput = {
      networkName,
      erc20Amounts: [
        {
          tokenAddress,
          decimals: 18,
          isBaseToken: false,
          amount: BigNumber.from(12000),
        },
      ],
      nfts: [],
    };
    const output = await recipe.getRecipeOutput(recipeInput);

    expect(output.stepOutputs.length).to.equal(4);

    // expect(output.stepOutputs).to.deep.equal([]);

    expect(output.stepOutputs[0]).to.deep.equal(
      {
        name: 'Unshield',
        description: 'Unshield ERC20s and NFTs from private RAILGUN balance.',
        feeERC20AmountRecipients: [
          {
            amount: BigNumber.from('30'),
            recipient: 'RAILGUN Unshield Fee',
            tokenAddress,
            decimals: 18,
          },
        ],
        outputERC20Amounts: [
          {
            tokenAddress,
            expectedBalance: BigNumber.from('11970'),
            minBalance: BigNumber.from('11970'),
            approvedSpender: undefined,
            isBaseToken: false,
            decimals: 18,
          },
        ],
        outputNFTs: [],
        populatedTransactions: [],
      },
      'Unshield Step',
    );
    // approval before this, add test for that

    expect(output.stepOutputs[2]).to.deep.equal(
      {
        name: 'Deposit PlasmaToken',
        description:
          'Wraps WETH for Plasma Token. This deposit earns rewards on flashLending fees.',
        // feeERC20AmountRecipients: [
        //   // {
        //   //   amount: BigNumber.from('0x00'),
        //   //   recipient: 'PLASMA Deposit Fee',
        //   //   tokenAddress,
        //   //   decimals: 18,
        //   // },
        // ],
        outputERC20Amounts: [
          {
            // Wrapped - WETH into Plasma
            approvedSpender: undefined,
            isBaseToken: false,
            expectedBalance: BigNumber.from('10000'), // 10000
            minBalance: BigNumber.from('10000'), // 10000
            tokenAddress: '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503',
            decimals: 18,
          },
          {
            // Change - Wrapped ETH
            approvedSpender: undefined,
            expectedBalance: BigNumber.from('1970'),
            minBalance: BigNumber.from('1970'),
            tokenAddress,
            isBaseToken: false,
            decimals: 18,
          },
        ],
        outputNFTs: [],
        populatedTransactions: [
          {
            data: '0xe2bbb15800000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000002710',
            to: '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503',
          },
        ],
        spentERC20Amounts: [
          {
            amount: BigNumber.from('10000'),
            recipient: '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503',
            tokenAddress,
            decimals: 18,
          },
        ],
      },
      'Deposit Plasma Step',
    );

    // expect(output.stepOutputs[2]).to.deep.equal({
    //   name: 'Transfer Base Token',
    //   description: 'Transfers base token to an external public address.',
    //   outputERC20Amounts: [
    //     {
    //       approvedSpender: undefined,
    //       expectedBalance: BigNumber.from('1970'),
    //       minBalance: BigNumber.from('1970'),
    //       tokenAddress,
    //       isBaseToken: false,
    //       decimals: 18,
    //     },
    //   ],
    //   outputNFTs: [],
    //   populatedTransactions: [
    //     {
    //       data: '0xc2e9ffd800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000000',
    //       to: '0x4025ee6512DBbda97049Bcf5AA5D38C54aF6bE8a',
    //     },
    //   ],
    //   spentERC20Amounts: [
    //     {
    //       amount: BigNumber.from('10000'),
    //       isBaseToken: true,
    //       tokenAddress,
    //       recipient: toAddress,
    //       decimals: 18,
    //     },
    //   ],
    // });

    expect(output.stepOutputs[3]).to.deep.equal(
      {
        name: 'Shield',
        description: 'Shield ERC20s and NFTs into private RAILGUN balance.',
        feeERC20AmountRecipients: [
          {
            amount: BigNumber.from('25'),
            recipient: 'RAILGUN Shield Fee',
            tokenAddress: '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503',
            decimals: 18,
          },
          {
            amount: BigNumber.from('4'),
            recipient: 'RAILGUN Shield Fee',
            tokenAddress,
            decimals: 18,
          },
        ],
        outputERC20Amounts: [
          {
            approvedSpender: undefined,
            expectedBalance: BigNumber.from('9975'),
            minBalance: BigNumber.from('9975'),
            tokenAddress: '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503',
            isBaseToken: false,
            decimals: 18,
          },
          {
            approvedSpender: undefined,
            expectedBalance: BigNumber.from('1966'),
            minBalance: BigNumber.from('1966'),
            tokenAddress,
            isBaseToken: false,
            decimals: 18,
          },
        ],
        outputNFTs: [],
        populatedTransactions: [],
      },
      'Shield Step',
    );
    // expect(output.erc20Amounts).to.deep.equal([]);

    expect(
      output.erc20Amounts.map(({ tokenAddress }) => tokenAddress),
    ).to.deep.equal(
      [tokenAddress, '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503'].map(
        tokenAddress => tokenAddress.toLowerCase(),
      ),
    );

    expect(output.nfts).to.deep.equal([]);

    const populatedTransactionsFlattened = output.stepOutputs.flatMap(
      stepOutput => stepOutput.populatedTransactions,
    );
    expect(output.populatedTransactions).to.deep.equal(
      populatedTransactionsFlattened,
    );

    expect(output.feeERC20AmountRecipients).to.deep.equal([
      {
        amount: BigNumber.from('30'),
        recipient: 'RAILGUN Unshield Fee',
        tokenAddress,
        decimals: 18,
      },
      {
        amount: BigNumber.from('25'),
        recipient: 'RAILGUN Shield Fee',
        tokenAddress: '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503',
        decimals: 18,
      },
      {
        amount: BigNumber.from('4'),
        recipient: 'RAILGUN Shield Fee',
        tokenAddress,
        decimals: 18,
      },
    ]);
  });

  it('Should create plasma-token-recipe without amount', async () => {
    const recipe = new PlasmaTokenRecipe('Wrap');

    const recipeInput: RecipeInput = {
      networkName,
      erc20Amounts: [
        {
          tokenAddress,
          decimals: 18,
          isBaseToken: false,
          amount: BigNumber.from('12000'),
        },
      ],
      nfts: [],
    };
    const output = await recipe.getRecipeOutput(recipeInput);

    expect(output.stepOutputs[0]).to.deep.equal(
      {
        name: 'Unshield',
        description: 'Unshield ERC20s and NFTs from private RAILGUN balance.',
        feeERC20AmountRecipients: [
          {
            amount: BigNumber.from('30'),
            recipient: 'RAILGUN Unshield Fee',
            tokenAddress,
            decimals: 18,
          },
        ],
        outputERC20Amounts: [
          {
            tokenAddress,
            expectedBalance: BigNumber.from('11970'),
            minBalance: BigNumber.from('11970'),
            approvedSpender: undefined,
            isBaseToken: false,
            decimals: 18,
          },
        ],
        outputNFTs: [],
        populatedTransactions: [],
      },
      'Unshield Step',
    );
    // approval before this, add test for that
    expect(output.stepOutputs[2]).to.deep.equal(
      {
        name: 'Deposit PlasmaToken',
        description:
          'Wraps WETH for Plasma Token. This deposit earns rewards on flashLending fees.',
        outputERC20Amounts: [
          {
            // Wrapped - ETH
            approvedSpender: undefined,
            isBaseToken: false,
            expectedBalance: BigNumber.from('11970'),
            minBalance: BigNumber.from('11970'),
            tokenAddress: '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503',
            decimals: 18,
          },
        ],
        outputNFTs: [],
        populatedTransactions: [
          {
            data: '0xe2bbb1580000000000000000000000000000000000000000000000000000000000002ec20000000000000000000000000000000000000000000000000000000000002ec2',
            to: '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503',
          },
        ],
        spentERC20Amounts: [
          {
            amount: BigNumber.from('11970'),
            recipient: '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503',
            tokenAddress,
            decimals: 18,
          },
        ],
      },
      'Deposit Plasma Step',
    );

    // expect(output.stepOutputs[2]).to.deep.equal({
    //   name: 'Transfer Base Token',
    //   description: 'Transfers base token to an external public address.',
    //   outputERC20Amounts: [],
    //   outputNFTs: [],
    //   populatedTransactions: [
    //     {
    //       data: '0xc2e9ffd800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000000',
    //       to: '0x4025ee6512DBbda97049Bcf5AA5D38C54aF6bE8a',
    //     },
    //   ],
    //   spentERC20Amounts: [
    //     {
    //       amount: BigNumber.from('11970'),
    //       isBaseToken: true,
    //       tokenAddress,
    //       recipient: toAddress,
    //       decimals: 18,
    //     },
    //   ],
    // });

    expect(output.stepOutputs[3]).to.deep.equal(
      {
        name: 'Shield',
        description: 'Shield ERC20s and NFTs into private RAILGUN balance.',
        outputERC20Amounts: [
          {
            decimals: 18,
            expectedBalance: BigNumber.from(11941),
            minBalance: BigNumber.from(11941),
            tokenAddress: '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503',
            approvedSpender: undefined,
            isBaseToken: false,
          },
        ],
        outputNFTs: [],
        feeERC20AmountRecipients: [
          {
            amount: BigNumber.from(29),
            recipient: 'RAILGUN Shield Fee',
            tokenAddress: '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503',
            decimals: 18,
          },
        ],
        populatedTransactions: [],
      },
      'Shield Step',
    );

    expect(
      output.erc20Amounts.map(({ tokenAddress }) => tokenAddress),
    ).to.deep.equal(
      [tokenAddress, '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503'].map(
        tokenAddress => tokenAddress.toLowerCase(),
      ),
    );

    expect(output.nfts).to.deep.equal([]);

    const populatedTransactionsFlattened = output.stepOutputs.flatMap(
      stepOutput => stepOutput.populatedTransactions,
    );
    expect(output.populatedTransactions).to.deep.equal(
      populatedTransactionsFlattened,
    );

    expect(output.feeERC20AmountRecipients).to.deep.equal(
      [
        {
          amount: BigNumber.from('30'),
          recipient: 'RAILGUN Unshield Fee',
          tokenAddress,
          decimals: 18,
        },
        {
          amount: BigNumber.from('29'),
          recipient: 'RAILGUN Shield Fee',
          tokenAddress: '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503',
          decimals: 18,
        },
      ],
      'Check feeERC20AmountRecipients',
    );
  });

  it('Should test plasma-token-recipe error cases', async () => {
    const recipe = new PlasmaTokenRecipe('Wrap', amount);

    // No matching erc20 inputs
    const recipeInputNoMatch: RecipeInput = {
      networkName,
      erc20Amounts: [
        {
          tokenAddress: '0x1234',
          decimals: 18,
          amount: BigNumber.from('12000'),
        },
      ],
      nfts: [],
    };
    await expect(recipe.getRecipeOutput(recipeInputNoMatch)).to.be.rejectedWith(
      'First input for this recipe must contain ERC20 Amount: 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    );

    // Too low balance for erc20 input
    const recipeInputTooLow: RecipeInput = {
      networkName,
      erc20Amounts: [
        {
          tokenAddress,
          decimals: 18,
          isBaseToken: false,
          amount: BigNumber.from('2000'),
        },
      ],
      nfts: [],
    };

    await expect(recipe.getRecipeOutput(recipeInputTooLow)).to.be.rejectedWith(
      'Approve ERC20 Spender step is invalid. Specified amount 10000 exceeds balance 1995.',
    );
  });
});
