/* eslint-disable no-undef */
// Import necessary libraries
const express = require('express');
const request = require('supertest');

const app = express();
const userController = require('../controllers/userController');

// Mock the userController methods
jest.mock('../controllers/userController.js');

describe('GET /getMe', () => {
  // Setup the route in the app
  beforeAll(() => {
    app.get('/getMe', userController.getMe, userController.getUser);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mock history after each test
  });

  it('should call getMe and getUser and return user data', async () => {
    // Mock behavior of getMe middleware
    userController.getMe.mockImplementation((req, res, next) => {
      req.user = { id: '123' }; // Mock a user ID being set
      next();
    });

    // Mock behavior of getUser function
    userController.getUser.mockImplementation((req, res) => {
      res.status(200).json({
        status: 'success',
        data: { id: req.user.id, name: 'John Doe' },
      });
    });

    const response = await request(app).get('/getMe');

    expect(userController.getMe).toHaveBeenCalledTimes(1); // Ensure getMe is called
    expect(userController.getUser).toHaveBeenCalledTimes(1); // Ensure getUser is called

    // Verify the response
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toEqual({ id: '123', name: 'John Doe' });
  });

  it('should handle errors properly in getUser', async () => {
    // Mock getMe to pass a valid user
    userController.getMe.mockImplementation((req, res, next) => {
      req.user = { id: '123' };
      next();
    });

    // Mock getUser to simulate an error
    userController.getUser.mockImplementation((req, res) => {
      res
        .status(500)
        .json({ status: 'error', message: 'Something went wrong' });
    });

    const response = await request(app).get('/getMe');

    expect(userController.getMe).toHaveBeenCalledTimes(1);
    expect(userController.getUser).toHaveBeenCalledTimes(1);

    // Verify error response
    expect(response.status).toBe(500);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Something went wrong');
  });

  it('should return 401 if the user is not authenticated', async () => {
    userController.getMe.mockImplementation((req, res, next) => {
      res
        .status(401)
        .json({ status: 'fail', message: 'You are not logged in!' });
    });

    const response = await request(app).get('/getMe');

    expect(userController.getMe).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(401);
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toBe('You are not logged in!');
  });

  it('should return 404 if the user is not found', async () => {
    userController.getMe.mockImplementation((req, res, next) => {
      req.user = { id: 'invalid-id' }; // Mock invalid user ID
      next();
    });

    userController.getUser.mockImplementation((req, res) => {
      res.status(404).json({ status: 'fail', message: 'User not found' });
    });

    const response = await request(app).get('/getMe');

    expect(userController.getMe).toHaveBeenCalledTimes(1);
    expect(userController.getUser).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toBe('User not found');
  });
});
