import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import { TestConfigModule } from '@test/test-config.module';

// setup testing module
export async function setupTestingModule(
  modules: any[],
  controllers: any[],
  providers: any[],
): Promise<TestingModule> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [TestConfigModule, ...modules],
    controllers,
    providers,
  }).compile();

  return module;
}

// close db connection
export async function closeConnection(connection: Connection): Promise<void> {
  if (connection) {
    await connection.close();
  }
}
