import { BigNumber } from 'ethers';
import {
  RecipeERC20AmountRecipient,
  RecipeERC20Info,
  StepConfig,
  StepInput,
  StepOutputERC20Amount,
  UnvalidatedStepOutput,
} from '../../../models/export-models';
import { compareERC20Info, isApprovedForSpender } from '../../../utils/token';
import { Step } from '../../step';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { PlasmaTokenContract } from '../../../contract/token/plasma-contract';
import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';

export class WithdrawPlasmaTokenStep extends Step {
  readonly config: StepConfig = {
    name: 'Withdraw PlasmaToken',
    description:
      'Unwraps Plasma for WETH. This withdraw earns rewards on flashLending fees.',
  };

  private readonly amount: Optional<BigNumber>;

  private readonly wethInfo: RecipeERC20Info = {
    tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    decimals: 18,
  };

  constructor(amount?: BigNumber) {
    super();
    this.amount = amount;
  }

  getWethInfo(): RecipeERC20Info {
    return this.wethInfo;
  }

  getAdaptInfo(network: NetworkName): string {
    return NETWORK_CONFIG[network].relayAdaptContract;
  }

  getPlasmaInfo(network: NetworkName) {
    const contract = new PlasmaTokenContract(network);
    const plasmaAddress = contract.getContractAddressForNetwork(network);

    return {
      contract,
      plasmaAddress,
    };
  }

  protected async getStepOutput(
    input: StepInput,
  ): Promise<UnvalidatedStepOutput> {
    const { erc20Amounts, networkName } = input;
    // check this against weth.
    const { contract, plasmaAddress } = this.getPlasmaInfo(networkName);
    if (!plasmaAddress) {
      throw new Error(`Plasma Token Address not found on chain ${networkName}`);
    }
    const { erc20AmountForStep, unusedERC20Amounts } =
      this.getValidInputERC20Amount(
        erc20Amounts,
        erc20Amount =>
          compareERC20Info(erc20Amount, {
            tokenAddress: plasmaAddress,
            decimals: this.wethInfo.decimals,
          }) && isApprovedForSpender(erc20Amount, plasmaAddress),
        this.amount,
      );

    const populatedTransactions: PopulatedTransaction[] = [
      await contract.createWithdraw(
        this.amount ?? erc20AmountForStep.expectedBalance,
      ),
    ];

    const transferredERC20: RecipeERC20AmountRecipient = {
      tokenAddress: plasmaAddress,
      decimals: this.wethInfo.decimals,
      amount: this.amount ?? erc20AmountForStep.expectedBalance,
      recipient: plasmaAddress,
    };

    // calculate the value
    const expectedBalance = this.amount ?? erc20AmountForStep.expectedBalance;

    const unwrappedPlasmaOutput: StepOutputERC20Amount = {
      tokenAddress: this.wethInfo.tokenAddress,
      decimals: this.wethInfo.decimals,
      expectedBalance: expectedBalance,
      minBalance: expectedBalance,
      approvedSpender: undefined,
    };

    return {
      populatedTransactions,
      spentERC20Amounts: [transferredERC20],
      outputERC20Amounts: [unwrappedPlasmaOutput, ...unusedERC20Amounts],
      outputNFTs: input.nfts,
    };
  }
}
