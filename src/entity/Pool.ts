//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer, bigintTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class Pool {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('numeric', { transformer: bigintTransformer })
    createdAtTimestamp!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    createdAtBlockNumber!: bigint;

  @Column('varchar')
    token0!: string;

  @Column('varchar')
    token1!: string;

  @Column('numeric', { transformer: bigintTransformer })
    feeTier!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    liquidity!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    sqrtPrice!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    feeGrowthGlobal0X128!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    feeGrowthGlobal1X128!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    token0Price!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    token1Price!: Decimal;

  @Column('numeric', { nullable: true })
    tick!: bigint | null;

  @Column('numeric', { transformer: bigintTransformer })
    observationIndex!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    volumeToken0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    volumeToken1!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    volumeUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    untrackedVolumeUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    feesUSD!: Decimal;

  @Column('numeric', { transformer: bigintTransformer })
    txCount!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    collectedFeesToken0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    collectedFeesToken1!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    collectedFeesUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLockedToken0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLockedToken1!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLockedETH!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLockedUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLockedUSDUntracked!: Decimal;

  @Column('numeric', { transformer: bigintTransformer })
    liquidityProviderCount!: bigint;

  @Column('boolean', { default: false })
    isPruned!: boolean;
}
