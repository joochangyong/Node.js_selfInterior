var express = require('express');
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');  //post로 사용자의 입력값 받기
var db = require('./dbconfig');
var con = mysql.createConnection(db);
router.use(bodyParser.urlencoded({ extended: true }));  //bodyParser 실행코드
var multer = require('multer');

var date = new Date();
var dd = date.getDate();
var mm = date.getMonth() + 1;
var yyyy = date.getFullYear();
var date = yyyy + '/' + mm + '/' + dd;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //파일이 이미지 파일이면
    if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png") {
      console.log("이미지 파일이네요")
      cb(null, './public/uploads/images')
    }
  },
  //파일이름 설정
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

//파일 업로드 모듈
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, cd) {
    if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png") {
      cd(null, true);
    } else {
      cd(null, false);
    }
  }
})

//파일 업로드 및 디비에 위치 저장
router.post('/fileupload', upload.single('fileupload'), function (req, res) {
  var product_img = `insert into product_img (product_img_path) values (?)`
  var product_img_info = `insert into product_img_info (product_img_path) values (?)`
  console.log('filename:' + req.file)
  if (req.file == undefined) {
    res.send('<script type="text/javascript">alert("올바른 이미지 파일을 첨부 해주세요");history.back();</script>');

  } else {
    console.log("post")
    var asd = req.file.path.split('\\');
    asd.splice(0, 1);
    var path = asd.join('\\');

    //파일 위치를 mysql 서버에 저장
    con.query(product_img, [path], function () {
      con.query(product_img_info, [path], function () {
        res.redirect('/');
      });
    })
  }
});
con.connect();

/* GET home page. */
//스토어 목록
router.get('/product_board', function (req, res) {
  var sess = req.session;
  var product = `select * from product, product_img, product_img_info where product.product_num = product_img_info.product_num and product_img.product_img_path = product_img_info.product_img_path and product_img_info.product_img_turn=1`
  var categorySQL = 'select * from category'

  con.query(product, function (err, product1) {
    con.query(categorySQL, function (err, row1) {
      res.render('./product/product_board', { user: sess, supplier: sess, product: product1, category: row1, title: 'Express' })
    })
  })
})
//카테고리별 스토어 목록
router.get('/product_board/:category', function (req, res) {
  var sess = req.session;
  var params = req.params;
  var body = req.body
  var product = `select * from product, product_img, product_img_info where product.product_num = product_img_info.product_num and product_img.product_img_path = product_img_info.product_img_path and category_name=? and product_img_info.product_img_turn=1`
  var categorySQL = 'select * from category'

  con.query(product, [params.category], function (err, product1) {
    con.query(categorySQL, function (err, row1) {
      res.render('./product/product_board', { user: sess, supplier: sess, product: product1, category: row1, title: 'Express' })
    })
  })
})

//상품상세
router.get('/product_detail/:productNum', function (req, res) {
  var sess = req.session;
  var params = req.params;
  var body = req.body;
  
  var productSQL = `select * from product, supplier,product_img, product_img_info where product.supplier_num=supplier.supplier_num and product.product_num = product_img_info.product_num and product_img.product_img_path = product_img_info.product_img_path and product.product_num=?`
  var SQL = 'select * from review where product_num = ?'
  var SQL1 = 'select * from product, supplier where supplier.supplier_num = product.supplier_num and product.product_num = ?'
  var sql = `select * from review where product_num = ? and id = ?`
  con.query(productSQL, [params.productNum], function (err, product1) {
    con.query(SQL,[params.productNum], function(err, row) {
      con.query(SQL1, [params.productNum],function(err, row1) {
        con.query(sql,[params.productNum, sess.userid],function(err,row6){
          console.log(row6[0])
          res.render('./product/product_detail', { user: sess, supplier: sess, review:row,product: product1, supplier1:row1, update:row6 })
        })
      })
      
    })
  })
})

router.post('/product_detail/:productNum', function (req, res) {
  var params = req.params;
  var body = req.body;
  var sess = req.session;
  sess.productAmount = body.amount;

  var basSQL = 'select * from basket where id = ?'
  var insertbas = 'insert into basket_info(basket_num,product_num,basket_amount) value(?,?,?)'
  var updatebas = 'update basket_info set basket_amount=(basket_amount+?) where basket_Num = ? and product_num=?'

  if (body.button == '바로구매') {
    if (sess.userid != null) {
      sess.productAmount = body.amount;
      res.redirect(`/order/shortcut/${params.productNum}`);
    } else {
      res.send("<script>alert('로그인 후에 이용가능합니다.'); location.href='/users/login';</script>");
    }
  } else if (body.button == '장바구니') {
    if (sess.userid != null) {
      con.query(basSQL, [sess.userid], function (err, basrow) {
        con.query(insertbas, [basrow[0].basket_num, params.productNum, body.amount], function (err, row) {
          if (err) {
            con.query(updatebas, [body.amount, basrow[0].basket_num, params.productNum], function (err, row1) {
              res.redirect('/basket/basket');
            })
          } else {
            res.redirect('/basket/basket');
          }
        })
      })
    } else {
      res.send("<script>alert('로그인 후에 이용가능합니다.'); location.href='/users/login';</script>");
    }
  }
})

router.get('/product_insert', function (req, res) {
  var sess = req.session;
  var SQL = 'select * from category'
  con.query(SQL,function(err,row) {
    res.render('./product/product_insert', { user: sess, supplier: sess, category:row,title: 'Express' })
  })
})

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@상품등록@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.post('/product_insert', upload.array('fileupload'), function (req, res) {
  var sess = req.session;
  var body = req.body;
  var pathArray = "";
  var sql = `insert into product (product_name, supplier_num, price, product_amount, product_info, category_name) value (?, ?, ?, ?, ?, ?)`
  var sql1 = `SELECT LAST_INSERT_ID() as product_num`
  
  con.query(sql, [body.product_name, sess.supplier_num, body.price, body.product_amount, body.product_info, body.category], function (err, row) {
    
    con.query(sql1, function (err, row1) {
      for (var i = 0; i < req.files.length; i++) {
        var asd = req.files[i].path.split('\\');
        asd.splice(0, 1);
        var path = asd.join('\\');
        if (i == req.files.length) {
          path == path;
        } else {
          con.query(`insert into product_img (product_img_path) values (?)`, [path], function (err, product) {
          });
        }
        con.query(`insert into product_img_info (product_num, product_img_path, product_img_turn) values (?, ?, ?)`, [row1[0].product_num, path, i + 1], function (err, product1) {
        });
      }
      if (err) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('실패하였습니다..'); history.back(); </script>");
      }
      else {
        res.redirect("/product/product_board");
      }
    })
  })
})
//리뷰
router.post('/review/:productNum', function (req, res) {
  var params = req.params;
  var sess = req.session;
  var body = req.body;

  var SQL = 'select * from orders, order_info where orders.order_num=order_info.order_num and id = ? and order_info.product_num = ?'
  var SQL1 = 'insert into review(id, product_num, review_info, write_time,product_star)value(?,?,?,?,?)'
  var SQL2 = 'UPDATE product SET average_star = (SELECT AVG(product_star) FROM review WHERE product_num=?)WHERE product_num=?'
  var SQL3 = 'update clients set point = (point+20) where id = ?'
  var update = `update clients set last_time=? where id = ?`

  con.query(SQL, [sess.userid,params.productNum], function (err, row) {    
    if(row[0]==undefined){     
      res.send(`<script>alert("상품을 구매하고 리뷰를 남길 수 있습니다."); location.href="/product/product_detail/${params.productNum}";</script>`);
    }else{
      con.query(SQL1, [sess.userid, params.productNum, body.review_info, date, body.star], function (err, row1) {
        if(err){
          res.send(`<script>alert("상품 리뷰를 이미 달았습니다."); location.href="/product/product_detail/${params.productNum}"</script>`);
        }else{
          con.query(SQL2, [params.productNum,params.productNum], function(err, row2) {
            if (err) {
              console.log('평점 업뎃 에러');
            } else {
              con.query(SQL3,[sess.userid],function(err, row3) {
                con.query(update,[date,sess.userid],function (err,row7) {
                  res.redirect(`/product/product_detail/${params.productNum}`);
                })
              })
            }
          })
        }
      })
    }
  })
})

//리뷰수정
router.get('/review_update/:id/:proNum',function(req,res,next){
  var sess = req.session;
  var params = req.params;
  var pa1 = params.id;
  var pa2 = params.proNum;

  var sql = `select * from review where product_num = ? and id = ?`
  con.query(sql, [params.proNum, params.id], function(err,row){
    res.render('./product/review_update',{ user: sess, supplier: sess, content:row, pa1:pa1, pa2:pa2 });
  })
})

router.post('/review_update/:id/:proNum',function(req,res,next) {
  var sess = req.session;
  var params = req.params;
  var body =req.body;

  var SQL = 'update review set review_info =?, product_star = ? , write_time = ? where id = ? and product_num = ?'
  var SQL2 = 'UPDATE product SET average_star = (SELECT AVG(product_star) FROM review WHERE product_num=?)WHERE product_num=?'

  con.query(SQL, [body.info,body.star,date,params.id,params.proNum],function(err, row) {
    con.query(SQL2,[params.proNum,params.proNum],function(err, row2) {
      res.send(`<script>alert("리뷰 수정이 완료되었습니다."); location.href="/product/product_detail/${params.proNum}"</script>`)
    })
  })
})

//리뷰 삭제
router.get('/review_delete/:proNum',function(req,res,next) {
  var params = req.params;
  var sess = req.session;
  var SQL = 'delete from review where id = ? and product_num = ?'

  con.query(SQL, [sess.userid,params.proNum],function(err, row) {
    res.send(`<script>alert("리뷰 삭제가 완료되었습니다."); location.href="/product/product_detail/${params.proNum}"</script>`)
  })
})

// 상품 검색
router.post('/product_search',function(req,res,next) {
  var sess = req.session;
  var body = req.body;
  var keyword = body.keyWord;
  var SQL = `select * from supplier,product_img_info,product where product.supplier_num = supplier.supplier_num and product_img_info.product_img_turn = 1 and product.product_num=product_img_info.product_num and (product.product_name like "%"?"%" or supplier.supplier_name like "%"?"%")`
  con.query(SQL,[body.keyWord,body.keyWord],function(err, row) {
    console.log(row);
    
      res.render('./interior/interior_search',{ user: sess, supplier: sess, product:row, key: keyword,title: 'Express' });
  })
})
//상품 수정
router.get('/product_update/:productNum',function(req, res, next) {
  var sess = req.session;
  var body = req.body;
  var params = req.params;
  var pa = params.productNum;
  var SQL = 'select * from category'
  var SQL1 = 'select * from product where product_num = ?'
  con.query(SQL, function (err, row) {
    con.query(SQL1, [params.productNum], function(err, row1) {
      console.log(pa);
      
    res.render('./product/product_update',{user: sess, supplier: sess,category:row , pa:pa, productinfo:row1})
    })
  })
})

router.post('/product_update/:productNum',upload.array('fileupload'),function(req, res, next) {
  var sess = req.session;
  var body = req.body;
  var params = req.params;
  var SQL = 'update product set category_name = ?, product_name = ?, price=?, product_amount = ?, product_info =? where product_num = ?'
  var SQL2 = `delete from product_img_info where product_num = ?`
  var SQL3 = `insert into product_img (product_img_path) values (?)`
  var SQL4 = `insert into product_img_info (product_num, product_img_path, product_img_turn) values (?, ?, ?)`
    con.query(SQL,[body.category,body.product_name,body.price,body.product_amount,body.product_info,params.productNum],function(err, row1) {
      con.query(SQL2, [params.productNum], function (err, row2) {
        
        for (var i = 0; i < req.files.length; i++){
          var asd = req.files[i].path.split('\\');
          asd.splice(0, 1);
          var path = asd.join('\\');
          if (i == req.files.length){
            path == path;
          } else {
            con.query(SQL3, [path], function (err, row3) {
            })
          }
          con.query(SQL4, [params.productNum, path, i+1], function (err, row4) {
          })
        }
        res.redirect(`/product/product_detail/${params.productNum}`)
      })
    })
})
//상품 삭제
router.get('/product_delete/:productNum',function(req,res,next) {
  var params = req.params;
  var SQL = "delete from product where product_num =?"
  var SQL1 = "delete from product_img_info where product_num = ?"
  con.query(SQL,[params.productNum],function(err, row) {
    con.query(SQL1,[params.productNum],function (err, row1) {
      res.send(`<script>alert("상품이 삭제 되었습니다."); location.href="/product/product_board";</script>`);
    })
  })
})
module.exports = router;