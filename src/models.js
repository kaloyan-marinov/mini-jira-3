const mongoose = require('mongoose');

const NAME_OF_USER_MODEL = 'User';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please specify a value for "username"'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please specify a value for "password"'],
    // When HTTP clients get a User from the backend application,
    // the generated HTTP response isn't going to contain the requested User's password.
    select: false,
  },
  email: {
    type: String,
    required: [true, 'Please specify a value for "email"'],
    unique: true,
    // At the time when the video was recorded, the regex below came from:
    // https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please specify a valid value for "email"',
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = new mongoose.model(NAME_OF_USER_MODEL, UserSchema);

const RevokedTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: NAME_OF_USER_MODEL,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // TODO: (2024/09/08, 15:39)
  //        create a secondary index on this field
  //        https://mongoosejs.com/docs/guide.html#indexes
  accessToken: {
    type: String,
    required: [true, 'Please specify a value for "accessToken"'],
  },
});

const RevokedToken = new mongoose.model('RevokedToken', RevokedTokenSchema);

const NAME_OF_ISSUE_MODEL = 'Issue';

const IssueSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    required: [true, 'Please specify a value for "createdAt".'],
    default: Date.now,
  },
  status: {
    type: String,
    enum: [
      '1 = backlog',
      '2 = selected',
      '3 = in progress',
      '4 = done',
      '5 = will not do',
    ],
    required: true,
  },
  deadline: {
    type: Date,
    required: [true, 'Please specify a value for "deadline".'],
  },
  finishedAt: {
    type: Date,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: NAME_OF_ISSUE_MODEL,
    default: null, // Allows the field to be nullable.
    // TODO: (2024/08/28, 21:23)
    //        find out how to create a secondary index on this field
    //        https://mongoosejs.com/docs/guide.html#indexes
    // index: true,
  },
  description: {
    type: String,
    required: [true, 'Please specify a value for "description".'],
  },
  // TODO: (2024/09/14, 20:07)
  //      add a reference to `User._id`
  //      and implement "authorization controls" based on the `User` owning this document
});

const Issue = new mongoose.model(NAME_OF_ISSUE_MODEL, IssueSchema);

module.exports = {
  User,
  RevokedToken,
  Issue,
};
