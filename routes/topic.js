const express = require('express');
const router = express.Router();
const template = require('../lib/template.js');
const path = require('path');
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');
const auth = require("../lib/auth")


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
  const title = post.title;
  const description = post.description;
  fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
    res.redirect(`/topic/${title}`);
  });

});



router.get("/update/:pageId", (req, res) => {
  if (!auth.isOwner(req, res)) return res.redirect("/");


  const filteredId = path.parse(req.params.pageId).base;

  fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
    const title = filteredId;
    const list = template.list(req.list);
    const html = template.HTML(title, list,
      `
              <form action="/topic/update_process" method="post">
                <input type="hidden" name="id" value="${title}">
                <p><input type="text" name="title" placeholder="title" value="${title}"></p>
                <p>
                  <textarea name="description" placeholder="description">${description}</textarea>
                </p>
                <p>
                  <input type="submit">
                </p>
              </form>
              `,
      `<a href="/topic/create">create</a> <a href="/topic/update/${title}">update</a>`,
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
  fs.rename(`data/${id}`, `data/${title}`, function (error) {
    fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
      res.redirect(`/topic/${title}`);
    })
  });

})


router.post("/delete_process", (req, res) => {
  if (!auth.isOwner(req, res)) return res.redirect("/");


  const post = req.body;
  const id = post.id;
  const filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function (error) {
    res.redirect("/");
  })
});


router.get('/:pageId', (req, res, next) => {

  const filteredId = path.parse(req.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
    if (err) return next(err);

    const title = filteredId;
    const sanitizedTitle = sanitizeHtml(title);
    const sanitizedDescription = sanitizeHtml(description, {
      allowedTags: ['h1']
    });
    const list = template.list(req.list);
    const html = template.HTML(sanitizedTitle, list,
      `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
      ` <a href="/topic/create">create</a>
                  <a href="/topic/update/${sanitizedTitle}">update</a>
                  <form action="/topic/delete_process" method="post">
                    <input type="hidden" name="id" value="${sanitizedTitle}">
                    <input type="submit" value="delete">
                  </form>`,
      auth.statusUI(req, res)
    );
    res.send(html);


  });
});


module.exports = router;