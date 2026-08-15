describe('Auth Module Suite', () => {
  it('should load auth routes', () => {
    const routes = require('../../src/modules/auth/auth.routes');
    expect(routes).toBeDefined();
  });
});
