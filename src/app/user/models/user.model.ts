import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Account } from 'src/app/account/models/account.model';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  isActive: boolean;

  @Field()
  createdDate: Date;

  @Field(() => [Account])
  accounts: Account[];
}
