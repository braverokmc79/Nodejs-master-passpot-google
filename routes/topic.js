const express = require('express');
const router = express.Router();
const template = require('../lib/template.js');
const path = require('path');
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');
const auth = require("../lib/auth")
const db = require('../lib/db');

router.get("/create", (req, res) => {

  const title = 'WEB - create';
  const list = template.list(req.list);
  const html = template.HTML(title, list, `
            <form action="/topic/create_process" method="post">
              <p><input type="text" name="title" placeholder="title"></p>
              <p>
                <textarea name="description" placeholder="description"></textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
          `, '', auth.statusUI(req, res));
  res.send(html);

});


router.post("/create_process", (req, res) => {
  if (!auth.isOwner(req, res)) return res.redirect("/");
  const post = req.body;

  db.query("INSERT INTO topics(title, description, user_id) VALUES(?, ?, ?) ", [post.title, post.description, req.user.id],
    function (err, result) {
      if (err) req.flash("error", err.toString());

      req.flash("msg", "등록 되었습니다.");
      res.redirect(`/topic/${result.insertId}`);

    });
});



router.get("/update/:pageId", (req, res) => {

  if (!auth.isOwner(req, res)) return res.redirect("/");
  const filteredId = path.parse(req.params.pageId).base;

  db.query("SELECT * FROM TOPICS WHERE id =? ", [filteredId], function (err, result) {

    if (result[0].user_id !== req.user.id) {
      req.flash("msg", "글작성자와 로그인한 아이디가 같지 않습니다.");
      console.log("filteredId  L ", filteredId);
      //return res.status(500).json({ message: "글작성자와 로그인한 아이디가 같지 않습니다." });
      return res.redirect(`/topic/${filteredId}`)
    }

    const list = template.list(req.list);
    const html = template.HTML(result[0].title, list,
      `
              <form action="/topic/update_process" method="post">
                <input type="hidden" name="id" value="${result[0].id}">
                <p><input type="text" name="title" placeholder="title" value="${result[0].title}"></p>
                <p>
                  <textarea name="description" placeholder="description">${result[0].description}</textarea>
                </p>
                <p>
                  <input type="submit">
                </p>
              </form>
              `,
      `<a href="/topic/create">create</a> <a href="/topic/update/${result[0].id}">update</a>`,
      auth.statusUI(req, res)
    );
    res.send(html);

  });

});


router.post("/update_process", (req, res) => {
  if (!auth.isOwner(req, res)) return res.redirect("/");

  const post = req.body;
  const id = post.id;
  const title = post.title;
  const description = post.description;


  db.query("SELECT * FROM TOPICS WHERE id =? ", [id], function (err, result) {

    if (result[0].user_id !== req.user.id) {
      return res.status(500).json({ message: "글작성자와 로그인한 아이디가 같지 않습니다." });
    }

    db.query(`UPDATE topics SET title = ?, description = ? WHERE id = ?`, [title, description, post.id], function (err2, result) {
      if (err2) throw err2;
      res.redirect("/");
    });

  });

})


router.post("/delete_process", (req, res) => {
  if (!auth.isOwner(req, res)) return res.redirect("/");

  const post = req.body;
  const id = post.id;
  const filteredId = path.parse(id).base;

  db.query(`SELECT * FROM topics WHERE id=?`, [filteredId], function (error, result) {
    if (error) throw error;

    if (result[0].user_id !== req.user.id) {
      return res.status(500).json({ message: "글작성자와 로그인한 아이디가 같지 않습니다." });
    }

    db.query(`DELETE FROM topics  WHERE id=?`, [post.id], function (err2, result) {
      if (err2) throw err2;
      res.redirect("/");
    });

  });

});


router.get('/:pageId', (req, res, next) => {

  const filteredId = path.parse(req.params.pageId).base;

  db.query("SELECT * FROM TOPICS WHERE id = ? ", [filteredId], function (err, result) {
    if (err) return next(err);

    const sanitizedTitle = sanitizeHtml(result[0].title);
    const sanitizedDescription = sanitizeHtml(result[0].description, {
      allowedTags: ['h1']
    });
    const list = template.list(req.list);

    const msg = req.flash("msg");
    const html = template.HTML(sanitizedTitle, list,
      `
      <h3 style="color:red">${msg}</h3>
      <h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
      ` <a href="/topic/create">create</a>
                      <a href="/topic/update/${result[0].id}">update</a>
                      <form action="/topic/delete_process" method="post">
                        <input type="hidden" name="id" value="${result[0].id}">
                        <input type="submit" value="delete">
                      </form>`,
      auth.statusUI(req, res)
    );
    res.send(html);

  });





});


module.exports = router;