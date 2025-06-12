import { SwaggerResponse } from '@utils/classes';
import { commonResponse } from '@utils/constant';
import { RESPONSE } from '@utils/constants';

export class InvalidAuthTokenResponse extends SwaggerResponse(
  commonResponse.unauthorized_request,
  [],
  RESPONSE.UNAUTHORIZED,
) {}

export class InternalServerErrorResponse extends SwaggerResponse(
  commonResponse.internal_server_error,
  [],
  RESPONSE.FAILURE,
) {}

export class BadRequestResponse extends SwaggerResponse(
  commonResponse.bad_request,
  [],
  RESPONSE.BAD_REQUEST,
) {}
