//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { bigintTransformer } from '@cerc-io/util';

@Entity()
@Index(['blockNumber'])
export class Transaction {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('numeric', { transformer: bigintTransformer })
    _blockNumber!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    timestamp!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    gasUsed!: bigint;

  @Column('numeric', { transformer: bigintTransformer })
    gasPrice!: bigint;

  @Column('boolean', { default: false })
    isPruned!: boolean;

  @Column('boolean', { default: false })
    isRemoved!: boolean;
}
