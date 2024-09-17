/* eslint-disable */

const request = require("supertest");
const app = require("../app");

test("Should Signup a new user", async () => {
    // when request app
    // we should give which HTTP method we want to request
    await request(app).post('/api/users/login').send({
        email: "songseyla99@gmail.com",
        password: "11s23@ws",
    }).expect(200)
})
