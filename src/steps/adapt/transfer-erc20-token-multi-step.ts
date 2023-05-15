import { BigNumber } from 'ethers';
import { RelayAdaptContract } from '../../contract/adapt/relay-adapt-contract';
import {
  RecipeERC20AmountRecipient,
  RecipeERC20Info,
  StepInput,
  UnvalidatedStepOutput,
} from '../../models/export-models';
import { compareERC20Info } from '../../utils/token';
import { Step } from '../step';
import { PopulatedTransaction } from '@ethersproject/contracts';

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

  private readonly toAddress: string;
  private readonly tokenInfo: RecipeERC20Info;
  private readonly amount: Optional<BigNumber>;

  constructor(
    toAddress: string,
    tokenInfo: RecipeERC20Info,
    amount?: BigNumber,
  ) {
    super();
    this.toAddress = toAddress;
    (this.tokenInfo = tokenInfo), (this.amount = amount);
  }

  protected async getStepOutput(
    input: StepInput,
  ): Promise<UnvalidatedStepOutput> {
    const { erc20Amounts } = input;

    const { erc20AmountForStep, unusedERC20Amounts } =
      this.getValidInputERC20Amount(
        erc20Amounts,
        erc20Amount => compareERC20Info(erc20Amount, this.tokenInfo),
        this.amount,
      );

    const contract = new RelayAdaptContract(input.networkName);
    const populatedTransactions: PopulatedTransaction[] = [
      await contract.createERC20TokenTransfer(
        this.toAddress,
        this.tokenInfo.tokenAddress,
        this.amount,
      ),
    ];

    const transferredBaseToken: RecipeERC20AmountRecipient = {
      ...this.tokenInfo,
      amount: this.amount ?? erc20AmountForStep.expectedBalance,
      recipient: this.toAddress,
    };

    return {
      populatedTransactions,
      spentERC20Amounts: [transferredBaseToken],
      outputERC20Amounts: unusedERC20Amounts,
      spentNFTs: [],
      outputNFTs: input.nfts,
      feeERC20AmountRecipients: [],
    };
  }
}
