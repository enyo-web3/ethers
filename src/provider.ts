import type { EnyoProvider } from '@enyo-web3/core';
import { Interface } from '@ethersproject/abi';
import { ethers } from 'ethers';

import Multicall from './Multicall.json';

const multicallAddresses: Record<string, string> = {
  mainnet: '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
  ropsten: '0x53c43764255c17bd724f74c4ef150724ac50a3ed',
  polygon: '0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507',
};

export type Network = 'mainnet' | 'ropsten' | 'polygon' | 'local';

const networks = {
  mainnet: {
    chainId: ethers.utils.hexValue(1),
    chainName: 'Ethereum Mainet',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io'],
  },
  ropsten: {
    chainId: ethers.utils.hexValue(3),
    chainName: 'Ropsten',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://ropsten.infura.io'],
  },
  polygon: {
    chainId: ethers.utils.hexValue(137),
    chainName: 'Polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://rpc-mainnet.matic.network'],
  },
  local: {
    chainId: ethers.utils.hexValue(1337),
    chainName: 'localhost',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['http://localhost:8545'],
  },
};

const CACHED_PROVIDER_KEY = 'ethers_cached_provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SecondArgument<T> = T extends (arg1: any, arg2: infer U, ...args: any[]) => any ? U : any;

export interface MulticallCall {
  target: string;
  functionName: string;
  functionArguments?: SecondArgument<Interface['encodeFunctionData']>;
}

export type ProvidersWithEthers = {
  ethers: EthersProvider;
};

export interface RPCTokens {
  infura?: string;
  alchemy?: string;
  etherscan?: string;
}

export interface EthersProviderOptions {
  network?: Network;
  rpcTokens?: RPCTokens;
  connectors?: Record<string, Connector>;
  customMulticalls?: Record<string, string>;
}

export type Connector = () => Promise<ethers.providers.Web3Provider>;

export class EthersProvider extends EventTarget implements EnyoProvider {
  connecting: boolean;
  desiredNetwork: Network;
  provider: ethers.providers.Web3Provider | null;
  mainAccount: string | null;
  providerType: string | null;
  switchingNetwork: Promise<void> | null;
  rpcTokens: RPCTokens | null;
  connectors: Record<string, Connector>;
  multicallAddresses: Record<string, string>;

  constructor(options?: EthersProviderOptions) {
    super();

    this.connecting = false;
    this.desiredNetwork = options?.network || 'mainnet';
    this.rpcTokens = options?.rpcTokens || null;
    this.connectors = {
      metamask: async () => {
        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
        await provider.send('eth_requestAccounts', []);

        return provider;
      },
      ...options?.connectors,
    };
    this.multicallAddresses = { ...multicallAddresses, ...options?.customMulticalls };

    this.provider = null;
    this.mainAccount = null;
    this.providerType = null;
    this.switchingNetwork = null;

    this.restoreCachedProvider();
  }

  async connectProvider(providerType: string) {
    try {
      this.setConnecting(true);

      if (!Object.keys(this.connectors).includes(providerType)) {
        throw new Error(`no connector provided for ${providerType}`);
      }

      const provider = await this.connectors[providerType]();

      this.setProvider(providerType, provider);
    } finally {
      this.setConnecting(false);
    }
  }

  disconnectProvider() {
    this.provider = null;
    this.mainAccount = null;

    this.dispatchEvent(new CustomEvent('changeProvider', { detail: null }));
    this.dispatchEvent(new CustomEvent('changeMainAccount', { detail: null }));

    this.removeCachedProvider();
  }

  setProvider(providerType: string, provider: ethers.providers.Web3Provider) {
    this.providerType = providerType;
    this.provider = provider;
    provider
      .listAccounts()
      .then(accounts => {
        this.mainAccount = accounts[0];
        this.dispatchEvent(new CustomEvent('changeProvider', { detail: provider }));
        this.dispatchEvent(new CustomEvent('changeMainAccount', { detail: this.mainAccount }));
      })
      .catch(() => {
        this.providerType = null;
        this.provider = null;
      });

    this.setCachedProvider(providerType);
  }

  getProvider(network?: Network) {
    return network === 'local' || (!network && (!this.desiredNetwork || this.desiredNetwork === 'local'))
      ? new ethers.providers.JsonRpcProvider('http://localhost:8545')
      : ethers.getDefaultProvider(network || this.desiredNetwork, this.rpcTokens);
  }

  async getSigner(network?: Network) {
    if (!this.provider) {
      throw new Error('wallet not connected');
    }

    const provider = this.provider;
    const networkParams = networks[network || this.desiredNetwork];
    const currentNetwork = await provider?.getNetwork();
    const currentNetworkChainId = ethers.utils.hexValue(currentNetwork?.chainId || -1);

    if (provider) {
      await this.switchingNetwork;

      if (currentNetworkChainId !== networkParams.chainId) {
        if (!provider.provider || !provider.provider.request) {
          throw new Error('metamask provider missing');
        }

        try {
          this.switchingNetwork = provider.provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: networkParams.chainId }],
          });

          await this.switchingNetwork;
        } catch (error) {
          // @ts-ignore
          if (error.code === 4902) {
            // chain not installed
            await provider.provider.request({
              method: 'wallet_addEthereumChain',
              params: [networkParams],
            });
            // @ts-ignore
          } else if (error.code === -32_002) {
            await this.switchingNetwork;
          } else {
            throw error;
          }
        }
      }

      const newNetwork = await provider.getNetwork();
      const newChainId = ethers.utils.hexValue(newNetwork.chainId);

      if (newChainId !== networkParams.chainId) {
        throw new Error('could not set new network! Set network to Localhost manually.');
      }
    }

    return provider.getSigner();
  }

  async multicall(network: string, abi: ConstructorParameters<typeof Interface>[0], calls: MulticallCall[]) {
    const multicallAddress = this.multicallAddresses[network];

    if (!multicallAddress) {
      throw new Error(`no multicall contract registered for network ${network}`);
    }

    const provider = this.getProvider(network as Network);
    const multicall = new ethers.Contract(multicallAddress, Multicall.abi, provider);
    const contractInterface = new Interface(abi);
    const multicallCalls = calls.map(c => ({
      target: c.target,
      callData: contractInterface.encodeFunctionData(c.functionName, c.functionArguments),
    }));
    const multicallResult = await multicall.aggregate(multicallCalls);

    const functionResults = multicallResult[1];

    return calls.map((c, i) => contractInterface.decodeFunctionResult(c.functionName, functionResults[i]));
  }

  get connected(): boolean {
    return !!this.provider;
  }

  private setConnecting(value: boolean) {
    this.connecting = value;
    this.dispatchEvent(new CustomEvent('connecting', { detail: value }));
  }

  private setCachedProvider(providerType: string) {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.setItem(CACHED_PROVIDER_KEY, providerType);
    }
  }

  private async restoreCachedProvider() {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      const cachedProviderType = window.localStorage.getItem(CACHED_PROVIDER_KEY);

      if (cachedProviderType) {
        try {
          await this.connectProvider(cachedProviderType);
        } catch {
          this.removeCachedProvider();
        }
      }
    }
  }

  private removeCachedProvider() {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.removeItem(CACHED_PROVIDER_KEY);
    }
  }
}
