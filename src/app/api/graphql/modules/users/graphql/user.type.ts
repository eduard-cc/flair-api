import {Field, ID, ObjectType} from '@nestjs/graphql';
import {TypeAccount} from '../../accounts/graphql/account.type';

@ObjectType('User')
export class TypeUser {
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

  @Field(() => [TypeAccount])
  accounts: TypeAccount[];
}
