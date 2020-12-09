var express = require('express');
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');  //post로 사용자의 입력값 받기
var db = require('./dbconfig');
var con = mysql.createConnection(db);
router.use(bodyParser.urlencoded({ extended: true }));  //bodyParser 실행코드

con.connect();

/* GET home page. */

//장바구니
router.get('/basket',function(req,res){
  var sess = req.session;
  var body = req.body;
  var sql = 'select * from basket, product_img_info,supplier, basket_info, product where product.product_num = product_img_info.product_num and product.supplier_num = supplier.supplier_num and basket.basket_num = basket_info.basket_num and product.product_num = basket_info.product_num and id = ? and product_img_info.product_img_turn=1'
  con.query(sql, [sess.userid], function(err, row){
    res.render('./basket/basket', { user: sess, supplier: sess, product: row, title: 'Express' })
  })
})
router.post('/basket',function(req,res) {
  var sess = req.session;
  var body = req.body;
  var SQL = 'select * from basket where id = ?'
  var SQL1 = 'update basket_info set basket_amount=? where product_num=? and basket_num=?'

  con.query(SQL, [sess.userid], function(err, row) {
    
    for (let i = 0; i < body.productNum.length; i++) {
      con.query(SQL1, [body.amount[i], body.productNum[i], row[0].basket_num],function(err,row1) {
        
      })
    }
    res.redirect('/basket/basket')
  })
})

router.get('/delete_product/:productNum',function(req,res){
  var params = req.params.productNum;
  var deleteSQL = `delete from basket_info where product_num in (${params})`
  con.query(deleteSQL, function(err,row){
    res.redirect('/basket/basket');
  })
})

module.exports = router;
