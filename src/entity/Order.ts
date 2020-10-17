import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

export enum OrderStatus {
  CREATED = 'CRE',
  CONFIRMED = 'CON',
  CANCELLED = 'CAN',
  DELIVERED = 'DEL'
}
@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pin: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.CREATED
  })
  status: OrderStatus;
}
