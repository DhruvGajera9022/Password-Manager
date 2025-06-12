import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { VaultService } from './vault.service';
import { commonResponse, userResponse, vaultResponse } from '@utils/constant';
import { BadRequestResponse, InternalServerErrorResponse } from '@utils/dto';
import {
  CreateVaultDto,
  IVaultData,
  Paginated,
  UpdateVaultDto,
  VaultAllResponse,
  VaultCreatedResponse,
  VaultDeletedResponse,
  VaultFilterOptions,
  VaultSingleResponse,
  VaultUpdatedResponse,
} from './dto';
import { ICommonResponse } from '@utils/common.type';
import { JwtAuthGuard } from '@common/jwt/jwt-auth.guard';
import { CurrentUser } from '@decorators/current-user.decorator';
import { SortOrder } from '@utils/enum';

@ApiTags('Vaults')
@Controller('v1/vault')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiBadRequestResponse({
  type: BadRequestResponse,
  description: commonResponse.bad_request,
})
@ApiInternalServerErrorResponse({
  type: InternalServerErrorResponse,
  description: commonResponse.internal_server_error,
})
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Post()
  @ApiOperation({
    description: 'This API is for add vault',
    summary: 'This API is for add vault',
  })
  @ApiCreatedResponse({
    description: vaultResponse.vault_created_successfully,
    type: VaultCreatedResponse,
  })
  async createVault(
    @CurrentUser() user: any,
    @Body() createDto: CreateVaultDto,
  ): Promise<ICommonResponse<IVaultData>> {
    return this.vaultService.create(user.sub, createDto);
  }

  @Get()
  @ApiOperation({
    description: 'Retrieve all vaults with pagination, search, and filtering',
    summary: 'This API is for get all vaults',
  })
  @ApiCreatedResponse({
    description: vaultResponse.all_vault_retrieved_successfully,
    type: VaultAllResponse,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of items per page (max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for filtering vaults',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: SortOrder,
    example: SortOrder.DESC,
    description: 'Sort order (asc/desc)',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'favorite',
    required: false,
    type: Boolean,
    description: 'Filter by favorite status',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: [String],
    description: 'Filter by tags',
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: SortOrder = SortOrder.DESC,
    @Query('category') category?: string,
    @Query('favorite') favorite?: string,
    @Query('tags') tags?: string | string[],
  ): Promise<ICommonResponse<Paginated<IVaultData>>> {
    // Parse and validate pagination parameters
    const pageNum = this.parsePositiveInteger(page, 'page');
    const limitNum = this.parsePositiveInteger(limit, 'limit');

    if (limitNum > 100) {
      throw new BadRequestException('Limit cannot exceed 100');
    }

    if (!user?.sub) {
      throw new BadRequestException(userResponse.userId_is_required);
    }

    // Parse boolean favorite parameter
    const favoriteBoolean =
      favorite === 'true' ? true : favorite === 'false' ? false : undefined;

    // Normalize tags parameter
    const tagsArray = this.normalizeTags(tags);

    const filter: VaultFilterOptions = {
      category: category?.trim() || undefined,
      favorite: favoriteBoolean,
      tags: tagsArray,
    };

    return await this.vaultService.findAll(
      user.sub,
      pageNum,
      limitNum,
      search?.trim(),
      sortBy,
      sortOrder,
      filter,
    );
  }

  private parsePositiveInteger(value: string, fieldName: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 1) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }
    return parsed;
  }

  private normalizeTags(tags?: string | string[]): string[] | undefined {
    if (!tags) return undefined;

    if (Array.isArray(tags)) {
      return tags.filter((tag) => tag?.trim()).map((tag) => tag.trim());
    }

    return tags.trim() ? [tags.trim()] : undefined;
  }

  @Get(':vaultId')
  @ApiOperation({
    summary: 'This API is for get single vault by id',
    description: 'This API is for get single vault by id',
  })
  @ApiParam({
    name: 'vaultId',
    description: 'ID of the vault entry',
    type: String,
  })
  @ApiOkResponse({
    description: vaultResponse.vault_fetched_successfully,
    type: VaultSingleResponse,
  })
  async findById(
    @Param('vaultId') vaultId: string,
    @CurrentUser() user: any,
  ): Promise<ICommonResponse<IVaultData>> {
    return this.vaultService.findById(user.sub, vaultId);
  }

  @Put(':vaultId')
  @ApiOperation({
    summary: 'This API is for update vault by id',
    description: 'This API is for update vault by id',
  })
  @ApiParam({
    name: 'vaultId',
    description: 'ID of the vault entry',
    type: String,
  })
  @ApiOkResponse({
    description: vaultResponse.vault_updated_successfully,
    type: VaultUpdatedResponse,
  })
  async update(
    @Param('vaultId') vaultId: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdateVaultDto,
  ): Promise<ICommonResponse<IVaultData>> {
    return this.vaultService.update(user.sub, vaultId, updateDto);
  }

  @Delete(':vaultId')
  @ApiOperation({
    summary: 'This API is for delete single vault by id',
    description: 'This API is for delete single vault by id',
  })
  @ApiParam({
    name: 'vaultId',
    description: 'ID of the vault entry',
    type: String,
  })
  @ApiOkResponse({
    description: vaultResponse.vault_deleted_successfully,
    type: VaultDeletedResponse,
  })
  async delete(
    @Param('vaultId') vaultId: string,
    @CurrentUser() user: any,
  ): Promise<ICommonResponse<IVaultData>> {
    return this.vaultService.delete(user.sub, vaultId);
  }
}
