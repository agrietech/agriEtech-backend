const request = require('supertest');
const app = require('../../src/app');

describe('USSD Delivery Gateway Suite', () => {
  it('should return initial menu on empty text input', async () => {
    const res = await request(app).post('/api/v1/delivery/ussd').send({
      sessionId: 'test-session-01',
      phoneNumber: '+251911223344',
      text: '',
    });

    expect(res.status).toBe(200);
    expect(res.text).toContain('CON');
    expect(res.text).toContain('(*212#)');
  });

  it('should return weather information when 1 is selected', async () => {
    const res = await request(app).post('/api/v1/delivery/ussd').send({
      sessionId: 'test-session-01',
      phoneNumber: '+251911223344',
      text: '1',
    });

    expect(res.status).toBe(200);
    expect(res.text).toContain('END');
  });

  it('should return drought status when 2 is selected', async () => {
    const res = await request(app).post('/api/v1/delivery/ussd').send({
      sessionId: 'test-session-01',
      phoneNumber: '+251911223344',
      text: '2',
    });

    expect(res.status).toBe(200);
    expect(res.text).toContain('END');
  });
});
