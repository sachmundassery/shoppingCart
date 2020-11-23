var db=require('../config/connection') // to use mongo db connection here
var collection=require('../config/collections') // check collections.js. to get those values here we use require
const bcrypt=require('bcrypt')
var objectId=require('mongodb').ObjectID
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
                    .updateOne({'products.item':objectId(proId)},
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
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    
                    }
                }
                /*
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        let:{prodList:'$products'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$_id',"$$prodList"]
                                    }
                                }
                            }
                        ],
                        as: 'cartItems'
                    }
                }
                */
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
    }

}   