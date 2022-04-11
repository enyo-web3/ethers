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
exports.WalletSubgraph = void 0;
const client_1 = require("@apollo/client");
const core_1 = require("@enyo-web3/core");
const schema_1 = require("@graphql-tools/schema");
class WalletSubgraph extends core_1.EnyoSubgraph {
    constructor() {
        super();
        this.ensNames = {};
    }
    schema(providers) {
        const ethersProvider = providers.ethers;
        const ensNames = this.ensNames;
        const updateWallet = () => {
            this.writeQuery({
                query: (0, client_1.gql) `
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
            this.writeQuery({
                query: (0, client_1.gql) `
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
        return (0, schema_1.makeExecutableSchema)({
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
        return (0, client_1.gql) `
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
exports.WalletSubgraph = WalletSubgraph;
//# sourceMappingURL=wallet.js.map