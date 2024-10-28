const { getAdminInfo } = require('../../controllers/adminController');
const UserAccount = require('../../models/userModel');
const httpMocks = require('node-mocks-http'); // Useful for mocking HTTP requests and responses

jest.mock('../../models/userModel'); // Mock UserAccount model

describe('getAdminInfo', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = res = httpMocks.createResponse({
      eventEmitter: require('events').EventEmitter,
    });
    next = jest.fn();
  });

  it('should return 403 if user is not an admin', async () => {
    req.user = { role: 'user', userUid: '12345' };

    await getAdminInfo(req, res, next);

    expect(res.statusCode).toBe(403);
    // Ensure _getData is parsed as an object
    expect(JSON.parse(res._getData())).toEqual({
      status: 'fail',
      message:
        'Access denied. You are not authorized to view this information.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 404 if admin not found', async () => {
    req.user = { role: 'admin', userUid: '12345' };
    UserAccount.findOne = jest.fn().mockResolvedValue(null); // Mock admin not found

    await getAdminInfo(req, res, next);

    expect(res.statusCode).toBe(404);
    // Ensure _getData is parsed as an object
    expect(JSON.parse(res._getData())).toEqual({
      status: 'fail',
      message: 'Admin not found.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 200 and created admin data if admin exists', async () => {
    req.user = { role: 'admin', userUid: '12345' };
    const mockAdmin = {
      create: jest.fn().mockResolvedValue({ id: 1, name: 'Admin' }),
    };
    UserAccount.findOne = jest.fn().mockResolvedValue(mockAdmin);

    req.body = { name: 'New Admin' };

    await getAdminInfo(req, res, next);

    expect(res.statusCode).toBe(200);
    // Ensure _getData is parsed as an object
    console.log(JSON.parse(res._getData()));
    expect(JSON.parse(res._getData())).toEqual({
      status: 'success',
      data: { id: 1, name: 'Admin' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle errors and pass to next middleware', async () => {
    req.user = { role: 'admin', userUid: '12345' };
    UserAccount.findOne = jest
      .fn()
      .mockRejectedValue(new Error('Database error'));

    await getAdminInfo(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
