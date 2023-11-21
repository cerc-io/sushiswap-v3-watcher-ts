//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { bigintTransformer } from '@cerc-io/util';

@Entity()
@Index(['blockNumber'])
export class IncreaseEvent {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('varchar')
    pool!: string;

  @Column('numeric', { transformer: bigintTransformer })
    tokenID!: bigint;

  @Column('varchar')
    position!: string;

  @Column('numeric', { transformer: bigintTransformer })
    amount0!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    amount1!: bigint;

  @Column('varchar')
    token0!: string;

  @Column('varchar')
    token1!: string;

  @Column('numeric', { transformer: bigintTransformer })
    timeStamp!: bigint;

  @Column('varchar')
    transaction!: string;

  @Column('boolean', { default: false })
    isPruned!: boolean;

  @Column('boolean', { default: false })
    isRemoved!: boolean;
}
