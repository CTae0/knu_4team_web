const bcrypt = require('bcryptjs');
const { createUser, getUserByEmail } = require('../service/user.service');
const userController = require("express").Router();
const jwt = require("jsonwebtoken");


userController.post("/signin", async (req, res) => {

    const body = req.body;
    // 사용자로부터 email과 password를 받음
    const email = req.body.email;
    const password = body.password;
    console.log(body);
    // email 혹은 password 둘중에 하나라도 없으면? 나가라
    if (!email || !password) {
        
        return res
            .status(400)
            .json({ result: false, message: "(!)로그인 정보가 올바르지 않습니다." });
    }
    // email을 기준으로 DB에서 유저 데이터를 꺼내와야 함
    const user = await getUserByEmail(email);

    console.log("유저정보", user)

    if (!user)
        return res
            .status(404)
            .json({ result: false, message: "(!)회원정보가 없습니다." });
    //User가 실제 있는 구간
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (isValidPassword) {
        //token을 끼워넣기.
        const token = jwt.sign({ email: user.email, nickname: user.nickname }, process.env.JWT_SECRET);
        return res
            .status(200)
            .json({ result: true, message: "로그인 성공", token });
    } else {
        return res
            .status(400)
            .json({ result: false, message: "(!)비밀번호가 올바르지 않습니다." })
    }
});




userController.post("/", async (req, res) => {
    const { email, password, nickname } = req.body;
    // 1) Email 검증
    if (!email.includes("@")) {
        return res.status(400).json({ isError: true, message: " 잘못된 Email 형식입니다." });
    }

    // 2) password 검증
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,25}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ isError: true, message: " 잘못된 Password 형식입니다." });
    }

    // 3) Nickname 검증

    if (nickname.length < 2) {
        return res.status(400).json({ isError: true, message: "닉네임은 두 글자 이상이어야 합니다." });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const user = {
        //email, == email: email,
        email: email,
        nickname: nickname,
        password: hashedPassword
    };
    try {
        await createUser(user);
        return true;
    } catch (err) {
        return false;
    }

});

module.exports = userController;