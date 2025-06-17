// Avoid all the errors about something not being implemented in JSDOM

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
