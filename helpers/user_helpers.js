var db=require('../config/connection') // to use mongo db connection here
var collection=require('../config/collections') // check collections.js. to get those values here we use require
const bcrypt=require('bcrypt')
const { response } = require('../app') // try changing to 'express'
var objectId=require('mongodb').ObjectID

const Razorpay=require('razorpay')
// get the code from https://www.npmjs.com/package/razorpay
var instance = new Razorpay({
    key_id: 'rzp_test_tVnzEbMzKlhCpU',
    key_secret: 'XE39RJM7LPsSU5RclWZm7AAP',
  });

module.exports={
    doSignup:function(userData){
        return new Promise(async function(resolve,reject){
            userData.Password=await bcrypt.hash(userData.Password,10) // 10 implies how fast the hash key should be generated, 10 is default
            db.get().collection(collection.USER_COLLECTIONS).insertOne(userData).then(function(data){
                resolve(data.ops[0])
            })
        })
        
    },
    doLogin:function(userData){
        return new Promise(async function(resolve,reject){
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTIONS).findOne({Email:userData.Email}) // cross checking the emails for authentication
            if(user){
                bcrypt.compare(userData.Password,user.Password).then(function(status){
                    if(status){
                        console.log("Login Success");
                        response.user=user
                        response.status=true
                        resolve(response)
                    }
                    else{
                        console.log("Login Failed");
                        resolve({status: false})
                    }
                })
            }
            else{
                console.log("User Invalid");
                resolve({status: false})
            }
        })
    },
    addToCart:function(proId,userId){
        let proObj = {
            item: objectId(proId),
            quantity:1
        }
        return new Promise(async function(resolve,reject){
            let userCart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)}) // to check if the cart is existing or not
            if(userCart){
                let proExist = userCart.products.findIndex(product=> product.item==proId)
                console.log(proExist);
                if(proExist!=-1){ // ie if product is there in the cart
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                        {
                            $inc:{'products.$.quantity':1}
                        }
                    ).then(function(){
                        resolve()
                    })
                }
                else{
                    db.get().collection(collection.CART_COLLECTION).
                    updateOne({user:objectId(userId)},
                    {
                            $push:{products:proObj}
                    
                    }
                        
                    ).then(function(response){
                        resolve()
                    })
                }
                
                
            }
            else{ // we will create one
                let cartObj={
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(function(response){
                    resolve()
                })
            }

        })
    },
    getCartProducts:function(userId){
        return new Promise(async function(resolve,reject){
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{ 
                        item:'$products.item',
                        quantity:'$products.quantity',
                        
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    
                    }
                },
                {
                    $project:{ // 0 implies disable, 1 implies enable
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}

                    }
                }
               
            ]).toArray()
            
            resolve(cartItems)
        })
    },
getCartCount:function(userId){
        return new Promise( async function(resolve,reject){
            let count=0
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:function(details){
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        ///details.price=parseInt(details.price)

        return new Promise(function(resolve,reject){
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}} // to remove that product
                }
                ).then(function(response){
                    resolve({removeProduct:true})
                })
            }   
            else{

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                        {
                            $inc:{'products.$.quantity':details.count}
                        }
                    ).then(function(response){
                        resolve({status:true})
                    })
            }
            })
      
    },
    getTotalAmount:function(userId){

        return new Promise(async function(resolve,reject){
         
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{ 
                        item:'$products.item',
                        quantity:'$products.quantity',
                       
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    
                    }
                },
                
                {
                    $project:{ // 0 implies disable, 1 implies enable
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]},
                        //convertedPrice:toInt('$product.Price')
                        
                    }
                },
                
               {
                    $group:{ // to get the whole cart total price
                        _id:null,
                        total:{$sum:{$multiply:['$quantity',100]}}
                        //total:{$sum:{$multiply:['$quantity','$product.Price']}}
                        
                    }
                }
               
            ]).toArray()
           
            resolve(total[0].total)
        })
    },
    placeOrder:function(order,products,total){
        return new Promise(function(resolve,reject){
            console.log(order,products,total);
            let status=order.payment_method==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                    
                },
                userId:objectId(order.userId),
                paymentMethod:order.payment_method,
                products:products,
                totalAmount:total,
                status:status,
                date:new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then(function(response){
               db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userId)})
                
               resolve(response.ops[0]._id) 
            })
        })
    },
    getCartProductList:function(userId){
        return new Promise(async function(resolve,reject){
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.products)
        })
    },
    getUserOrders:function(userId){
        return new Promise(async function(resolve, reject){
            console.log(userId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
            .find({userId:objectId(userId)}).toArray()
            console.log(orders)
            resolve(orders)
        })
    },
    getOrderProducts:function(orderId){
        return new Promise(async function(resolve,reject){
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                { 
                    $project:{ 
                        item:'$products.item',
                        quantity:'$products.quantity',
                       
                    } 
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    
                    }
                },
                
                {
                    $project:{ // 0 implies disable, 1 implies enable
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]},
                        
                    }
                },
                                             
            ]).toArray()
            console.log(orderItems);
            resolve(orderItems)
            
        })
    },
    generateRazorpay:function(orderId){
        return new Promise(function(resolve,reject){
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                  if(err){
                      console.log(err);
                  }
                  else{
                    console.log("-----------"+order);
                    resolve(order)
                  }
                
              });
                       
        })
    },
    verifyPayment:function(details){
        return new Promise(function(resolve,reject){
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256','XE39RJM7LPsSU5RclWZm7AAP')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex') // for conversion
            if(hmca==details['payment[razorpay_signature]']){
                resolve()
            }
            else{
                reject()
            }
        })   
    },
    changePaymentStatus: function(orderId){
        return new Promise(function(resolve,reject){
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
            ).then(function(){
                resolve()
            })
        })
    }
    
}

