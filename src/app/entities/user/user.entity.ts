import {Entity, Column, PrimaryGeneratedColumn, OneToMany} from 'typeorm';
import {Account} from '@entities/account/account.entity';

//TODO: Use class validator
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({type: 'varchar', length: 255})
  name: string;

  @Column({type: 'varchar', length: 255, unique: true})
  email: string;

  @Column({type: 'varchar', length: 255})
  password: string;

  @Column({type: 'boolean', default: true})
  isActive: boolean;

  @Column({type: 'timestamp', default: () => 'CURRENT_DATE'})
  createdDate: Date;

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];
}
