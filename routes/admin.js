var express = require('express');
const { render } = require('../app')
var router = express.Router();
var productHelpers = require('../helpers/product_helpers') // to access addProduct function in product_helpers

/* GET users listing. */
router.get('/', function(req, res, next) {
  // earlier, we had dummy data here
  // now we will fetch data from the database
  productHelpers.getAllProducts().then(function(products){
    
     res.render('admin/view_products',{admin:true, products})
  })
  
  
});

router.get('/add_product',function(req,res){
  res.render('admin/add_product')

})
router.post('/add_product', function(req,res){
  console.log(req.body) // tocheck whether values are coming or not to the req object
  console.log(req.files.image)

  productHelpers.addProduct(req.body,function(id){
    let image=req.files.image
    
    console.log(id)
    image.mv('./public/product_images/'+ id+'.jpg', function(err,done){
      if(!err){
        res.render('admin/add_product')// if no error navigate to this page
      }
      else{
        console.log('error'); 
      }
    })
    res.render("admin/add_product")
  })
})

router.get('/delete_product/:id',function(req,res){
  let proId=req.params.id // to get the product id when clicked on the browser frm the url
  console.log(proId);
  productHelpers.deleteProduct(proId).then(function(response){
    res.redirect('/admin/')
  })
})

module.exports = router;
