//
// Copyright 2021 Vulcanize, Inc.
//

import assert from 'assert';
import debug from 'debug';
import { GraphQLResolveInfo } from 'graphql';
import { ExpressContext } from 'apollo-server-express';
import winston from 'winston';

import {
  gqlTotalQueryCount,
  gqlQueryCount,
  gqlQueryDuration,
  getResultState,
  IndexerInterface,
  GraphQLBigInt,
  GraphQLBigDecimal,
  BlockHeight,
  OrderDirection,
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

const executeAndRecordMetrics = async (
  indexer: Indexer,
  gqlLogger: winston.Logger,
  opName: string,
  expressContext: ExpressContext,
  operation: () => Promise<any>
) => {
  gqlTotalQueryCount.inc(1);
  gqlQueryCount.labels(opName).inc(1);
  const endTimer = gqlQueryDuration.labels(opName).startTimer();

  try {
    const [result, syncStatus] = await Promise.all([
      operation(),
      indexer.getSyncStatus()
    ]);

    gqlLogger.info({
      opName,
      query: expressContext.req.body.query,
      variables: expressContext.req.body.variables,
      latestIndexedBlockNumber: syncStatus?.latestIndexedBlockNumber,
      urlPath: expressContext.req.path,
      apiKey: expressContext.req.header('x-api-key'),
      origin: expressContext.req.headers.origin
    });
    return result;
  } catch (error) {
    gqlLogger.error({
      opName,
      error,
      query: expressContext.req.body.query,
      variables: expressContext.req.body.variables,
      urlPath: expressContext.req.path,
      apiKey: expressContext.req.header('x-api-key'),
      origin: expressContext.req.headers.origin
    });
  } finally {
    endTimer();
  }
};

export const createResolvers = async (
  indexerArg: IndexerInterface,
  eventWatcher: EventWatcher,
  gqlLogger: winston.Logger
): Promise<any> => {
  const indexer = indexerArg as Indexer;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const gqlCacheConfig = indexer.serverConfig.gql.cache;

  return {
    BigInt: GraphQLBigInt,

    BigDecimal: GraphQLBigDecimal,

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
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('factory', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'factory',
          expressContext,
          async () => indexer.getSubgraphEntity(Factory, id, block, info)
        );
      },

      factories: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('factories', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'factories',
          expressContext,
          async () => indexer.getSubgraphEntities(
            Factory,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      bundle: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('bundle', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'bundle',
          expressContext,
          async () => indexer.getSubgraphEntity(Bundle, id, block, info)
        );
      },

      bundles: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('bundles', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'bundles',
          expressContext,
          async () => indexer.getSubgraphEntities(
            Bundle,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      token: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('token', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'token',
          expressContext,
          async () => indexer.getSubgraphEntity(Token, id, block, info)
        );
      },

      tokens: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('tokens', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'tokens',
          expressContext,
          async () => indexer.getSubgraphEntities(
            Token,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      pool: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('pool', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'pool',
          expressContext,
          async () => indexer.getSubgraphEntity(Pool, id, block, info)
        );
      },

      pools: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('pools', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'pools',
          expressContext,
          async () => indexer.getSubgraphEntities(
            Pool,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      tick: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('tick', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'tick',
          expressContext,
          async () => indexer.getSubgraphEntity(Tick, id, block, info)
        );
      },

      ticks: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('ticks', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'ticks',
          expressContext,
          async () => indexer.getSubgraphEntities(
            Tick,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      position: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('position', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'position',
          expressContext,
          async () => indexer.getSubgraphEntity(Position, id, block, info)
        );
      },

      positions: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('positions', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'positions',
          expressContext,
          async () => indexer.getSubgraphEntities(
            Position,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      positionSnapshot: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('positionSnapshot', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'positionSnapshot',
          expressContext,
          async () => indexer.getSubgraphEntity(PositionSnapshot, id, block, info)
        );
      },

      positionSnapshots: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('positionSnapshots', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'positionSnapshots',
          expressContext,
          async () => indexer.getSubgraphEntities(
            PositionSnapshot,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      transaction: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('transaction', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'transaction',
          expressContext,
          async () => indexer.getSubgraphEntity(Transaction, id, block, info)
        );
      },

      transactions: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('transactions', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'transactions',
          expressContext,
          async () => indexer.getSubgraphEntities(
            Transaction,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      mint: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('mint', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'mint',
          expressContext,
          async () => indexer.getSubgraphEntity(Mint, id, block, info)
        );
      },

      mints: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('mints', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'mints',
          expressContext,
          async () => indexer.getSubgraphEntities(
            Mint,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      burn: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('burn', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'burn',
          expressContext,
          async () => indexer.getSubgraphEntity(Burn, id, block, info)
        );
      },

      burns: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('burns', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'burns',
          expressContext,
          async () => indexer.getSubgraphEntities(
            Burn,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      swap: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('swap', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'swap',
          expressContext,
          async () => indexer.getSubgraphEntity(Swap, id, block, info)
        );
      },

      swaps: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('swaps', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'swaps',
          expressContext,
          async () => indexer.getSubgraphEntities(
            Swap,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      collect: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('collect', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'collect',
          expressContext,
          async () => indexer.getSubgraphEntity(Collect, id, block, info)
        );
      },

      collects: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('collects', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'collects',
          expressContext,
          async () => indexer.getSubgraphEntities(
            Collect,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      flash: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('flash', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'flash',
          expressContext,
          async () => indexer.getSubgraphEntity(Flash, id, block, info)
        );
      },

      flashes: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('flashes', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'flashes',
          expressContext,
          async () => indexer.getSubgraphEntities(
            Flash,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      uniswapDayData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('uniswapDayData', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'uniswapDayData',
          expressContext,
          async () => indexer.getSubgraphEntity(UniswapDayData, id, block, info)
        );
      },

      uniswapDayDatas: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('uniswapDayDatas', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'uniswapDayDatas',
          expressContext,
          async () => indexer.getSubgraphEntities(
            UniswapDayData,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      poolDayData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('poolDayData', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'poolDayData',
          expressContext,
          async () => indexer.getSubgraphEntity(PoolDayData, id, block, info)
        );
      },

      poolDayDatas: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('poolDayDatas', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'poolDayDatas',
          expressContext,
          async () => indexer.getSubgraphEntities(
            PoolDayData,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      poolHourData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('poolHourData', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'poolHourData',
          expressContext,
          async () => indexer.getSubgraphEntity(PoolHourData, id, block, info)
        );
      },

      poolHourDatas: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('poolHourDatas', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'poolHourDatas',
          expressContext,
          async () => indexer.getSubgraphEntities(
            PoolHourData,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      tickHourData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('tickHourData', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'tickHourData',
          expressContext,
          async () => indexer.getSubgraphEntity(TickHourData, id, block, info)
        );
      },

      tickHourDatas: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('tickHourDatas', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'tickHourDatas',
          expressContext,
          async () => indexer.getSubgraphEntities(
            TickHourData,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      tickDayData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('tickDayData', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'tickDayData',
          expressContext,
          async () => indexer.getSubgraphEntity(TickDayData, id, block, info)
        );
      },

      tickDayDatas: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('tickDayDatas', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'tickDayDatas',
          expressContext,
          async () => indexer.getSubgraphEntities(
            TickDayData,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      tokenDayData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('tokenDayData', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'tokenDayData',
          expressContext,
          async () => indexer.getSubgraphEntity(TokenDayData, id, block, info)
        );
      },

      tokenDayDatas: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('tokenDayDatas', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'tokenDayDatas',
          expressContext,
          async () => indexer.getSubgraphEntities(
            TokenDayData,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      tokenHourData: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('tokenHourData', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'tokenHourData',
          expressContext,
          async () => indexer.getSubgraphEntity(TokenHourData, id, block, info)
        );
      },

      tokenHourDatas: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('tokenHourDatas', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'tokenHourDatas',
          expressContext,
          async () => indexer.getSubgraphEntities(
            TokenHourData,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      increaseEvent: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('increaseEvent', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'increaseEvent',
          expressContext,
          async () => indexer.getSubgraphEntity(IncreaseEvent, id, block, info)
        );
      },

      increaseEvents: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('increaseEvents', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'increaseEvents',
          expressContext,
          async () => indexer.getSubgraphEntities(
            IncreaseEvent,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      decreaseEvent: async (
        _: any,
        { id, block = {} }: { id: string, block: BlockHeight },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('decreaseEvent', id, JSON.stringify(block, jsonBigIntStringReplacer));

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'decreaseEvent',
          expressContext,
          async () => indexer.getSubgraphEntity(DecreaseEvent, id, block, info)
        );
      },

      decreaseEvents: async (
        _: any,
        { block = {}, where, first, skip, orderBy, orderDirection }: { block: BlockHeight, where: { [key: string]: any }, first: number, skip: number, orderBy: string, orderDirection: OrderDirection },
        expressContext: ExpressContext,
        info: GraphQLResolveInfo
      ) => {
        log('decreaseEvents', JSON.stringify(block, jsonBigIntStringReplacer), JSON.stringify(where, jsonBigIntStringReplacer), first, skip, orderBy, orderDirection);

        // Set cache-control hints
        // setGQLCacheHints(info, block, gqlCacheConfig);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'decreaseEvents',
          expressContext,
          async () => indexer.getSubgraphEntities(
            DecreaseEvent,
            block,
            where,
            { limit: first, skip, orderBy, orderDirection },
            info
          )
        );
      },

      events: async (
        _: any,
        { blockHash, contractAddress, name }: { blockHash: string, contractAddress: string, name?: string },
        expressContext: ExpressContext
      ) => {
        log('events', blockHash, contractAddress, name);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'events',
          expressContext,
          async () => {
            const block = await indexer.getBlockProgress(blockHash);
            if (!block || !block.isComplete) {
              throw new Error(`Block hash ${blockHash} number ${block?.blockNumber} not processed yet`);
            }

            const events = await indexer.getEventsByFilter(blockHash, contractAddress, name);
            return events.map(event => indexer.getResultEvent(event));
          }
        );
      },

      eventsInRange: async (
        _: any,
        { fromBlockNumber, toBlockNumber }: { fromBlockNumber: number, toBlockNumber: number },
        expressContext: ExpressContext
      ) => {
        log('eventsInRange', fromBlockNumber, toBlockNumber);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'eventsInRange',
          expressContext,
          async () => {
            const syncStatus = await indexer.getSyncStatus();

            if (!syncStatus) {
              throw new Error('No blocks processed yet');
            }

            if ((fromBlockNumber < syncStatus.initialIndexedBlockNumber) || (toBlockNumber > syncStatus.latestProcessedBlockNumber)) {
              throw new Error(`Block range should be between ${syncStatus.initialIndexedBlockNumber} and ${syncStatus.latestProcessedBlockNumber}`);
            }

            const events = await indexer.getEventsInRange(fromBlockNumber, toBlockNumber);
            return events.map(event => indexer.getResultEvent(event));
          }
        );
      },

      getStateByCID: async (
        _: any,
        { cid }: { cid: string },
        expressContext: ExpressContext
      ) => {
        log('getStateByCID', cid);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'getStateByCID',
          expressContext,
          async () => {
            const state = await indexer.getStateByCID(cid);

            return state && state.block.isComplete ? getResultState(state) : undefined;
          }
        );
      },

      getState: async (
        _: any,
        { blockHash, contractAddress, kind }: { blockHash: string, contractAddress: string, kind: string },
        expressContext: ExpressContext
      ) => {
        log('getState', blockHash, contractAddress, kind);

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'getState',
          expressContext,
          async () => {
            const state = await indexer.getPrevState(blockHash, contractAddress, kind);

            return state && state.block.isComplete ? getResultState(state) : undefined;
          }
        );
      },

      _meta: async (
        _: any,
        { block = {} }: { block: BlockHeight },
        expressContext: ExpressContext
      ) => {
        log('_meta');

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          '_meta',
          expressContext,
          async () => indexer.getMetaData(block)
        );
      },

      getSyncStatus: async (
        _: any,
        __: Record<string, never>,
        expressContext: ExpressContext
      ) => {
        log('getSyncStatus');

        return executeAndRecordMetrics(
          indexer,
          gqlLogger,
          'getSyncStatus',
          expressContext,
          async () => indexer.getSyncStatus()
        );
      }
    }
  };
};
