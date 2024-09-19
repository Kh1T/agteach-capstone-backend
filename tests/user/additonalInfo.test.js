/* eslint-disable */

const { updateMe } = require('./path/to/your/controller');
const AppError = require('./path/to/AppError');
const catchAsync = require('./path/to/catchAsync');
const filterObj = require('./path/to/filterObj');

jest.mock('./path/to/catchAsync', () => jest.fn((fn) => fn));
jest.mock('./path/to/filterObj');

describe('updateMe', () => {
  let req, res, next, Model;

  beforeEach(() => {
    req = {
      body: {},
      user: { userUid: '123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    Model = {
      update: jest.fn(),
    };
  });

  it('should return an error if password data is provided', async () => {
    req.body.password = 'password123';

    await updateMe(Model)(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].message).toBe(
      'This route is not for password updates. Please use /updateMyPassword.',
    );
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it('should filter out unwanted fields and update the user', async () => {
    req.body = {
      username: 'newUsername',
      email: 'newEmail@example.com',
      password: 'password123', // should be filtered out
    };
    const filteredBody = {
      username: 'newUsername',
      email: 'newEmail@example.com',
    };
    filterObj.mockReturnValue(filteredBody);
    const updatedUser = [{}, [{ id: '123', ...filteredBody }]];
    Model.update.mockResolvedValue(updatedUser);

    await updateMe(Model)(req, res, next);

    expect(filterObj).toHaveBeenCalledWith(
      req.body,
      'username',
      'email',
      'image_url',
      'first_name',
      'last_name',
    );
    expect(Model.update).toHaveBeenCalledWith(filteredBody, {
      where: { userUid: req.user.userUid },
      returning: true,
      individualHooks: true,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        user: updatedUser[1][0],
      },
    });
  });
});
