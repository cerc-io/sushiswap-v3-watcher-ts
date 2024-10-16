//
// Copyright 2021 Vulcanize, Inc.
//

import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne } from 'typeorm';
import { BlockProgress } from './BlockProgress';

@Entity()
@Index(['block', 'contract'])
@Index(['block', 'contract', 'eventName'])
export class Event {
  @PrimaryGeneratedColumn()
    id!: number;

  @ManyToOne(() => BlockProgress, { onDelete: 'CASCADE' })
    block!: BlockProgress;

  @Column('varchar', { length: 66 })
    txHash!: string;

  @Column('integer')
    index!: number;

  @Column('varchar', { length: 42 })
    contract!: string;

  @Column('varchar', { length: 256 })
    eventName!: string;

  @Column('varchar', { length: 66 })
    topic0!: string;

  @Column('varchar', { length: 66, nullable: true })
    topic1!: string | null;

  @Column('varchar', { length: 66, nullable: true })
    topic2!: string | null;

  @Column('varchar', { length: 66, nullable: true })
    topic3!: string | null;

  @Column('varchar')
    data!: string;

  @Column('text')
    eventInfo!: string;

  @Column('text')
    extraInfo!: string;

  @Column('text')
    proof!: string;
}
