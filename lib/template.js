const db = require('../lib/db');

module.exports = {

  List: "",

  HTML: function (title, list, body, control, authStatusUI = '<a href="/auth/login">login</a>&nbsp;&nbsp;<a href="/auth/signup">signup</a>') {
    return `
    <!doctype html>
    <html>
    <head>
      <title>WEB1 - ${title}</title>
      <meta charset="utf-8">
    </head>
    <body>
    ${authStatusUI}  
   
      <h1><a href="/">WEB</a></h1>
      ${list}
      ${control}
      ${body}
    </body>
    </html>
    `;
  }, list: function (filelist) {

    let list = '<ul>';
    for (let i in filelist) {
      list = list + `<li><a href="/topic/${filelist[i].id}">${filelist[i].title}</a></li>`;
    }

    list = list + '</ul>';
    return list;
  }
}
