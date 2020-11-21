var db=require('../config/connection') // to use mongo db connection here
var collection=require('../config/collections') // check collections.js. to get those values here we use require
const bcrypt=require('bcrypt')
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
    }

}   