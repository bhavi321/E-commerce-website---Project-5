const mongoose = require("mongoose")
const cartModel = require("../models/cartModel")
const productModel = require("../models/productModel")
const userModel = require("../models/userModel")
const { isValidPrice, isValidNo, isValidQuan } = require("../validations/validation")


const createCartByParams = async function (req, res) {
    try {
        let bodyData = req.body
        let userId = req.params.userId

        let verifyToken= req.bearerToken;
        if(userId!==verifyToken) return res.status(403).send({status:false,message:"You are not authorised"})

        if (Object.keys(bodyData).length == 0) return res.status(400).send({ status: false, message: "Please provide some data in body" })
        let { cartId, productId, quantity } = bodyData
        if (!productId) return res.status(400).send({ status: false, message: "ProductId is mandatory" })
        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "ProductId is INVALID" })
        if (!quantity) return res.status(400).send({ status: false, message: "Quantity is mandatory" })
        if (quantity || typeof quantity == 'string') {
            if (!isValidQuan(quantity)) return res.status(400).send({ status: false, message: "Quantity should be a numeric value" })
        } else {
            quantity = 1
        }
        let findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) return res.status(400).send({ status: false, message: "Product not found" })
        let price = findProduct.price
        if (cartId) {
            if (!mongoose.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "CartId is INVALID" })
        }
        let Cart = await cartModel.findOne({ _id: cartId, userId: userId })

        let totalPrice=0
        let totalItem=0

        if (Cart) {
            let items = Cart.items
            let Object = {}
            for (let i = 0; i < items.length; i++) {
                if (items[i].productId.toString() == productId) {

                items[i]['quantity'] = (items[i]['quantity']) + quantity
                 totalPrice = Cart.totalPrice + (quantity * price)
                 totalItem = items.length
                Object.items = items+1
                Object.totalPrice = totalPrice
            Object.totalItems = totalItem
            let newCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: Object }, { new: true }).populate('items.productId')
            return res.status(201).send({ status: true, message: "Success", data: newCart })
                }
               
            }
            
        }else{
            bodyData.totalPrice=totalPrice
            bodyData.totalItems=totalItem
            let newCarts = await cartModel.create(bodyData)
            return res.status(201).send({ status: true, message: "Success", data: newCarts })
        }
       


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }




}



const updateCartByParams = async function (req, res) {




}






const getCartByParams = async function(req,res){
    try{
    let userId = req.params.userId
    let jwtId = req.bearerToken

    // checking user id in params is valid or not
    if(userId == undefined) return res.send(400).send({status : false , message: "please give userId in params"})
    if(!mongoose.isValidObjectId(userId))  return res.status(400).send({status : false, message : "invalid userid in params"})

    // checking userid is matched with jwt payload user id 
    if(!userId === jwtId) return res.status(401).send({status : false, message : "user is not authorized"})

    // checking if user exist or not
    let user = await userModel.findOne({userId : userId, isDeleted : false })
    if(!user) return res.status(404).send({status : false, message : "user doesn't exist or deleted"})

    //checking if the cart exist
    let cart = await  cartModel.findOne({userId : userId})
    if(!cart)  return res.status(404).send({status : false, message: "No cart exist"})

    res.status(200).send({status : true , message : "Success", data : cart})
    }catch(err){
        return res.status(500).send({status:false, error : err.message})
    }

}







const deleteCartByParams = async function(req,res){

    try {
        let userId=req.params.userId;
        let verifyToken= req.bearerToken;

        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid" })
        if(userId!==verifyToken) return res.status(403).send({status:false,message:"You are not authorised"})
       
        let usercheck=await userModel.findOne({_id:userId})
        if(!usercheck) return res.status(404).send({status:false,message:"User not Found"})

        let cartDelete=await cartModel.findOneAndUpdate({userId:userId},{$set:{items:[],totalItems:0,totalPrice:0}},{new:true})
        if(!cartDelete) return res.status(404).send({status:false,message:"Cart Doesn't Exist"})
       
        return res.status(204).send() // response struture
       

    } catch (error) {
        return res.status(500).send({status: false,error:error.message})
    }
    
   


}


module.exports = {createCartByParams,updateCartByParams,getCartByParams,deleteCartByParams}
