import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Vault } from './vault.entity';
import { DeleteResult, Model, Types, UpdateResult } from 'mongoose';
import {
  CreateVaultDto,
  Paginated,
  UpdateVaultDto,
  VaultFilterOptions,
} from '@app/vault/dto';
import { SortOrder } from '@utils/enum';

@Injectable()
export class VaultModelService {
  constructor(
    @InjectModel(Vault.name) private readonly vaultModel: Model<Vault>,
  ) {}

  /**
   * Creates a new vault entry for the given user.
   *
   * @param {string} userId - The ID of the user creating the vault entry.
   * @param {CreateVaultDto} createDto - The data required to create a vault.
   * @returns {Promise<Vault>} The created vault document.
   */
  async create(userId: string, createDto: CreateVaultDto): Promise<Vault> {
    return this.vaultModel.insertOne({
      userId,
      siteName: createDto.siteName,
      username: createDto.username,
      encryptedPassword: createDto.encryptedPassword,
      email: createDto.email,
      phone: createDto.phone,
      notes: createDto.notes,
      favorite: createDto.favorite,
      url: createDto.url,
      tags: createDto.tags,
      category: createDto.category,
      avatarUrl: createDto.avatarUrl,
    });
  }

  /**
   * Retrieves a paginated list of vault entries for the given user,
   * with support for search, filtering, and sorting.
   *
   * @param {string} userId - The user's ID.
   * @param {number} [page=1] - The current page number.
   * @param {number} [limit=10] - Number of entries per page.
   * @param {string} [search] - Optional search keyword.
   * @param {string} [sortBy='createdAt'] - Field to sort by.
   * @param {SortOrder} [sortOrder=SortOrder.DESC] - Sorting direction.
   * @param {VaultFilterOptions} [filter] - Optional filter options (tags, category, favorite).
   * @returns {Promise<Paginated<Vault>>} Paginated list of vaults.
   */
  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: SortOrder = SortOrder.DESC,
    filter?: VaultFilterOptions,
  ): Promise<Paginated<Vault>> {
    const validatedPage = Math.max(1, Math.floor(page));
    const validatedLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    const skip = (validatedPage - 1) * validatedLimit;
    const userObjectId = new Types.ObjectId(userId);

    const matchCondition = this.buildMatchCondition(
      userObjectId,
      search,
      filter,
    );
    const sortCondition = this.buildSortCondition(sortBy, sortOrder);

    const [result] = await this.vaultModel.aggregate([
      { $match: matchCondition },
      {
        $facet: {
          results: [
            { $sort: sortCondition },
            { $skip: skip },
            { $limit: validatedLimit },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
      {
        $project: {
          results: 1,
          total: { $arrayElemAt: ['$totalCount.count', 0] },
        },
      },
      {
        $addFields: {
          page: validatedPage,
          limit: validatedLimit,
          totalPages: {
            $ceil: {
              $divide: [{ $ifNull: ['$total', 0] }, validatedLimit],
            },
          },
          hasNextPage: {
            $gt: [{ $ifNull: ['$total', 0] }, validatedPage * validatedLimit],
          },
          hasPrevPage: {
            $gt: [validatedPage, 1],
          },
        },
      },
    ]);

    return {
      results: result?.results || [],
      total: result?.total || 0,
      page: validatedPage,
      limit: validatedLimit,
      totalPages: result?.totalPages || 0,
    };
  }

  /**
   * Builds a MongoDB match condition based on user, search query, and filters.
   *
   * @param {Types.ObjectId} userObjectId - The user's ObjectId.
   * @param {string} [search] - Optional search keyword.
   * @param {VaultFilterOptions} [filter] - Optional filters.
   * @returns {Record<string, any>} MongoDB match condition.
   */
  private buildMatchCondition(
    userObjectId: Types.ObjectId,
    search?: string,
    filter?: VaultFilterOptions,
  ): Record<string, any> {
    const matchCondition: Record<string, any> = { userId: userObjectId };

    if (search?.trim()) {
      const regex = new RegExp(this.escapeRegex(search.trim()), 'i');
      matchCondition.$or = [
        { siteName: { $regex: regex } },
        { username: { $regex: regex } },
        { email: { $regex: regex } },
        { notes: { $regex: regex } },
        { tags: { $in: [regex] } },
      ];
    }

    if (filter?.category?.trim()) {
      matchCondition.category = filter.category.trim();
    }

    if (typeof filter?.favorite === 'boolean') {
      matchCondition.favorite = filter.favorite;
    }

    if (Array.isArray(filter?.tags) && filter.tags.length > 0) {
      const validTags = filter.tags.filter((tag) => tag?.trim());
      if (validTags.length > 0) {
        matchCondition.tags = { $in: validTags };
      }
    }

    return matchCondition;
  }

  /**
   * Builds a sorting condition for MongoDB queries.
   *
   * @param {string} sortBy - The field to sort by.
   * @param {SortOrder} sortOrder - The sort direction (ASC or DESC).
   * @returns {Record<string, 1 | -1>} A sort condition.
   */
  private buildSortCondition(
    sortBy: string,
    sortOrder: SortOrder,
  ): Record<string, 1 | -1> {
    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'siteName',
      'username',
      'category',
      'favorite',
      'email',
    ];

    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sortDirection: 1 | -1 = sortOrder === SortOrder.ASC ? 1 : -1;

    return { [validSortBy]: sortDirection };
  }

  /**
   * Escapes special characters in a string for use in a regular expression.
   *
   * @param {string} text - The text to escape.
   * @returns {string} Escaped text.
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Finds a vault document by user ID and vault ID.
   *
   * @param {string} userId - The ID of the user.
   * @param {string} vaultId - The ID of the vault document.
   * @returns {Promise<Vault | null>} The vault document, if found.
   */
  async findById(userId: string, vaultId: string): Promise<Vault | null> {
    return this.vaultModel.findOne({ _id: vaultId, userId });
  }

  /**
   * Updates a vault document by ID and returns the update result.
   *
   * @param {string} userId - The user's ID.
   * @param {string} vaultId - The vault ID to update.
   * @param {UpdateVaultDto} updateDto - The fields to update.
   * @returns {Promise<UpdateResult>} Mongoose update result.
   */
  async update(
    userId: string,
    vaultId: string,
    updateDto: UpdateVaultDto,
  ): Promise<UpdateResult> {
    return this.vaultModel.updateOne(
      { _id: vaultId, userId },
      { $set: updateDto },
    );
  }

  /**
   * Deletes a vault document by ID.
   *
   * @param {string} userId - The user's ID.
   * @param {string} vaultId - The vault ID.
   * @returns {Promise<DeleteResult>} Mongoose delete result.
   */
  async delete(userId: string, vaultId: string): Promise<DeleteResult> {
    return this.vaultModel.deleteOne({ _id: vaultId, userId });
  }
}
