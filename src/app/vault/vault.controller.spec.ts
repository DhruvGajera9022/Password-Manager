import { VaultModelService } from '@entities/vault/vault.model.service';
import { VaultController } from './vault.controller';
import { VaultService } from './vault.service';
import { Connection } from 'mongoose';
import { TestingModule } from '@nestjs/testing';
import { closeConnection, setupTestingModule } from '@test/test-setup';
import { VaultModel } from '@entities/vault/vault.entity';
import { VaultModule } from './vault.module';
import { CommonModule } from '@utils/common.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateVaultDto, UpdateVaultDto } from './dto';
import { SortOrder } from '@utils/enum';
import { RESPONSE } from '@utils/constants';
import { vaultResponse, userResponse } from '@utils/constant';

jest.setTimeout(10000);

describe('VaultController', () => {
  let controller: VaultController;
  let service: VaultService;
  let vaultModelService: VaultModelService;
  let connection: Connection;
  let app: TestingModule;

  const mockUser = { sub: '507f1f77bcf86cd799439011' };
  const mockVaultId = '507f1f77bcf86cd799439012';

  beforeAll(async () => {
    app = await setupTestingModule(
      [VaultModel, VaultModule, CommonModule],
      [VaultController],
      [VaultService, VaultModelService],
    );

    controller = app.get(VaultController);
    service = app.get(VaultService);
    vaultModelService = app.get(VaultModelService);
    connection = app.get(getConnectionToken());
  });

  afterAll(async () => {
    await closeConnection(connection);
    await app.close();
  });

  beforeEach(async () => {
    await connection.collection('vaults').deleteMany({});
  });

  describe('createVault', () => {
    it('should create a vault successfully', async () => {
      const createDto: CreateVaultDto = {
        siteName: 'Test Site',
        username: 'testuser',
        encryptedPassword: 'testpassword123',
        email: 'test@example.com',
        url: 'https://testsite.com',
        category: 'Social',
        tags: ['test', 'example'],
        favorite: false,
        notes: 'Test notes',
      };

      const result = await controller.createVault(mockUser, createDto);

      if (!result.data) {
        throw new Error('Result not found.');
      }

      expect(result.status).toBe(RESPONSE.SUCCESS);
      expect(result.message).toBe(vaultResponse.vault_created_successfully);
      expect(result.data).toBeDefined();
      expect(result.data.siteName).toBe(createDto.siteName);
      expect(result.data.username).toBe(createDto.username);
      expect(result.data.email).toBe(createDto.email);
      expect(result.data.userId).toBe(mockUser.sub);
    });

    it('should throw BadRequestException when encryptedPassword is missing', async () => {
      const createDto: CreateVaultDto = {
        siteName: 'Test Site',
        username: 'testuser',
        encryptedPassword: '',
        email: 'test@example.com',
      };

      await expect(controller.createVault(mockUser, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create vault with minimal required fields', async () => {
      const createDto: CreateVaultDto = {
        siteName: 'Minimal Site',
        username: 'minimaluser',
        encryptedPassword: 'password123',
      };

      const result = await controller.createVault(mockUser, createDto);

      if (!result.data) {
        throw new Error('Result not found.');
      }

      expect(result.status).toBe(RESPONSE.SUCCESS);
      expect(result.data.siteName).toBe(createDto.siteName);
      expect(result.data.username).toBe(createDto.username);
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create test vaults
      const testVaults = [
        {
          siteName: 'Facebook',
          username: 'user1',
          encryptedPassword: 'password1',
          category: 'Social',
          tags: ['social', 'personal'],
          favorite: true,
        },
        {
          siteName: 'Gmail',
          username: 'user2',
          encryptedPassword: 'password2',
          category: 'Email',
          tags: ['email', 'work'],
          favorite: false,
        },
        {
          siteName: 'GitHub',
          username: 'user3',
          encryptedPassword: 'password3',
          category: 'Work',
          tags: ['development', 'work'],
          favorite: true,
        },
      ];

      for (const vault of testVaults) {
        await controller.createVault(mockUser, vault);
      }
    });

    it('should retrieve all vaults with default pagination', async () => {
      const result = await controller.findAll('1', '10', mockUser);

      if (!result.data) {
        throw new Error('Result not found.');
      }

      expect(result.status).toBe(RESPONSE.SUCCESS);
      expect(result.message).toBe(
        vaultResponse.all_vault_retrieved_successfully,
      );
      expect(result.data.results).toHaveLength(3);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
      expect(result.data.total).toBe(3);
    });

    it('should filter vaults by search term', async () => {
      const result = await controller.findAll('1', '10', mockUser, 'Facebook');

      if (!result.data) {
        throw new Error('Result not found.');
      }

      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].siteName).toBe('Facebook');
    });

    it('should filter vaults by category', async () => {
      const result = await controller.findAll(
        '1',
        '10',
        mockUser,
        undefined,
        'createdAt',
        SortOrder.DESC,
        'Social',
      );

      if (!result.data) {
        throw new Error('Result not found.');
      }

      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].category).toBe('Social');
    });

    it('should filter vaults by favorite status', async () => {
      const result = await controller.findAll(
        '1',
        '10',
        mockUser,
        undefined,
        'createdAt',
        SortOrder.DESC,
        undefined,
        'true',
      );

      if (!result.data) {
        throw new Error('Result not found.');
      }

      expect(result.data.results).toHaveLength(2);
      expect(result.data.results.every((vault) => vault.favorite)).toBe(true);
    });

    it('should filter vaults by tags', async () => {
      const result = await controller.findAll(
        '1',
        '10',
        mockUser,
        undefined,
        'createdAt',
        SortOrder.DESC,
        undefined,
        undefined,
        ['work'],
      );

      if (!result.data) {
        throw new Error('Result not found.');
      }

      expect(result.data.results).toHaveLength(2);
      expect(
        result.data.results.every((vault) => vault.tags?.includes('work')),
      ).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const result = await controller.findAll('1', '2', mockUser);

      if (!result.data) {
        throw new Error('Result not found.');
      }

      expect(result.data.results).toHaveLength(2);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(2);
      expect(result.data.totalPages).toBe(2);
    });

    it('should throw BadRequestException for invalid page number', async () => {
      await expect(controller.findAll('0', '10', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid limit', async () => {
      await expect(
        controller.findAll('1', 'invalid', mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when limit exceeds 100', async () => {
      await expect(controller.findAll('1', '101', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user is missing', async () => {
      await expect(controller.findAll('1', '10', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should sort vaults by specified field and order', async () => {
      const result = await controller.findAll(
        '1',
        '10',
        mockUser,
        undefined,
        'siteName',
        SortOrder.ASC,
      );

      const siteNames = result.data?.results.map((vault) => vault.siteName);
      expect(siteNames).toEqual(['Facebook', 'GitHub', 'Gmail']);
    });

    it('should handle multiple tags filter', async () => {
      const result = await controller.findAll(
        '1',
        '10',
        mockUser,
        undefined,
        'createdAt',
        SortOrder.DESC,
        undefined,
        undefined,
        ['work', 'social'],
      );

      expect(result.data?.results.length).toBeGreaterThan(0);
    });
  });

  describe('findById', () => {
    let createdVaultId: string;

    beforeEach(async () => {
      const createDto: CreateVaultDto = {
        siteName: 'Test Site',
        username: 'testuser',
        encryptedPassword: 'testpassword123',
        email: 'test@example.com',
      };

      const result = await controller.createVault(mockUser, createDto);
      createdVaultId = result.data?._id || '';
    });

    it('should retrieve vault by id successfully', async () => {
      const result = await controller.findById(createdVaultId, mockUser);

      if (!result.data) {
        throw new Error('Result not found.');
      }

      expect(result.status).toBe(RESPONSE.SUCCESS);
      expect(result.message).toBe(vaultResponse.vault_fetched_successfully);
      expect(result.data._id).toBe(createdVaultId);
      expect(result.data.siteName).toBe('Test Site');
    });

    it('should throw NotFoundException for non-existent vault', async () => {
      const nonExistentId = '507f1f77bcf86cd799439099';

      await expect(
        controller.findById(nonExistentId, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for empty vaultId', async () => {
      await expect(controller.findById('', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for missing user', async () => {
      await expect(controller.findById(createdVaultId, {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    let createdVaultId: string;

    beforeEach(async () => {
      const createDto: CreateVaultDto = {
        siteName: 'Original Site',
        username: 'originaluser',
        encryptedPassword: 'originalpassword',
        email: 'original@example.com',
      };

      const result = await controller.createVault(mockUser, createDto);
      createdVaultId = result.data?._id || '';
    });

    it('should update vault successfully', async () => {
      const updateDto: UpdateVaultDto = {
        siteName: 'Updated Site',
        username: 'updateduser',
        email: 'updated@example.com',
        favorite: true,
      };

      const result = await controller.update(
        createdVaultId,
        mockUser,
        updateDto,
      );

      if (!result.data) {
        throw new Error('Result not found.');
      }

      expect(result.status).toBe(RESPONSE.SUCCESS);
      expect(result.message).toBe(vaultResponse.vault_updated_successfully);
      expect(result.data.siteName).toBe('Updated Site');
      expect(result.data.username).toBe('updateduser');
      expect(result.data.email).toBe('updated@example.com');
      expect(result.data.favorite).toBe(true);
    });

    it('should update vault password', async () => {
      const updateDto: UpdateVaultDto = {
        encryptedPassword: 'newpassword123',
      };

      const result = await controller.update(
        createdVaultId,
        mockUser,
        updateDto,
      );

      expect(result.status).toBe(RESPONSE.SUCCESS);
      expect(result.data?.encryptedPassword).toBe('newpassword123');
    });

    it('should update vault tags and category', async () => {
      const updateDto: UpdateVaultDto = {
        tags: ['updated', 'test'],
        category: 'Updated Category',
      };

      const result = await controller.update(
        createdVaultId,
        mockUser,
        updateDto,
      );

      if (!result.data) {
        throw new Error('Result not found.');
      }

      expect(result.data.tags).toEqual(['updated', 'test']);
      expect(result.data.category).toBe('Updated Category');
    });

    it('should throw NotFoundException for non-existent vault', async () => {
      const nonExistentId = '507f1f77bcf86cd799439099';
      const updateDto: UpdateVaultDto = { siteName: 'Updated' };

      await expect(
        controller.update(nonExistentId, mockUser, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for empty vaultId', async () => {
      const updateDto: UpdateVaultDto = { siteName: 'Updated' };

      await expect(controller.update('', mockUser, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for missing user', async () => {
      const updateDto: UpdateVaultDto = { siteName: 'Updated' };

      await expect(
        controller.update(createdVaultId, {}, updateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    let createdVaultId: string;

    beforeEach(async () => {
      const createDto: CreateVaultDto = {
        siteName: 'To Delete Site',
        username: 'deleteuser',
        encryptedPassword: 'deletepassword',
      };

      const result = await controller.createVault(mockUser, createDto);
      createdVaultId = result.data?._id || '';
    });

    it('should delete vault successfully', async () => {
      const result = await controller.delete(createdVaultId, mockUser);

      expect(result.status).toBe(RESPONSE.SUCCESS);
      expect(result.message).toBe(vaultResponse.vault_deleted_successfully);

      // Verify vault is deleted
      await expect(
        controller.findById(createdVaultId, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent vault', async () => {
      const nonExistentId = '507f1f77bcf86cd799439099';

      await expect(controller.delete(nonExistentId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for empty vaultId', async () => {
      await expect(controller.delete('', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for missing user', async () => {
      await expect(controller.delete(createdVaultId, {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('parsePositiveInteger', () => {
    it('should parse valid positive integer', () => {
      const result = (controller as any).parsePositiveInteger('5', 'test');
      expect(result).toBe(5);
    });

    it('should throw BadRequestException for negative number', () => {
      expect(() =>
        (controller as any).parsePositiveInteger('-1', 'test'),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for zero', () => {
      expect(() =>
        (controller as any).parsePositiveInteger('0', 'test'),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-numeric string', () => {
      expect(() =>
        (controller as any).parsePositiveInteger('abc', 'test'),
      ).toThrow(BadRequestException);
    });
  });

  describe('normalizeTags', () => {
    it('should return undefined for null/undefined input', () => {
      expect((controller as any).normalizeTags(undefined)).toBeUndefined();
      expect((controller as any).normalizeTags(null)).toBeUndefined();
    });

    it('should normalize single tag string', () => {
      const result = (controller as any).normalizeTags('  test  ');
      expect(result).toEqual(['test']);
    });

    it('should return undefined for empty string', () => {
      const result = (controller as any).normalizeTags('   ');
      expect(result).toBeUndefined();
    });

    it('should normalize array of tags', () => {
      const result = (controller as any).normalizeTags([
        '  tag1  ',
        'tag2',
        '  ',
        'tag3  ',
      ]);
      expect(result).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle empty array', () => {
      const result = (controller as any).normalizeTags([]);
      expect(result).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete CRUD operations', async () => {
      // Create
      const createDto: CreateVaultDto = {
        siteName: 'Integration Test Site',
        username: 'integrationuser',
        encryptedPassword: 'integrationpassword',
        email: 'integration@test.com',
        category: 'Test',
        tags: ['integration', 'test'],
        favorite: false,
      };

      const createResult = await controller.createVault(mockUser, createDto);
      const vaultId = createResult.data?._id || '';

      // Read
      const readResult = await controller.findById(vaultId, mockUser);
      expect(readResult.data?.siteName).toBe(createDto.siteName);

      // Update
      const updateDto: UpdateVaultDto = {
        siteName: 'Updated Integration Site',
        favorite: true,
      };

      const updateResult = await controller.update(
        vaultId,
        mockUser,
        updateDto,
      );

      if (!updateResult.data) {
        throw new Error('Result not found.');
      }

      expect(updateResult.data.siteName).toBe('Updated Integration Site');
      expect(updateResult.data.favorite).toBe(true);

      // Delete
      await controller.delete(vaultId, mockUser);

      // Verify deletion
      await expect(controller.findById(vaultId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle concurrent operations', async () => {
      const createPromises = Array.from({ length: 5 }, (_, i) =>
        controller.createVault(mockUser, {
          siteName: `Concurrent Site ${i}`,
          username: `user${i}`,
          encryptedPassword: `password${i}`,
        }),
      );

      const results = await Promise.all(createPromises);
      expect(results).toHaveLength(5);

      // Verify all were created
      const allVaults = await controller.findAll('1', '10', mockUser);
      expect(allVaults.data?.total).toBe(5);
    });
  });
});
