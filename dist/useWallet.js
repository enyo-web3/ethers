"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWallet = void 0;
const client_1 = require("@apollo/client");
const react_1 = require("react");
const QUERY = (0, client_1.gql) `
  query GetEthersWallet {
    wallet {
      mainAccount
      connected
      connecting
      ensName
    }
  }
`;
const CONNECT_PROVIDER = (0, client_1.gql) `
  mutation EthersWalletConnectProvider($providerType: String!) {
    ethers {
      connectProvider(providerType: $providerType)
    }
  }
`;
const DISCONNECT_PROVIDER = (0, client_1.gql) `
  mutation EthersWalletDisconnectProvider {
    ethers {
      disconnectProvider
    }
  }
`;
const GET_PROVIDER = (0, client_1.gql) `
  mutation GetEthersWalletProvider($network: Network) {
    ethers {
      provider(network: $network)
    }
  }
`;
const GET_SIGNER = (0, client_1.gql) `
  mutation GetEthersWalletSigner($network: Network) {
    ethers {
      signer(network: $network)
    }
  }
`;
function useWallet() {
    const { data, loading } = (0, client_1.useQuery)(QUERY);
    const [mutationConnectProvider] = (0, client_1.useMutation)(CONNECT_PROVIDER);
    const [mutationDisconnectProvider] = (0, client_1.useMutation)(DISCONNECT_PROVIDER);
    // note(carlos): important we use no-cache policy here. Cache will freeze the provider
    // objects, rendering them unusable.
    const [mutationGetProvider] = (0, client_1.useMutation)(GET_PROVIDER);
    const [mutationGetSigner] = (0, client_1.useMutation)(GET_SIGNER);
    const connectProvider = (0, react_1.useCallback)((providerType) => {
        return mutationConnectProvider({ variables: { providerType } });
    }, [mutationConnectProvider]);
    const disconnectProvider = (0, react_1.useCallback)(() => {
        return mutationDisconnectProvider();
    }, [mutationDisconnectProvider]);
    const getProvider = (0, react_1.useCallback)((network) => __awaiter(this, void 0, void 0, function* () {
        const result = yield mutationGetProvider({ variables: { network } });
        return result.data.ethers.provider;
    }), [mutationGetProvider]);
    const getSigner = (0, react_1.useCallback)((network) => __awaiter(this, void 0, void 0, function* () {
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
exports.useWallet = useWallet;
//# sourceMappingURL=useWallet.js.map