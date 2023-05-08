import { StepInput, UniswapV2Fork } from '../../../models/export-models';
import { UniV2LikeSDK } from '../../../api/uniswap/uni-v2-like-sdk';
import { NetworkName } from '@railgun-community/shared-models';
import { RecipeERC20Amount } from '../../../models';
import { ApproveERC20SpenderStep } from '../../../steps/token/erc20/approve-erc20-spender-step';
import { UniV2LikeAddLiquidityStep } from '../../../steps/liquidity/uni-v2-like/UniV2LikeAddLiquidityStep';
import { BaseProvider } from '@ethersproject/providers';
import { Step } from '../../../steps/step';
import { AddLiquidityRecipe } from '../add-liquidity-recipe';

export class UniV2LikeAddLiquidityRecipe extends AddLiquidityRecipe {
  readonly config = {
    name: '[Name] Add Liquidity Recipe',
    description: 'Adds liquidity to a Uniswap V2-like pair.',
    hasNonDeterministicOutput: true,
  };

  private readonly uniswapV2Fork: UniswapV2Fork;

  private readonly erc20AmountA: RecipeERC20Amount;
  private readonly erc20AmountB: RecipeERC20Amount;

  private readonly slippagePercentage: number;
  private readonly provider: BaseProvider;

  constructor(
    uniswapV2Fork: UniswapV2Fork,
    erc20AmountA: RecipeERC20Amount,
    erc20AmountB: RecipeERC20Amount,
    slippagePercentage: number,
    provider: BaseProvider,
  ) {
    super();
    this.uniswapV2Fork = uniswapV2Fork;

    this.erc20AmountA = erc20AmountA;
    this.erc20AmountB = erc20AmountB;
    this.slippagePercentage = slippagePercentage;
    this.provider = provider;

    const forkName = UniV2LikeSDK.getForkName(uniswapV2Fork);
    this.config.name = `${forkName} Add Liquidity Recipe`;
  }

  protected supportsNetwork(networkName: NetworkName): boolean {
    return UniV2LikeSDK.supportsForkAndNetwork(this.uniswapV2Fork, networkName);
  }

  protected async getInternalSteps(
    firstInternalStepInput: StepInput,
  ): Promise<Step[]> {
    const { networkName } = firstInternalStepInput;

    this.addLiquidityData = await UniV2LikeSDK.getAddLiquidityData(
      this.uniswapV2Fork,
      networkName,
      this.erc20AmountA,
      this.erc20AmountB,
      this.slippagePercentage,
      this.provider,
    );

    return [
      new ApproveERC20SpenderStep(
        this.addLiquidityData.routerContract,
        this.erc20AmountA,
      ),
      new ApproveERC20SpenderStep(
        this.addLiquidityData.routerContract,
        this.erc20AmountB,
      ),
      new UniV2LikeAddLiquidityStep(this.uniswapV2Fork, this.addLiquidityData),
    ];
  }
}
