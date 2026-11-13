import type { UserType } from './user.types';

export interface CollectionOwner {
  id: string;
  name: string;
  email: string;
  role: UserType;
  ownedAt: string;
}

export interface OwnershipItem {
  id: string;
  label: string;
  detail?: string;
  owners: CollectionOwner[];
}
