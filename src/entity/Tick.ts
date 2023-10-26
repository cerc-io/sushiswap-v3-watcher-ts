//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer, bigintTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class Tick {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('varchar', { nullable: true })
    poolAddress!: string | null;

  @Column('numeric', { transformer: bigintTransformer })
    tickIdx!: bigint;

  @Column('varchar')
    pool!: string;

  @Column('numeric', { transformer: bigintTransformer })
    liquidityGross!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    liquidityNet!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    price0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    price1!: Decimal;

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

  @Column('numeric', { transformer: decimalTransformer })
    collectedFeesToken0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    collectedFeesToken1!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    collectedFeesUSD!: Decimal;

  @Column('numeric', { transformer: bigintTransformer })
    createdAtTimestamp!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    createdAtBlockNumber!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    liquidityProviderCount!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    feeGrowthOutside0X128!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    feeGrowthOutside1X128!: bigint;

  @Column('boolean', { default: false })
    isPruned!: boolean;
}
