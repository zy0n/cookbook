import { BigNumber } from 'ethers';
import { RelayAdaptContract } from '../../contract/adapt/relay-adapt-contract';
import {
  RecipeERC20AmountRecipient,
  RecipeERC20Info,
  StepInput,
  StepOutputERC20Amount,
  UnvalidatedStepOutput,
} from '../../models/export-models';
import { compareERC20Info } from '../../utils/token';
import { Step } from '../step';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { RelayAdapt } from '../../abi-typechain/adapt/RelayAdapt';

export type ERC20Transfer = {
  toAddress: string;
  tokenInfo: RecipeERC20Info;
  amount?: BigNumber;
};

export class TransferERC20TokenMultiStep extends Step {
  readonly config = {
    name: 'Transfer ERC20 Token Multi',
    description:
      'Transfers a set of ERC20 tokens to many external public addresses.',
  };

  private readonly transfers: ERC20Transfer[];

  constructor(erc20TokenTransfers: ERC20Transfer[]) {
    super();
    this.transfers = erc20TokenTransfers;
  }

  protected async getStepOutput(
    input: StepInput,
  ): Promise<UnvalidatedStepOutput> {
    // start off with these inputs, but we'll pull the unusedERC20Amounts out
    // each loop and replace erc20Amounts with that.
    const { erc20Amounts } = input;
    const contract = new RelayAdaptContract(input.networkName);

    const spentERC20Amounts: RecipeERC20AmountRecipient[] = [];
    const erc20TokenTransfers: RelayAdapt.TokenTransferStruct[] = [];
    let lastUnusedERC20Amounts: StepOutputERC20Amount[] = erc20Amounts;

    for (const transfer of this.transfers) {
      const { toAddress, tokenInfo, amount } = transfer;

      const { erc20AmountForStep, unusedERC20Amounts } =
        this.getValidInputERC20Amount(
          lastUnusedERC20Amounts,
          erc20Amount => compareERC20Info(erc20Amount, tokenInfo),
          amount,
        );

      const erc20TokenTransfer = contract.createERC20TokenTransferStruct(
        toAddress,
        tokenInfo.tokenAddress,
        amount,
      );
      erc20TokenTransfers.push(erc20TokenTransfer);

      const transferredERC20Token: RecipeERC20AmountRecipient = {
        ...tokenInfo,
        amount: amount ?? erc20AmountForStep.expectedBalance,
        recipient: toAddress,
      };
      spentERC20Amounts.push(transferredERC20Token);
      lastUnusedERC20Amounts = unusedERC20Amounts;
    }

    const populatedTransactions: PopulatedTransaction[] = [
      await contract.createMultiERC20TokenTransfer(erc20TokenTransfers),
    ];

    return {
      populatedTransactions,
      spentERC20Amounts,
      outputERC20Amounts: lastUnusedERC20Amounts,
      spentNFTs: [],
      outputNFTs: input.nfts,
      feeERC20AmountRecipients: [],
    };
  }
}
