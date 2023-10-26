//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { decimalTransformer } from '@cerc-io/util';
import { Decimal } from 'decimal.js';

@Entity()
@Index(['blockNumber'])
export class TokenDayData {
  @PrimaryColumn('varchar')
    id!: string;

  @PrimaryColumn('varchar', { length: 66 })
    blockHash!: string;

  @Column('integer')
    blockNumber!: number;

  @Column('integer')
    date!: number;

  @Column('varchar')
    token!: string;

  @Column('numeric', { transformer: decimalTransformer })
    volume!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    volumeUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    untrackedVolumeUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLocked!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    totalValueLockedUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    priceUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    feesUSD!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    open!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    high!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    low!: Decimal;

  @Column('numeric', { transformer: decimalTransformer })
    close!: Decimal;

  @Column('boolean', { default: false })
    isPruned!: boolean;
}
