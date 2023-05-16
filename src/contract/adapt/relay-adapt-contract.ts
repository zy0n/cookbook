import { Contract, PopulatedTransaction } from '@ethersproject/contracts';
import { abi } from '../../abi-typechain/abi';
import {
  RelayAdapt,
  TokenDataStruct,
} from '../../abi-typechain/adapt/RelayAdapt';
import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';
import { BigNumber } from '@ethersproject/bignumber';
import { ZERO_ADDRESS } from '../../models/constants';

export class RelayAdaptContract {
  private readonly contract: RelayAdapt;

  constructor(networkName: NetworkName) {
    const network = NETWORK_CONFIG[networkName];
    if (!network) {
      throw new Error(`Network not found: ${networkName}`);
    }
    if (!network.relayAdaptContract) {
      throw new Error('Address is required for Relay Adapt contract.');
    }
    this.contract = new Contract(
      network.relayAdaptContract,
      abi.adapt.relay,
    ) as RelayAdapt;
  }

  private createERC20TokenData(tokenAddress: string): TokenDataStruct {
    return {
      tokenAddress,
      tokenType: 0, // ERC20
      tokenSubID: ZERO_ADDRESS,
    };
  }

  createBaseTokenWrap(amount?: BigNumber): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.wrapBase(
      // 0 will automatically wrap full balance.
      amount ?? BigNumber.from(0),
    );
  }

  createBaseTokenUnwrap(amount?: BigNumber): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.unwrapBase(
      // 0 will automatically unwrap full balance.
      amount ?? BigNumber.from(0),
    );
  }

  createBaseTokenTransfer(
    toAddress: string,
    amount?: BigNumber,
  ): Promise<PopulatedTransaction> {
    const baseTokenTransfer = this.createTokenTransferStruct(
      toAddress,
      ZERO_ADDRESS,
      amount,
    );

    return this.contract.populateTransaction.transfer([baseTokenTransfer]);
  }

  createTokenTransferStruct(
    toAddress: string,
    tokenAddress: string,
    amount?: BigNumber,
  ): RelayAdapt.TokenTransferStruct {
    const erc20TokenData = this.createERC20TokenData(tokenAddress);

    const erc20TokenTransfer: RelayAdapt.TokenTransferStruct = {
      token: erc20TokenData,
      to: toAddress,
      // 0 will automatically transfer full balance.
      value: amount ?? BigNumber.from(0),
    };
    return erc20TokenTransfer;
  }

  createMultiERC20TokenTransfer(
    erc20TokenTransfers: RelayAdapt.TokenTransferStruct[],
  ): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.transfer(erc20TokenTransfers);
  }

  createERC20TokenTransfer(
    toAddress: string,
    tokenAddress: string,
    amount?: BigNumber,
  ): Promise<PopulatedTransaction> {
    const erc20TokenTransfer = this.createTokenTransferStruct(
      toAddress,
      tokenAddress,
      amount,
    );
    return this.contract.populateTransaction.transfer([erc20TokenTransfer]);
  }
}
