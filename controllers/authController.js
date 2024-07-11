const { promisify } = require('util');
const User = require('../models/userModel');
const JWT = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const createSendJWT = async (res, user, isNew = false) => {
  const statusCode = isNew ? 201 : 200;

  const token = await user.signJWT(process.env.JWT_EXPIRES_IN);

  // Sending jwt in cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    ...(process.env.NODE_ENV === 'production' && { secure: true }),
    httpOnly: true,
  };

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: user,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  // Get user data from req body
  const newUser = await User.create(req.body);

  // Create email confirmation token
  const confirmationToken = await newUser.signJWT(
    process.env.JWT_CONFIRMATION_EMAIL_EXPIRES_IN
  );

  // Send token to user email
  // 3) Send confirmation token to email
  const confirmUrl = `${process.env.FE_URL}/sign-up-confirm.html?token=${confirmationToken}`;
  await new Email(newUser, confirmUrl).sendAccountConfirm();

  // Send confirmation token to user
  res.status(201).json({
    status: 'success',
    message: 'Confirmation token was sent to user email.',
  });
});

exports.confirmSignUp = catchAsync(async (req, res, next) => {
  // Get and verify the token
  const { token } = req.params;
  const decoded = await promisify(JWT.verify)(token, process.env.JWT_SECRET);

  // Get user and set him as confirmed
  const user = await User.findByIdAndUpdate(
    decoded.id,
    { confirmed: true },
    { new: true }
  );

  // Send welcome email
  const url = `${process.env.FE_URL}`;
  await new Email(user, url).sendWelcome();

  // Log the user in
  await createSendJWT(res, user, true);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please write email and password!', 400));
  }

  //2) get user from db by email
  const user = await User.findOne({ email }).select('+password +confirmed');

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('In correct email or password!', 401));

  if (!user.confirmed)
    return next(
      new AppError(
        'User email is not confirmed yet. Check your email for confirmation link',
        401
      )
    );

  //if everything is ok then send token to client
  user.password = undefined;
  await createSendJWT(res, user);
});

exports.protect = catchAsync(async (req, res, next) => {
  // Get the token from req
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer'))
    token = authHeader.split(' ')[1];
  else if (req.cookies?.jwt) token = req.cookies.jwt;

  if (!token)
    return next(
      new AppError('You are not logged in! Please log in to have access', 401)
    );

  // Verify token and user still exists
  const decoded = await promisify(JWT.verify)(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user)
    return next(
      new AppError(
        'The user belonging to this token does no longer exist!',
        401
      )
    );

  // Check if user's password is changed
  if (user.checkChangedPassword(decoded.iat))
    return next(
      new AppError(
        'The user recently changed his password. Please log in again.',
        401
      )
    );

  // Grant Access to protect route
  req.user = user;
  next();
});

exports.restrictTo = role => (req, res, next) => {
  const userRole = req.user.role;

  if (userRole !== role)
    return next(
      new AppError("You don't have access to perform this action!", 401)
    );

  next();
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  // oldPass - newPass - newPassConfirm

  // Check if current pass is correct
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.correctPassword(req.body.currentPassword, user.password)))
    return next(
      new AppError('Current Password is not correct! Please try again.', 401)
    );

  if (req.body.password !== req.body.passwordConfirm)
    return next(
      new AppError(
        "New password and confirm password don't match. Please try again.",
        400
      )
    );

  // Update current pass
  user.password = req.body.password;
  await user.save();

  // Send new jwt
  await createSendJWT(res, user);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 100),
    httpOnly: true,
  });

  const token = await promisify(JWT.sign)(
    { id: req.user.id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LOGOUT_EXPIRES_IN,
    }
  );

  res.status(200).json({ status: 'success', token });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser)
    return next(new AppError('No user found with this ID', 404));

  res.status(200).json({
    status: 'success',
    data: updatedUser,
  });
});
