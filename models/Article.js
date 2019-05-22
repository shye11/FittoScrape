var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  tagline: {
    type: String,
    required: true
  },
  byline: {
    type: String,
    required: false
  },
  figure: {
    type: String,
    required: false
  },
  link: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: false
  },
  source: {
    type: String,
    required: true
  },
  timeStamp: { type: Date, default: Date.now },
  comments: [{
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comments"
    }
  }]
});

var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;