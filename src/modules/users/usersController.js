const { jwtSecret, redis } = require("../../config/env");
const { ROLE } = require("../../utils/enums");
const User = require("./usersModel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const redisClient = require('../../config/redis');

const safeUnlinkScript = `
  local keys = redis.call('keys', ARGV[1])
  if #keys > 0 then
    return redis.call('unlink', unpack(keys))
  end
  return 0
`;


const register = async (req, res) => {
    const { name, email, password, role = ROLE.USER } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const err = new Error('Email already in use');
        err.statusCode = 400;
        throw err;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
}

const login = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        const err = new Error('Email and password are required');
        err.statusCode = 400;
        throw err;
    }
    const user = await User.findOne({ email });
    if (!user) {
        const err = new Error('Invalid email or password');
        err.statusCode = 400;
        throw err;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const err = new Error('Invalid email or password');
        err.statusCode = 400;
        throw err;
    }
    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
}


const getTodayLogs = async (req, res, next) => {
    const logFilePath = path.join(__dirname, '..', '..', '..', 'logs', 'requests.log');
    const { lines } = req.query;
    const numLines = parseInt(lines) || 50;

    const nLogs = fs.readFileSync(logFilePath, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .slice(-numLines);

    res.status(200).json({ logs: nLogs });
}

const resetPasswordRequest = async (req, res, next) => {
    const jwtToken = jwt.sign({ id: req.user.id }, jwtSecret, { expiresIn: '15m' });
    redisClient.setex(`password_reset_${req.user.id}`, 900, jwtToken);
    res.status(200).json({ message: 'Password reset token generated', token: jwtToken });
}

const resetPassword = async (req, res, next) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        const err = new Error('Token and new password are required');
        err.statusCode = 400;
        throw err;
    }
    const storedToken = await redisClient.get(`password_reset_${req.user.id}`);
    if (!storedToken) {
        const err = new Error('Invalid or expired password reset token');
        err.statusCode = 400;
        throw err;
    }
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.id);
    if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        throw err;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    await redisClient.eval(safeUnlinkScript, 0, `password_reset_${req.user.id}`);
    res.status(200).json({ message: 'Password reset successfully' });
}


module.exports = {
    register,
    login,
    resetPasswordRequest,
    resetPassword,
    getTodayLogs
}