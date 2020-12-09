var express = require('express');
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');  //post로 사용자의 입력값 받기
var db = require('./dbconfig');
var con = mysql.createConnection(db);
var schedule = require('node-schedule');
var moment = require('moment');


router.use(bodyParser.urlencoded({ extended: true }));  //bodyParser 실행코드

con.connect();

var date = new Date();
date.setDate(date.getDate()-1);
var dd = date.getDate();
var mm = date.getMonth() + 1;
var yyyy = date.getFullYear();
var date = yyyy + '/' + mm + '/' + dd;

var date2 = new Date();
var dd = date2.getDate();
var mm = date2.getMonth() + 1;
var yyyy = date2.getFullYear();
var date2 = yyyy + '/' + mm + '/' + dd;

var date1 = new Date();

var date3m = moment(date1.getTime()).subtract(3,'M').format("YYYY/MM/DD");

//공급업체 등급 변경
var schedule0 = schedule.scheduleJob('* * 1 * *', function() {
  var SQL = 'select supplier.supplier_name, product.supplier_num,AVG(product.average_star) as avg_star, COUNT(product.supplier_num) as count_sup FROM review, product, supplier where review.product_num = product.product_num and product.supplier_num = supplier.supplier_num GROUP BY product.supplier_num HAVING avg_star >= 4.0 and count_sup >= 10'
  var SQL1 = 'update supplier set supplier_class = "우수" where supplier_num = ?'
  var SQL2 = 'select supplier.supplier_name, product.supplier_num,AVG(product.average_star) as avg_star, COUNT(product.supplier_num) as count_sup FROM review, product, supplier where review.product_num = product.product_num and product.supplier_num = supplier.supplier_num GROUP BY product.supplier_num HAVING avg_star < 4.0 or count_sup < 10'
  var SQL3 = 'update supplier set supplier_class = "일반" where supplier_num = ?'
  con.query(SQL, function(err, row) {
    for (let i = 0; i < row.length; i++) {
      con.query(SQL1, [row[i].supplier_num],function(err, row1) {
      
      })
    }
  })
  con.query(SQL2, function(err, row2) {
    for (let i = 0; i < row2.length; i++) {
      con.query(SQL3, [row2[i].supplier_num],function(err, row3) {
        
      })
    }
  })
})

//매년 1월 1일 포인트 초기화
var schedule1 = schedule.scheduleJob('* * 1 1 *', function () {
  var SQL = 'update clients set point=0'

  con.query(SQL,function(err, row) {
    
  })
})

//3개월마다 등급 갱신
var schedule2 = schedule.scheduleJob('* * 1 3,6,9,12 *', function() {
  var sql = "SELECT id, SUM(order_sum) as orderSum FROM orders where order_time >= ? AND order_time <= ? GROUP BY id HAVING orderSum<200000"
  var sql1 = "SELECT id, SUM(order_sum) as orderSum FROM orders where order_time >= ? AND order_time <= ? GROUP BY id HAVING orderSum>=500000"
  var sql2= 'SELECT id, SUM(order_sum) as orderSum FROM orders where order_time >= ? AND order_time <= ? GROUP BY id HAVING 200000 <= orderSum and orderSum < 500000'
  var update = "update clients set class='Bronze' where id=?"
  var update1 = "update clients set class='Silver' where id=?"
  var update2 = "update clients set class='Gold' where id=?"

  con.query(sql,[date3m,date2],function(err, row) {
    for (let i = 0; i < row.length; i++) {
      con.query(update, [row[i].id],function(err, up) {
        
      })
    }
  })
  con.query(sql1,[date3m, date2],function(err, row1) {
    for (let i = 0; i < row1.length; i++) {
      con.query(update1, [row1[i].id],function(err, up1) {
        
      })
    }
  })
  con.query(sql2,[date3m, date2],function(err, row2) {
    for (let i = 0; i < row2.length; i++) {
      con.query(update2, [row2[i].id],function(err, up2) {
        
      })
    }
  })
})


router.get('/', function (req, res, next) {
  var sess = req.session;
  var SQL = 'SELECT *, COUNT(like_info.post_num) as likeCount from post_img_info, post, like_info where post_img_info.post_num=post.post_num and post.post_num = like_info.post_num and like_info.like_time = ? and post_img_info.post_img_turn = 1 GROUP BY post.post_num order by likeCount desc limit 1'
  var SQL1 ='select *, AVG(product.average_star) as avg_star FROM product_img_info,review, product, supplier where product_img_info.product_num = product.product_num and review.product_num = product.product_num and product.supplier_num = supplier.supplier_num and product_img_info.product_img_turn = 1 GROUP BY product.supplier_num HAVING supplier.supplier_class = "우수" limit 4'
  con.query(SQL, [date], function(err, row) {
    con.query(SQL1, function(err, row1) {
        res.render('index', { user: sess, supplier: sess, bestpost: row, product:row1});
    })
  })
});

module.exports = router;