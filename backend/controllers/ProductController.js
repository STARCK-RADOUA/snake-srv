const Product = require("../models/Product.js");
const Order = require("../models/Order.js");

const getProducts = async (req, res) => {
    try {
        let searchClient = req.body.ClientId;

        // let searchDriver = req.body.DriverId;
        let searchDriver = req.sender.DriverId;
        
        let Products = [];
        let UserType = req.sender.UserType;
        if (UserType == 'Client') {
            let ClientId = req.sender.ClientId;
            //console.log(ClientId);
            Products = await Product.find({}).populate({
                path: 'productElements.medicineId',
            }).populate({
                path: 'OrderId',
                match: { ClientId: ClientId },
                populate: [
                    {
                        path: 'ClientId',
                        populate: {
                            path: 'User_id'
                        },
                    },
                    {
                        path: 'DriverId',
                        populate: {
                            path: 'User_id'
                        }
                    }
                ]
            }).then((Products) => Products.filter((pre => pre.OrderId != null)));
            

        } else if (UserType == 'Driver') {
            let matchDriverClient = {};
            /*
            if(searchClient){
                matchDriverClient = {ClientId:searchClient ,DriverId:req.sender.DriverId };
            }else{
                matchDriverClient = {DriverId : req.sender.DriverId}
            }
            */
            if(searchClient){
                matchDriverClient = {ClientId:searchClient};
            }

            if(searchDriver){
                matchDriverClient = {DriverId:searchDriver};
            }

            if(searchClient && searchDriver){
                matchDriverClient = {ClientId:searchClient,DriverId:searchDriver};
            }
            
            Products = await Product.find({}).populate({
                path: 'productElements.medicineId',
            }).populate({
                path: 'OrderId',
                match: matchDriverClient,
                populate: [
                    {
                        path: 'ClientId',
                        populate: {
                            path: 'User_id'
                        }
                    },
                    {
                        path: 'DriverId',
                        populate: {
                            path: 'User_id'
                        }
                    }
                ]
            }).then((Products) => Products.filter((pre => pre.OrderId != null)));

        } else {
            let matchDriverClient = {};
            /*
            if(searchClient){
                matchDriverClient = {ClientId:searchClient ,DriverId:req.sender.DriverId };
            }else{
                matchDriverClient = {DriverId : req.sender.DriverId}
            }
            */
            if(searchClient){
                matchDriverClient = {ClientId:searchClient};
            }

            if(searchDriver){
                matchDriverClient = {DriverId:searchDriver};
            }

            if(searchClient && searchDriver){
                matchDriverClient = {ClientId:searchClient,DriverId:searchDriver};
            }
            //console.log(matchClient);

            Products = await Product.find({}).populate({
                path: 'productElements.medicineId',
            }).populate({
                path: 'OrderId',
                match: matchDriverClient,
                populate: [
                    {
                        path: 'ClientId',
                        populate: {
                            path: 'User_id',
                        }
                    },
                    {
                        path: 'DriverId',
                        populate: {
                            path: 'User_id'
                        }
                    }
                ]
            }).then((Products) => Products.filter((pre => pre.OrderId != null)));
        }

        res.json({ message: "success", 'Products': Products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const saveProduct = async (req, res) => {
    let Product = req.body;
    //console.log(Product);
    Product.create(Product,
        (error, ProductDetails) => {
            if (error) {
                res.status(400).json({ message: 'error', errors: [error.message] });
            } else {
                Order.findByIdAndUpdate(Product.OrderId, { completed: 1 },
                    function (err, docs) {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            res.status(201).json({ message: 'success' });
                        }
                    });
            }
        }
    );
}


module.exports = {
    getProducts,
    saveProduct
}