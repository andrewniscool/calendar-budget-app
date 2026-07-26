export function createFinancialSettingsService(repository) {
  return {
    get: (userId) => repository.find(userId),
    update: (userId, data) => repository.upsert(userId, data),
  };
}
