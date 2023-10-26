//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer, bigintTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class TickHourData {
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

  @Column('varchar')
    tick!: string;

  @Column('numeric', { transformer: bigintTransformer })
    liquidityGross!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    liquidityNet!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    volumeToken0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    volumeToken1!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    volumeUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    feesUSD!: Decimal;

  @Column('boolean', { default: false })
    isPruned!: boolean;
}
