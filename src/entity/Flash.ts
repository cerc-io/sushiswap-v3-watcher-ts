//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer, bigintTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class Flash {
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

  @Column('varchar')
    sender!: string;

  @Column('varchar')
    recipient!: string;

  @Column('numeric', { transformer: decimalTransformer })
    amount0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    amount1!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    amountUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    amount0Paid!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    amount1Paid!: Decimal;

  @Column('numeric', { nullable: true, transformer: bigintTransformer })
    logIndex!: bigint | null;

  @Column('boolean', { default: false })
    isPruned!: boolean;

  @Column('boolean', { default: false })
    isRemoved!: boolean;
}
