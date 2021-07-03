const express = require("express");
const router = express.Router();

const auth = require("./middleware/auth");

const Book = require("./models/Book");
const Comment = require("./models/Comment");
const User = require("./models/User");

var ObjectId = require('mongoose').Types.ObjectId;

/******* USER CREATION AND LOGIN *******/

// Create a new user
router.post('/users/add', async (req, res) => {

    try {

        const user = new User(req.body)
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (error) {
      console.log(error);
        res.status(500).send(error)
    }
})

//Login a registered user
router.post('/users/login', async(req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findByCredentials(email, password)

        if (!user) {
            return res.status(401).send({error: 'LOGIN_FAILED'})
        }
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (error) {
			res.status(500).send({error: error.message})
    }

})

//Update user data
router.post('/users/update', async(req, res) => {
		let userid = req.body._id;
    try {
			await User.updateOne({ _id: userid },
			    								 {
														 name: req.body.name,
														 email: req.body.email,
														 acceptMailling: req.body.acceptMailling,
														 wishlist: req.body.wishlist,
												 		}
			);
			res.send(req.body)
		} catch (error) {
				res.status(500).send(error)
		}
})

// Log user out of the application in current device
router.post('/users/me/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token
        })
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send(error)
    }
})

// Log user out of all devices
router.post('/users/me/logoutall', auth, async(req, res) => {
    try {
        req.user.tokens.splice(0, req.user.tokens.length)
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send(error)
    }
})

/******* BOOKS *******/

//list all available tags
router.get("/tags", async (req, res) => {
	const tags = await Book.distinct('tags')
	res.send(tags)
})

//Add a new book
router.post("/books/add", async (req, res) => {
	const book = new Book({
							title: req.body.title,
							subtitle: req.body.subtitle,
							description: req.body.description,
							author: req.body.author,
							press: req.body.press,
							year: req.body.year,
							isbn: req.body.isbn,
							tags: req.body.tags,
							coverURL: req.body.coverURL,
							comments: req.body.comments,
							dateAdded: new Date()
	})

	await book.save()
	res.status(200).send(book)
})

//List all books
router.get("/books", async (req, res) => {
	var pipeline = [];

	//check if there is a search term
	if (req.query.search) {
		const search = { $text:
										    {
										      $search: req.query.search,
										      $caseSensitive: false,
										      $diacriticSensitive: false
										    }
										}
		pipeline.push(search)
	}

	//check if there are tags selected
  //const tagsArray = JSON.parse(JSON.stringify(req.query.tag))
	const tagsArray = JSON.parse(req.query.tag)
	if (tagsArray.length > 0) {
			const tag = {"tags": { "$all": tagsArray } };
			pipeline.push(tag)
	}

	//Create the query pipeline depending on the params
	var query = {};
	if (pipeline.length > 0)
		query["$and"] = pipeline;

	//define the sort field and direction
	var sortOrder = {};
	sortOrder[req.query.sortField] = +req.query.sortDirection;

	var books = '';
	try {
		//return the total number of books
		let total = await Book.aggregate([{$match:{}}, {$count: "count"}]);

		books = await Book.find(query)
											.skip(req.query.page * req.query.booksPerPage)
											.limit(+req.query.booksPerPage)
											.sort(sortOrder)
											.collation({ locale: "pt", strength: 1 });

		res.status(200).send({books:books, total:total[0]});

	} catch (error) {
		res.status(400).send(error);
	}
});

//Fetch a single book
router.get("/book/:id", async (req, res) => {

	try {
		const book = await Book.findOne({ _id: req.params.id })

      console.log(book);
    if (!book)
        throw 'null book'
		res.status(200).send(book);
	} catch {
		res.status(404).send({ error: "Book doesn't exist!" })
	}
});

//Update a book
router.patch("/book/:id", async (req, res) => {
	try {
		const book = await Book.findOne({ _id: req.params.id })
        if (!book)
            throw 'null book'

		if (req.body.title)
			book.title = req.body.title
		if (req.body.isbn)
			book.isbn = req.body.isbn
		if (req.body.coverImg)
			book.isbn = req.body.coverImg
		if (req.body.comments)
				book.comments = req.body.comments

			console.log(req.body);
		await book.save()
		res.send(book)
	} catch {
		res.status(404).send({ error: "Book doesn't exist!" })
	}
})

//Remove a book from the database
router.delete("/books/:id", async (req, res) => {
	try {
		await Book.deleteOne({ _id: req.params.id })
		res.status(204).send()
	} catch {
		res.status(404).send({ error: "Book doesn't exist!" })
	}
})

/******* COMMENTS *******/

//Get all comments from for a given book
router.post("/book/comments", async (req, res) => {
	let bookID = req.body.bookID;
	let docsPerPage = req.body.docsPerPage;
	let skip = req.body.page * docsPerPage;

	let comments = await Comment.find({bookID: bookID})
															.skip(skip)
															.limit(docsPerPage)
															.sort({"date":-1});

	res.status(200).send(comments);
})

//Get all comments from for a given from a given user
router.post('/users/comments', async(req, res) => {
	//let comments = await Comment.find({ userID: req.body.userID });

  let comments = await Comment.aggregate([
            { $match: { userID: req.body.userID } },
            { $addFields: { 'bookObjId': { $toObjectId: "$BookID" } } },
            { $lookup: {
                     from: "books",
                     localField: "bookObjId",
                     foreignField: "_id",
                     as: "book"
            }}

  ]);

	res.status(200).send(comments);
})

//Add a new comment
router.post("/book/comment/add", async (req, res) => {
	const comment = new Comment(req.body);
	let bookID = req.body.BookID;

	await comment.save()

	//keep the last 10 comments embedded on the book document
	let query = { _id: bookID };
	let update = {
					$inc: { total_comments: 1 },
				 	$push: { comments: {
											$each: [ comment ],
											$slice: -10
										}}
      }

	await Book.updateOne(query, update);

	res.status(200).send(comment);
})

//remove one comment
router.delete("/book/comment/remove/:id", async (req, res) => {

  let commentID = new ObjectId(req.params.id);
  let comment = await Comment.findOneAndDelete({ _id: commentID })

  //keep the last 10 comments updated
  let query = { _id: comment.BookID };
  let update = {
          $inc: { total_comments: -1 },
          $pull: { comments: { _id: commentID } }
      }

  await Book.updateOne(query, update);

  res.status(200).send()
})


//log all other routes
router.post("**", async (req, res) => {
	console.log("**");
	res.status(404).send("Invalid route")
})

module.exports = router
