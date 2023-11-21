//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer, bigintTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class Position {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('varchar')
    owner!: string;

  @Column('varchar')
    pool!: string;

  @Column('varchar')
    token0!: string;

  @Column('varchar')
    token1!: string;

  @Column('varchar')
    tickLower!: string;

  @Column('varchar')
    tickUpper!: string;

  @Column('numeric', { transformer: bigintTransformer })
    liquidity!: bigint;

  @Column('numeric', { transformer: decimalTransformer })
    depositedToken0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    depositedToken1!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    withdrawnToken0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    withdrawnToken1!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    collectedToken0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    collectedToken1!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    collectedFeesToken0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    collectedFeesToken1!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    amountDepositedUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    amountWithdrawnUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    amountCollectedUSD!: Decimal;

  @Column('varchar')
    transaction!: string;

  @Column('numeric', { transformer: bigintTransformer })
    feeGrowthInside0LastX128!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    feeGrowthInside1LastX128!: bigint;

  @Column('boolean', { default: false })
    isPruned!: boolean;

  @Column('boolean', { default: false })
    isRemoved!: boolean;
}
