import { DynamicModule, Global, Module, type OnModuleInit } from '@nestjs/common';
import { getModelToken, ModelDefinition, MongooseModule } from '@nestjs/mongoose';
import ServerConfig from '@root/core/config/server.config';
import { DBConnectKeys } from '@root/core/define/db.connect.key';
import { MongoService } from '@root/core/mongo/mongo.service';
import { Connection } from 'mongoose';
import ServerLogger from '../server-logger/server.logger';

@Global()
@Module({
  imports: [
    ...(ServerConfig.db.mongo.active
      ? [
          MongooseModule.forRootAsync({
            useFactory: async () => {
              const db = ServerConfig.db.mongo;
              const dbName = DBConnectKeys.getKey(db.db_name);

              const uri = `mongodb://${db.user_name}:${db.password}@${db.host}:${db.port}/${dbName}?authSource=${db.auth_source}`;
              ServerLogger.log(`uri: ${uri}`, 'MongooseModule');

              return {
                uri,
                maxPoolSize: db.max_pool_size,
                minPoolSize: db.min_pool_size,
                tls: db.use_tls,
                onConnectionCreate: (connection: Connection): Connection => {
                  connection.on('connected', () => {
                    ServerLogger.log(`[mongo.${dbName}] Connected to MongoDB.`);
                  });
                  connection.on('disconnected', () => {
                    ServerLogger.warn(`[mongo.${dbName}] Disconnected from MongoDB. Waiting for auto-reconnect...`);
                  });
                  connection.on('error', (err) => {
                    ServerLogger.error(`[mongo.${dbName}] MongoDB connection error: ${err.message}`);
                  });

                  return connection;
                },
              };
            },
          }),
        ]
      : []),
  ],
  providers: [MongoService],
  exports: [MongoService],
})
export class MongoModule implements OnModuleInit {
  static forFeature(models: ModelDefinition[]): DynamicModule {
    if (!ServerConfig.db.mongo.active) {
      return {
        module: MongoModule,
        providers: [
          ...models.map((model) => ({
            provide: getModelToken(model.name),
            useValue: {},
          })),
        ],
        exports: models.map((model) => getModelToken(model.name)),
      };
    }

    return MongooseModule.forFeature(models);
  }

  async onModuleInit(): Promise<void> {
    ServerLogger.log('MongoModule.onModuleInit');
  }
}
