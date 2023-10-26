//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer, bigintTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class PositionSnapshot {
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
    position!: string;

  @Column('numeric', { transformer: bigintTransformer })
    _blockNumber!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    timestamp!: bigint;

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
    collectedFeesToken0!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    collectedFeesToken1!: Decimal;

  @Column('varchar')
    transaction!: string;

  @Column('numeric', { transformer: bigintTransformer })
    feeGrowthInside0LastX128!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    feeGrowthInside1LastX128!: bigint;

  @Column('boolean', { default: false })
    isPruned!: boolean;
}
