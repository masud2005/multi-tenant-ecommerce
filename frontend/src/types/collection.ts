// Collection domain model and API request/response contracts

export type CollectionType = 'MANUAL' | 'RULE' | 'manual' | 'rule';

export interface CollectionRule {
  field: string;
  op: string;
  value: string;
}

export interface CollectionItem {
  id?: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  type: CollectionType;
  rule?: string;
  ruleDetails?: CollectionRule;
  productSlugs?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface CreateCollectionPayload {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  type?: 'MANUAL' | 'RULE';
  rule?: any;
  isActive?: boolean;
  isFeatured?: boolean;
  order?: number;
  startsAt?: string;
  endsAt?: string;
}

export interface UpdateCollectionPayload {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  type?: 'MANUAL' | 'RULE';
  rule?: any;
  isActive?: boolean;
  isFeatured?: boolean;
  order?: number;
  startsAt?: string;
  endsAt?: string;
}

export interface CollectionResponseData {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  type: 'MANUAL' | 'RULE';
  rule: any;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  products?: any[];
}
