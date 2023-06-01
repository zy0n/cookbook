import ganache from 'ganache';
import { testConfig } from './test-config.test';
import { JsonRpcProvider } from '@ethersproject/providers';
import { ERC20Contract } from '../contract/token/erc20-contract';
import debug from 'debug';
import { getTestEthersWallet, setSharedTestRPCProvider } from './shared.test';
import { ethers } from 'ethers';
import { parseEther } from '@ethersproject/units';
import { getLocalhostRPC, getRPCPort } from './common.test';
import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';

const dbg = debug('rpc:setup');

export enum ForkRPCType {
  Ganache = 'ganache',
  Anvil = 'anvil',
}

export const setupTestRPCAndWallets = async (
  forkRPCType: ForkRPCType,
  networkName: NetworkName,
  tokenAddresses: string[],
) => {
  dbg(`Starting test RPC: ${networkName}...`);

  const chainId = NETWORK_CONFIG[networkName].chain.id;
  const port = getRPCPort(networkName);

  if (forkRPCType === ForkRPCType.Ganache) {
    const rpcServer = ganache.server({
      server: {},
      fork: {
        url: testConfig.ethereumForkRPC,
      },
      wallet: {
        mnemonic: testConfig.signerMnemonic,
      },
      chain: {
        chainId,
      },
      defaultTransactionGasLimit: 30_000_000,
      logging: {
        logger: {
          log: (msg: string) => {
            if (!testConfig.showVerboseLogs) {
              return;
            }
            dbg(msg);
          },
        },
      },
    });

    await rpcServer.listen(port);
    dbg('Ganache RPC server created and listening...');
  }

  const localhost = getLocalhostRPC(port);
  //'https://rpc.vnet.tenderly.co/devnet/plasma-test/2514bf13-81d7-4448-88d5-f361a4485205'; //
  const testRPCProvider = new JsonRpcProvider(localhost);
  setSharedTestRPCProvider(testRPCProvider);

  try {
    await testRPCProvider.getBlockNumber();
  } catch (err) {
    throw new Error(
      forkRPCType === ForkRPCType.Anvil
        ? `Could not connect to test RPC server. Please start anvil fork RPC for ${networkName} (see README).`
        : `Could not connect to test Ganache RPC server.`,
    );
  }
  if (forkRPCType === ForkRPCType.Anvil) {
    await testRPCProvider.send('anvil_reset', [{}]);
  }

  const wallet = getTestEthersWallet();
  const oneThousand18Decimals = parseEther('1000').toString();

  await Promise.all(
    tokenAddresses.map(async tokenAddress => {
      await setTokenBalance(
        forkRPCType,
        testRPCProvider,
        wallet.address,
        tokenAddress,
        oneThousand18Decimals, // 1000 WETH
      );
    }),
  );
};

const setTokenBalance = async (
  forkRPCType: ForkRPCType,
  provider: JsonRpcProvider,
  walletAddress: string,
  tokenAddress: string,
  balance: string,
) => {
  // Format balance
  const balanceFormatted = `0x${BigInt(balance)
    .toString(16)
    .padStart(64, '0')}`;

  // Get token interface
  const erc20 = new ERC20Contract(tokenAddress, provider);

  // Get RPC command to set storage
  const setRPCCommand =
    forkRPCType === ForkRPCType.Anvil
      ? 'anvil_setStorageAt'
      : 'evm_setAccountStorageAt';

  /**
   * Attempt to change ERC20 balance with storage slot
   */
  const attemptERC20BalanceChange = async (storageSlot: string) => {
    // Get storage before
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const before: string = await provider.send('eth_getStorageAt', [
      tokenAddress,
      storageSlot,
      null,
    ]);

    // Set storage
    await provider.send(setRPCCommand, [
      tokenAddress,
      storageSlot,
      balanceFormatted,
    ]);

    // Check if token balance changed
    if ((await erc20.balanceOf(walletAddress)).toBigInt() === BigInt(balance))
      return true;

    // Restore storage before going to next slot
    await provider.send(setRPCCommand, [tokenAddress, storageSlot, before]);

    return false;
  };

  // Loop through storage slots and try to change balance
  let success = false;

  // Loop through storage slots
  for (let i = 0; i < 1000; i += 1) {
    // Try to change for solidity storage layout
    if (
      await attemptERC20BalanceChange(
        ethers.utils.solidityKeccak256(
          ['uint256', 'uint256'],
          [walletAddress, i],
        ),
      )
    ) {
      success = true;
      break;
    }

    // Try to change for vyper storage layout
    if (
      await attemptERC20BalanceChange(
        ethers.utils.solidityKeccak256(
          ['uint256', 'uint256'],
          [i, walletAddress],
        ),
      )
    ) {
      success = true;
      break;
    }
  }

  if (!success) {
    throw new Error(`Could not set token balance for ${tokenAddress}`);
  }
};
