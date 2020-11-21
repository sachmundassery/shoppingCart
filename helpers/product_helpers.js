var db=require('../config/connection') // to use mongo db connection here
var collection=require('../config/collections') // check collections.js. to get those values here we use require
var objectId=require('mongodb').ObjectID
module.exports={ // this contains all functions  needed

    addProduct:function(product,callback){
        db.get().collection('product').insertOne(product).then(function(data){ // we got the object of db, then we are adding a product 
          // to understand get( ) go to connections.js  
            callback(data.ops[0]._id)
        })
    }, // now next function
    getAllProducts:function(){
        return new Promise(async function(resolve,reject){
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:function(proId){
        return new Promise(function (resolve,reject){
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(proId)}).then(function(response){
                console.log(response)
                resolve(response)
            })
        })
    }
} 