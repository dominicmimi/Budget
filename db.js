const db = (() => {
  const DB_NAME = 'budget-tracker';
  const STORE_NAME = 'transactions';
  let dbInstance;

  // Open IndexedDB
  const init = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };

  // Add transaction
  const add = (item) => {
    return new Promise((resolve, reject) => {
      const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.add(item);
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  };

  // Get all transactions
  const getAll = () => {
    return new Promise(async (resolve, reject) => {
      if (!dbInstance) await init();
      const tx = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = reject;
    });
  };

  return { add, getAll };
})();
