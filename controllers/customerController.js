const Customer = require("../models/customerModel");


exports.additionalInfo = async (req,res,next) => {
    // console.log(req.locals)
    const { email, password } = req.locals.user;
    console.log(email, password)
    const data = req.body;
    data.userUid = email
    data.email = password
    const customers = await Customer.create(data);

    res.json({
        status: "success",
        data: customers,
    })
    
}