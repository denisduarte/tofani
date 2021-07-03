const mongoose = require("mongoose")

const commentSchema = mongoose.Schema({
  BookId: String,
	comment: String,
	userID: String,
  userName: String,
	createdAt: Date
})

module.exports = mongoose.model("Comment", commentSchema)
