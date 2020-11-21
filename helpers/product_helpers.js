var db=require('../config/connection') // to use mongo db connection here
module.exports={
    addProduct:function(product,callback){
        db.get().collection('product').insertOne(product).then(function(data){ // we got the object of db, then we are adding a product 
          // to understand get( ) go to connections.js  
            callback(data.ops[0]._id)
        })
    }
} 