import { useQuery, gql, useMutation } from '@apollo/client';
import { ethers } from 'ethers';
import { useCallback } from 'react';

const QUERY = gql`
  query GetEthersWallet {
    wallet {
      mainAccount
      connected
      connecting
      ensName
    }
  }
`;

const CONNECT_PROVIDER = gql`
  mutation EthersWalletConnectProvider($providerType: String!) {
    ethers {
      connectProvider(providerType: $providerType)
    }
  }
`;

const DISCONNECT_PROVIDER = gql`
  mutation EthersWalletDisconnectProvider {
    ethers {
      disconnectProvider
    }
  }
`;

const GET_PROVIDER = gql`
  mutation GetEthersWalletProvider($network: Network) {
    ethers {
      provider(network: $network)
    }
  }
`;

const GET_SIGNER = gql`
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

  const connectProvider = useCallback(
    (providerType: string) => {
      return mutationConnectProvider({ variables: { providerType } });
    },
    [mutationConnectProvider]
  );

  const disconnectProvider = useCallback(() => {
    return mutationDisconnectProvider();
  }, [mutationDisconnectProvider]);

  const getProvider = useCallback(
    async (network?: string): Promise<ethers.providers.BaseProvider> => {
      const result = await mutationGetProvider({ variables: { network } });

      return result.data.ethers.provider;
    },
    [mutationGetProvider]
  );

  const getSigner = useCallback(
    async (network?: string): Promise<ethers.Signer> => {
      const result = await mutationGetSigner({ variables: { network } });

      return result.data.ethers.signer;
    },
    [mutationGetSigner]
  );

  return {
    connected: !!data?.wallet.connected,
    connecting: !!data?.wallet.connecting || loading,
    mainAccount: data?.wallet.mainAccount || null,
    ensName: data?.wallet.ensName || null,
    connectProvider,
    disconnectProvider,
    getProvider,
    getSigner,
    loading,
  };
}
