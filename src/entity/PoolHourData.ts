//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer, bigintTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class PoolHourData {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('integer')
    periodStartUnix!: number;

  @Column('varchar')
    pool!: string;

  @Column('numeric', { transformer: bigintTransformer })
    liquidity!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    sqrtPrice!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    token0Price!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    token1Price!: Decimal;

  @Column('numeric', { nullable: true, transformer: bigintTransformer })
    tick!: bigint | null;

  @Column('numeric', { transformer: bigintTransformer })
    feeGrowthGlobal0X128!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    feeGrowthGlobal1X128!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    tvlUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    volumeToken0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    volumeToken1!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    volumeUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    feesUSD!: Decimal;

  @Column('numeric', { transformer: bigintTransformer })
    txCount!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    open!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    high!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    low!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    close!: Decimal;

  @Column('boolean', { default: false })
    isPruned!: boolean;

  @Column('boolean', { default: false })
    isRemoved!: boolean;
}
