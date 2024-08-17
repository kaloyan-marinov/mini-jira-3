const mongoose = require('mongoose');

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
  // TODO: (2024/08/17, 11:27) convert the following to a nullable reference to `this._id`
  epic: {
    type: String,
  },
  description: {
    type: String,
    required: [true, 'Please specify a value for "description".'],
  },
});

const Issue = new mongoose.model('Issue', IssueSchema);

module.exports = Issue;
