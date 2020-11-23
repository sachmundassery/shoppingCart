function addToCart(proId){
    $.ajax({
        url:'/add_to_cart/'+proId,
        method:'get',
        success : function(response){
            if(response.status){
                let count=$('#cart_count').html()
                count=parseInt(count)+1
                $("#cart_count").html(count)
            }
           
        }
    })
}