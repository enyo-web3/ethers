# Enyo
Enyo (sister to Apollo, goddess of war) is a web3 supergraph GraphQL framework built on top of [Apollo](https://www.apollographql.com/) designed to unify data from diverse web3 data sources (GraphQL services like Graph Protocol subgraphs, EVM JSON-RPC chain state via ethers, other chain state such as ARWeave, off-chain state from IPFS/Ceramic/etc.) on the client-side, wrapped in nice and easy to use GraphQL-based schemas. It is intended to optimize for ease-of-use, efficiency, and speed while keeping lookup operations at the client-side layer of decentralized applications.

## Install

`yarn add @enyo/core`

or

`npm install --save @enyo/core`

## Usage

```typescript
import { ApolloClient, gql } from '@apollo/client';
import { EnyoSupergraph } from '@enyo/core';
import { EthersProvider, TransactionSubgraph } from '@enyo/ethers';
import { CeramicProvider, CeramicSubgraph } from '@enyo/ceramic';
import { ERC20Subgraph } from '@enyo/erc20';
import { ERC721Subgraph } from '@enyo/erc721';
import { ERC1155Subgraph } from '@enyo/erc1155';

const supergraph = new EnyoSupergraph({
  subgraphs: [
    new TransactionSubgraph(),
    new CeramicSubgraph(),
    new GraphProtocolSubgraph({ host: 'https://api.thegraph.com', name: '@metaphor-xyz/approval-protocol', schema: subgraphSchema }),
    new ERC20Subgraph({ alias: 'token' }),
    new ERC721Subgraph({ alias: 'nftToken' }),
    new ERC1155Subgraph({ alias: 'editionToken' }),
  ],
  providers: {
    ethers: new EthersProvider(),
    ceramic: new CeramicProvider({ uri: 'https://ceramic.myhost.com' }),
  },
});

const client = new ApolloClient({
  link: supergraph.link(),
  typeDefs: supergraph.typeDefs(),
});

client.query({
  query: gql`
  {
    account(id: "0x38fj...") {
      token(id: "0x9dfh9h....") {
        name
        balanceOf
      }

      nftTokens(id: "0xd09hfh...") {
        balanceOf
      }
    }

    nftToken(id: "0xd89hdf", tokenId: "0xdfh0d") {
      name
      description
    }
  }
  `,
});
```

## TODO
- [x] GraphProtocolSubgraph
  - [x] Approval Protocol
- [x] EthersWalletSubgraph
- [ ] BigNumber scalar resolver
- [x] CeramicSubgraph
- [ ] ERC721/ERC1155
- [ ] Add token list data to ERC20Subgraph

