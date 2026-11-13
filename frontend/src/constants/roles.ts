export const USER_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
  STAFF: 'STAFF',
  SUPER_ADMIN: 'SUPER_ADMIN',
  CUSTOMER: 'CUSTOMER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

const ROLE_VALUES = Object.values(USER_ROLES);

export function resolveUserRole(role: string | undefined, fallback: UserRole = 'USER'): UserRole {
  const match = ROLE_VALUES.find((item) => item === role);
  return match ?? fallback;
}
