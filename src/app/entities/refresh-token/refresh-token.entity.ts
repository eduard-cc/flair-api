import {Column, Entity, JoinColumn, OneToOne} from 'typeorm';

import {User} from '@entities/user/user.entity';

@Entity()
export class RefreshToken {
  @Column({type: 'varchar', length: 255})
  token: string;

  @OneToOne(() => User, (user) => user.refreshToken)
  @JoinColumn()
  user: User;

  @Column({type: 'timestamp'})
  expiresAt: Date;
}