import { BigNumber } from '@ethersproject/bignumber';
import {
  RecipeERC20AmountRecipient,
  RecipeERC20Info,
  StepInput,
  StepOutputERC20Amount,
  UnvalidatedStepOutput,
} from '../../../models/export-models';
import { compareERC20Info, isApprovedForSpender } from '../../../utils/token';
import { Step } from '../../step';
import { BeefyVaultData } from '../../../api/beefy';
import { BeefyVaultContract } from '../../../contract/vault/beefy-vault-contract';
import { calculateOutputsForBeefyDeposit } from './beefy-util';

export class BeefyDepositStep extends Step {
  readonly config = {
    name: 'Beefy Vault Deposit',
    description: 'Deposits into a yield-bearing Beefy Vault.',
  };

  private readonly vault: BeefyVaultData;

  constructor(vault: BeefyVaultData) {
    super();
    this.vault = vault;
  }

  protected async getStepOutput(
    input: StepInput,
  ): Promise<UnvalidatedStepOutput> {
    const {
      vaultID,
      vaultName,
      depositERC20Address,
      depositERC20Decimals,
      vaultContractAddress,
      vaultTokenAddress,
      vaultRate,
      depositFee,
    } = this.vault;
    const { erc20Amounts } = input;

    const depositERC20Info: RecipeERC20Info = {
      tokenAddress: depositERC20Address,
    };
    const { erc20AmountForStep, unusedERC20Amounts } =
      this.getValidInputERC20Amount(
        erc20Amounts,
        erc20Amount =>
          compareERC20Info(erc20Amount, depositERC20Info) &&
          isApprovedForSpender(erc20Amount, vaultContractAddress),
        undefined, // amount
      );

    const contract = new BeefyVaultContract(vaultContractAddress);
    const populatedTransaction = await contract.createDepositAll();

    const {
      depositFeeAmount,
      depositAmountAfterFee,
      receivedVaultTokenAmount,
    } = calculateOutputsForBeefyDeposit(
      erc20AmountForStep.expectedBalance,
      depositFee,
      depositERC20Decimals,
      vaultRate,
    );

    const spentERC20AmountRecipient: RecipeERC20AmountRecipient = {
      ...depositERC20Info,
      amount: depositAmountAfterFee,
      recipient: `${vaultName} Vault`,
    };
    const outputERC20Amount: StepOutputERC20Amount = {
      tokenAddress: vaultTokenAddress,
      expectedBalance: receivedVaultTokenAmount,
      minBalance: receivedVaultTokenAmount,
      approvedSpender: undefined,
    };
    const feeERC20Amount: RecipeERC20AmountRecipient = {
      ...depositERC20Info,
      amount: depositFeeAmount,
      recipient: `${vaultName} Vault Deposit Fee`,
    };

    return {
      populatedTransactions: [populatedTransaction],
      spentERC20Amounts: [spentERC20AmountRecipient],
      outputERC20Amounts: [outputERC20Amount, ...unusedERC20Amounts],
      spentNFTs: [],
      outputNFTs: input.nfts,
      feeERC20AmountRecipients: [feeERC20Amount],
    };
  }
}
