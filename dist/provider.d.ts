import type { EnyoProvider } from '@enyo-web3/core';
import { Interface } from '@ethersproject/abi';
import { ethers } from 'ethers';
export declare type Network = 'mainnet' | 'ropsten' | 'polygon' | 'local';
declare type SecondArgument<T> = T extends (arg1: any, arg2: infer U, ...args: any[]) => any ? U : any;
export interface MulticallCall {
    target: string;
    functionName: string;
    functionArguments?: SecondArgument<Interface['encodeFunctionData']>;
}
export declare type ProvidersWithEthers = {
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
export declare type Connector = () => Promise<ethers.providers.Web3Provider>;
export declare class EthersProvider extends EventTarget implements EnyoProvider {
    connecting: boolean;
    desiredNetwork: Network;
    provider: ethers.providers.Web3Provider | null;
    mainAccount: string | null;
    providerType: string | null;
    switchingNetwork: Promise<void> | null;
    rpcTokens: RPCTokens | null;
    connectors: Record<string, Connector>;
    multicallAddresses: Record<string, string>;
    constructor(options?: EthersProviderOptions);
    connectProvider(providerType: string): Promise<void>;
    disconnectProvider(): void;
    setProvider(providerType: string, provider: ethers.providers.Web3Provider): void;
    getProvider(network?: Network): ethers.providers.BaseProvider;
    getSigner(network?: Network): Promise<ethers.providers.JsonRpcSigner>;
    multicall(network: string, abi: ConstructorParameters<typeof Interface>[0], calls: MulticallCall[]): Promise<ethers.utils.Result[]>;
    get connected(): boolean;
    private setConnecting;
    private setCachedProvider;
    private restoreCachedProvider;
    private removeCachedProvider;
}
export {};
