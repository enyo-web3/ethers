var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useQuery, gql, useMutation } from '@apollo/client';
import { useCallback } from 'react';
const QUERY = gql `
  query GetEthersWallet {
    wallet {
      mainAccount
      connected
      connecting
      ensName
    }
  }
`;
const CONNECT_PROVIDER = gql `
  mutation EthersWalletConnectProvider($providerType: String!) {
    ethers {
      connectProvider(providerType: $providerType)
    }
  }
`;
const DISCONNECT_PROVIDER = gql `
  mutation EthersWalletDisconnectProvider {
    ethers {
      disconnectProvider
    }
  }
`;
const GET_PROVIDER = gql `
  mutation GetEthersWalletProvider($network: Network) {
    ethers {
      provider(network: $network)
    }
  }
`;
const GET_SIGNER = gql `
  mutation GetEthersWalletSigner($network: Network) {
    ethers {
      signer(network: $network)
    }
  }
`;
export function useWallet() {
    const { data, loading } = useQuery(QUERY);
    const [mutationConnectProvider] = useMutation(CONNECT_PROVIDER);
    const [mutationDisconnectProvider] = useMutation(DISCONNECT_PROVIDER);
    // note(carlos): important we use no-cache policy here. Cache will freeze the provider
    // objects, rendering them unusable.
    const [mutationGetProvider] = useMutation(GET_PROVIDER);
    const [mutationGetSigner] = useMutation(GET_SIGNER);
    const connectProvider = useCallback((providerType) => {
        return mutationConnectProvider({ variables: { providerType } });
    }, [mutationConnectProvider]);
    const disconnectProvider = useCallback(() => {
        return mutationDisconnectProvider();
    }, [mutationDisconnectProvider]);
    const getProvider = useCallback((network) => __awaiter(this, void 0, void 0, function* () {
        const result = yield mutationGetProvider({ variables: { network } });
        return result.data.ethers.provider;
    }), [mutationGetProvider]);
    const getSigner = useCallback((network) => __awaiter(this, void 0, void 0, function* () {
        const result = yield mutationGetSigner({ variables: { network } });
        return result.data.ethers.signer;
    }), [mutationGetSigner]);
    return {
        connected: !!(data === null || data === void 0 ? void 0 : data.wallet.connected),
        connecting: !!(data === null || data === void 0 ? void 0 : data.wallet.connecting) || loading,
        mainAccount: (data === null || data === void 0 ? void 0 : data.wallet.mainAccount) || null,
        ensName: (data === null || data === void 0 ? void 0 : data.wallet.ensName) || null,
        connectProvider,
        disconnectProvider,
        getProvider,
        getSigner,
        loading,
    };
}
//# sourceMappingURL=useWallet.js.map