import { Recipe } from '../recipe';
import { Step } from '../../steps';
import {
  ERC20Transfer,
  TransferERC20TokenMultiStep,
} from '../../steps/adapt/transfer-erc20-token-multi-step';
import { BigNumber } from 'ethers';
import { RecipeERC20Info } from '../../models';
import { ERC20Contract } from '../../contract/token/erc20-contract';
import { promiseTimeout } from '@railgun-community/shared-models';

export class UnshieldMultiTransferRecipe extends Recipe {
  readonly config = {
    name: 'Unshield Multi-Transfer Recipe',
    description:
      'Unshields tokens and transfers them to multiple public addresses.',
  };
  private readonly transfers: ERC20Transfer[];

  constructor(erc20Transfers?: ERC20Transfer[]) {
    super();
    //add internal vars here.
    this.transfers = erc20Transfers ?? [];
  }

  protected async getERC20TokenRecipeInfo(
    tokenAddress: string,
    decimals?: number,
  ): Promise<RecipeERC20Info> {
    // creates

    if (decimals) {
      return {
        tokenAddress,
        decimals,
      };
    } else {
      // call the contract and find out, why the hell not. lol.
      const contract = new ERC20Contract(tokenAddress);
      const foundDecimals = await promiseTimeout(
        contract.decimals(),
        10000, // 10 second timeout on contract call. dont let it hang.
      ).catch(err => {
        throw new Error(`There was an error gathering token decimals. ${err}`);
      });
      return {
        tokenAddress,
        decimals: foundDecimals,
      };
    }
  }

  async createTransfer(
    toAddress: string,
    amount: BigNumber,
    tokenAddress: string,
    decimals?: number,
  ) {
    const tokenInfo = await this.getERC20TokenRecipeInfo(
      tokenAddress,
      decimals,
    );
    if (!tokenInfo) {
      return;
    }
    this.transfers.push({
      toAddress,
      tokenInfo,
      amount,
    });
  }

  protected supportsNetwork(): boolean {
    // this should support all of them by default, its just a basic transfer.
    return true;
  }

  protected async getInternalSteps(): Promise<Step[]> {
    // throw error if there are no transfers.
    if (this.transfers.length === 0) {
      throw new Error('There are no transfers added to the recipe.');
    }
    return [new TransferERC20TokenMultiStep(this.transfers)];
  }
}
