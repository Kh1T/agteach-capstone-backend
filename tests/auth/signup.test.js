/* eslint-disable */

const request = require('supertest');
const app = require('../../app');
const UserAccount = require('../../models/userModel');

const userOne = {
  username: 'testing1',
  email: 'tesingJest1@gmail.com',
  password: '123456789',
  passwordConfirm: '123456789',
};

beforeEach(async () => {
  await UserAccount.destroy({
    where: {
      username: 'testing',
    },
  });
});

test('Should Signup a user', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
      username: 'testing',
      email: 'tesingJest@gmail.com',
      password: '123456789',
      passwordConfirm: '123456789',
    })
    .expect(201);
});

test('Should Login existing user', async () => {
  await request(app)
    .post('/api/users/login')
    .send({
      email: 'tesingJest1@gmail.com',
      password: '123456789',
    })
    .expect(200);
});
