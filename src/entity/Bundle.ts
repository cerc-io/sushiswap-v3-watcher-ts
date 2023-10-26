//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class Bundle {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('numeric', { transformer: decimalTransformer })
    ethPriceUSD!: Decimal;

  @Column('boolean', { default: false })
    isPruned!: boolean;
}
