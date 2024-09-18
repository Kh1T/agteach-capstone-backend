const Customer = require("../models/customerModel");


exports.additionalInfo = async (req,res,next) => {
    console.log(req.user)
    const { email, password } = req.user;
    // console.log(email, password)
    const data = req.body;
    data.userUid = req.user.userUid
    data.email = password
    const customers = await Customer.create(data);

    res.json({
        status: "success",
        data: customers,
        isAuthenticated: req.user ? true : false,
    })
}