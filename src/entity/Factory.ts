//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer, bigintTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class Factory {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('numeric', { transformer: bigintTransformer })
    poolCount!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    txCount!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    totalVolumeUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalVolumeETH!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalFeesUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalFeesETH!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    untrackedVolumeUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLockedUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLockedETH!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLockedUSDUntracked!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLockedETHUntracked!: Decimal;

  @Column('varchar')
    owner!: string;

  @Column('boolean', { default: false })
    isPruned!: boolean;

  @Column('boolean', { default: false })
    isRemoved!: boolean;
}
