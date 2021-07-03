const mongoose = require("mongoose")

const bookSchema = mongoose.Schema({
	title: String,
	subtitle: String,
	description: String,
	author: Array,
	press: String,
	year: Number,
	isbn: Number,
	tags: Array,
	coverURL: String,
	comments: Array,
	total_comments: Number,
	createdAt: Date
})

module.exports = mongoose.model("Book", bookSchema)
