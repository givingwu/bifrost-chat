import type { IndexedDBConfig, IStorage } from '@/interfaces/storage.interface';
import { IndexedDBImpl } from '@/services/storage/indexed-db.service';
import { LocalStorageImpl } from '@/services/storage/local-storage.service';

/**
 * 检测 IndexedDB 是否可用
 */
export async function isIndexedDBAvailable(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') {
    return false;
  }

  try {
    const testDB = indexedDB.open('__bifrost_test__');

    return new Promise((resolve) => {
      testDB.onsuccess = () => {
        indexedDB.deleteDatabase('__bifrost_test__');
        resolve(true);
      };
      testDB.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * 创建存储辅助类（自动选择 IndexedDB 或 LocalStorage）
 * @description
 * 优先使用 IndexedDB，如果不可用则回退到 LocalStorage
 */
export async function createStorageHelper(
  config: IndexedDBConfig,
): Promise<IStorage> {
  const indexedDBAvailable = await isIndexedDBAvailable();

  if (indexedDBAvailable) {
    console.info('[Storage] Using IndexedDB');
    return new IndexedDBImpl(config);
  }

  console.warn(
    '[Storage] IndexedDB not available, falling back to LocalStorage',
  );
  return new LocalStorageImpl(config);
}
