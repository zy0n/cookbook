import { Recipe } from '../recipe';
import { BigNumber } from '@ethersproject/bignumber';
import { ApproveERC20SpenderStep, Step } from '../../steps';
import {
  RecipeConfig,
  RecipeERC20Info,
  StepInput,
} from '../../models/export-models';
import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';
import { findFirstInputERC20Amount } from '../../utils';
import { DepositPlasmaTokenStep } from '../../steps/token/plasma/deposit-plasma-step';
import { WithdrawPlasmaTokenStep } from '../../steps/token/plasma/withdraw-plasma-step';

export class PlasmaTokenRecipe extends Recipe {
  readonly config: RecipeConfig = {
    name: '{ACTION} Plasma Token',
    description: '{ACTION} wrapped token into base token.',
  };

  private readonly amount: Optional<BigNumber>;
  private readonly action: string;

  constructor(action: string, amount?: BigNumber) {
    super();
    this.amount = amount;
    this.action = action;
    this.config.name = `${action} Plasma Token`;
    this.config.description = `${action} ${action.toLowerCase()}ed token into plasma token.`;
  }

  protected getContractAddressForNetwork(
    networkName: NetworkName,
  ): Optional<string> {
    switch (networkName) {
      case NetworkName.Ethereum:
        return '0x9D3DA37d36BB0B825CD319ed129c2872b893f538';
      case NetworkName.Railgun:
      case NetworkName.BNBChain:
      case NetworkName.Polygon:
      case NetworkName.Arbitrum:
      case NetworkName.EthereumRopsten_DEPRECATED:
      case NetworkName.EthereumGoerli:
      case NetworkName.PolygonMumbai:
      case NetworkName.ArbitrumGoerli:
      case NetworkName.Hardhat:
        return undefined;
    }
  }

  protected supportsNetwork(networkName: NetworkName): boolean {
    switch (networkName) {
      case NetworkName.Ethereum:
        return true;
      case NetworkName.Railgun:
      case NetworkName.BNBChain:
      case NetworkName.Polygon:
      case NetworkName.Arbitrum:
      case NetworkName.EthereumRopsten_DEPRECATED:
      case NetworkName.EthereumGoerli:
      case NetworkName.PolygonMumbai:
      case NetworkName.ArbitrumGoerli:
      case NetworkName.Hardhat:
        return false;
    }
  }

  protected async getInternalSteps(
    firstInternalStepInput: StepInput,
  ): Promise<Step[]> {
    const { networkName } = firstInternalStepInput;
    const plasmaAddress = this.getContractAddressForNetwork(networkName);
    const { wrappedAddress } = NETWORK_CONFIG[networkName].baseToken;

    const approvalSpender =
      this.action === 'Wrap' ? wrappedAddress : plasmaAddress;

    if (!approvalSpender) {
      throw new Error('What the fudge');
    }
    const plasmaInfo: RecipeERC20Info = {
      tokenAddress: approvalSpender as string,
      decimals: 18,
    };
    const unshieldedAmount = findFirstInputERC20Amount(
      firstInternalStepInput.erc20Amounts,
      plasmaInfo,
    );
    // determine the action
    const { amount } = unshieldedAmount;
    // const internalAction =
    //   this.action === 'Wrap'
    //     ? new DepositPlasmaTokenStep(plasmaAmount)
    //     : new WithdrawPlasmaTokenStep(plasmaAmount);
    const plasmaAmount = this.amount ?? amount;
    return [
      new ApproveERC20SpenderStep(plasmaAddress, unshieldedAmount),
      this.action === 'Wrap'
        ? new DepositPlasmaTokenStep(plasmaAmount)
        : new WithdrawPlasmaTokenStep(plasmaAmount),
    ];
  }
}
