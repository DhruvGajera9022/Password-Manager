import { SwaggerResponse } from '@utils/classes';
import { vaultResponse } from '@utils/constant';
import { vaultResponseData } from '../doc';
import { RESPONSE } from '@utils/constants';

export class VaultCreatedResponse extends SwaggerResponse(
  vaultResponse.vault_created_successfully,
  vaultResponseData,
  RESPONSE.SUCCESS,
) {}

export class VaultAllResponse extends SwaggerResponse(
  vaultResponse.all_vault_retrieved_successfully,
  [vaultResponseData, vaultResponseData],
  RESPONSE.SUCCESS,
) {}

export class VaultSingleResponse extends SwaggerResponse(
  vaultResponse.vault_fetched_successfully,
  vaultResponseData,
  RESPONSE.SUCCESS,
) {}

export class VaultUpdatedResponse extends SwaggerResponse(
  vaultResponse.vault_updated_successfully,
  vaultResponseData,
  RESPONSE.SUCCESS,
) {}

export class VaultDeletedResponse extends SwaggerResponse(
  vaultResponse.vault_deleted_successfully,
  vaultResponseData,
  RESPONSE.SUCCESS,
) {}
