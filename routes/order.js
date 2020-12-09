//현재시간
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1; //January is 0!
var yyyy = today.getFullYear();
if (dd < 10) {
  dd = '0' + dd
}
if (mm < 10) {
  mm = '0' + mm
}
today = yyyy + '/' + mm + '/' + dd;
////

var date = new Date();
var dd = date.getDate();
var mm = date.getMonth() + 1;
var yyyy = date.getFullYear();
var date = yyyy + '/' + mm + '/' + dd;

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
//바로구매
router.get('/shortcut/:productNum', function (req, res) {
  var sess = req.session;
  var params = req.params;
  var SQL = `select * from product, supplier, product_img_info where supplier.supplier_num = product.supplier_num and product.product_num = product_img_info.product_num and product.product_num in (${params.productNum})`
  var SQL1 = 'select * from address, card where address.id = card.id and card.id = ?'
  var SQL3 = 'select * from clients where id = ?'
  con.query(SQL, function (err, row) {
    con.query(SQL1, [sess.userid], function (err, row1) {
      con.query(SQL3, [sess.userid], function (err, row3) {
        res.render('./order/shortcut', { user: sess, supplier: sess, productinfo: row, clientinfo: row1, point: row3 })
      })
    })
  })
})
router.post('/shortcutorder', function (req, res) {
  var sess = req.session;
  var body = req.body;

  var SQL = 'select * from card, address where card.id = address.id and card.card_num = ? and address.address_num =?'//카드 주소 정보 가져오기
  var SQL1 = 'insert into orders(id,order_sum,order_time,card_num,validity,cvc,zipcode,pri_address,det_address,use_point)values(?,?,?,?,?,?,?,?,?,?)' //orders 정보 삽입
  var SQL2 = 'select LAST_INSERT_ID() as ordersNum;' // 최근 삽입된 값 가져오기
  var SQL3 = 'insert into order_info(order_num,product_num,amount)values(?,?,?)' //order_info 정보 삽입
  var SQL4 = 'update clients set point=(point+?) where id = ?'//포인트 추가
  var SQL5 = 'select * from clients, clients_class where clients.class = clients_class.class and id=?'//적립률 가져오기
  var SQL6 = 'update product set product_amount=(product_amount-?)where product_num=?'//상품 수량 감소
  var SQL7 = 'update clients set point=(point-?) where id = ?'//포인트 감소
  var SQL9 = 'SELECT id,SUM(order_sum) as orderSum from orders where id = ?'
  var SQL10 = 'update clients set class = "Bronze" where id = ?'
  var SQL11 = 'update clients set class = "Silver" where id = ?'
  var SQL12 = 'update clients set class = "Gold" where id = ?'
  var update = `update clients set last_time=? where id = ?`

  var orderSum = parseInt(body.sum - body.point);
  con.query(SQL5, [sess.userid], function (err, pointrow) {
    con.query(SQL, [body.Card, body.Ship], function (err, row) {
      if (err) {
        console.log('SQL에러');
      } else {
        console.log(orderSum);
        con.query(SQL1, [sess.userid, orderSum, today, row[0].card_num, row[0].validity, row[0].cvc, row[0].zipcode, row[0].pri_address, row[0].det_address, body.point], function (err, row1) {
          if (err) {
            console.log('SQL1 에러');
          } else {
            con.query(SQL2, function (err, row2) {
              con.query(SQL3, [row2[0].ordersNum, body.productNum, body.amount], function (err, row3) {
                if (err) {
                  console.log('SQL3 에러');
                } else {
                  var point = parseInt(orderSum * pointrow[0].saving_point);
                  if (body.point == 0) {
                    con.query(SQL4, [point, sess.userid], function (err, row4) {
                      con.query(SQL6, [body.amount, body.productNum], function (err, row6) {
                        con.query(SQL9, [sess.userid], function (err, row5) {
                          if (err) console.log('sql5 에러', err);
              
                          if (row5[0].orderSum < 200000) {
                            con.query(SQL10, [row5[0].id], function (err, row6) {
                              if (err) console.log('sql6 에러', err);
                              con.query(update,[date,sess.userid],function (err,row20) {
                                res.redirect('/users/client_mypage');
                              })
                            })
                          } else if (row5[0].orderSum >= 200000 && row5[0].orderSum < 500000) {
                            con.query(SQL11, [row5[0].id], function (err, row6) {
                              if (err) console.log('sql7 에러', err);
                              con.query(update,[date,sess.userid],function (err,row20) {
                                res.redirect('/users/client_mypage');
                              })
                            })
                          } else {
                            con.query(SQL12, [row5[0].id], function (err, row6) {
                              if (err) console.log('sql8 에러', err);
                              con.query(update,[date,sess.userid],function (err,row20) {
                                res.redirect('/users/client_mypage');
                              })
                            })
                          }
                        })
                      })
                    })
                  } else {
                    con.query(SQL7, [body.point, sess.userid], function (err, row7) {
                      con.query(SQL6, [body.amount, body.productNum], function (err, row6) {
                        con.query(SQL9, [sess.userid], function (err, row5) {
                          if (err) console.log('sql5 에러', err);

                          if (row5[0].orderSum < 200000) {
                            con.query(SQL10, [row5[0].id], function (err, row6) {
                              if (err) console.log('sql6 에러', err);
                              con.query(update,[date,sess.userid],function (err,row20) {
                                res.redirect('/users/client_mypage');
                              })
                            })
                          } else if (row5[0].orderSum >= 200000 && row5[0].orderSum < 500000) {
                            con.query(SQL11, [row5[0].id], function (err, row6) {
                              if (err) console.log('sql7 에러', err);
                              con.query(update,[date,sess.userid],function (err,row20) {
                                res.redirect('/users/client_mypage');
                              })
                            })
                          } else {
                            con.query(SQL12, [row5[0].id], function (err, row6) {
                              if (err) console.log('sql8 에러', err);
                              con.query(update,[date,sess.userid],function (err,row20) {
                                res.redirect('/users/client_mypage');
                              })
                            })
                          }
                        })
                      })
                    })
                  }
                }
              })
            })
          }
        })
      }
    })
  })
})
//장바구니 구매
router.get('/basket_order/:productNum', function (req, res) {
  var sess = req.session;
  var params = req.params;
  var SQL = `select * from product, supplier, product_img_info where supplier.supplier_num = product.supplier_num and product.product_num = product_img_info.product_num and product_img_info.product_img_turn = 1 and product.product_num in (${params.productNum})`
  var SQL1 = 'select * from address, card where address.id = card.id and card.id = ?'
  var SQL2 = 'select * from basket_info, basket where basket_info.basket_num = basket.basket_num and basket.id = ?'
  var SQL3 = 'select * from clients where id = ?'
  con.query(SQL, function (err, row) {
    con.query(SQL1, [sess.userid], function (err, row1) {
      con.query(SQL2, [sess.userid], function (err, row2) {
        con.query(SQL3, [sess.userid], function (err, row3) {
          res.render('./order/order', { user: sess, supplier: sess, productinfo: row, clientinfo: row1, basket: row2, point: row3 })
        })
      })
    })
  })
})
router.post('/basket_order', function (req, res) {
  var sess = req.session;
  var body = req.body;

  var SQL = 'select * from card, address where card.id=address.id and card.id = ? and card.card_num = ? and address.address_num = ?'
  var SQL1 = 'insert into orders(id, order_sum, order_time, card_num, validity, cvc, zipcode, pri_address, det_address, use_point) values(?,?,?,?,?,?,?,?,?,?)'
  var SQL2 = 'select LAST_INSERT_ID() as ordersNum;'
  var SQL3 = 'insert into order_info(order_num, product_num, amount) values(?,?,?)'
  var SQL4 = 'update clients set point = (point + ?) where id = ?'
  var SQL5 = 'SELECT * from clients_class, clients where clients_class.class = clients.class and clients.id = ?'
  var SQL6 = 'DELETE FROM basket_info WHERE basket_num = (SELECT basket_num from basket WHERE id = ?) and product_num = ?'
  var SQL7 = 'update clients set point = (point - ?) where id = ?'
  var SQL8 = 'update product set product_amount=(product_amount-?) where product_num=?'
  var SQL9 = 'SELECT id,SUM(order_sum) as orderSum from orders where id = ?'
  var SQL10 = 'update clients set class = "Bronze" where id = ?'
  var SQL11 = 'update clients set class = "Silver" where id = ?'
  var SQL12 = 'update clients set class = "Gold" where id = ?'
  var update = `update clients set last_time=? where id = ?`
  con.query(SQL, [sess.userid, body.Card, body.Ship], function (err, row) {
    if (err)
      console.log('SQL에러');
    console.log(body);

    var sum = parseInt(body.sum - body.point);
    con.query(SQL1, [sess.userid, sum, today, row[0].card_num, row[0].validity, row[0].cvc, row[0].zipcode, row[0].pri_address, row[0].det_address, body.point], function (err, row1) {

      con.query(SQL2, function (err, row2) {

        var stringRow = JSON.stringify(row2); // row2를 JSON형식에서 String형식으로 바꾼 변수

        function INT_Last_ProductNum(String_Last_productNum) { // row2를 JSON에서 String으로 변환한 값에서 숫자만 추출하는 함수
          var INT_productNum;
          INT_productNum = String_Last_productNum.replace(/[^0-9]/g, "");
          return INT_productNum;
        }

        var row2_orderNum = INT_Last_ProductNum(stringRow); //  row2를 JSON에서 String으로 변환한 값에서 숫자만 추출하는 함수를 사용하여 추출한 숫자


        if(typeof(body.productNum) == 'object'){
          
        for (let i = 0; i < body.productNum.length; i++) {
          con.query(SQL3, [row2_orderNum, body.productNum[i], body.amount[i]], function (err, row3) {
            if(err) console.log('for문 안',err);
            console.log(body.productNum.length);
            
          })
        }}else{
          con.query(SQL3,[row2_orderNum, body.productNum,body.amount], function(err, row3) {
            if (err) console.log('for문 밖',err);
            
          })
        }
        if (body.point == 0) {
          
          con.query(SQL5, [sess.userid], function (err, row5) {

            var userSavingPoint = parseFloat(row5[0].saving_point) * body.sum;
            con.query(SQL4, [userSavingPoint, sess.userid], function (err, row4) {

              if (typeof(body.productNum) == 'object') {
                for (let i = 0; i < body.productNum.length; i++) {
                  con.query(SQL6, [sess.userid, body.productNum[i]], function (err, row6) {
                    
                  })
                  con.query(SQL8, [body.amount[i], body.productNum[i]], function (err, row8) {

                  })
                }
              } else {
                con.query(SQL6, [sess.userid, body.productNum], function (err, row6) {
                  con.query(SQL8, [body.amount, body.productNum], function (err, row8) {

                  })
                })
              }
              con.query(SQL9, [sess.userid], function (err, row5) {
                if (err) console.log('sql5 에러', err);

                if (row5[0].orderSum < 200000) {
                  con.query(SQL10, [row5[0].id], function (err, row6) {
                    if (err) console.log('sql6 에러', err);
                    con.query(update,[date,sess.userid],function (err,row20) {
                      res.redirect('/users/client_mypage');
                    })
                  })
                } else if (row5[0].orderSum >= 200000 && row5[0].orderSum < 500000) {
                  con.query(SQL11, [row5[0].id], function (err, row6) {
                    if (err) console.log('sql7 에러', err);
                    con.query(update,[date,sess.userid],function (err,row20) {
                      res.redirect('/users/client_mypage');
                    })
                  })
                } else {
                  con.query(SQL12, [row5[0].id], function (err, row6) {
                    if (err) console.log('sql8 에러', err);
                    con.query(update,[date,sess.userid],function (err,row20) {
                      res.redirect('/users/client_mypage');
                    })
                  })
                }
              })
            })
          })
        } else {
          con.query(SQL7, [body.point, sess.userid], function (err, row7) {
            for (let i = 0; i < body.productNum.length; i++) {
              con.query(SQL6, [sess.userid, body.productNum[i]], function (err, row6) {

              })
              con.query(SQL8, [body.amount[i], body.productNum[i]], function (err, row8) {

              })
            }
            con.query(SQL9, [sess.userid], function (err, row5) {
              if (err) console.log('sql5 에러', err);

              if (row5[0].orderSum < 200000) {
                con.query(SQL10, [row5[0].id], function (err, row6) {
                  if (err) console.log('sql6 에러', err);
                  con.query(update,[date,sess.userid],function (err,row20) {
                    res.redirect('/users/client_mypage');
                  })
                })
              } else if (row5[0].orderSum >= 200000 && row5[0].orderSum < 500000) {
                con.query(SQL11, [row5[0].id], function (err, row6) {
                  if (err) console.log('sql7 에러', err);
                  con.query(update,[date,sess.userid],function (err,row20) {
                    res.redirect('/users/client_mypage');
                  })
                })
              } else {
                con.query(SQL12, [row5[0].id], function (err, row6) {
                  if (err) console.log('sql8 에러', err);
                  con.query(update,[date,sess.userid],function (err,row20) {
                    res.redirect('/users/client_mypage');
                  })
                })
              }
            })
          })
        }
      })
    })
  })
})
module.exports = router;
