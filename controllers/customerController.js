const Customer = require("../models/customerModel");


exports.additionalInfo = async (req,res,next) => {
    const data = req.body;
    data.userUid = req.user.userUid
    data.email = req.user.email
    const customers = await Customer.create(data);

    res.json({
        status: "success",
        data: customers,
    })
    
}