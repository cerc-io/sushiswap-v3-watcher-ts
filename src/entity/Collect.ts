//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer, bigintTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class Collect {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('varchar')
    transaction!: string;

  @Column('numeric', { transformer: bigintTransformer })
    timestamp!: bigint;

  @Column('varchar')
    pool!: string;

  @Column('varchar', { nullable: true })
    owner!: string | null;

  @Column('numeric', { transformer: decimalTransformer })
    amount0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    amount1!: Decimal;

  @Column('numeric', { nullable: true })
    amountUSD!: Decimal | null;

  @Column('numeric', { transformer: bigintTransformer })
    tickLower!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    tickUpper!: bigint;

  @Column('numeric', { nullable: true })
    logIndex!: bigint | null;

  @Column('boolean', { default: false })
    isPruned!: boolean;
}
