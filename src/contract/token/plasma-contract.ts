import { Contract } from '@ethersproject/contracts';
import { abi } from '../../abi-typechain/abi';
import { PlasmaToken } from '../../abi-typechain/plasma/Plasma';
import { BigNumber } from '@ethersproject/bignumber';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { BaseProvider } from '@ethersproject/providers';
import { NetworkName } from '@railgun-community/shared-models';

export class PlasmaTokenContract {
  private readonly contract: PlasmaToken;
  readonly address?: string;
  constructor(network: NetworkName, provider?: BaseProvider) {
    this.address = this.getContractAddressForNetwork(network);
    if (!this.address) {
      throw new Error(`Plasma Token is not deployed on ${network}.`);
    }
    this.contract = new Contract(
      this.address,
      abi.token.plasma,
      provider,
    ) as PlasmaToken;
  }

  /** deposit(uint256)
   *  withdraw(uint256)
   *  totalAssets()->(uint256)
   *  resyncPool() -> (uint256)
   *  calculateShares(uint256) -> (uint256)
   *  calculateAssets(uint256) -> (uint256)
   *
   */
  getContractAddressForNetwork(networkName: NetworkName): Optional<string> {
    switch (networkName) {
      case NetworkName.Ethereum:
        return '0x687bB6c57915aa2529EfC7D2a26668855e022fAE';
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

  createDeposit(amount: BigNumber): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.deposit(amount);
  }

  createWithdraw(amount: BigNumber): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.withdraw(amount);
  }

  calculateDepositReturn(amount: BigNumber): Promise<BigNumber> {
    return this.contract.calculateShares(amount);
  }

  calculateWithdrawReturn(amount: BigNumber): Promise<BigNumber> {
    return this.contract.calculateAssets(amount);
  }

  balanceOf(account: string): Promise<BigNumber> {
    return this.contract.balanceOf(account);
  }
}
