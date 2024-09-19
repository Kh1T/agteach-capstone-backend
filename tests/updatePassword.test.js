/* eslint-disable */

const request = require('supertest');
const app = require('../app');
const UserAccount = require('../models/userModel');
const jwt = require('jsonwebtoken');

jest.mock('../models/userModel');
jest.mock('jsonwebtoken');

describe('User Authentication and Password Update', () => {
  let mockUser;
  let loginToken;

  // beforeEach(() => {
  //   mockUser = {
  //     userUid: '123e4567-e89b-12d3-a456-426614174000',
  //     email: 'test@example.com',
  //     username: 'testuser',
  //     password: 'hashedOldPassword',
  //     role: 'guest',
  //     isVerify: true,
  //     authenticate: jest.fn().mockReturnValue(true),
  //     save: jest.fn().mockResolvedValue(true),
  //   };

  //   UserAccount.findOne = jest.fn().mockResolvedValue(mockUser);
  //   UserAccount.findByPk = jest.fn().mockResolvedValue(mockUser);

  //   jwt.sign = jest.fn().mockReturnValue('mockedToken');
  //   loginToken = 'mockedToken';

  //   process.env.JWT_SECRET = 'test-secret';
  //   process.env.JWT_EXPIRES_IN = '90d';
  //   process.env.JWT_EXPIRES_COOKIE_IN = '90';
  // });

  test('should login successfully', async () => {
    const response = await request(app).post('/api/users/login').send({
      email: 'test@example.com',
      password: 'correctPassword',
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.token).toBe('mockedToken');
    expect(response.body.data.user).toEqual(
      expect.objectContaining({
        userUid: mockUser.userUid,
        email: mockUser.email,
        username: mockUser.username,
      }),
    );
    expect(UserAccount.findOne).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(mockUser.authenticate).toHaveBeenCalledWith('correctPassword');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: mockUser.userUid },
      'test-secret',
      { expiresIn: '90d' },
    );
    expect(response.headers['set-cookie'][0]).toContain('jwt=mockedToken');
  });

  // test('should update password after successful login', async () => {
  //   // Mock the req.user object that would be set by your authentication middleware
  //   const authenticatedUser = { userUid: mockUser.userUid };

  //   const response = await request(app)
  //     .patch('/api/users/updatePassword')
  //     .send({
  //       password: 'correctPassword',
  //       passwordConfirm: 'correctPassword',
  //     })
  //     .set('Authorization', `Bearer ${loginToken}`)
  //     .set('user', JSON.stringify(authenticatedUser)); // Mocking the authenticated user

  //   expect(response.status).toBe(200);
  //   expect(response.body.status).toBe('success');
  //   expect(response.body.token).toBe('mockedToken');
  //   expect(UserAccount.findByPk).toHaveBeenCalledWith(mockUser.userUid);
  //   expect(mockUser.authenticate).toHaveBeenCalledWith('correctPassword');
  //   expect(mockUser.password).toBe('newPassword');
  //   expect(mockUser.save).toHaveBeenCalled();
  // });
});
