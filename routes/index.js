const express = require('express');
const router = express.Router();
const template = require('../lib/template.js');
const auth = require("../lib/auth.js")


router.get('/', (req, res) => {
    const fmsg = req.flash();

    let feedback = '';
    if (fmsg.success) {
        feedback = fmsg.success[0];
    }

    let title = 'Welcome';
    const description = 'Hello, Node.js';
    const list = template.list(req.list);
    const html = template.HTML(title, list,
        `
        <div style="color:blue">${feedback}</div>
        <h2>${title}</h2>${description}   
     <img src="/images/hello.jpg" style="width:300px; display:block; margin-top:10px" >
    `,
        `<a href="/topic/create">create</a>`,
        auth.statusUI(req, res)
    );
    res.send(html);
});


module.exports = router;