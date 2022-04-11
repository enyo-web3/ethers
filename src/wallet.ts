import { gql } from '@apollo/client';
import { EnyoSubgraph } from '@enyo-web3/core';
import { makeExecutableSchema } from '@graphql-tools/schema';

import type { ProvidersWithEthers } from './provider';

export class WalletSubgraph extends EnyoSubgraph<ProvidersWithEthers> {
  ensNames: Record<string, string>;

  constructor() {
    super();

    this.ensNames = {};
  }

  schema(providers: ProvidersWithEthers) {
    const ethersProvider = providers.ethers;
    const ensNames = this.ensNames;

    const updateWallet = () => {
      this.writeQuery({
        query: gql`
          query SetWalletData {
            wallet {
              mainAccount
              connected
              connecting
            }
          }
        `,
        data: {
          wallet: {
            __typename: 'Wallet',
            mainAccount: ethersProvider.mainAccount,
            connected: ethersProvider.connected,
            connecting: ethersProvider.connecting,
          },
        },
      });
    };

    const updateAccount = async () => {
      let ensName = null;
      if (ethersProvider.mainAccount) {
        ensName = await ethersProvider.getProvider('mainnet').lookupAddress(ethersProvider.mainAccount);

        if (ensName) {
          ensNames[ethersProvider.mainAccount.toLowerCase()] = ensName;
        }
      }

      this.writeQuery({
        query: gql`
          query SetAccountData {
            wallet {
              mainAccount
              ensName
            }
          }
        `,
        data: {
          wallet: {
            __typename: 'Wallet',
            mainAccount: ethersProvider.mainAccount,
            ensName,
          },
        },
      });
    };

    ethersProvider.addEventListener('changeProvider', updateWallet);
    ethersProvider.addEventListener('changeMainAccount', updateAccount);
    ethersProvider.addEventListener('connecting', updateWallet);

    return makeExecutableSchema({
      typeDefs: this.typeDefs(),
      resolvers: {
        Query: {
          wallet() {
            return {
              mainAccount: ethersProvider.mainAccount,
              connected: ethersProvider.connected,
              connecting: ethersProvider.connecting,
            };
          },
        },
        Wallet: {
          ensName(wallet) {
            if (wallet.mainAccount && wallet.mainAccount.toLowerCase() in ensNames) {
              return ensNames[wallet.mainAccount.toLowerCase()];
            }

            return null;
          },
        },
        Mutation: {
          ethers: () => ({}),
        },
        EthersMutations: {
          async connectProvider(_, args) {
            await ethersProvider.connectProvider(args.providerType);

            return true;
          },
          disconnectProvider() {
            ethersProvider.disconnectProvider();

            return true;
          },
          provider(_, args) {
            return ethersProvider.getProvider(args?.network);
          },
          signer(_, args) {
            return ethersProvider.getSigner(args?.network);
          },
        },
      },
    });
  }

  typeDefs() {
    return gql`
      type Query {
        wallet: Wallet!
      }

      type Mutation {
        ethers: EthersMutations!
      }

      type Wallet {
        mainAccount: String
        connected: Boolean!
        connecting: Boolean!
        ensName: String
      }

      type EthersMutations {
        connectProvider(providerType: String!): Boolean!
        disconnectProvider: Boolean!

        provider(network: Network): Provider
        signer(network: Network): Signer
      }

      scalar Network
      scalar Provider
      scalar Signer
    `;
  }
}
