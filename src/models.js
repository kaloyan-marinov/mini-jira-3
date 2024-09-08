const mongoose = require('mongoose');

const RevokedTokenSchema = new mongoose.Schema({
  // TODO: (2024/09/08, 09:42)
  //      when a `User` model is implemented:
  //      (a) the following should be changed to a reference to `User._id`
  //      (b) more meaningful/comprehensive tests for requests to `/api/v1/tokens`
  //          should be implemented
  userId: {
    type: Number,
    required: [true, 'Please specify a value for "userId"'],
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
});

const Issue = new mongoose.model(NAME_OF_ISSUE_MODEL, IssueSchema);

module.exports = { RevokedToken, Issue };
