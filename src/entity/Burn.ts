//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer, bigintTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class Burn {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('varchar')
    transaction!: string;

  @Column('varchar')
    pool!: string;

  @Column('varchar')
    token0!: string;

  @Column('varchar')
    token1!: string;

  @Column('numeric', { transformer: bigintTransformer })
    timestamp!: bigint;

  @Column('varchar', { nullable: true })
    owner!: string | null;

  @Column('varchar')
    origin!: string;

  @Column('numeric', { transformer: bigintTransformer })
    amount!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    amount0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    amount1!: Decimal;

  @Column('numeric', { nullable: true, transformer: decimalTransformer })
    amountUSD!: Decimal | null;

  @Column('numeric', { transformer: bigintTransformer })
    tickLower!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    tickUpper!: bigint;

  @Column('numeric', { nullable: true, transformer: bigintTransformer })
    logIndex!: bigint | null;

  @Column('boolean', { default: false })
    isPruned!: boolean;
}
