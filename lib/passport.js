const passport = require("passport");
const crypto = require('crypto');
const db = require("../lib/db");
const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oidc');



module.exports = function (app) {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function (user, cb) {
        console.log("로그인 처리시 최초 한번  passport.serializeUser 호출 user 값  :", user);
        process.nextTick(function () {
            cb(null, { id: user.id, email: user.email, username: user.username });
        });
    });

    // 로그인 성공되면 passport.deserializeUser  매번 실행 처리된다
    passport.deserializeUser(function (user, cb) {
        console.log("deserializeUser  :", user);
        process.nextTick(function () {
            return cb(null, user);
        });
    });


    // 로그인 처리 - 2) passport 로그인
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function verify(email, password, cb) {


        db.query('SELECT * FROM users WHERE email = ?', [email], function (err, row) {
            if (err) { return cb(err); }
            if (!row[0]) { return cb(null, false, { message: '등록된 email 이 없습니다.' }); }
            if (!row[0].salt) return cb(null, false, { message: '소셜 로그인으로 등록된 유저입니다.' });

            crypto.pbkdf2(password, row[0].salt, 310000, 32, 'sha256', function (err, hashedPassword) {
                console.log("로그인 데이터 : ", password, row[0].salt, hashedPassword.toString('hex'));
                console.log("로그인 DB암호: ", row[0].hashed_password);

                if (err) { return cb(err); }
                if (row[0].hashed_password !== hashedPassword.toString('hex')) {
                    console.log("비밀번호 오류");
                    //flash 에 저장 처리됨  - "flash":{"error":["비밀번호가 일치하지 않습니다."]}}
                    return cb(null, false, { message: '비밀번호가 일치하지 않습니다.' });
                }


                console.log("로그인 성공");
                return cb(null, row[0], { message: '로그인 성공' });
            });
        });

    }));


    //구글 - 로그인 처리
    passport.use(new GoogleStrategy({
        clientID: process.env['GOOGLE_CLIENT_ID'],
        clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
        callbackURL: '/auth/oauth2/redirect/google',
        scope: ['profile', 'email']
    }, function verify(issuer, profile, cb) {

        console.log("1.구글 로그인 profile: ", profile);


        db.query('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [
            'Google',
            profile.id
        ], function (err, row) {
            if (err) { return cb(err); }

            console.log("2. 구글 로그인 등록 처리: ", row.length);

            //1.federated_credentials 테이블에 등록되어 있지 않으면 신규등록처리
            if (row.length === 0) {


                db.query('SELECT * FROM users WHERE email = ?', [profile.emails[0].value], function (err, results) {
                    console.log("등록된 이메일이 존재 results : ", results);
                    //등록된 이메일이 존재하면은 로그인 처리
                    if (results.length > 0) {
                        //1) User 테이블에  등록되어 있다면 federated_credentials 테이블에만 등록후 로그인 처리
                        db.query('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [
                            results[0].id, 'Google', profile.id], function (err) {
                                if (err) { return cb(err); }
                                return cb(null, results[0]);
                            });


                    } else {
                        //2) User 테이블 및   federated_credentials 테이블 모두 등록 되어 있지 않다면 모두 등록후 로그인 처리
                        db.query('INSERT INTO users (username, email) VALUES (?, ?)', [
                            profile.displayName, profile.emails[0].value
                        ], function (err, results, fields) {
                            if (err) return cb(err);

                            const id = results.insertId;
                            db.query('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [
                                id, "Google", profile.id
                            ], function (err) {
                                if (err) { return cb(err); }
                                const user = {
                                    id: id,
                                    username: profile.displayName
                                };
                                return cb(null, user);
                            });
                        });

                    }

                });



            } else {
                //2.federated_credentials 테이블 등록되어 있다면 바로 로그인처리
                console.log("row.user_id : ", row[0].user_id);
                db.query('SELECT * FROM users WHERE id = ?', [row[0].user_id], function (err, row) {
                    if (err) { return cb(err); }
                    if (!row[0]) { return cb(null, false); }
                    return cb(null, row[0]);
                });
            }
        });



    }));



    return passport;
}