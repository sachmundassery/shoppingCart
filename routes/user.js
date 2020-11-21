var express = require('express');
const { response } = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/product_helpers') // to access addProduct function in product_helpers
const userHelpers = require('../helpers/user_helpers')

const verifyLogin=function(req,res){
  if(req.session.loggedIn){
    next() // this helps to return back to the function
  }
  else{
    res.redirect('/login')
  }
} // a more general way to check if a user is logged in or not,so that each time we need not write the code to check whether the user is logged in or not


/* GET home page. */
router.get('/', function(req, res, next) {
  let user=req.session.user // user = whether user is logged in or not
  
  productHelpers.getAllProducts().then(function(products){
    
    res.render('user/view_products',{ products,user})
 })
});

router.get('/login',function(req,res){
  if(req.session.loggedIn){
    res.redirect('/')
  }
  else{
    res.render('user/login',{"loginErr":req.session.loginErr})
    req.session.loginErr=false
  }
  
})
router.get('/signup',function(req,res){
  res.render('user/signup')
})

router.post("/signup",function(req,res){
  userHelpers.doSignup(req.body).then(function(response){
   
  })
})
router.post('/login',function(req,res){
  userHelpers.doLogin(req.body).then(function(response){
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }
    else{
      req.session.loginErr=true
      res.redirect('/login')
    }
  })
})
router.get('/logout',function(req,res){
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin,function(req,res){ // now this looks for the verifylogin and checks whether the user is logged in or not

  res.render('user/cart')
})


module.exports = router; 
