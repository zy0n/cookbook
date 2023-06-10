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
        return '0x1dBDba33dfA381bCC89FCe74DFF69Aa96B53b503';
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

  async createDeposit(
    amount: BigNumber,
    expectedAmount?: BigNumber,
  ): Promise<PopulatedTransaction> {
    if (!expectedAmount) {
      const recvShares = await this.calculateDepositReturn(amount);
      return this.contract.populateTransaction.deposit(amount, recvShares);
    }
    return this.contract.populateTransaction.deposit(amount, expectedAmount);
  }

  async createWithdraw(
    amount: BigNumber,
    expectedAmount?: BigNumber,
  ): Promise<PopulatedTransaction> {
    if (!expectedAmount) {
      const recvAssets = await this.calculateWithdrawReturn(amount);
      return this.contract.populateTransaction.withdraw(amount, recvAssets);
    }
    return this.contract.populateTransaction.withdraw(amount, expectedAmount);
  }

  async calculateDepositReturn(amount: BigNumber): Promise<BigNumber> {
    return await this.contract.calculateShares(amount);
  }

  async calculateWithdrawReturn(amount: BigNumber): Promise<BigNumber> {
    return await this.contract.calculateAssets(amount);
  }

  balanceOf(account: string): Promise<BigNumber> {
    return this.contract.balanceOf(account);
  }
}
