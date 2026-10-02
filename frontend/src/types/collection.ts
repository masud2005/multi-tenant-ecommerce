export type CollectionType = 'manual' | 'rule';

export interface CollectionRule {
  field: string;
  op: string;
  value: string;
}

export interface CollectionItem {
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
