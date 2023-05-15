import { Recipe } from '../recipe';
import { Step, UnshieldStep } from '../../steps';

export class UnshieldMultiTransferRecipe extends Recipe {
  readonly config = {
    name: 'Unshield Multi-Transfer Recipe',
    description:
      'Unshields tokens and transfers them to multiple public addresses.',
  };

  constructor() {
    super();
    //add internal vars here.
  }

  protected supportsNetwork(): boolean {
    // this should support all of them by default, its just a basic transfer.
    return true;
  }

  protected async getInternalSteps(): Promise<Step[]> {
    const steps: Step[] = [];
    // loop through the erc20Amounts provided.
    // they should be tokenAddress, toAddress, amount
    // add erc20transfer step
    return steps;
  }
}
