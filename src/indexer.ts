//
// Copyright 2021 Vulcanize, Inc.
//

import assert from 'assert';
import { DeepPartial, FindConditions, FindManyOptions, ObjectLiteral } from 'typeorm';
import debug from 'debug';
import { ethers, constants } from 'ethers';
import { SelectionNode } from 'graphql';

import { JsonFragment } from '@ethersproject/abi';
import { BaseProvider } from '@ethersproject/providers';
import { MappingKey, StorageLayout } from '@cerc-io/solidity-mapper';
import {
  Indexer as BaseIndexer,
  IndexerInterface,
  ValueResult,
  ServerConfig,
  JobQueue,
  Where,
  QueryOptions,
  BlockHeight,
  ResultMeta,
  updateSubgraphState,
  dumpSubgraphState,
  GraphWatcherInterface,
  StateKind,
  StateStatus,
  ResultEvent,
  getResultEvent,
  DatabaseInterface,
  Clients,
  EthClient,
  UpstreamConfig,
  EthFullBlock,
  EthFullTransaction,
  ExtraEventData
} from '@cerc-io/util';
import { GraphWatcher } from '@cerc-io/graph-node';

import FactoryArtifacts from './artifacts/Factory.json';
import NonfungiblePositionManagerArtifacts from './artifacts/NonfungiblePositionManager.json';
import PoolArtifacts from './artifacts/Pool.json';
import { Database, ENTITIES, SUBGRAPH_ENTITIES } from './database';
import { createInitialState, handleEvent, createStateDiff, createStateCheckpoint } from './hooks';
import { Contract } from './entity/Contract';
import { Event } from './entity/Event';
import { SyncStatus } from './entity/SyncStatus';
import { StateSyncStatus } from './entity/StateSyncStatus';
import { BlockProgress } from './entity/BlockProgress';
import { State } from './entity/State';
/* eslint-disable @typescript-eslint/no-unused-vars */
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
/* eslint-enable @typescript-eslint/no-unused-vars */

import { FrothyEntity } from './entity/FrothyEntity';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const log = debug('vulcanize:indexer');

const KIND_FACTORY = 'Factory';

const KIND_NONFUNGIBLEPOSITIONMANAGER = 'NonfungiblePositionManager';

const KIND_POOL = 'Pool';

export class Indexer implements IndexerInterface {
  _db: Database;
  _ethClient: EthClient;
  _ethProvider: BaseProvider;
  _baseIndexer: BaseIndexer;
  _serverConfig: ServerConfig;
  _upstreamConfig: UpstreamConfig;
  _graphWatcher: GraphWatcher;

  _abiMap: Map<string, JsonFragment[]>;
  _storageLayoutMap: Map<string, StorageLayout>;
  _contractMap: Map<string, ethers.utils.Interface>;
  eventSignaturesMap: Map<string, string[]>;

  _entityTypesMap: Map<string, { [key: string]: string }>;
  _relationsMap: Map<any, { [key: string]: any }>;

  _subgraphStateMap: Map<string, any>;

  constructor (
    config: {
      server: ServerConfig;
      upstream: UpstreamConfig;
    },
    db: DatabaseInterface,
    clients: Clients,
    ethProvider: BaseProvider,
    jobQueue: JobQueue,
    graphWatcher?: GraphWatcherInterface
  ) {
    assert(db);
    assert(clients.ethClient);

    this._db = db as Database;
    this._ethClient = clients.ethClient;
    this._ethProvider = ethProvider;
    this._serverConfig = config.server;
    this._upstreamConfig = config.upstream;
    this._baseIndexer = new BaseIndexer(config, this._db, this._ethClient, this._ethProvider, jobQueue);
    assert(graphWatcher);
    this._graphWatcher = graphWatcher as GraphWatcher;

    this._abiMap = new Map();
    this._storageLayoutMap = new Map();
    this._contractMap = new Map();
    this.eventSignaturesMap = new Map();

    const { abi: FactoryABI } = FactoryArtifacts;

    const { abi: NonfungiblePositionManagerABI } = NonfungiblePositionManagerArtifacts;

    const { abi: PoolABI } = PoolArtifacts;

    assert(FactoryABI);
    this._abiMap.set(KIND_FACTORY, FactoryABI);

    const FactoryContractInterface = new ethers.utils.Interface(FactoryABI);
    this._contractMap.set(KIND_FACTORY, FactoryContractInterface);

    const FactoryEventSignatures = Object.values(FactoryContractInterface.events).map(value => {
      return FactoryContractInterface.getEventTopic(value);
    });
    this.eventSignaturesMap.set(KIND_FACTORY, FactoryEventSignatures);

    assert(NonfungiblePositionManagerABI);
    this._abiMap.set(KIND_NONFUNGIBLEPOSITIONMANAGER, NonfungiblePositionManagerABI);

    const NonfungiblePositionManagerContractInterface = new ethers.utils.Interface(NonfungiblePositionManagerABI);
    this._contractMap.set(KIND_NONFUNGIBLEPOSITIONMANAGER, NonfungiblePositionManagerContractInterface);

    const NonfungiblePositionManagerEventSignatures = Object.values(NonfungiblePositionManagerContractInterface.events).map(value => {
      return NonfungiblePositionManagerContractInterface.getEventTopic(value);
    });
    this.eventSignaturesMap.set(KIND_NONFUNGIBLEPOSITIONMANAGER, NonfungiblePositionManagerEventSignatures);

    assert(PoolABI);
    this._abiMap.set(KIND_POOL, PoolABI);

    const PoolContractInterface = new ethers.utils.Interface(PoolABI);
    this._contractMap.set(KIND_POOL, PoolContractInterface);

    const PoolEventSignatures = Object.values(PoolContractInterface.events).map(value => {
      return PoolContractInterface.getEventTopic(value);
    });
    this.eventSignaturesMap.set(KIND_POOL, PoolEventSignatures);

    this._entityTypesMap = new Map();
    this._populateEntityTypesMap();

    this._relationsMap = new Map();
    this._populateRelationsMap();

    this._subgraphStateMap = new Map();
  }

  get serverConfig (): ServerConfig {
    return this._serverConfig;
  }

  get upstreamConfig (): UpstreamConfig {
    return this._upstreamConfig;
  }

  get storageLayoutMap (): Map<string, StorageLayout> {
    return this._storageLayoutMap;
  }

  get graphWatcher (): GraphWatcher {
    return this._graphWatcher;
  }

  async init (): Promise<void> {
    await this._baseIndexer.fetchContracts();
    await this._baseIndexer.fetchStateStatus();
  }

  async getMetaData (block: BlockHeight): Promise<ResultMeta | null> {
    return this._baseIndexer.getMetaData(block);
  }

  getResultEvent (event: Event): ResultEvent {
    return getResultEvent(event);
  }

  async getStorageValue (storageLayout: StorageLayout, blockHash: string, contractAddress: string, variable: string, ...mappingKeys: MappingKey[]): Promise<ValueResult> {
    return this._baseIndexer.getStorageValue(
      storageLayout,
      blockHash,
      contractAddress,
      variable,
      ...mappingKeys
    );
  }

  async getEntitiesForBlock (blockHash: string, tableName: string): Promise<any[]> {
    return this._db.getEntitiesForBlock(blockHash, tableName);
  }

  async processInitialState (contractAddress: string, blockHash: string): Promise<any> {
    // Call initial state hook.
    return createInitialState(this, contractAddress, blockHash);
  }

  async processStateCheckpoint (contractAddress: string, blockHash: string): Promise<boolean> {
    // Call checkpoint hook.
    return createStateCheckpoint(this, contractAddress, blockHash);
  }

  async processCanonicalBlock (blockHash: string, blockNumber: number): Promise<void> {
    console.time('time:indexer#processCanonicalBlock-finalize_auto_diffs');
    // Finalize staged diff blocks if any.
    await this._baseIndexer.finalizeDiffStaged(blockHash);
    console.timeEnd('time:indexer#processCanonicalBlock-finalize_auto_diffs');

    // Call custom stateDiff hook.
    await createStateDiff(this, blockHash);

    this._graphWatcher.pruneEntityCacheFrothyBlocks(blockHash, blockNumber);
  }

  async processCheckpoint (blockHash: string): Promise<void> {
    // Return if checkpointInterval is <= 0.
    const checkpointInterval = this._serverConfig.checkpointInterval;
    if (checkpointInterval <= 0) return;

    console.time('time:indexer#processCheckpoint-checkpoint');
    await this._baseIndexer.processCheckpoint(this, blockHash, checkpointInterval);
    console.timeEnd('time:indexer#processCheckpoint-checkpoint');
  }

  async processCLICheckpoint (contractAddress: string, blockHash?: string): Promise<string | undefined> {
    return this._baseIndexer.processCLICheckpoint(this, contractAddress, blockHash);
  }

  async getPrevState (blockHash: string, contractAddress: string, kind?: string): Promise<State | undefined> {
    return this._db.getPrevState(blockHash, contractAddress, kind);
  }

  async getLatestState (contractAddress: string, kind: StateKind | null, blockNumber?: number): Promise<State | undefined> {
    return this._db.getLatestState(contractAddress, kind, blockNumber);
  }

  async getStatesByHash (blockHash: string): Promise<State[]> {
    return this._baseIndexer.getStatesByHash(blockHash);
  }

  async getStateByCID (cid: string): Promise<State | undefined> {
    return this._baseIndexer.getStateByCID(cid);
  }

  async getStates (where: FindConditions<State>): Promise<State[]> {
    return this._db.getStates(where);
  }

  getStateData (state: State): any {
    return this._baseIndexer.getStateData(state);
  }

  // Method used to create auto diffs (diff_staged).
  async createDiffStaged (contractAddress: string, blockHash: string, data: any): Promise<void> {
    console.time('time:indexer#createDiffStaged-auto_diff');
    await this._baseIndexer.createDiffStaged(contractAddress, blockHash, data);
    console.timeEnd('time:indexer#createDiffStaged-auto_diff');
  }

  // Method to be used by createStateDiff hook.
  async createDiff (contractAddress: string, blockHash: string, data: any): Promise<void> {
    const block = await this.getBlockProgress(blockHash);
    assert(block);

    await this._baseIndexer.createDiff(contractAddress, block, data);
  }

  // Method to be used by createStateCheckpoint hook.
  async createStateCheckpoint (contractAddress: string, blockHash: string, data: any): Promise<void> {
    const block = await this.getBlockProgress(blockHash);
    assert(block);

    return this._baseIndexer.createStateCheckpoint(contractAddress, block, data);
  }

  // Method to be used by export-state CLI.
  async createCheckpoint (contractAddress: string, blockHash: string): Promise<string | undefined> {
    const block = await this.getBlockProgress(blockHash);
    assert(block);

    return this._baseIndexer.createCheckpoint(this, contractAddress, block);
  }

  // Method to be used by fill-state CLI.
  async createInit (blockHash: string, blockNumber: number): Promise<void> {
    // Create initial state for contracts.
    await this._baseIndexer.createInit(this, blockHash, blockNumber);
  }

  async saveOrUpdateState (state: State): Promise<State> {
    return this._baseIndexer.saveOrUpdateState(state);
  }

  async removeStates (blockNumber: number, kind: StateKind): Promise<void> {
    await this._baseIndexer.removeStates(blockNumber, kind);
  }

  async getSubgraphEntity<Entity extends ObjectLiteral> (
    entity: new () => Entity,
    id: string,
    block: BlockHeight,
    selections: ReadonlyArray<SelectionNode> = []
  ): Promise<any> {
    const data = await this._graphWatcher.getEntity(entity, id, this._relationsMap, block, selections);

    return data;
  }

  async getSubgraphEntities<Entity extends ObjectLiteral> (
    entity: new () => Entity,
    block: BlockHeight,
    where: { [key: string]: any } = {},
    queryOptions: QueryOptions = {},
    selections: ReadonlyArray<SelectionNode> = []
  ): Promise<any[]> {
    return this._graphWatcher.getEntities(entity, this._relationsMap, block, where, queryOptions, selections);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async triggerIndexingOnEvent (event: Event, extraData: ExtraEventData): Promise<void> {
    const resultEvent = this.getResultEvent(event);

    console.time('time:indexer#processEvent-mapping_code');
    // Call subgraph handler for event.
    await this._graphWatcher.handleEvent(resultEvent, extraData);
    console.timeEnd('time:indexer#processEvent-mapping_code');

    // Call custom hook function for indexing on event.
    await handleEvent(this, resultEvent);
  }

  async processEvent (event: Event, extraData: ExtraEventData): Promise<void> {
    // Trigger indexing of data based on the event.
    await this.triggerIndexingOnEvent(event, extraData);
  }

  async processBlock (blockProgress: BlockProgress): Promise<void> {
    console.time('time:indexer#processBlock-init_state');
    // Call a function to create initial state for contracts.
    await this._baseIndexer.createInit(this, blockProgress.blockHash, blockProgress.blockNumber);
    console.timeEnd('time:indexer#processBlock-init_state');

    this._graphWatcher.updateEntityCacheFrothyBlocks(blockProgress);
  }

  async processBlockAfterEvents (blockHash: string, blockNumber: number): Promise<void> {
    console.time('time:indexer#processBlockAfterEvents-mapping_code');
    // Call subgraph handler for block.
    await this._graphWatcher.handleBlock(blockHash, blockNumber);
    console.timeEnd('time:indexer#processBlockAfterEvents-mapping_code');

    console.time('time:indexer#processBlockAfterEvents-dump_subgraph_state');
    // Persist subgraph state to the DB.
    await this.dumpSubgraphState(blockHash);
    console.timeEnd('time:indexer#processBlockAfterEvents-dump_subgraph_state');
  }

  parseEventNameAndArgs (kind: string, logObj: any): any {
    const { topics, data } = logObj;

    const contract = this._contractMap.get(kind);
    assert(contract);

    const logDescription = contract.parseLog({ data, topics });

    const { eventName, eventInfo, eventSignature } = this._baseIndexer.parseEvent(logDescription);

    return {
      eventName,
      eventInfo,
      eventSignature
    };
  }

  async getStateSyncStatus (): Promise<StateSyncStatus | undefined> {
    return this._db.getStateSyncStatus();
  }

  async updateStateSyncStatusIndexedBlock (blockNumber: number, force?: boolean): Promise<StateSyncStatus | undefined> {
    if (!this._serverConfig.enableState) {
      return;
    }

    const dbTx = await this._db.createTransactionRunner();
    let res;

    try {
      res = await this._db.updateStateSyncStatusIndexedBlock(dbTx, blockNumber, force);
      await dbTx.commitTransaction();
    } catch (error) {
      await dbTx.rollbackTransaction();
      throw error;
    } finally {
      await dbTx.release();
    }

    return res;
  }

  async updateStateSyncStatusCheckpointBlock (blockNumber: number, force?: boolean): Promise<StateSyncStatus> {
    const dbTx = await this._db.createTransactionRunner();
    let res;

    try {
      res = await this._db.updateStateSyncStatusCheckpointBlock(dbTx, blockNumber, force);
      await dbTx.commitTransaction();
    } catch (error) {
      await dbTx.rollbackTransaction();
      throw error;
    } finally {
      await dbTx.release();
    }

    return res;
  }

  async getLatestCanonicalBlock (): Promise<BlockProgress | undefined> {
    const syncStatus = await this.getSyncStatus();
    assert(syncStatus);

    if (syncStatus.latestCanonicalBlockHash === constants.HashZero) {
      return;
    }

    const latestCanonicalBlock = await this.getBlockProgress(syncStatus.latestCanonicalBlockHash);
    assert(latestCanonicalBlock);

    return latestCanonicalBlock;
  }

  async getLatestStateIndexedBlock (): Promise<BlockProgress> {
    return this._baseIndexer.getLatestStateIndexedBlock();
  }

  async addContracts (): Promise<void> {
    // Watching all the contracts in the subgraph.
    await this._graphWatcher.addContracts();
  }

  async watchContract (address: string, kind: string, checkpoint: boolean, startingBlock: number, context?: any): Promise<void> {
    return this._baseIndexer.watchContract(address, kind, checkpoint, startingBlock, context);
  }

  updateStateStatusMap (address: string, stateStatus: StateStatus): void {
    this._baseIndexer.updateStateStatusMap(address, stateStatus);
  }

  cacheContract (contract: Contract): void {
    return this._baseIndexer.cacheContract(contract);
  }

  async saveEventEntity (dbEvent: Event): Promise<Event> {
    return this._baseIndexer.saveEventEntity(dbEvent);
  }

  async saveEvents (dbEvents: Event[]): Promise<void> {
    return this._baseIndexer.saveEvents(dbEvents);
  }

  async getEventsByFilter (blockHash: string, contract?: string, name?: string): Promise<Array<Event>> {
    return this._baseIndexer.getEventsByFilter(blockHash, contract, name);
  }

  isWatchedContract (address : string): Contract | undefined {
    return this._baseIndexer.isWatchedContract(address);
  }

  getWatchedContracts (): Contract[] {
    return this._baseIndexer.getWatchedContracts();
  }

  getContractsByKind (kind: string): Contract[] {
    return this._baseIndexer.getContractsByKind(kind);
  }

  async getProcessedBlockCountForRange (fromBlockNumber: number, toBlockNumber: number): Promise<{ expected: number, actual: number }> {
    return this._baseIndexer.getProcessedBlockCountForRange(fromBlockNumber, toBlockNumber);
  }

  async getEventsInRange (fromBlockNumber: number, toBlockNumber: number): Promise<Array<Event>> {
    return this._baseIndexer.getEventsInRange(fromBlockNumber, toBlockNumber, this._serverConfig.maxEventsBlockRange);
  }

  async getSyncStatus (): Promise<SyncStatus | undefined> {
    return this._baseIndexer.getSyncStatus();
  }

  async getBlocks (blockFilter: { blockHash?: string, blockNumber?: number }): Promise<any> {
    return this._baseIndexer.getBlocks(blockFilter);
  }

  async updateSyncStatusIndexedBlock (blockHash: string, blockNumber: number, force = false): Promise<SyncStatus> {
    return this._baseIndexer.updateSyncStatusIndexedBlock(blockHash, blockNumber, force);
  }

  async updateSyncStatusChainHead (blockHash: string, blockNumber: number, force = false): Promise<SyncStatus> {
    return this._baseIndexer.updateSyncStatusChainHead(blockHash, blockNumber, force);
  }

  async updateSyncStatusCanonicalBlock (blockHash: string, blockNumber: number, force = false): Promise<SyncStatus> {
    const syncStatus = this._baseIndexer.updateSyncStatusCanonicalBlock(blockHash, blockNumber, force);
    await this.pruneFrothyEntities(blockNumber);

    return syncStatus;
  }

  async updateSyncStatusProcessedBlock (blockHash: string, blockNumber: number, force = false): Promise<SyncStatus> {
    return this._baseIndexer.updateSyncStatusProcessedBlock(blockHash, blockNumber, force);
  }

  async updateSyncStatusIndexingError (hasIndexingError: boolean): Promise<SyncStatus | undefined> {
    return this._baseIndexer.updateSyncStatusIndexingError(hasIndexingError);
  }

  async getEvent (id: string): Promise<Event | undefined> {
    return this._baseIndexer.getEvent(id);
  }

  async getBlockProgress (blockHash: string): Promise<BlockProgress | undefined> {
    return this._baseIndexer.getBlockProgress(blockHash);
  }

  async getBlockProgressEntities (where: FindConditions<BlockProgress>, options: FindManyOptions<BlockProgress>): Promise<BlockProgress[]> {
    return this._baseIndexer.getBlockProgressEntities(where, options);
  }

  async getBlocksAtHeight (height: number, isPruned: boolean): Promise<BlockProgress[]> {
    return this._baseIndexer.getBlocksAtHeight(height, isPruned);
  }

  async fetchAndSaveFilteredEventsAndBlocks (startBlock: number, endBlock: number): Promise<{
    blockProgress: BlockProgress,
    events: DeepPartial<Event>[],
    ethFullBlock: EthFullBlock;
    ethFullTransactions: EthFullTransaction[];
  }[]> {
    return this._baseIndexer.fetchAndSaveFilteredEventsAndBlocks(startBlock, endBlock, this.eventSignaturesMap, this.parseEventNameAndArgs.bind(this));
  }

  async fetchEventsForContracts (blockHash: string, blockNumber: number, addresses: string[]): Promise<DeepPartial<Event>[]> {
    return this._baseIndexer.fetchEventsForContracts(blockHash, blockNumber, addresses, this.eventSignaturesMap, this.parseEventNameAndArgs.bind(this));
  }

  async saveBlockAndFetchEvents (block: DeepPartial<BlockProgress>): Promise<[
    BlockProgress,
    DeepPartial<Event>[],
    EthFullTransaction[]
  ]> {
    return this._saveBlockAndFetchEvents(block);
  }

  async getBlockEvents (blockHash: string, where: Where, queryOptions: QueryOptions): Promise<Array<Event>> {
    return this._baseIndexer.getBlockEvents(blockHash, where, queryOptions);
  }

  async removeUnknownEvents (block: BlockProgress): Promise<void> {
    return this._baseIndexer.removeUnknownEvents(Event, block);
  }

  async markBlocksAsPruned (blocks: BlockProgress[]): Promise<void> {
    await this._baseIndexer.markBlocksAsPruned(blocks);

    await this._graphWatcher.pruneEntities(FrothyEntity, blocks, SUBGRAPH_ENTITIES);
  }

  async pruneFrothyEntities (blockNumber: number): Promise<void> {
    await this._graphWatcher.pruneFrothyEntities(FrothyEntity, blockNumber);
  }

  async resetLatestEntities (blockNumber: number): Promise<void> {
    await this._graphWatcher.resetLatestEntities(blockNumber);
  }

  async updateBlockProgress (block: BlockProgress, lastProcessedEventIndex: number): Promise<BlockProgress> {
    return this._baseIndexer.updateBlockProgress(block, lastProcessedEventIndex);
  }

  async getAncestorAtDepth (blockHash: string, depth: number): Promise<string> {
    return this._baseIndexer.getAncestorAtDepth(blockHash, depth);
  }

  async resetWatcherToBlock (blockNumber: number): Promise<void> {
    const entities = [...ENTITIES, FrothyEntity];
    await this._baseIndexer.resetWatcherToBlock(blockNumber, entities);

    await this.resetLatestEntities(blockNumber);
  }

  async clearProcessedBlockData (block: BlockProgress): Promise<void> {
    const entities = [...ENTITIES, FrothyEntity];
    await this._baseIndexer.clearProcessedBlockData(block, entities);

    await this.resetLatestEntities(block.blockNumber);
  }

  getEntityTypesMap (): Map<string, { [key: string]: string }> {
    return this._entityTypesMap;
  }

  getRelationsMap (): Map<any, { [key: string]: any }> {
    return this._relationsMap;
  }

  updateSubgraphState (contractAddress: string, data: any): void {
    return updateSubgraphState(this._subgraphStateMap, contractAddress, data);
  }

  async dumpSubgraphState (blockHash: string, isStateFinalized = false): Promise<void> {
    return dumpSubgraphState(this, this._subgraphStateMap, blockHash, isStateFinalized);
  }

  _populateEntityTypesMap (): void {
    this._entityTypesMap.set('Factory', {
      id: 'ID',
      poolCount: 'BigInt',
      txCount: 'BigInt',
      totalVolumeUSD: 'BigDecimal',
      totalVolumeETH: 'BigDecimal',
      totalFeesUSD: 'BigDecimal',
      totalFeesETH: 'BigDecimal',
      untrackedVolumeUSD: 'BigDecimal',
      totalValueLockedUSD: 'BigDecimal',
      totalValueLockedETH: 'BigDecimal',
      totalValueLockedUSDUntracked: 'BigDecimal',
      totalValueLockedETHUntracked: 'BigDecimal',
      owner: 'ID'
    });
    this._entityTypesMap.set('Bundle', {
      id: 'ID',
      ethPriceUSD: 'BigDecimal'
    });
    this._entityTypesMap.set('Token', {
      id: 'ID',
      symbol: 'String',
      name: 'String',
      decimals: 'BigInt',
      totalSupply: 'BigInt',
      volume: 'BigDecimal',
      volumeUSD: 'BigDecimal',
      untrackedVolumeUSD: 'BigDecimal',
      feesUSD: 'BigDecimal',
      txCount: 'BigInt',
      poolCount: 'BigInt',
      totalValueLocked: 'BigDecimal',
      totalValueLockedUSD: 'BigDecimal',
      totalValueLockedUSDUntracked: 'BigDecimal',
      derivedETH: 'BigDecimal',
      whitelistPools: 'Pool'
    });
    this._entityTypesMap.set('Pool', {
      id: 'ID',
      createdAtTimestamp: 'BigInt',
      createdAtBlockNumber: 'BigInt',
      token0: 'Token',
      token1: 'Token',
      feeTier: 'BigInt',
      liquidity: 'BigInt',
      sqrtPrice: 'BigInt',
      feeGrowthGlobal0X128: 'BigInt',
      feeGrowthGlobal1X128: 'BigInt',
      token0Price: 'BigDecimal',
      token1Price: 'BigDecimal',
      tick: 'BigInt',
      observationIndex: 'BigInt',
      volumeToken0: 'BigDecimal',
      volumeToken1: 'BigDecimal',
      volumeUSD: 'BigDecimal',
      untrackedVolumeUSD: 'BigDecimal',
      feesUSD: 'BigDecimal',
      txCount: 'BigInt',
      collectedFeesToken0: 'BigDecimal',
      collectedFeesToken1: 'BigDecimal',
      collectedFeesUSD: 'BigDecimal',
      totalValueLockedToken0: 'BigDecimal',
      totalValueLockedToken1: 'BigDecimal',
      totalValueLockedETH: 'BigDecimal',
      totalValueLockedUSD: 'BigDecimal',
      totalValueLockedUSDUntracked: 'BigDecimal',
      liquidityProviderCount: 'BigInt'
    });
    this._entityTypesMap.set('Tick', {
      id: 'ID',
      poolAddress: 'String',
      tickIdx: 'BigInt',
      pool: 'Pool',
      liquidityGross: 'BigInt',
      liquidityNet: 'BigInt',
      price0: 'BigDecimal',
      price1: 'BigDecimal',
      volumeToken0: 'BigDecimal',
      volumeToken1: 'BigDecimal',
      volumeUSD: 'BigDecimal',
      untrackedVolumeUSD: 'BigDecimal',
      feesUSD: 'BigDecimal',
      collectedFeesToken0: 'BigDecimal',
      collectedFeesToken1: 'BigDecimal',
      collectedFeesUSD: 'BigDecimal',
      createdAtTimestamp: 'BigInt',
      createdAtBlockNumber: 'BigInt',
      liquidityProviderCount: 'BigInt',
      feeGrowthOutside0X128: 'BigInt',
      feeGrowthOutside1X128: 'BigInt'
    });
    this._entityTypesMap.set('Position', {
      id: 'ID',
      owner: 'Bytes',
      pool: 'Pool',
      token0: 'Token',
      token1: 'Token',
      tickLower: 'Tick',
      tickUpper: 'Tick',
      liquidity: 'BigInt',
      depositedToken0: 'BigDecimal',
      depositedToken1: 'BigDecimal',
      withdrawnToken0: 'BigDecimal',
      withdrawnToken1: 'BigDecimal',
      collectedToken0: 'BigDecimal',
      collectedToken1: 'BigDecimal',
      collectedFeesToken0: 'BigDecimal',
      collectedFeesToken1: 'BigDecimal',
      amountDepositedUSD: 'BigDecimal',
      amountWithdrawnUSD: 'BigDecimal',
      amountCollectedUSD: 'BigDecimal',
      transaction: 'Transaction',
      feeGrowthInside0LastX128: 'BigInt',
      feeGrowthInside1LastX128: 'BigInt'
    });
    this._entityTypesMap.set('PositionSnapshot', {
      id: 'ID',
      owner: 'Bytes',
      pool: 'Pool',
      position: 'Position',
      blockNumber: 'BigInt',
      timestamp: 'BigInt',
      liquidity: 'BigInt',
      depositedToken0: 'BigDecimal',
      depositedToken1: 'BigDecimal',
      withdrawnToken0: 'BigDecimal',
      withdrawnToken1: 'BigDecimal',
      collectedFeesToken0: 'BigDecimal',
      collectedFeesToken1: 'BigDecimal',
      transaction: 'Transaction',
      feeGrowthInside0LastX128: 'BigInt',
      feeGrowthInside1LastX128: 'BigInt'
    });
    this._entityTypesMap.set('Transaction', {
      id: 'ID',
      blockNumber: 'BigInt',
      timestamp: 'BigInt',
      gasUsed: 'BigInt',
      gasPrice: 'BigInt'
    });
    this._entityTypesMap.set('Mint', {
      id: 'ID',
      transaction: 'Transaction',
      timestamp: 'BigInt',
      pool: 'Pool',
      token0: 'Token',
      token1: 'Token',
      owner: 'Bytes',
      sender: 'Bytes',
      origin: 'Bytes',
      amount: 'BigInt',
      amount0: 'BigDecimal',
      amount1: 'BigDecimal',
      amountUSD: 'BigDecimal',
      tickLower: 'BigInt',
      tickUpper: 'BigInt',
      logIndex: 'BigInt'
    });
    this._entityTypesMap.set('Burn', {
      id: 'ID',
      transaction: 'Transaction',
      pool: 'Pool',
      token0: 'Token',
      token1: 'Token',
      timestamp: 'BigInt',
      owner: 'Bytes',
      origin: 'Bytes',
      amount: 'BigInt',
      amount0: 'BigDecimal',
      amount1: 'BigDecimal',
      amountUSD: 'BigDecimal',
      tickLower: 'BigInt',
      tickUpper: 'BigInt',
      logIndex: 'BigInt'
    });
    this._entityTypesMap.set('Swap', {
      id: 'ID',
      transaction: 'Transaction',
      timestamp: 'BigInt',
      pool: 'Pool',
      token0: 'Token',
      token1: 'Token',
      sender: 'Bytes',
      recipient: 'Bytes',
      origin: 'Bytes',
      amount0: 'BigDecimal',
      amount1: 'BigDecimal',
      amountUSD: 'BigDecimal',
      sqrtPriceX96: 'BigInt',
      tick: 'BigInt',
      logIndex: 'BigInt'
    });
    this._entityTypesMap.set('Collect', {
      id: 'ID',
      transaction: 'Transaction',
      timestamp: 'BigInt',
      pool: 'Pool',
      owner: 'Bytes',
      amount0: 'BigDecimal',
      amount1: 'BigDecimal',
      amountUSD: 'BigDecimal',
      tickLower: 'BigInt',
      tickUpper: 'BigInt',
      logIndex: 'BigInt'
    });
    this._entityTypesMap.set('Flash', {
      id: 'ID',
      transaction: 'Transaction',
      timestamp: 'BigInt',
      pool: 'Pool',
      sender: 'Bytes',
      recipient: 'Bytes',
      amount0: 'BigDecimal',
      amount1: 'BigDecimal',
      amountUSD: 'BigDecimal',
      amount0Paid: 'BigDecimal',
      amount1Paid: 'BigDecimal',
      logIndex: 'BigInt'
    });
    this._entityTypesMap.set('UniswapDayData', {
      id: 'ID',
      date: 'Int',
      volumeETH: 'BigDecimal',
      volumeUSD: 'BigDecimal',
      volumeUSDUntracked: 'BigDecimal',
      feesUSD: 'BigDecimal',
      txCount: 'BigInt',
      tvlUSD: 'BigDecimal'
    });
    this._entityTypesMap.set('PoolDayData', {
      id: 'ID',
      date: 'Int',
      pool: 'Pool',
      liquidity: 'BigInt',
      sqrtPrice: 'BigInt',
      token0Price: 'BigDecimal',
      token1Price: 'BigDecimal',
      tick: 'BigInt',
      feeGrowthGlobal0X128: 'BigInt',
      feeGrowthGlobal1X128: 'BigInt',
      tvlUSD: 'BigDecimal',
      volumeToken0: 'BigDecimal',
      volumeToken1: 'BigDecimal',
      volumeUSD: 'BigDecimal',
      feesUSD: 'BigDecimal',
      txCount: 'BigInt',
      open: 'BigDecimal',
      high: 'BigDecimal',
      low: 'BigDecimal',
      close: 'BigDecimal'
    });
    this._entityTypesMap.set('PoolHourData', {
      id: 'ID',
      periodStartUnix: 'Int',
      pool: 'Pool',
      liquidity: 'BigInt',
      sqrtPrice: 'BigInt',
      token0Price: 'BigDecimal',
      token1Price: 'BigDecimal',
      tick: 'BigInt',
      feeGrowthGlobal0X128: 'BigInt',
      feeGrowthGlobal1X128: 'BigInt',
      tvlUSD: 'BigDecimal',
      volumeToken0: 'BigDecimal',
      volumeToken1: 'BigDecimal',
      volumeUSD: 'BigDecimal',
      feesUSD: 'BigDecimal',
      txCount: 'BigInt',
      open: 'BigDecimal',
      high: 'BigDecimal',
      low: 'BigDecimal',
      close: 'BigDecimal'
    });
    this._entityTypesMap.set('TickHourData', {
      id: 'ID',
      periodStartUnix: 'Int',
      pool: 'Pool',
      tick: 'Tick',
      liquidityGross: 'BigInt',
      liquidityNet: 'BigInt',
      volumeToken0: 'BigDecimal',
      volumeToken1: 'BigDecimal',
      volumeUSD: 'BigDecimal',
      feesUSD: 'BigDecimal'
    });
    this._entityTypesMap.set('TickDayData', {
      id: 'ID',
      date: 'Int',
      pool: 'Pool',
      tick: 'Tick',
      liquidityGross: 'BigInt',
      liquidityNet: 'BigInt',
      volumeToken0: 'BigDecimal',
      volumeToken1: 'BigDecimal',
      volumeUSD: 'BigDecimal',
      feesUSD: 'BigDecimal',
      feeGrowthOutside0X128: 'BigInt',
      feeGrowthOutside1X128: 'BigInt'
    });
    this._entityTypesMap.set('TokenDayData', {
      id: 'ID',
      date: 'Int',
      token: 'Token',
      volume: 'BigDecimal',
      volumeUSD: 'BigDecimal',
      untrackedVolumeUSD: 'BigDecimal',
      totalValueLocked: 'BigDecimal',
      totalValueLockedUSD: 'BigDecimal',
      priceUSD: 'BigDecimal',
      feesUSD: 'BigDecimal',
      open: 'BigDecimal',
      high: 'BigDecimal',
      low: 'BigDecimal',
      close: 'BigDecimal'
    });
    this._entityTypesMap.set('TokenHourData', {
      id: 'ID',
      periodStartUnix: 'Int',
      token: 'Token',
      volume: 'BigDecimal',
      volumeUSD: 'BigDecimal',
      untrackedVolumeUSD: 'BigDecimal',
      totalValueLocked: 'BigDecimal',
      totalValueLockedUSD: 'BigDecimal',
      priceUSD: 'BigDecimal',
      feesUSD: 'BigDecimal',
      open: 'BigDecimal',
      high: 'BigDecimal',
      low: 'BigDecimal',
      close: 'BigDecimal'
    });
    this._entityTypesMap.set('IncreaseEvent', {
      id: 'ID',
      pool: 'Pool',
      tokenID: 'BigInt',
      position: 'Position',
      amount0: 'BigInt',
      amount1: 'BigInt',
      token0: 'Token',
      token1: 'Token',
      timeStamp: 'BigInt',
      transaction: 'Transaction'
    });
    this._entityTypesMap.set('DecreaseEvent', {
      id: 'ID',
      pool: 'Pool',
      tokenID: 'BigInt',
      position: 'Position',
      amount0: 'BigInt',
      amount1: 'BigInt',
      token0: 'Token',
      token1: 'Token',
      timeStamp: 'BigInt',
      transaction: 'Transaction'
    });
  }

  _populateRelationsMap (): void {
    this._relationsMap.set(Token, {
      whitelistPools: {
        entity: Pool,
        isArray: true,
        isDerived: false
      },
      tokenDayData: {
        entity: TokenDayData,
        isArray: true,
        isDerived: true,
        field: 'token'
      }
    });
    this._relationsMap.set(Pool, {
      token0: {
        entity: Token,
        isArray: false,
        isDerived: false
      },
      token1: {
        entity: Token,
        isArray: false,
        isDerived: false
      },
      poolHourData: {
        entity: PoolHourData,
        isArray: true,
        isDerived: true,
        field: 'pool'
      },
      poolDayData: {
        entity: PoolDayData,
        isArray: true,
        isDerived: true,
        field: 'pool'
      },
      mints: {
        entity: Mint,
        isArray: true,
        isDerived: true,
        field: 'pool'
      },
      burns: {
        entity: Burn,
        isArray: true,
        isDerived: true,
        field: 'pool'
      },
      swaps: {
        entity: Swap,
        isArray: true,
        isDerived: true,
        field: 'pool'
      },
      collects: {
        entity: Collect,
        isArray: true,
        isDerived: true,
        field: 'pool'
      },
      ticks: {
        entity: Tick,
        isArray: true,
        isDerived: true,
        field: 'pool'
      }
    });
    this._relationsMap.set(Tick, {
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(Position, {
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      },
      token0: {
        entity: Token,
        isArray: false,
        isDerived: false
      },
      token1: {
        entity: Token,
        isArray: false,
        isDerived: false
      },
      tickLower: {
        entity: Tick,
        isArray: false,
        isDerived: false
      },
      tickUpper: {
        entity: Tick,
        isArray: false,
        isDerived: false
      },
      transaction: {
        entity: Transaction,
        isArray: false,
        isDerived: false
      },
      increaseEvents: {
        entity: IncreaseEvent,
        isArray: true,
        isDerived: true,
        field: 'position'
      },
      decreaseEvents: {
        entity: IncreaseEvent,
        isArray: true,
        isDerived: true,
        field: 'position'
      }
    });
    this._relationsMap.set(PositionSnapshot, {
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      },
      position: {
        entity: Position,
        isArray: false,
        isDerived: false
      },
      transaction: {
        entity: Transaction,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(Transaction, {
      mints: {
        entity: Mint,
        isArray: true,
        isDerived: true,
        field: 'transaction'
      },
      burns: {
        entity: Burn,
        isArray: true,
        isDerived: true,
        field: 'transaction'
      },
      swaps: {
        entity: Swap,
        isArray: true,
        isDerived: true,
        field: 'transaction'
      },
      flashed: {
        entity: Flash,
        isArray: true,
        isDerived: true,
        field: 'transaction'
      },
      collects: {
        entity: Collect,
        isArray: true,
        isDerived: true,
        field: 'transaction'
      }
    });
    this._relationsMap.set(Mint, {
      transaction: {
        entity: Transaction,
        isArray: false,
        isDerived: false
      },
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      },
      token0: {
        entity: Token,
        isArray: false,
        isDerived: false
      },
      token1: {
        entity: Token,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(Burn, {
      transaction: {
        entity: Transaction,
        isArray: false,
        isDerived: false
      },
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      },
      token0: {
        entity: Token,
        isArray: false,
        isDerived: false
      },
      token1: {
        entity: Token,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(Swap, {
      transaction: {
        entity: Transaction,
        isArray: false,
        isDerived: false
      },
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      },
      token0: {
        entity: Token,
        isArray: false,
        isDerived: false
      },
      token1: {
        entity: Token,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(Collect, {
      transaction: {
        entity: Transaction,
        isArray: false,
        isDerived: false
      },
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(Flash, {
      transaction: {
        entity: Transaction,
        isArray: false,
        isDerived: false
      },
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(PoolDayData, {
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(PoolHourData, {
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(TickHourData, {
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      },
      tick: {
        entity: Tick,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(TickDayData, {
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      },
      tick: {
        entity: Tick,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(TokenDayData, {
      token: {
        entity: Token,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(TokenHourData, {
      token: {
        entity: Token,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(IncreaseEvent, {
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      },
      position: {
        entity: Position,
        isArray: false,
        isDerived: false
      },
      token0: {
        entity: Token,
        isArray: false,
        isDerived: false
      },
      token1: {
        entity: Token,
        isArray: false,
        isDerived: false
      },
      transaction: {
        entity: Transaction,
        isArray: false,
        isDerived: false
      }
    });
    this._relationsMap.set(DecreaseEvent, {
      pool: {
        entity: Pool,
        isArray: false,
        isDerived: false
      },
      position: {
        entity: Position,
        isArray: false,
        isDerived: false
      },
      token0: {
        entity: Token,
        isArray: false,
        isDerived: false
      },
      token1: {
        entity: Token,
        isArray: false,
        isDerived: false
      },
      transaction: {
        entity: Transaction,
        isArray: false,
        isDerived: false
      }
    });
  }

  async _saveBlockAndFetchEvents ({
    cid: blockCid,
    blockHash,
    blockNumber,
    blockTimestamp,
    parentHash
  }: DeepPartial<BlockProgress>): Promise<[
    BlockProgress,
    DeepPartial<Event>[],
    EthFullTransaction[]
  ]> {
    assert(blockHash);
    assert(blockNumber);

    const { events: dbEvents, transactions } = await this._baseIndexer.fetchEvents(blockHash, blockNumber, this.eventSignaturesMap, this.parseEventNameAndArgs.bind(this));

    const dbTx = await this._db.createTransactionRunner();
    try {
      const block = {
        cid: blockCid,
        blockHash,
        blockNumber,
        blockTimestamp,
        parentHash
      };

      console.time(`time:indexer#_saveBlockAndFetchEvents-db-save-${blockNumber}`);
      const blockProgress = await this._db.saveBlockWithEvents(dbTx, block, dbEvents);
      await dbTx.commitTransaction();
      console.timeEnd(`time:indexer#_saveBlockAndFetchEvents-db-save-${blockNumber}`);

      return [blockProgress, [], transactions];
    } catch (error) {
      await dbTx.rollbackTransaction();
      throw error;
    } finally {
      await dbTx.release();
    }
  }
}
