//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer, bigintTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class UniswapDayData {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('integer')
    date!: number;

  @Column('numeric', { transformer: decimalTransformer })
    volumeETH!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    volumeUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    volumeUSDUntracked!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    feesUSD!: Decimal;

  @Column('numeric', { transformer: bigintTransformer })
    txCount!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    tvlUSD!: Decimal;

  @Column('boolean', { default: false })
    isPruned!: boolean;

  @Column('boolean', { default: false })
    isRemoved!: boolean;
}
