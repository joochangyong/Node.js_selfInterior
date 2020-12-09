var express = require('express');
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');  //post로 사용자의 입력값 받기
var db = require('./dbconfig');
var con = mysql.createConnection(db);
router.use(bodyParser.urlencoded({ extended: true }));  //bodyParser 실행코드
var multer = require('multer')
con.connect();

var date = new Date();
var dd = date.getDate();
var mm = date.getMonth() + 1;
var yyyy = date.getFullYear();
var date = yyyy + '/' + mm + '/' + dd;

//파일 저장위치와 파일이름 설정
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
  var post_img = `insert into post_img (post_img_path) values (?)`
  var post_img_info = `insert into post_img_info (post_img_path) values (?)`
  if (req.file == undefined) {
    res.send('<script type="text/javascript">alert("올바른 이미지 파일을 첨부 해주세요");history.back();</script>');
  } else {
    var asd = req.file.path.split('\\');
    asd.splice(0, 1);
    var path = asd.join('\\');

    //파일 위치를 mysql 서버에 저장
    con.query(post_img, [path], function () {
      con.query(post_img_info, [path], function () {
        res.redirect('/');
      });
    })
  }
});

/* GET home page. */
// 인테리어 리스트
router.get('/interior_board', function (req, res, next) {
  var sess = req.session;
  con.query(`select * from Style`, function (err, row) {
    con.query(`select * from Space`, function (err, row1) {
      con.query(`select * from post, post_img_info where post.post_num = post_img_info.post_num and post_img_info.post_img_turn = 1 order by post.post_num desc`, function (err, row3) {
        console.log(row3);
        
        res.render('./interior/interior_board', { user: sess, supplier: sess, style: row, space: row1, content: row3 });
      })
    })
  })
})

router.get('/interior_board/:area', function (req, res, next) {
  var sess = req.session;
  var params = req.params;
  var interior = `select * from post, post_img_info, poststyle, postspace where post.post_num = poststyle.post_num and post.post_num = postspace.post_num and post.post_num = post_img_info.post_num and post_img_info.post_img_turn = 1 and (post.area = ? OR poststyle.style_name = ? OR postspace.space_name = ?) GROUP BY post.post_num`
  var style = `select * from Style`
  var Space = `select * from Space`
  con.query(interior, [params.area, params.area, params.area], function (err, row) {
    console.log(row);

    con.query(style, function (err, row1) {
      con.query(Space, function (err, row2) {
        res.render('./interior/interior_board', { user: sess, supplier: sess, content: row, style: row1, space: row2 });
      })
    })
  })
});

// 인테리어 상세
router.get('/interior_detail/:post_num', function (req, res, next) {
  var sess = req.session;
  var params = req.params;
  var sql = `select * from comment where post_num = ? order by comment_num asc`
  var select = `select count(post_num) as count_post from comment where post_num = ?`
  con.query(`select * from post, post_img_info where post.post_num = post_img_info.post_num and post.post_num = ?`, [req.params.post_num], function (err, row1) {
    con.query(`select * from postspace where post_num = ?`, [req.params.post_num], function (err, row2) {
      con.query(`select * from poststyle where post_num = ?`, [req.params.post_num], function (err, row3) {
        con.query(`select * from tag where post_num = ?`, [req.params.post_num], function (err, row4) {
          con.query(`select * from like_info where id = ? and post_num = ?`, [sess.userid, req.params.post_num], function (err, row5) {
            con.query(`select post_num, count(*) as likeCount from like_info where post_num = ? group by post_num`, [req.params.post_num], function (err, row6) {
              con.query(sql, [req.params.post_num], function (err, row7) {
                con.query(select, [params.post_num], function (err, rowselect) {

                  res.render('./interior/interior_detail', { user: sess, supplier: sess, img: row1, space: row2, style: row3, tag: row4, like: row5, count: row6, comment: row7, comcount: rowselect });
                })
              })
            })
          })
        })
      })
    })
  })
});

router.post('/interior_detail/:post_num', function (req, res, next) {
  var sess = req.session;
  con.query(`select * from like_info where id = ? and post_num = ?`, [sess.userid, req.params.post_num], function (err, row) {

    if (row.length != 0) {
      con.query(`delete from like_info where id = ? and post_num = ?`, [sess.userid, req.params.post_num], function (err, row2) {
      })
    } else {
      con.query(`insert into like_info (id, post_num, like_time) values (?, ?, ?)`, [sess.userid, req.params.post_num, date], function (err, row1) {
      })
    }
  })
  res.redirect(`/interior/interior_detail/${req.params.post_num}`);
})

// 인테리어 등록하기
router.get('/interior_posting', function (req, res, next) {
  var sess = req.session;
  var body = req.body
  con.query(`select * from space`, function (err, result1) {
    con.query(`select * from style`, function (err, result2) {
      res.render('./interior/interior_posting', { user: sess, supplier: sess, space: result1, style: result2 });
    })
  })
});

router.post('/interior_posting', upload.array('fileupload'), function (req, res, next) {
  var sess = req.session;
  var body = req.body;
  var pathArray = "";
  if (req.files == "") {
    res.send(`<script>alert("사진을 추가 하세요."); history.back();</script>`)
  } else {
    con.query(`insert into Post (id, area, post_info, write_time, post_title) values (?, ?, ?, SYSDATE(), ?)`, [sess.userid, body.area, body.post_info, body.post_title], function (err, row1) {
      if (err) console.log('111', err);

      con.query(`SELECT LAST_INSERT_ID() as post_num`, function (err, LAST) {
        if (err) console.log('222', err);

        if (typeof (body.space) == 'object') {
          for (var i = 0; i < body.space.length; i++) {
            con.query(`insert into postspace (post_num, space_name) values (?, ?)`, [LAST[0].post_num, body.space[i]], function (err, row2) {
              if (err) console.log('333', err);

            })
          }
        } else {
          con.query(`insert into postspace (post_num, space_name) values (?, ?)`, [LAST[0].post_num, body.space], function (err, row2) {
            if (err) console.log('4444', err);

          })
        }
        if (typeof (body.style) == 'object') {
          for (var i = 0; i < body.style.length; i++) {
            con.query(`insert into poststyle (post_num, style_name) values (?, ?)`, [LAST[0].post_num, body.style[i]], function (err, row3) {
              if (err) console.log('555', err);

            })
          }
        } else {
          con.query(`insert into poststyle (post_num, style_name) values (?, ?)`, [LAST[0].post_num, body.style], function (err, row3) {
            if (err) console.log('666', err);

          })
        }
        for (var i = 0; i < req.files.length; i++) {
          var asd = req.files[i].path.split('\\');
          asd.splice(0, 1);
          var path = asd.join('\\');
          if (i == req.files.length) {
            path == path;
          } else {
            con.query(`insert into post_img (post_img_path) values (?)`, [path], function (err, post) {
              if (err) console.log('777', err);

            });
          }
          con.query(`insert into post_img_info (post_num, post_img_path, post_img_turn) values (?, ?, ?)`, [LAST[0].post_num, path, i + 1], function (err, post1) {
            if (err) console.log('888', err);
          });
        }
        if (typeof (body.link) == 'object' && typeof (body.tag_name) == 'object') {
          for (var i = 0; i < body.link.length; i++) {
            con.query(`insert into tag (tag_address, post_num, tag_name) values (?, ?, ?)`, [body.link[i], LAST[0].post_num, body.tag_name[i]], function (err, row6) {
              if (err) console.log('999', err);
            })
          }
        } else {
          con.query(`insert into tag (tag_address, post_num, tag_name) values (?, ?, ?)`, [body.link, LAST[0].post_num, body.tag_name], function (err, row6) {
            if (err) console.log('101010', err);
          })
        }
        con.query(`update clients set point = (point + 50) where id = ?`, [sess.userid], function (err1, row7) {
          if (body.link != null) {
            con.query(`select *, COUNT(tag_address) as count from tag where post_num = ? GROUP BY post_num`, [LAST[0].post_num], function (err, row8) {
              if (err) console.log('rwrwrwrwr222222', err);
              con.query(`update clients set point = (point + (? * 10)) where id = ?`, [row8[0].count, sess.userid], function (err, row9) {
                if (err) console.log('11`11`11', err);
                if (err1) {
                  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
                  res.write("<script> alert('실패하였습니다.'); history.back(); </script>");
                }
                else {
                  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
                  res.write(`<script> alert('등록되었습니다!'); location.href='/interior/interior_board';  </script>`);
                }
              })
            })
          }
          else {
            if (err1) {
              res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
              res.write("<script> alert('실패하였습니다.'); history.back(); </script>");
            }
            else {
              res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
              res.write(`<script> alert('등록되었습니다!'); location.href='/interior/interior_board';  </script>`);
            }
          }
        })
      })
    })
  }

})


// 인테리어 업데이트
router.get('/interior_update/:post_num', function (req, res, next) {
  var sess = req.session;
  var papa = req.params.post_num
  con.query(`SELECT * FROM poststyle, post WHERE post.post_num=poststyle.post_num && post.post_num=?`, [papa], function (err, row1) {
    con.query(`SELECT * FROM postspace, post WHERE post.post_num=postspace.post_num && post.post_num=?`, [papa], function (err, row2) {
      con.query(`select * from style`, function (err, row3) {
        con.query(`select * from space`, function (err, row4) {
          con.query(`select * from post where post_num=?`, [papa], function (err, row5) {
            res.render('./interior/interior_update', { user: sess, supplier: sess, user_style: row1, user_space: row2, style: row3, space: row4, post: row5 });
          })
        })
      })
    })
  })
});

router.post('/interior_update/:post_num', upload.array('fileupload'), function (req, res, next) {
  var sess = req.session
  var body = req.body

  if (req.files == "") {
    res.send(`<script>alert("사진을 추가 하세요."); history.back();</script>`)
  } else {
    con.query(`update post set area = ?, post_info=?, write_time=SYSDATE(), post_title=? where post_num = ?`, [body.area, body.post_info, body.post_title, req.params.post_num], function (err, row1) {
      //@@@@@@@@@@@공간@@@@@@@@@@@//
      if (typeof (body.space) == 'object') {
        con.query(`delete from postspace where post_num = ?`, [req.params.post_num], function (err, row2) {
          for (var i = 0; i < body.space.length; i++) {
            con.query(`insert into postspace (post_num, space_name) values (?, ?)`, [req.params.post_num, body.space[i]], function (err, row3) {
              console.log("*****************", body.space);

            })
          }
        })
      } else {
        con.query(`delete from postspace where post_num = ?`, [req.params.post_num], function (err, row2) {
          con.query(`insert into postspace (post_num, space_name) values (?, ?)`, [req.params.post_num, body.space], function (err, row3) {
          })
        })
      }
      //@@@@@@@@@@@스타일@@@@@@@@@@@//
      if (typeof (body.style) == 'object') {
        con.query(`delete from poststyle where post_num = ?`, [req.params.post_num], function (err, row2) {
          for (var i = 0; i < body.style.length; i++) {
            con.query(`insert into poststyle (post_num, style_name) values (?, ?)`, [req.params.post_num, body.style[i]], function (err, row3) {
            })
          }
        })
      } else {
        con.query(`delete from poststyle where post_num = ?`, [req.params.post_num], function (err, row2) {
          con.query(`insert into poststyle (post_num, style_name) values (?, ?)`, [req.params.post_num, body.style], function (err, row3) {
          })
        })
      }
      //@@@@@@@@@@@사진@@@@@@@@@@@//
      con.query(`delete from post_img_info where post_num = ?`, [req.params.post_num], function (err, row5) {
        for (var i = 0; i < req.files.length; i++) {
          var asd = req.files[i].path.split('\\');
          asd.splice(0, 1);
          var path = asd.join('\\');
          if (i == req.files.length) {
            path == path;
          } else {
            con.query(`insert into post_img (post_img_path) values (?)`, [path], function (err, post4) {
            })
          }

          con.query(`insert into post_img_info (post_num, post_img_path, post_img_turn) values (?, ?, ?)`, [req.params.post_num, path, i + 1], function (err, row6) {
          })
        }
      });
      //@@@@@@@@@@@링크@@@@@@@@@@@//
      con.query(`delete from tag where post_num = ?`, [req.params.post_num], function (err, row7) {
        if (typeof (body.link) == 'object' && typeof (body.tag_name) == 'object') {
          for (var i = 0; i < body.link.length; i++) {
            con.query(`insert into tag (post_num, tag_address, tag_name) values (?, ?, ?)`, [req.params.post_num, body.link[i], body.tag_name[i]], function (err, row8) {
              if (err) console.log(body);
            })
          }
        } else {
          con.query(`insert into tag (post_num, tag_address, tag_name) values (?, ?, ?)`, [req.params.post_num, body.link, body.tag_name], function (err, row8) {
            if (err) console.log(body);
          })
        }
      })

      if (err) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('실패하였습니다..'); history.back(); </script>");
      }
      else {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write(`<script> alert('수정되었습니다!'); location.href='/interior/interior_detail/${req.params.post_num}';  </script>`);
      }
    })
  }
});


//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@인테리어삭제@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/delete/:post_num', function (req, res, next) {
  var val = req.session;
  var sql = "delete from post where post_num = ?";
  var sql1 = "delete from like_info where post_num = ?";
  con.query(sql, [req.params.post_num], function (err, row) {
    con.query(sql1, [req.params.post_num], function (err, row2) {
      if (err) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write(`<script> alert('실패하였습니다!'); history.back(); </script>`);
        console.log(req.params.post_num);
      } else {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('삭제되었습니다!'); location.href='/interior/interior_board'; </script>");
      }
    })
  })
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@댓글등록@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.post("/comment", function (req, res, next) {
  var body = req.body;
  var val = req.session;
  var select = `select * from comment where post_num = ? and id = ?`
  var SQL = `insert into comment (post_num, id, comment_info, write_time) values (?,?,?,?)`
  var update = `update clients set point=(point + 10) where id = ?`
  var update2 = `update clients set last_time=? where id = ?`
  con.query(select, [body.post_num, val.userid], function (err, result) {
    con.query(SQL, [body.post_num, val.userid, body.comment, date], function (err, row) {
      console.log(result);

      if (result != '') {
        con.query(update2, [date, val.userid], function (err, row5) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
          res.write(`<script> alert('댓글이 등록되었습니다!'); location.href='/interior/interior_detail/${body.post_num}'; </script>`);
        })
      } else {
        con.query(update, [val.userid], function (err, row4) {
          con.query(update2, [date, val.userid], function (err, row5) {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
            res.write(`<script> alert('댓글이 등록되었습니다!'); location.href='/interior/interior_detail/${body.post_num}'; </script>`);
          })
        })
      }
    })
  })
})

//댓글
router.get("/comment_update/:comNum", function (req, res, next) {
  var body = req.body;
  var params = req.params;
  var sess = req.session
  var sql = `select * from comment where comment_num = ?`
  con.query(sql, [params.comNum], function (err, row) {
    res.render('./interior/comment_update', { user: sess, supplier: sess, com: row })
  })
})

router.post("/comment_update", function (req, res, next) {
  var body = req.body
  var sess = req.session
  var sql = `update comment set comment_info=? where comment_num=?`
  var sql2 = `select * from comment where comment_num = ?`
  con.query(sql, [body.info, body.comment_num], function (err, row) {
    con.query(sql2, [body.comment_num], function (err, row2) {
      res.redirect('/interior/interior_detail/' + row2[0].post_num)
    })
  })
})

router.get("/comment_delete/:comNum", function (req, res, next) {
  var select = `select * from comment where comment_num = ?`
  var sql = `delete from comment where comment_num = ?`
  con.query(select, [req.params.comNum], function (err, row1) {
    con.query(sql, [req.params.comNum], function (err, row) {
      res.redirect('/interior/interior_detail/' + row1[0].post_num)
    })
  })
})

module.exports = router;