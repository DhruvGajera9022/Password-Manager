/**
 * Checks whether the given user has permission to access the vault.
 *
 * @param {string} userId - The ID of the requesting user.
 * @param {string} vaultUserId - The ID of the user who owns the vault.
 * @throws {ForbiddenException} If the user does not have permission to access the vault.
 */
import { ForbiddenException } from '@nestjs/common';

export const checkVaultPermission = (
  userId: string,
  vaultUserId: string,
): void => {
  if (userId !== vaultUserId) {
    throw new ForbiddenException(
      'You do not have permission to access this vault.',
    );
  }
};
