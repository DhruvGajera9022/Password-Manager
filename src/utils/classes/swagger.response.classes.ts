import { ApiProperty } from '@nestjs/swagger';

export const SwaggerResponse = <T>(
  exampleMessage: string,
  exampleData: T,
  status: string,
) => {
  class Response {
    @ApiProperty({
      example: exampleMessage,
    })
    message: string;

    @ApiProperty({
      example: status,
    })
    status: string;

    @ApiProperty({
      example: exampleData,
    })
    data: T;
  }
  return Response;
};
