const mongoClient=require('mongodb').MongoClient
const state={       // creating an object for database state
    db:null
}

module.exports.connect=function(done){
    const url='mongodb://localhost:27017'
    const dbname='shopping'

    mongoClient.connect(url,function(err,data){
        if(err)
            return done(err)
        state.db=data.db(dbname)
        done() // callback
        
    })
    
}

// to get db
module.exports.get=function(){ // this is the function for get, ie we get the db
    return state.db
}