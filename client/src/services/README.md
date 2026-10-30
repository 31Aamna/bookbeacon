# Service layer

Domain modules in this directory own application data access. Mock mode reads/writes the local demonstration repository through `mockStore.js`; API mode uses `apiClient.js` and the future Flask REST contract. UI components must not import seed arrays or mutate the mock repository directly. API failures are shown to users and do not fall back to mock data.
