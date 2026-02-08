/**
 * IndexedDB 对象存储定义
 */
export interface ObjectStoreDefinition {
  /** 主键路径 */
  keyPath: string;
  /** 是否自动递增 */
  autoIncrement?: boolean;
  /** 索引定义 */
  indexes?: Array<{
    /** 索引名称 */
    name: string;
    /** 索引键路径 */
    keyPath: string | string[];
    /** 索引选项 */
    options?: IDBIndexParameters;
  }>;
}

/**
 * IndexedDB 配置
 */
export interface IndexedDBConfig {
  /** 数据库名称 */
  dbName: string;
  /** 数据库版本 */
  dbVersion: number;
  /** 对象存储定义 */
  stores: Record<string, ObjectStoreDefinition>;
}

/**
 * 批量操作类型
 */
export type BatchOperation =
  | { type: 'add'; storeName: string; data: unknown }
  | { type: 'put'; storeName: string; data: unknown }
  | { type: 'delete'; storeName: string; key: string | number };

/**
 * 统一存储接口
 * @description
 * 定义了存储层需要实现的通用接口，支持 IndexedDB 和 LocalStorage 两种实现
 */
export interface IStorage {
  /**
   * 初始化存储
   */
  open(): Promise<void>;

  /**
   * 关闭存储
   */
  close(): void;

  /**
   * 添加数据
   */
  add<T>(storeName: string, data: T): Promise<string>;

  /**
   * 获取单条数据
   */
  get<T>(storeName: string, key: string): Promise<T | null>;

  /**
   * 更新数据
   */
  put<T>(storeName: string, data: T): Promise<void>;

  /**
   * 删除数据
   */
  delete(storeName: string, key: string): Promise<void>;

  /**
   * 获取所有数据
   */
  getAll<T>(storeName: string): Promise<T[]>;

  /**
   * 使用索引查询数据（LocalStorage 不支持，返回空数组）
   */
  getByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey,
  ): Promise<T[]>;

  /**
   * 清空对象存储
   */
  clear(storeName: string): Promise<void>;

  /**
   * 统计数据数量
   */
  count(storeName: string): Promise<number>;

  /**
   * 获取存储类型
   */
  getStorageType(): 'indexeddb' | 'localstorage';
}
