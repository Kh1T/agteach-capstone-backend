const { resendVerifyCode } = require('../../controllers/authController');
const { UserAccount } = require('../../models/userModel');
// Mock necessary modules
jest.mock('../models/userModel', () => {
    findOne: jest.fn(),
});

describe('Resend Verify Code API', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  it('should return 429 if cooldown is active', async () => {
    const mockUser = {
      updatedAt: new Date(Date.now() - 30 * 1000), // Last sent 30 seconds ago
      createEmailVerifyCode: jest.fn(),
    };

    // Mock UserAccount.findOne to return a user
    UserAccount.findOne.mockResolvedValue(mockUser);

    await resendVerifyCode(req, res, next);

    expect(UserAccount.findOne).toHaveBeenCalledWith({
      where: { email: req.body.email },
    });

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      status: 'fail',
      message: 'Your verification is in cooldown 1 minute.',
    });
  });

  it('should send verification code if cooldown is not active', async () => {
    const mockUser = {
      updatedAt: new Date(Date.now() - 2 * 60 * 1000), // Last sent 2 minutes ago
      createEmailVerifyCode: jest.fn().mockReturnValue('123456'),
    };

    // Mock UserAccount.findOne to return a user
    UserAccount.findOne.mockResolvedValue(mockUser);

    await resendVerifyCode(req, res, next);

    expect(UserAccount.findOne).toHaveBeenCalledWith({
      where: { email: req.body.email },
    });

    expect(mockUser.createEmailVerifyCode).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      message: 'Verification code resent successfully: 123456',
    });
  });

  it('should handle user not found case', async () => {
    // Mock UserAccount.findOne to return no user
    UserAccount.findOne.mockResolvedValue(null);

    await resendVerifyCode(req, res, next);

    expect(UserAccount.findOne).toHaveBeenCalledWith({
      where: { email: req.body.email },
    });

    expect(res.status).toHaveBeenCalledWith(404); // Assuming you handle user not found with a 404 response
    expect(res.json).toHaveBeenCalledWith({
      status: 'fail',
      message: 'User not found',
    });
  });
});
