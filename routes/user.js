var express = require('express');
const { response } = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/product_helpers') // to access addProduct function in product_helpers
const userHelpers = require('../helpers/user_helpers')

const verifyLogin=function(req,res,next){
  if(req.session.userLoggedIn){
    next() // this helps to return back to the function
  }
  else{
    res.redirect('/login')
  }
} // a more general way to check if a user is logged in or not,so that each time we need not write the code to check whether the user is logged in or not


/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user // user = whether user is logged in or not
  let cartCount=null
  if(req.session.user){
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  
  productHelpers.getAllProducts().then(function(products){
    
    res.render('user/view_products',{ products,user,cartCount})
 })
});

router.get('/login',function(req,res){
  if(req.session.user){
    res.redirect('/')
  }
  else{
    res.render('user/login',{"loginErr":req.session.userLoginErr})
    req.session.userLoginErr=false
  }
  
})
router.get('/signup',function(req,res){
  res.render('user/signup')
})

router.post("/signup",function(req,res){
  userHelpers.doSignup(req.body).then(function(response){
    
    req.session.user=response
    req.session.user.loggedIn=true
    res.redirect('/')
   
  })
})
router.post('/login',function(req,res){
  userHelpers.doLogin(req.body).then(function(response){
    if(response.status){
      
      req.session.user=response.user
      req.session.user.loggedIn=true
      res.redirect('/')
    }
    else{
      req.session.userLoginErr="Invalid Username or Password"
      res.redirect('/login')
    }
  })
})
router.get('/logout',function(req,res){
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')
})

router.get('/cart',verifyLogin,async function(req,res){ // now this looks for the verifylogin and checks whether the user is logged in or not
  let products=await userHelpers.getCartProducts(req.session.user._id)
  let totalValue=0
  if(products.length>0){
    totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  }
 
  res.render('user/cart',{products,user:req.session.user._id,totalValue})
})

router.get('/add_to_cart/:id',function(req,res){
  
  userHelpers.addToCart(req.params.id,req.session.user._id).then(function(){
  res.json({status:true}) 
  }) 
})
  
router.post('/change_product_quantity/',function(req,res,next){
  console.log(req.body)
    userHelpers.changeProductQuantity(req.body).then(async function(response){
    response.total=await userHelpers.getTotalAmount(req.body.user) // try userId
    res.json(response)
  })
})
router.get('/place_order',verifyLogin,async function(req,res){
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place_order',{total,user:req.session.user})
})

router.post('/place_order',async function(req,res){
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice= await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then(function(orderId){
    console.log(orderId);
    if(req.body['payment_method']==='COD'){
      res.json({codSuccess:true})
    }
    else{
       userHelpers.generateRazorpay(orderId,totalPrice).then(function(response){
        res.json(response)
       })
    } 
    
  })
  console.log(req.body)
})

router.get('/order_success',function(req,res){
  res.render('user/order_success',{user:req.session.user})
})

router.get('/orders',async function(req,res){
  let orders= await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
})

router.get('/view_order_products/:id',async function(req,res){
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view_order_products',{user:req.session.user,products})
})

router.post('/verify_payment',function(req,res){
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(function(){
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(function(){
      console.log("payment successfull");
      res.json({status:true})
    })
  }).catch(function(err){
    console.log(err);
    res.json({status:false,errMsg:''})
  })
})

 
module.exports = router; 
