import { NetworkName } from '@railgun-community/shared-models';
import { CustomRecipe } from '../custom-recipe';
import { TransferERC20Step } from '../../steps';
import { StepInput } from '../../models';
const networkName = NetworkName.Ethereum;
const supportedNetworks = [networkName];

const recipe = new CustomRecipe(
  {
    name: 'unshield-multi-transfer',
    description:
      'This will unshield tokens, and transfer them to multiple public addresses.',
  },
  supportedNetworks,
);

// recipe.addStep(new TransferERC20Step());

const firstStepInput: StepInput = {
  networkName,
  erc20Amounts: [],
  nfts: [],
};
