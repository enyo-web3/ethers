var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { gql } from '@apollo/client';
import { makeExecutableSchema } from '@graphql-tools/schema';
export class EthersWalletSubgraph {
    constructor() {
        this.ensNames = {};
    }
    schema(providers) {
        const ethersProvider = providers.ethers;
        const cache = providers.cache;
        const ensNames = this.ensNames;
        const updateWallet = () => {
            cache.writeQuery({
                query: gql `
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
        const updateAccount = () => __awaiter(this, void 0, void 0, function* () {
            let ensName = null;
            if (ethersProvider.mainAccount) {
                ensName = yield ethersProvider.getProvider('mainnet').lookupAddress(ethersProvider.mainAccount);
                if (ensName) {
                    ensNames[ethersProvider.mainAccount.toLowerCase()] = ensName;
                }
            }
            cache.writeQuery({
                query: gql `
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
        });
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
                    connectProvider(_, args) {
                        return __awaiter(this, void 0, void 0, function* () {
                            yield ethersProvider.connectProvider(args.providerType);
                            return true;
                        });
                    },
                    disconnectProvider() {
                        ethersProvider.disconnectProvider();
                        return true;
                    },
                    provider(_, args) {
                        return ethersProvider.getProvider(args === null || args === void 0 ? void 0 : args.network);
                    },
                    signer(_, args) {
                        return ethersProvider.getSigner(args === null || args === void 0 ? void 0 : args.network);
                    },
                },
            },
        });
    }
    typeDefs() {
        return gql `
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
//# sourceMappingURL=wallet.js.map