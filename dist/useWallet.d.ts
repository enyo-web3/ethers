import { ethers } from 'ethers';
export declare function useWallet(): {
    connected: boolean;
    connecting: boolean;
    mainAccount: any;
    ensName: any;
    connectProvider: (providerType: string) => Promise<import("@apollo/client").FetchResult<any, Record<string, any>, Record<string, any>>>;
    disconnectProvider: () => Promise<import("@apollo/client").FetchResult<any, Record<string, any>, Record<string, any>>>;
    getProvider: (network?: string | undefined) => Promise<ethers.providers.BaseProvider>;
    getSigner: (network?: string | undefined) => Promise<ethers.Signer>;
    loading: boolean;
};
