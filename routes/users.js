var express = require('express');
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');  //post로 사용자의 입력값 받기
var db = require('./dbconfig');
var con = mysql.createConnection(db);
router.use(bodyParser.urlencoded({ extended: true }));  //bodyParser 실행코드

con.connect();

var date = new Date();
var dd = date.getDate();
var mm = date.getMonth() + 1;
var yyyy = date.getFullYear();
var date = yyyy + '/' + mm + '/' + dd;

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@사용자회원가입@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/client_signup', function (req, res, next) {
  var sess = req.session;
  res.render('./signup/client_signup', { user: sess, supplier: sess, title: 'Express' })
})

router.post('/client_signup', function (req, res, next) {
  var sess = req.session;
  var body = req.body
  var signup = "insert into clients (id, class, pw, name, age, sex, phone_num, email) values (?, ?, ?, ?, ?, ?, ?, ?)"
  var basket = "insert into basket (id) values (?)"
  con.query(signup, [body.id, 'Bronze', body.pw, body.name, body.age, body.sex, body.phone_num, body.email], function (err, row) {
    if (err) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('중복된 아이디 입니다..'); history.back(); </script>");
    }
    else {
      con.query(basket, [body.id])
      res.redirect('/users/login');
    }
  });
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@사용자로그인@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/login', function (req, res, next) {
  var sess = req.session;
  res.render('./login/login', { user: sess, supplier: sess })
})

router.post("/login", async function (req, res, next) {
  var body = req.body;
  var sess = req.session;
  var loginsql = `select * from clients where id = ? AND pw = ?`;
  var update = `update clients set last_time=? where id = ?`
  con.query(loginsql, [body.id, body.pw], function (err, row) {
    if (err) {

    }
    else {
      if (row[0] == null) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('아이디 또는 비밀번호를 잘못 입력하였습니다.'); history.back(); </script>");
      }
      else {
        con.query(update, [date, body.id], function (err, row1) {
          sess.userid = row[0].id;
          sess.userpw = row[0].pw;
          sess.username = row[0].name;
          res.redirect('/');
        })
      }
    }
  });
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@사용자로그아웃@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get("/logout", function (req, res, next) { //세션 탈출탈출
  req.session.destroy();
  res.clearCookie('userid');
  res.redirect("/")
});


//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@업체회원가입@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/supplier_signup', function (req, res, next) {
  var sess = req.session;
  res.render('./signup/supplier_signup', { user: sess, supplier: sess, title: 'Express' })
})

router.post('/supplier_signup', function (req, res, next) {
  var sess = req.session;
  var body = req.body
  var signup = "insert into supplier (supplier_id, supplier_pw, supplier_name, manager, cr_num, phone_num, supplier_email, supplier_class) values (?, ?, ?, ?, ?, ?, ?, ?)"
  con.query(signup, [body.supplier_id, body.supplier_pw, body.supplier_name, body.manager, body.cr_num, body.phone_num, body.supplier_email, '일반'], function (err, row) {
    if (err) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('중복된 아이디 입니다..'); history.back(); </script>");
    }
    else {
      res.redirect('/users/supplier_login');
    }
  });
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@업체로그인@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/supplier_login', function (req, res, next) {
  var sess = req.session;
  res.render('./login/supplier_login', { user: sess, supplier: sess, title: 'Express' })
})

router.post("/supplier_login", async function (req, res, next) {
  var body = req.body;
  var sess = req.session;
  var supplierloginsql = `select * from supplier where supplier_id = ? AND supplier_pw = ?`;
  con.query(supplierloginsql, [body.supplier_id, body.supplier_pw], function (err, row) {
    if (err) {
      throw err;
    }
    else {
      if (row[0] == null) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('아이디 또는 비밀번호를 잘못 입력하였습니다.'); history.back(); </script>");
      }
      else {
        sess.supplier_id = row[0].supplier_id;
        sess.supplier_pw = row[0].supplier_pw;
        sess.supplier_name = row[0].supplier_name;
        sess.supplier_num = row[0].supplier_num;
        res.redirect('/');
      }
    }
  });
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@업체로그아웃@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get("/supplier_logout", function (req, res, next) { //세션 탈출탈출
  req.session.destroy();
  res.clearCookie('supplier_id');
  res.redirect("/")
});

//회원 마이페이지
router.get("/client_mypage", function (req, res, next) {
  var sess = req.session;
  var sql = 'select * from clients where id = ?';
  var addrSQL = 'select * from address where id = ?'
  var cardSQL = 'select * from card where id = ?'
  var order = `select * from orders, order_info, product, product_img_info where product_img_info.product_num = product.product_num and product_img_info.product_img_turn=1 and orders.order_num=order_info.order_num and product.product_num = order_info.product_num and orders.id=? GROUP BY orders.order_num ORDER BY orders.order_num DESC`
  var selectCount = `select orders.order_num, count(orders.order_num) as count from orders, order_info WHERE orders.order_num=order_info.order_num and orders.id=? GROUP BY order_info.order_num order by orders.order_num desc`
  var selectlike = `select * from like_info, post, post_img_info where like_info.id = ? and post.post_num = like_info.post_num and post.post_num=post_img_info.post_num and post_img_info.post_img_turn = 1`
  con.query(sql, [sess.userid], function (err, row) {
    con.query(addrSQL, [sess.userid], function (err, row2) {
      con.query(cardSQL, [sess.userid], function (err, row3) {
        con.query(order, [sess.userid], function (err, row4) {
          con.query(selectCount, [sess.userid], function (err, row5) {
            console.log(row5);
            
            con.query(`select * from post, post_img_info where post.post_num = post_img_info.post_num and post_img_info.post_img_turn = 1 and id = ?`, [sess.userid], function (err, row6) {
              con.query(selectlike,[sess.userid],function(err,row7){

                res.render('./mypage/client_mypage', { user: sess, supplier: sess, clients: row, addr: row2, card: row3, order: row4, count: row5, post:row6, like:row7})
              })
            })
          })
        })
      })
    })
  })
})

//회원 정보수정
router.get("/client_update/:client_id", function (req, res, next) {
  var sess = req.session;
  var param = req.params;
  var sql = 'select * from clients where id = ?'
  var addrSQL = 'select * from address where id = ?'
  var cardSQL = 'select * from card where id = ?'
  con.query(sql, [param.client_id], function (err, row1) {
    con.query(addrSQL, [sess.userid], function (err, row2) {
      con.query(cardSQL, [sess.userid], function (err, row3) {
        res.render('./mypage/client_update', { user: sess, supplier: sess, clients: row1, addr: row2, card: row3, title: 'Express' })
      })
    })
  })
})
router.post("/client_update/:client_id", function (req, res, next) {
  var sess = req.session;
  var param = req.params;
  var body = req.body;
  var sql = 'update clients set name=?, phone_num=?, pw=? where id=?'
  con.query(sql, [body.name, body.phoneNum, body.pw, param.client_id], function (err, row1) {
    res.send('<script>alert("회원 정보가 수정 되었습니다."); history.back();</script>')
  })
})

//회원탈퇴
router.get("/client_secession/:userid", function (req, res, next) {
  var body = req.body;
  var params = req.params;
  var sess = req.session;
  var sql = `select * from clients where id = ?`
  con.query(sql, [params.userid], function (err, row) {
    console.log(row);

    res.render('./mypage/client_secession', { user: sess, supplier: sess, clients: row })
  })
})

router.post("/client_secession", function (req, res, next) {
  var body = req.body;
  var sess = req.session;
  console.log('body-------------------------', body.pw[0]);

  var select1 = `select * from clients where id = ?`
  var delete1 = `delete from clients where id = ?`
  con.query(select1, [body.userid], function (err, row2) {
    console.log('row2-------------------------', row2[0].pw);
    console.log(sess);

    if (row2[0].pw == body.pw[0]) {
      con.query(delete1, [body.userid], function (err, row) {
        console.log(err);
        req.session.destroy();
        res.clearCookie('userid');
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('회원탈퇴가 완료되었습니다'); location.href='/' </script>");
      })
    } else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('비밀번호가 잘못되었습니다'); history.back(); </script>");
    }

  })
})
//회원주소추가
router.post("/addradd/:client_id", function (req, res, next) {
  var sess = req.session;
  var params = req.params;
  var body = req.body;
  var addraddSQL = 'insert into address(id, zipcode, pri_address, det_address) values(?,?,?,?)'
  con.query(addraddSQL, [sess.userid, body.zipCode, body.priAddress, body.detAddress], function (err, row) {
    res.send('<script>alert("배송지가 추가 되었습니다."); location.href="/users/client_mypage"</script>')
  })
})
//회원 주소 삭제
router.post("/addrdelete/:addrNum", function (req, res, next) {
  var sess = req.session;
  var params = req.params;
  var deleteaddrSQL = 'delete from address where address_num = ?'
  con.query(deleteaddrSQL, [params.addrNum], function (err, row) {
    res.send('<script>alert("배송지정보가 삭제 되었습니다."); location.href="/users/client_mypage"</script>')
  })
})
//회원카드추가
router.post("/cardadd/:client_id", function (req, res, next) {
  var sess = req.session;
  var params = req.params;
  var body = req.body;
  var addraddSQL = 'insert into card(id, card_num, validity, cvc) values(?,?,?,?)'
  con.query(addraddSQL, [sess.userid, body.cardNum, body.validity, body.CVC], function (err, row) {
    res.send('<script>alert("카드정보가 추가 되었습니다."); location.href="/users/client_mypage"</script>')
  })
})
//회원 카드 삭제
router.post("/carddelete/:cardNum", function (req, res, next) {
  var sess = req.session;
  var params = req.params;
  var deletecardSQL = 'delete from card where card_num = ?'
  con.query(deletecardSQL, [params.cardNum], function (err, row) {
    res.send('<script>alert("카드정보가 삭제 되었습니다."); location.href="/users/client_mypage"</script>')
  })
})

router.get("/supplier_mypage", function (req, res, next) {
  var sess = req.session;
  var SQL = 'select * from supplier where supplier_id = ?'
  var SQL1 = 'select * from product,product_img_info where product.product_num = product_img_info.product_num and supplier_num = ? and product_img_info.product_img_turn = 1'
  con.query(SQL, [sess.supplier_id], function (err, row) {
    con.query(SQL1, [row[0].supplier_num], function (err, row1) {
      res.render('./mypage/supplier_mypage', { user: sess, supplier: sess, supplierinfo: row, supplierproduct: row1, title: 'Express' })
    })
  })
})

router.get("/supplier_update/:suppliernum", function (req, res, next) {
  var sess = req.session;
  var params = req.params;

  var SQL = 'select * from supplier where supplier_num = ?'

  con.query(SQL, [params.suppliernum], function (err, row) {
    res.render('./mypage/supplier_update', { user: sess, supplier: sess, supplierinfo: row, title: 'Express' })
  })
})
router.post("/supplier_update/:suppliernum", function (req, res, next) {
  var sess = req.session;
  var params = req.params;
  var body = req.body;
  var SQL = 'select * from supllier where supplier_num = ?'
  var SQL1 = 'update supplier set supplier_name = ?, supplier_pw = ?, phone_num = ?, supplier_email = ?'

  con.query(SQL, [params.suppliernum], function (err, row) {
    con.query(SQL1, [body.storeName, body.sellerPw, body.sellerPhone, body.sellerEmail], function (err, row1) {
      res.send(`<script>alert('수정이 완료되었습니다.'); location.href="/users/supplier_mypage"</script>`);
    })
  })
})
router.get("/order_look/:suppliernum", function (req, res, next) {
  var sess = req.session;
  var params = req.params;
  var SQL = 'select * from orders, order_info, product_img_info, product where product.product_num = product_img_info.product_num and orders.order_num=order_info.order_num and order_info.product_num = product.product_num and product_img_info.product_img_turn = 1 and product.supplier_num = ?'
  con.query(SQL, [params.suppliernum], function (err, row) {
    res.render('./mypage/order_look', { user: sess, supplier: sess, order: row, title: 'Express' })
  })
})

router.get("/return_look/:suppliernum", function (req, res, next) {
  var sess = req.session;
  var params = req.params;
  var SQL = 'select * from orders, order_info, product_img_info, product where product.product_num = product_img_info.product_num and orders.order_num=order_info.order_num and order_info.product_num = product.product_num and product.supplier_num = ? and order_info.return_reason != "" and product_img_info.product_img_turn = 1'
  con.query(SQL, [params.suppliernum], function (err, row) {
    res.render('./mypage/return_look', { user: sess, supplier: sess, order: row, title: 'Express' })
  })
})

router.post("/return_look/:productnum/:ordernum", function (req, res, next) {
  var sess = req.session;
  var params = req.params;
  var SQL = 'select * from orders, order_info, product_img_info, product where product.product_num = product_img_info.product_num and orders.order_num=order_info.order_num and order_info.product_num = product.product_num and product.supplier_num = 1 and order_info.return_reason != ""'
  var SQL1 = 'select * from order_info where order_num = ? and product_num = ?'
  con.query(SQL, [params.suppliernum], function (err, row) {
    con.query(SQL1, [params.ordernum, params.productnum], function (err, row1) {
      res.send(`<script>alert('${row1[0].return_reason}');history.back();</script>`);
    })
  })
})

//회원 반품신청
router.get("/client_return/:orderNum/:productNum", function (req, res, next) {
  var sess = req.session;
  var params = req.params;
  var sql1 = `select * from order_info, product where order_info.product_num = product.product_num and order_info.order_num = ? and order_info.product_num = ?`
  con.query(sql1, [params.orderNum, params.productNum], function (err, row1) {
    res.render('./mypage/client_return', { user: sess, supplier: sess, order: row1 })
  })
})
var a = 0;
router.post("/client_return", function (req, res, next) {
  var sess = req.session;
  var body = req.body;

  var sql0 = 'select * from order_info, product where order_info.product_num = product.product_num and order_info.order_num = ? and order_info.product_num = ?'
  var sql = 'update order_info set return_reason = ? where order_num = ? and product_num = ?'
  var sql1 = 'select * ,COUNT(order_num) AS orderCount from order_info where order_num =?'
  var sql2 = 'select * from orders where order_num = ?'
  var sql2_1 = 'select * from order_info where order_num = ? and return_reason IS NULL'
  var sql3 = 'update clients set point = (point + ?) where id = ?'
  var sql4 = 'update orders set order_sum = (order_sum -?) where order_num = ?'
  var sql5 = 'SELECT id,SUM(order_sum) as orderSum from orders where id = ?'
  var sql6 = 'update clients set class = "Bronze" where id = ?'
  var sql7 = 'update clients set class = "Silver" where id = ?'
  var sql8 = 'update clients set class = "Gold" where id = ?'
  var sql9 = 'update clients set point = (point - ?) where id = ?'
  var sql10 = 'SELECT * from clients where id = ?'
  var sql11 = 'select * from clients_class where class = ?'
  

  con.query(sql0, [body.ordernum, body.productnum], function (err, row0) {
    if (err) console.log('sql0 에러');
    console.log('row0000000',row0);
    
    con.query(sql, [body.product_return, body.ordernum, body.productnum], function (err, row) {
      con.query(sql1, [body.ordernum], function (err, row1) {
        if (err) console.log('sql1 에러');
        console.log(row1);
        con.query(sql2, [body.ordernum], function (err, row2) {
        
          if (row2[0].use_point == '0') {//포인트 사용 안했다면
            if (row1[0].orderCount != 1) {//주문을 2개 같이 했을때
              console.log('포인트를 사용안하고 주문을 2개 같이 했을때');
              con.query(sql2_1, [body.ordernum],function(err, row2_1) {
                console.log('rrrrrrrrrrrrrrrrrrrrrrrrr',row2_1);
                
                if(row2_1[0] == undefined){
                  console.log('남은 반품 없음');
                  
                  con.query(sql10,[sess.userid],function(err,row10) {
                    con.query(sql11, [row10[0].class],function(err,row11) {
                      con.query(sql9,[row11[0].saving_point*a,sess.userid],function(err,row9) {
                        console.log('sql9',err);
                        console.log('빼야하는 포인트',row11[0].saving_point*a);
                        
                        
                        con.query(sql4, [row0[0].price * row0[0].amount, body.ordernum], function (err, row4) {
                          if (err) console.log(err);
              
                          con.query(sql5, [sess.userid], function (err, row5) {
                            if (err) console.log('sql5 에러', err);
              
                            if (row5[0].orderSum < 200000) {
                              con.query(sql6, [row5[0].id], function (err, row6) {
                                if (err) console.log('sql6 에러', err);
                                res.redirect('/users/client_mypage')
                              })
                            } else if (row5[0].orderSum >= 200000 && row5[0].orderSum < 500000) {
                              con.query(sql7, [row5[0].id], function (err, row6) {
                                if (err) console.log('sql7 에러', err);
                                res.redirect('/users/client_mypage')
                              })
                            } else {
                              con.query(sql8, [row5[0].id], function (err, row6) {
                                if (err) console.log('sql8 에러', err);
                                res.redirect('/users/client_mypage')
                              })
                            }
                        })
                        })
                      })
                    })
                  })
              }else{
                console.log('반품 남음');
                a = row2[0].order_sum;
                console.log(a);
                
                con.query(sql4, [row0[0].price * row0[0].amount, body.ordernum], function (err, row4) {
                  if (err) console.log(err);
      
                  con.query(sql5, [sess.userid], function (err, row5) {
                    if (err) console.log('sql5 에러', err);
      
                    if (row5[0].orderSum < 200000) {
                      con.query(sql6, [row5[0].id], function (err, row6) {
                        if (err) console.log('sql6 에러', err);
                        res.redirect('/users/client_mypage')
                      })
                    } else if (row5[0].orderSum >= 200000 && row5[0].orderSum < 500000) {
                      con.query(sql7, [row5[0].id], function (err, row6) {
                        if (err) console.log('sql7 에러', err);
                        res.redirect('/users/client_mypage')
                      })
                    } else {
                      con.query(sql8, [row5[0].id], function (err, row6) {
                        if (err) console.log('sql8 에러', err);
                        res.redirect('/users/client_mypage')
                      })
                    }
                })
                })
              }
            })
              
            } else {//주문을 1개 만 했을때
              console.log("---------------------------------------");
              
              console.log('포인트를 사용안하고 주문을 1개 같이 했을때');

                con.query(sql3, [row2[0].use_point, sess.userid], function (err, row3) {
                  con.query(sql4, [row0[0].price * row0[0].amount, body.orderNum], function (err, row4) {
                    con.query(sql5, [sess.userid], function (err, row5) {
                      if (err) console.log('sql5 에러');
                      console.log(row5[0].orderSum);
                      if (row5[0].orderSum < 200000) {
                        con.query(sql6, [row5[0].id], function (err, row6) {
                          if (err) console.log('sql6 에러');
                          res.redirect('/users/client_mypage')
                        })
                      } else if (row5[0].orderSum >= 200000 && row5[0].orderSum < 500000) {
                        con.query(sql7, [row5[0].id], function (err, row6) {
                          if (err) console.log('sql7 에러');
                          res.redirect('/users/client_mypage')
                        })
                      } else {
                        con.query(sql8, [row5[0].id], function (err, row6) {
                          if (err) console.log('sql8 에러');
                          res.redirect('/users/client_mypage')
                        })
                      }
                    })
                  })
                })
              }
          } else {//포인트 사용
            if (row1[0].orderCount != 1) {//주문을 2개 같이 했을때
              console.log('포인트를 사용하고 주문을 2개 같이 했을때');
              
              con.query(sql2_1,[body.ordernum],function(err,row2_1) {                
                if (row2_1[0] == undefined) {//포인트 환불, 
                  con.query(sql3, [row2[0].use_point, sess.userid], function (err, row3) {
                  con.query(sql4, [row0[0].price * row0[0].amount - row2[0].use_point, body.ordernum], function (err, row4) {
                    console.log(row0[0].price * row0[0].amount - row2[0].use_point);
                    
                    if (err) console.log(err);
        
                    con.query(sql5, [sess.userid], function (err, row5) {
                      if (err) console.log('sql5 에러', err);
        
                      if (row5[0].orderSum < 200000) {
                        con.query(sql6, [row5[0].id], function (err, row6) {
                          if (err) console.log('sql6 에러', err);
                          res.redirect('/users/client_mypage')
                        })
                      } else if (row5[0].orderSum >= 200000 && row5[0].orderSum < 500000) {
                        con.query(sql7, [row5[0].id], function (err, row6) {
                          if (err) console.log('sql7 에러', err);
                          res.redirect('/users/client_mypage')
                        })
                      } else {
                        con.query(sql8, [row5[0].id], function (err, row6) {
                          if (err) console.log('sql8 에러', err);
                          res.redirect('/users/client_mypage')
                        })
                      }
                    })
                  })
                  })
                } else {//반품이 남아있을때
                  con.query(sql4, [row0[0].price * row0[0].amount, body.ordernum], function (err, row4) {
                    if (err) console.log(err);
        
                    con.query(sql5, [sess.userid], function (err, row5) {
                      if (err) console.log('sql5 에러', err);
        
                      if (row5[0].orderSum < 200000) {
                        con.query(sql6, [row5[0].id], function (err, row6) {
                          if (err) console.log('sql6 에러', err);
                          res.redirect('/users/client_mypage')
                        })
                      } else if (row5[0].orderSum >= 200000 && row5[0].orderSum < 500000) {
                        con.query(sql7, [row5[0].id], function (err, row6) {
                          if (err) console.log('sql7 에러', err);
                          res.redirect('/users/client_mypage')
                        })
                      } else {
                        con.query(sql8, [row5[0].id], function (err, row6) {
                          if (err) console.log('sql8 에러', err);
                          res.redirect('/users/client_mypage')
                        })
                      }
                    })
                  })
                }
              })
            } else {//주문을 1개 만 했을때
              console.log('포인트를 사용하고 주문을 1개 같이 했을때');

                con.query(sql3, [row2[0].use_point, sess.userid], function (err, row3) {
                  con.query(sql4, [row0[0].price * row0[0].amount - row2[0].use_point, body.ordernum], function (err, row4) {
                    con.query(sql5, [sess.userid], function (err, row5) {
                      if (err) console.log('sql5 에러');
                      console.log(row5[0].orderSum);
                      if (row5[0].orderSum < 200000) {
                        con.query(sql6, [row5[0].id], function (err, row6) {
                          if (err) console.log('sql6 에러');
                          res.redirect('/users/client_mypage')
                        })
                      } else if (row5[0].orderSum >= 200000 && row5[0].orderSum < 500000) {
                        con.query(sql7, [row5[0].id], function (err, row6) {
                          if (err) console.log('sql7 에러');
                          res.redirect('/users/client_mypage')
                        })
                      } else {
                        con.query(sql8, [row5[0].id], function (err, row6) {
                          if (err) console.log('sql8 에러');
                          res.redirect('/users/client_mypage')
    
                        })
                      }
                    })
                  })
                })
              }
          }
          //
        })
      })
    })
  })
})

//회원 주문목록
router.get("/client_order/:orderNum", function (req, res, next) {
  var sess = req.session;
  var params = req.params;
  var sql = `select * from orders, order_info, product where orders.order_num = ? and order_info.order_num = ? and product.product_num = order_info.product_num`
  var sql2 = 'select * from order_info where order_num = ? and product_num = ?'

  con.query(sql, [params.orderNum, params.orderNum], function (err, row) {
    console.log(row);
    res.render('./mypage/client_order', { user: sess, supplier: sess, content: row })
  })
})

module.exports = router;