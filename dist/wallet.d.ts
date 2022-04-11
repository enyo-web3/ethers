import { EnyoSubgraph } from '@enyo-web3/core';
import type { ProvidersWithEthers } from './provider';
export declare class WalletSubgraph extends EnyoSubgraph<ProvidersWithEthers> {
    ensNames: Record<string, string>;
    constructor();
    schema(providers: ProvidersWithEthers): import("graphql").GraphQLSchema;
    typeDefs(): import("@apollo/client").DocumentNode;
}
