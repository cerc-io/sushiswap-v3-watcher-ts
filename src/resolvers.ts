//
// Copyright 2021 Vulcanize, Inc.
//

import assert from 'assert';
import BigInt from 'apollo-type-bigint';
import debug from 'debug';
import Decimal from 'decimal.js';
import {
  GraphQLScalarType,
  GraphQLResolveInfo
} from 'graphql';

import {
  gqlTotalQueryCount,
  gqlQueryCount,
  getResultState,
  IndexerInterface,
  BlockHeight,
  jsonBigIntStringReplacer,
  EventWatcher,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setGQLCacheHints
} from '@cerc-io/util';

import { Indexer } from './indexer';

import { Factory } from './entity/Factory';
import { Bundle } from './entity/Bundle';
import { Token } from './entity/Token';
import { Pool } from './entity/Pool';
import { Tick } from './entity/Tick';
import { Position } from './entity/Position';
import { PositionSnapshot } from './entity/PositionSnapshot';
import { Transaction } from './entity/Transaction';
import { Mint } from './entity/Mint';
import { Burn } from './entity/Burn';
import { Swap } from './entity/Swap';
import { Collect } from './entity/Collect';
import { Flash } from './entity/Flash';
import { UniswapDayData } from './entity/UniswapDayData';
import { PoolDayData } from './entity/PoolDayData';
import { PoolHourData } from './entity/PoolHourData';
import { TickHourData } from './entity/TickHourData';
import { TickDayData } from './entity/TickDayData';
import { TokenDayData } from './entity/TokenDayData';
import { TokenHourData } from './entity/TokenHourData';
import { IncreaseEvent } from './entity/IncreaseEvent';
import { DecreaseEvent } from './entity/DecreaseEvent';

const log = debug('vulcanize:resolver');

export const createResolvers = async (indexerArg: IndexerInterface, eventWatcher: EventWatcher): Promise<any> => {
  const indexer = indexerArg as Indexer;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const gqlCacheConfig = indexer.serverConfig.gqlCache;

  return {
    BigInt: new BigInt('bigInt'),

    BigDecimal: new GraphQLScalarType({
      name: 'BigDecimal',
      description: 'BigDecimal custom scalar type',
      parseValue (value) {
        // value from the client
        return new Decimal(value);
      },
      serialize (value: Decimal) {
        // value sent to the client
        return value.toFixed();
      }
    }),

    Event: {
      __resolveType: (obj: any) => {
        assert(obj.__typename);

        return obj.__typename;
      }
    },

    Subscription: {
      onEvent: {
        subscribe: () => eventWatcher.getEventIterator()
      }
    },

    Mutation: {
      watchContract: async (_: any, { address, kind, checkpoint, startingBlock = 1 }: { address: string, kind: string, checkpoint: boolean, startingBlock: number }): Promise<boolean> => {
        log('watchContract', address, kind, checkpoint, startingBlock);
        await indexer.watchContract(address, kind, checkpoint, startingBlock);

        return true;
      }
    },

    Query: {
      factory: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('factory', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('factory').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(Factory, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      bundle: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('bundle', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('bundle').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(Bundle, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      token: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('token', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('token').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(Token, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      pool: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('pool', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('pool').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(Pool, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      tick: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('tick', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('tick').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(Tick, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      position: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('position', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('position').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(Position, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      positionSnapshot: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('positionSnapshot', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('positionSnapshot').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(PositionSnapshot, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      transaction: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('transaction', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('transaction').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(Transaction, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      mint: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('mint', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('mint').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(Mint, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      burn: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('burn', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('burn').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(Burn, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      swap: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('swap', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('swap').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(Swap, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      collect: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('collect', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('collect').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(Collect, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      flash: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('flash', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('flash').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(Flash, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      uniswapDayData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('uniswapDayData', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('uniswapDayData').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(UniswapDayData, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      poolDayData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('poolDayData', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('poolDayData').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(PoolDayData, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      poolHourData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('poolHourData', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('poolHourData').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(PoolHourData, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      tickHourData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('tickHourData', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('tickHourData').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(TickHourData, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      tickDayData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('tickDayData', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('tickDayData').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(TickDayData, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      tokenDayData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('tokenDayData', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('tokenDayData').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(TokenDayData, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      tokenHourData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('tokenHourData', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('tokenHourData').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(TokenHourData, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      increaseEvent: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('increaseEvent', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('increaseEvent').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(IncreaseEvent, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      decreaseEvent: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        __: any,
        info: GraphQLResolveInfo
      ) => {
        log('decreaseEvent', id, JSON.stringify(block, jsonBigIntStringReplacer));
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('decreaseEvent').inc(1);
        assert(info.fieldNodes[0].selectionSet);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return indexer.getSubgraphEntity(DecreaseEvent, id, block, info.fieldNodes[0].selectionSet.selections);
      },

      events: async (_: any, { blockHash, contractAddress, name }: { blockHash: string, contractAddress: string, name?: string }) => {
        log('events', blockHash, contractAddress, name);
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('events').inc(1);

        const block = await indexer.getBlockProgress(blockHash);
        if (!block || !block.isComplete) {
          throw new Error(`Block hash ${blockHash} number ${block?.blockNumber} not processed yet`);
        }

        const events = await indexer.getEventsByFilter(blockHash, contractAddress, name);
        return events.map(event => indexer.getResultEvent(event));
      },

      eventsInRange: async (_: any, { fromBlockNumber, toBlockNumber }: { fromBlockNumber: number, toBlockNumber: number }) => {
        log('eventsInRange', fromBlockNumber, toBlockNumber);
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('eventsInRange').inc(1);

        const { expected, actual } = await indexer.getProcessedBlockCountForRange(fromBlockNumber, toBlockNumber);
        if (expected !== actual) {
          throw new Error(`Range not available, expected ${expected}, got ${actual} blocks in range`);
        }

        const events = await indexer.getEventsInRange(fromBlockNumber, toBlockNumber);
        return events.map(event => indexer.getResultEvent(event));
      },

      getStateByCID: async (_: any, { cid }: { cid: string }) => {
        log('getStateByCID', cid);
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('getStateByCID').inc(1);

        const state = await indexer.getStateByCID(cid);

        return state && state.block.isComplete ? getResultState(state) : undefined;
      },

      getState: async (_: any, { blockHash, contractAddress, kind }: { blockHash: string, contractAddress: string, kind: string }) => {
        log('getState', blockHash, contractAddress, kind);
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('getState').inc(1);

        const state = await indexer.getPrevState(blockHash, contractAddress, kind);

        return state && state.block.isComplete ? getResultState(state) : undefined;
      },

      getSyncStatus: async () => {
        log('getSyncStatus');
        gqlTotalQueryCount.inc(1);
        gqlQueryCount.labels('getSyncStatus').inc(1);

        return indexer.getSyncStatus();
      }
    }
  };
};
