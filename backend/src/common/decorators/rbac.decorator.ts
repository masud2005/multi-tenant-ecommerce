import { SetMetadata } from '@nestjs/common';

export type RbacAction = 'view' | 'create' | 'update' | 'delete';

export interface RbacPermissionOverride {
  module?: string;
  action?: RbacAction;
}

export const RBAC_OVERRIDE_KEY = 'rbac_override';

// Optional override when an endpoint deviates from standard URL/Method conventions
export const RbacPermission = (module?: string, action?: RbacAction) =>
  SetMetadata(RBAC_OVERRIDE_KEY, { module, action });
