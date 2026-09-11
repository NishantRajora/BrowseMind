(global as any).chrome = {
  storage: {
    local: {
      _store: {},
      get: (keys: any, cb: any) => {
        const result: any = {};
        const store = (global as any).chrome.storage.local._store;
        if (typeof keys === 'string') {
          result[keys] = store[keys];
        } else {
          for (const key in keys) {
            result[key] = store[key] ?? keys[key];
          }
        }
        cb(result);
      },
      set: (items: any, cb: any) => {
        const store = (global as any).chrome.storage.local._store;
        Object.assign(store, items);
        cb();
      }
    }
  }
};
