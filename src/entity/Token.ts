//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer, bigintTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class Token {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('varchar')
    symbol!: string;

  @Column('varchar')
    name!: string;

  @Column('numeric', { transformer: bigintTransformer })
    decimals!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    totalSupply!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    volume!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    volumeUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    untrackedVolumeUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    feesUSD!: Decimal;

  @Column('numeric', { transformer: bigintTransformer })
    txCount!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    poolCount!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLocked!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLockedUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLockedUSDUntracked!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    derivedETH!: Decimal;

  @Column('varchar', { array: true })
    whitelistPools!: string[];

  @Column('boolean', { default: false })
    isPruned!: boolean;
}
