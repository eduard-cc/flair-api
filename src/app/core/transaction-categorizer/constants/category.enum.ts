import {registerEnumType} from '@nestjs/graphql';

export enum Category {
  RENT_AND_UTILITIES = 'RENT_AND_UTILITIES',
  FOOD_AND_DRINK = 'FOOD_AND_DRINK',
  GENERAL_MERCHANDISE = 'GENERAL_MERCHANDISE',
  TRANSPORTATION = 'TRANSPORTATION',
  ENTERTAINMENT = 'ENTERTAINMENT',
  MEDICAL = 'MEDICAL',
  INCOME = 'INCOME',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  OTHER = 'OTHER',
}

registerEnumType(Category, {name: 'Category'});
