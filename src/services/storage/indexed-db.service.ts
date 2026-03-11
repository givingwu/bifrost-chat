import type {
  BatchOperation,
  IndexedDBConfig,
  IStorage,
} from '@/interfaces/storage.interface';

/**
 * IndexedDB 错误
 */
export class IndexedDBError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: DOMException,
  ) {
    super(message);
    this.name = 'IndexedDBError';
  }
}

/**
 * IndexedDB 辅助类
 *
 * @description
 * 提供类型安全的 IndexedDB 操作接口，简化数据库访问
 *
 * @example
 * ```typescript
 * const helper = new IndexedDB({
 *   dbName: 'my-db',
 *   dbVersion: 1,
 *   stores: {
 *     messages: {
 *       keyPath: 'id',
 *       indexes: [
 *         { name: 'conversationId', keyPath: 'conversationId' },
 *         { name: 'createdAt', keyPath: 'createdAt' },
 *       ],
 *     },
 *   },
 * });
 *
 * await helper.open();
 * await helper.add('messages', { id: '1', content: 'Hello' });
 * const messages = await helper.getAll('messages');
 * ```
 */
export class IndexedDBImpl implements IStorage {
  private db: IDBDatabase | null = null;
  private config: IndexedDBConfig;

  constructor(config: IndexedDBConfig) {
    this.config = config;
  }

  /**
   * 打开数据库
   * @returns Promise<void>
   * @throws {IndexedDBError} 打开数据库失败
   */
  async open(): Promise<void> {
    if (this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = () => {
        reject(
          new IndexedDBError(
            `Failed to open database: ${this.config.dbName}`,
            'OPEN_ERROR',
            request.error ?? undefined,
          ),
        );
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      // 数据库升级或首次创建
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // 创建对象存储（仅在不存在时创建，避免数据丢失）
        for (const [storeName, storeDef] of Object.entries(
          this.config.stores,
        )) {
          let objectStore: IDBObjectStore;

          if (db.objectStoreNames.contains(storeName)) {
            // 对象存储已存在，获取引用
            objectStore = (
              event.target as IDBOpenDBRequest
            ).transaction!.objectStore(storeName);
          } else {
            // 创建新对象存储
            objectStore = db.createObjectStore(storeName, {
              keyPath: storeDef.keyPath,
              autoIncrement: storeDef.autoIncrement,
            });
          }

          // 创建索引（仅在不存在时创建）
          if (storeDef.indexes) {
            for (const index of storeDef.indexes) {
              if (!objectStore.indexNames.contains(index.name)) {
                objectStore.createIndex(
                  index.name,
                  index.keyPath,
                  index.options,
                );
              }
            }
          }
        }

        console.info(
          `[IndexedDB] Database upgraded from version ${oldVersion} to ${this.config.dbVersion}`,
        );
      };
    });
  }

  /**
   * 关闭数据库
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * 获取数据库实例
   * @returns IDBDatabase
   * @throws {IndexedDBError} 数据库未打开
   */
  private async getDatabase(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.open();
    }
    if (!this.db) {
      throw new IndexedDBError('Database is not opened', 'NOT_OPENED');
    }
    return this.db;
  }

  /**
   * 添加数据
   * @param storeName 对象存储名称
   * @param data 要添加的数据
   * @returns Promise<string> 返回添加的数据的主键
   * @throws {IndexedDBError} 添加数据失败
   */
  async add<T>(storeName: string, data: T): Promise<string> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.add(data);

      request.onsuccess = () => {
        resolve(String(request.result));
      };

      request.onerror = () => {
        reject(
          new IndexedDBError(
            `Failed to add data to ${storeName}`,
            'ADD_ERROR',
            request.error ?? undefined,
          ),
        );
      };
    });
  }

  /**
   * 获取单条数据
   * @param storeName 对象存储名称
   * @param key 主键
   * @returns Promise<T | null> 返回数据或 null
   * @throws {IndexedDBError} 获取数据失败
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        resolve(request.result ?? null);
      };

      request.onerror = () => {
        reject(
          new IndexedDBError(
            `Failed to get data from ${storeName}`,
            'GET_ERROR',
            request.error ?? undefined,
          ),
        );
      };
    });
  }

  /**
   * 更新数据
   * @param storeName 对象存储名称
   * @param data 要更新的数据
   * @returns Promise<void>
   * @throws {IndexedDBError} 更新数据失败
   */
  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.put(data);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(
          new IndexedDBError(
            `Failed to put data to ${storeName}`,
            'PUT_ERROR',
            request.error ?? undefined,
          ),
        );
      };
    });
  }

  /**
   * 删除数据
   * @param storeName 对象存储名称
   * @param key 主键
   * @returns Promise<void>
   * @throws {IndexedDBError} 删除数据失败
   */
  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(
          new IndexedDBError(
            `Failed to delete data from ${storeName}`,
            'DELETE_ERROR',
            request.error ?? undefined,
          ),
        );
      };
    });
  }

  /**
   * 获取所有数据
   * @param storeName 对象存储名称
   * @returns Promise<T[]> 返回所有数据
   * @throws {IndexedDBError} 获取数据失败
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(
          new IndexedDBError(
            `Failed to get all data from ${storeName}`,
            'GET_ALL_ERROR',
            request.error ?? undefined,
          ),
        );
      };
    });
  }

  /**
   * 使用索引查询数据
   * @param storeName 对象存储名称
   * @param indexName 索引名称
   * @param value 索引值
   * @returns Promise<T[]> 返回匹配的数据
   * @throws {IndexedDBError} 查询数据失败
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey,
  ): Promise<T[]> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const index = objectStore.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(
          new IndexedDBError(
            `Failed to get data by index ${indexName} from ${storeName}`,
            'GET_BY_INDEX_ERROR',
            request.error ?? undefined,
          ),
        );
      };
    });
  }

  /**
   * 使用索引范围查询数据
   * @param storeName 对象存储名称
   * @param indexName 索引名称
   * @param range 查询范围
   * @returns Promise<T[]> 返回匹配的数据
   * @throws {IndexedDBError} 查询数据失败
   */
  async getByIndexRange<T>(
    storeName: string,
    indexName: string,
    range: IDBKeyRange,
  ): Promise<T[]> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const index = objectStore.index(indexName);
      const request = index.getAll(range);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(
          new IndexedDBError(
            `Failed to get data by index range ${indexName} from ${storeName}`,
            'GET_BY_INDEX_RANGE_ERROR',
            request.error ?? undefined,
          ),
        );
      };
    });
  }

  /**
   * 清空对象存储
   * @param storeName 对象存储名称
   * @returns Promise<void>
   * @throws {IndexedDBError} 清空失败
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(
          new IndexedDBError(
            `Failed to clear ${storeName}`,
            'CLEAR_ERROR',
            request.error ?? undefined,
          ),
        );
      };
    });
  }

  /**
   * 批量操作
   * @param operations 操作列表
   * @returns Promise<void>
   * @throws {IndexedDBError} 批量操作失败
   */
  async batch(operations: BatchOperation[]): Promise<void> {
    if (operations.length === 0) {
      return;
    }

    const db = await this.getDatabase();

    // 按对象存储分组
    const operationsByStore = new Map<string, BatchOperation[]>();
    for (const op of operations) {
      if (!operationsByStore.has(op.storeName)) {
        operationsByStore.set(op.storeName, []);
      }
      operationsByStore.get(op.storeName)!.push(op);
    }

    // 为每个对象存储创建事务
    const promises: Promise<void>[] = [];

    for (const [storeName, storeOps] of operationsByStore) {
      promises.push(
        new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const objectStore = transaction.objectStore(storeName);

          transaction.oncomplete = () => resolve();
          transaction.onerror = () =>
            reject(
              new IndexedDBError(
                `Batch operation failed for ${storeName}`,
                'BATCH_ERROR',
                transaction.error ?? undefined,
              ),
            );

          for (const op of storeOps) {
            const request =
              op.type === 'add'
                ? objectStore.add(op.data)
                : op.type === 'put'
                  ? objectStore.put(op.data)
                  : objectStore.delete(op.key);

            request.onerror = () => {
              transaction.abort();
            };
          }
        }),
      );
    }

    await Promise.all(promises);
  }

  /**
   * 统计对象存储中的数据数量
   * @param storeName 对象存储名称
   * @returns Promise<number> 返回数据数量
   * @throws {IndexedDBError} 统计失败
   */
  async count(storeName: string): Promise<number> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(
          new IndexedDBError(
            `Failed to count ${storeName}`,
            'COUNT_ERROR',
            request.error ?? undefined,
          ),
        );
      };
    });
  }

  /**
   * 删除数据库
   * @returns Promise<void>
   * @throws {IndexedDBError} 删除数据库失败
   */
  async deleteDatabase(): Promise<void> {
    this.close();

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.config.dbName);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(
          new IndexedDBError(
            `Failed to delete database ${this.config.dbName}`,
            'DELETE_DATABASE_ERROR',
            request.error ?? undefined,
          ),
        );
      };
    });
  }

  /**
   * 获取存储类型
   */
  getStorageType(): 'indexeddb' {
    return 'indexeddb';
  }
}
