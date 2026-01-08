import { type Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Injectable, Optional } from '@nestjs/common';
import { MongoCollectionSchema, MongoFieldSchema } from '@root/core/mongo/mongo.schema';

/**
 * Mongo Service
 */
@Injectable()
export class MongoService {
  constructor(@Optional() @InjectConnection() private readonly connection?: Connection) {}

  /**
   * 필터 조건을 포함한 페이지네이션 조회
   */
  async getCollectionPage(collectionName: string, page: number, filter: Record<string, any> = {}, sort: Record<string, any> = {}): Promise<{ data: any[]; total: number }> {
    const PAGE_SIZE = 100;
    const total = await this.connection.collection(collectionName).countDocuments(filter);
    const data = await this.connection
      .collection(collectionName)
      .find(filter, { projection: { _id: 0 } })
      .sort(sort)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray();

    return { data, total };
  }

  async getCollections(): Promise<MongoCollectionSchema[]> {
    const collections = await this.connection.db.listCollections().toArray();
    const result: MongoCollectionSchema[] = [];
    for (const c of collections) {
      result.push({ name: c.name, properties: this.getSchemaDetailByCollection(c.name) });
    }

    return result;
  }

  getSchemaDetailByCollection(collectionName: string): MongoFieldSchema[] {
    for (const modelName of Object.keys(this.connection.models)) {
      const model = this.connection.models[modelName];
      if (model.collection.name === collectionName) {
        const detail: MongoFieldSchema[] = [];
        for (const [key, schemaType] of Object.entries(model.schema.paths)) {
          detail.push({
            name: key,
            type: schemaType['instance'],
            required: schemaType['isRequired'],
          });
        }

        return detail;
      }
    }

    return [];
  }
}
