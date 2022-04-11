import type { EnyoSubgraph, ProvidersWithCache } from '@enyo-web3/core';
import type { ProvidersWithEthers } from './provider';
export declare class EthersWalletSubgraph implements EnyoSubgraph<ProvidersWithEthers & ProvidersWithCache> {
    ensNames: Record<string, string>;
    constructor();
    schema(providers: ProvidersWithEthers & ProvidersWithCache): import("graphql").GraphQLSchema;
    typeDefs(): import("@apollo/client").DocumentNode;
}
