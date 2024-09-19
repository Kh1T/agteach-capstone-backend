/* eslint-disable */

const request = require('supertest');
const app = require('../../app');

console.log(app);
jest.setTimeout(10000);

test('Should signup a new user', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
      username: 'seyla',
      email: 'songseyla99@gmail.com',
      password: '11s23@ws',
      passwordConfirm: '11s23@ws',
    })
    .expect(201);
});
