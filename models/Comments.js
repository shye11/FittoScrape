var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var CommentsSchema = new Schema({
  name: String,
  body: String,
  timeStamp: { type: Date, default: Date.now },
  article: {
    type: Schema.Types.ObjectId,
    ref: 'Article'
  } 
});


// creates model
var Comments = mongoose.model("Comments", CommentsSchema);

// Export the Note model
module.exports = Comments;