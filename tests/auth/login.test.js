/* eslint-disable */

const request = require('supertest');
const app = require('../../app');
// const UserAccount = require('../../models/userModel');

test('Should Login a user', async () => {
  await request(app)
    .post('/api/users/login')
    .send({
      email: 'songseyla99@gmail.com',
      password: '123456789',
    })
    .expect(201);
});
