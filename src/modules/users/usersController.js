const { jwtSecret } = require("../../config/env");
const { ROLE } = require("../../utils/enums");
const User = require("./usersModel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const { name, email, password , role = ROLE.USER} = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const err = new Error('Email already in use');
        err.statusCode = 400;
        return next(err);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
}

const login = async (req, res) => {
    const {email , password} = req.body;
    if(!email || !password){
        const err = new Error('Email and password are required');
        err.statusCode = 400;
        return next(err);
    }
    const user = await User.findOne({ email });
    if(!user){
        const err = new Error('Invalid email or password');
        err.statusCode = 400;
        return next(err);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        const err = new Error('Invalid email or password');
        err.statusCode = 400;
        return next(err);
    }
    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
}


module.exports = {
    register,
    login
}