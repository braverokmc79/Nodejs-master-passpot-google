module.exports = {

    isOwner: function (req, res) {
        console.log(" isOwner req.user : ", req.user);
        if (req.user) return true;
        else return false;
    },

    statusUI: function (req, res) {
        let authStatusUI = '<a href="/auth/login">login</a>&nbsp;&nbsp;<a href="/auth/signup">signup</a>';
        if (this.isOwner(req, res)) {
            authStatusUI = `${req.user.username}  <a href="/auth/logout">logout</a>
           
            `;
        }
        return authStatusUI;
    }
}


