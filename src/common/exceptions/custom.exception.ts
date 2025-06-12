import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomException extends HttpException {
  constructor(message: string) {
    super(
      { message, statusCode: HttpStatus.I_AM_A_TEAPOT },
      HttpStatus.I_AM_A_TEAPOT,
    );
  }
}
