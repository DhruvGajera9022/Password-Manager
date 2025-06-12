import { VaultModelService } from '@entities/vault/vault.model.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateVaultDto,
  IVaultData,
  Paginated,
  UpdateVaultDto,
  VaultFilterOptions,
} from './dto';
import { ICommonResponse } from '@utils/common.type';
import { RESPONSE } from '@utils/constants';
import { userResponse, vaultResponse } from '@utils/constant';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { CommonService } from '@helper/common.helper.service';
import { SortOrder } from '@utils/enum';
import { Types } from 'mongoose';
import { checkVaultPermission } from '@utils/vault-permission.utils';

@Injectable()
export class VaultService {
  constructor(
    private readonly vaultModelService: VaultModelService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly commonService: CommonService,
  ) {}

  /**
   * Creates a new vault entry for the given user.
   *
   * @param {string} userId - The ID of the user creating the vault entry.
   * @param {CreateVaultDto} createDto - The DTO containing vault creation data.
   * @returns {Promise<ICommonResponse<IVaultData>>} The response with created vault data.
   * @throws {BadRequestException} If the encryptedPassword is not provided.
   */
  async create(
    userId: string,
    createDto: CreateVaultDto,
  ): Promise<ICommonResponse<IVaultData>> {
    if (!createDto.encryptedPassword) {
      throw new BadRequestException(vaultResponse.password_is_required);
    }

    const encryptedPassword = this.commonService.encrypt(
      createDto.encryptedPassword,
    );

    const updatedDto = {
      ...createDto,
      encryptedPassword,
    };

    const vault = await this.vaultModelService.create(userId, updatedDto);
    this.logger.log(
      `Vault created for user: ${userId}, site: ${vault.siteName}`,
    );

    const responseData: IVaultData = {
      _id: vault._id.toString(),
      userId: vault.userId.toString(),
      siteName: vault.siteName,
      username: vault.username,
      encryptedPassword: vault.encryptedPassword,
      email: vault.email,
      phone: vault.phone,
      notes: vault.notes,
      favorite: vault.favorite,
      url: vault.url,
      tags: vault.tags,
      category: vault.category,
      avatarUrl: vault.avatarUrl,
    };

    return {
      status: RESPONSE.SUCCESS,
      message: vaultResponse.vault_created_successfully,
      data: responseData,
    };
  }

  /**
   * Retrieves all vaults for a user with pagination, filtering, and search support.
   *
   * @param {string} userId - ID of the user.
   * @param {number} page - Current page number.
   * @param {number} limit - Number of items per page.
   * @param {string} [search] - Optional search string.
   * @param {string} [sortBy='createdAt'] - Field to sort by.
   * @param {SortOrder} [sortOrder=SortOrder.DESC] - Sort direction.
   * @param {VaultFilterOptions} [filter] - Optional filters for tags, category, and favorite.
   * @returns {Promise<ICommonResponse<Paginated<IVaultData>>>} Paginated vaults with decrypted passwords.
   * @throws {BadRequestException} If userId is missing or invalid.
   */
  async findAll(
    userId: string,
    page: number,
    limit: number,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: SortOrder = SortOrder.DESC,
    filter?: VaultFilterOptions,
  ): Promise<ICommonResponse<Paginated<IVaultData>>> {
    if (!userId?.trim()) {
      throw new BadRequestException(userResponse.userId_is_required);
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(userResponse.invalid_userId_format);
    }

    this.logger.log(
      `Finding vaults for user: ${userId}, page: ${page}, limit: ${limit}`,
    );

    const vaults = await this.vaultModelService.findAll(
      userId,
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      filter,
    );

    const transformedResults = await this.transformVaultResults(vaults.results);

    const paginatedData: Paginated<IVaultData> = {
      ...vaults,
      results: transformedResults,
    };

    return {
      status: RESPONSE.SUCCESS,
      message: vaultResponse.all_vault_retrieved_successfully,
      data: paginatedData,
    };
  }

  /**
   * Transforms vault documents by decrypting their passwords.
   *
   * @private
   * @param {any[]} vaults - Array of raw vault documents.
   * @returns {Promise<IVaultData[]>} Transformed vaults with decrypted passwords.
   */
  private async transformVaultResults(vaults: any[]): Promise<IVaultData[]> {
    const transformPromises = vaults.map((vault) =>
      this.transformSingleVault(vault),
    );
    return Promise.all(transformPromises);
  }

  /**
   * Transforms a single vault by decrypting the password and formatting fields.
   *
   * @private
   * @param {any} vault - A single raw vault document.
   * @returns {Promise<IVaultData>} Transformed vault data.
   */
  private async transformSingleVault(vault: any): Promise<IVaultData> {
    try {
      const decryptedPassword = await this.safeDecrypt(vault.encryptedPassword);

      return {
        _id: vault._id.toString(),
        userId: vault.userId.toString(),
        siteName: vault.siteName || '',
        username: vault.username || '',
        encryptedPassword: decryptedPassword,
        email: vault.email,
        phone: vault.phone,
        notes: vault.notes,
        favorite: Boolean(vault.favorite),
        url: vault.url,
        tags: Array.isArray(vault.tags) ? vault.tags : [],
        category: vault.category,
        avatarUrl: vault.avatarUrl,
      };
    } catch (error) {
      this.logger.error(
        `Error transforming vault ${vault._id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Safely decrypts an encrypted password, handling any decryption errors.
   *
   * @private
   * @param {string} encryptedPassword - The encrypted password string.
   * @returns {Promise<string>} Decrypted password or fallback string if decryption fails.
   */
  private async safeDecrypt(encryptedPassword: string): Promise<string> {
    try {
      if (!encryptedPassword) {
        return '';
      }
      return this.commonService.decrypt(encryptedPassword);
    } catch (decryptError) {
      this.logger.error(`Password decryption failed: ${decryptError.message}`);
      return '[DECRYPTION_FAILED]';
    }
  }

  /**
   * Finds a vault entry by user ID and vault ID with permission check.
   *
   * @param {string} userId - ID of the requesting user.
   * @param {string} vaultId - ID of the vault entry.
   * @returns {Promise<ICommonResponse<IVaultData>>} - The vault data wrapped in a common response.
   * @throws {BadRequestException} When userId or vaultId is missing or empty.
   * @throws {NotFoundException} When the vault entry does not exist.
   * @throws {ForbiddenException} When the user does not have permission to access the vault.
   */
  async findById(
    userId: string,
    vaultId: string,
  ): Promise<ICommonResponse<IVaultData>> {
    if (!vaultId?.trim()) {
      throw new BadRequestException(vaultResponse.vaultId_is_required);
    }

    if (!userId?.trim()) {
      throw new BadRequestException(userResponse.userId_is_required);
    }

    const vault = await this.vaultModelService.findById(userId, vaultId);

    if (!vault) {
      throw new NotFoundException(vaultResponse.vault_not_found);
    }

    checkVaultPermission(userId, vault.userId.toString());

    const responseData: IVaultData = {
      _id: vault._id.toString(),
      userId: vault.userId.toString(),
      siteName: vault.siteName,
      username: vault.username,
      encryptedPassword: await this.safeDecrypt(vault.encryptedPassword),
      email: vault.email,
      phone: vault.phone,
      notes: vault.notes,
      favorite: vault.favorite,
      url: vault.url,
      tags: vault.tags,
      category: vault.category,
      avatarUrl: vault.avatarUrl,
    };

    return {
      status: RESPONSE.SUCCESS,
      message: vaultResponse.vault_fetched_successfully,
      data: responseData,
    };
  }

  /**
   * Updates a vault entry with new data for a specific user and vault ID.
   *
   * @param {string} userId - ID of the user requesting the update.
   * @param {string} vaultId - ID of the vault to update.
   * @param {UpdateVaultDto} updateDto - Data fields to be updated.
   * @returns {Promise<ICommonResponse<IVaultData>>} Standard response with updated vault data.
   *
   * @throws {BadRequestException} If vaultId or userId is missing or empty.
   * @throws {NotFoundException} If the vault is not found.
   * @throws {ForbiddenException} If the user does not have permission to access the vault.
   */
  async update(
    userId: string,
    vaultId: string,
    updateDto: UpdateVaultDto,
  ): Promise<ICommonResponse<IVaultData>> {
    if (!vaultId?.trim()) {
      throw new BadRequestException(vaultResponse.vaultId_is_required);
    }

    if (!userId?.trim()) {
      throw new BadRequestException(userResponse.userId_is_required);
    }

    const vault = await this.vaultModelService.findById(userId, vaultId);
    if (!vault) {
      throw new NotFoundException(vaultResponse.vault_not_found);
    }

    checkVaultPermission(userId, vault.userId.toString());

    // Encrypt password if provided
    if (updateDto.encryptedPassword) {
      updateDto.encryptedPassword = this.commonService.encrypt(
        updateDto.encryptedPassword,
      );
    }

    // Perform the update
    await this.vaultModelService.update(userId, vaultId, updateDto);

    // Fetch updated vault document
    const updatedVault = await this.vaultModelService.findById(userId, vaultId);
    if (!updatedVault) {
      throw new NotFoundException(vaultResponse.vault_not_found_after_update);
    }

    const responseData: IVaultData = {
      _id: updatedVault._id.toString(),
      userId: updatedVault.userId.toString(),
      siteName: updatedVault.siteName,
      username: updatedVault.username,
      encryptedPassword: await this.safeDecrypt(updatedVault.encryptedPassword),
      email: updatedVault.email,
      phone: updatedVault.phone,
      notes: updatedVault.notes,
      favorite: updatedVault.favorite,
      url: updatedVault.url,
      tags: updatedVault.tags,
      category: updatedVault.category,
      avatarUrl: updatedVault.avatarUrl,
    };

    return {
      status: RESPONSE.SUCCESS,
      message: vaultResponse.vault_updated_successfully,
      data: responseData,
    };
  }

  /**
   * Deletes a vault entry by its ID for the specified user.
   *
   * @param {string} userId - The ID of the user who owns the vault.
   * @param {string} vaultId - The ID of the vault to delete.
   * @returns {Promise<ICommonResponse<IVaultData>>} A promise that resolves to a response object indicating success or failure.
   *
   * @throws {BadRequestException} If either userId or vaultId is missing or empty.
   * @throws {NotFoundException} If the specified vault does not exist.
   * @throws {ForbiddenException} If the user does not have permission to delete the vault.
   */
  async delete(
    userId: string,
    vaultId: string,
  ): Promise<ICommonResponse<IVaultData>> {
    if (!vaultId?.trim()) {
      throw new BadRequestException(vaultResponse.vaultId_is_required);
    }

    if (!userId?.trim()) {
      throw new BadRequestException(userResponse.userId_is_required);
    }

    const vault = await this.vaultModelService.findById(userId, vaultId);
    if (!vault) {
      throw new NotFoundException(vaultResponse.vault_not_found);
    }

    checkVaultPermission(userId, vault.userId.toString());

    await this.vaultModelService.delete(userId, vaultId);

    return {
      status: RESPONSE.SUCCESS,
      message: vaultResponse.vault_deleted_successfully,
    };
  }
}
