/* eslint-disable */

const request = require("supertest");
const app = require("../app");

test("Should Signup a new user", async () => {

    await request(app).post('/api/users/signup').send({
        username: "test12345",
        email: "songseyla99@gmail.com",
        password: "11s23@ws",
        passwordConfirm: "11s23@ws"
    }).expect(201)
})
