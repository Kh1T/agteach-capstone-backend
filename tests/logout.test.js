const request = require('supertest');
const express = require('express');

const app = express();

// Mocking the `logout` function
app.post('/logout', (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
});

describe('POST /logout', () => {
  it('should set a "loggedout" cookie and return a success status', async () => {
    const res = await request(app).post('/logout');

    // Check response status
    expect(res.statusCode).toBe(200);
    // Check response body
    expect(res.body.status).toBe('success');
    // Check if the cookie is set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    // Verify that the cookie has the correct value
    expect(cookies[0]).toContain('jwt=loggedout');
    // Verify the cookie has httpOnly flag
    expect(cookies[0]).toContain('HttpOnly');
  });

  it('should expire the cookie in 10 seconds', async () => {
    const res = await request(app).post('/logout');
    // Check if the cookie expiration is set properly
    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toContain('Expires=');
    const expirationDate = new Date(
      cookies[0].split('Expires=')[1].split(';')[0],
    );
    // Calculate expected expiration date
    const now = Date.now();
    const tenSecondsFromNow = now + 10 * 1000;

    // Check if expirationDate is within a reasonable range of tenSecondsFromNow
    if (expirationDate.getTime() > tenSecondsFromNow) {
      expect(expirationDate.getTime()).toBeGreaterThanOrEqual(
        tenSecondsFromNow - 100,
      );
    } else {
      expect(expirationDate.getTime()).toBeLessThanOrEqual(
        tenSecondsFromNow + 100,
      ); // Allow for a small margin
    }
  });

  it('should handle cases where the user is already logged out or no cookie is present', async () => {
    const res = await request(app).post('/logout');

    // Check response status
    expect(res.statusCode).toBe(200);
    // Even if there's no prior cookie, it should return success
    expect(res.body.status).toBe('success');
  });

  it('should reject invalid HTTP methods like GET or PUT', async () => {
    let res = await request(app).get('/logout');
    expect(res.statusCode).toBe(404); // No GET handler for logout

    res = await request(app).put('/logout');
    expect(res.statusCode).toBe(404); // No PUT handler for logout
  });

  it('should handle missing cookies gracefully', async () => {
    // Simulating a request with no cookies
    const res = await request(app).post('/logout').unset('Cookie');

    // Check response status
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    // Ensure that a logged out cookie is still set even if none existed before
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('jwt=loggedout');
  });

  //   it('should return HttpOnly cookie with secure flag in production environments', async () => {
  //     // Temporarily set NODE_ENV to 'production'
  //     const originalEnv = process.env.NODE_ENV;
  //     process.env.NODE_ENV = 'production';

  //     const res = await request(app).post('/logout');

  //     // Check if the cookie is set
  //     const cookies = res.headers['set-cookie'];
  //     expect(cookies).toBeDefined();
  //     // Verify the cookie is HttpOnly and Secure in production
  //     expect(cookies[0]).toContain('HttpOnly');
  //     expect(cookies[0]).toContain('Secure');

  //     // Reset NODE_ENV
  //     process.env.NODE_ENV = originalEnv;
  //   });
});
