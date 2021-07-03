const express = require("express");
const Sequelize = require("sequelize");

const router = express.Router();
const auth = require("./middleware/auth");

const fs = require('fs');
const sendBorrowMail = require("../../mailer")

const { Book, Author, Organiser, Translator, Local, Tag, Comment, User, Token, sequelize } = require('./sequelize')
const UserController = require("./controllers/user.controller");
const BookController = require("./controllers/book.controller");
const TagController = require("./controllers/tag.controller");
const AuthorController = require("./controllers/author.controller");
const OrganiserController = require("./controllers/organiser.controller");
const TranslatorController = require("./controllers/translator.controller");
const LocalController = require("./controllers/local.controller");
const CommentController = require("./controllers/comment.controller");

function toJSON(data) {
	return JSON.parse(JSON.stringify(data));
}

function formatBook(book) {
	var formattedBook = {
						"author": [],
						"tags": [],
						"comments": [],
						"_id": book._id,
						"title": book.title,
						"isbn": book.isbn,
						"subtitle": book.subtitle,
						"press": book.press,
						"year": book.year,
						"isAvailable": book.isAvailable,
						"createdAt": book.createdAt,
						"description": book.description,
						"coverURL":  book.coverURL
			};

	for (let tag of book.Tags) {
		formattedBook.tags.push(tag.tag);
	}

	for (let author of book.Authors) {
		formattedBook.author.push(author.name);
	}

	for (let comment of book.Comments) {
		formattedBook.comments.push({
			"_id": comment._id,
			"comment": comment.comment,
			"bookID": book._id,
			"userID": comment.userID,
			"userName": comment.userName,
			"createdAt": comment.createdAt
		});
	}

	return formattedBook;
}



/******* USER CREATION AND LOGIN *******/

// Create a new user
router.post('/users/add', async (req, res) => {
	const user = await UserController.create(req.body);
	res.status(200).send(user)
});

router.post('/users/update', async(req, res) => {

	console.log(req.body.wishlist);

		let userid = req.body._id;
    try {

			const result = await sequelize.transaction(async (t) => {


				const user = await User.findOne({
																					where: { _id: userid },
																				  include: {
																						model: Book,
																						as: "wishlist",
																						attributes: [['_id', 'BookID']],
																						through: {
																							attributes: ["createdAt"],
																						}
																					}
																				});

				user.update({ name: req.body.name,
														email: req.body.email,
														acceptMailling: req.body.acceptMailling
										});

				var storedBooks = [];
				var newWishlist = [];
				for (let book of user.wishlist) {
					storedBooks.push(book.toJSON().BookID);
				}

				for (let book of req.body.wishlist) {
					newWishlist.push(book.BookID);
					user.addWishlist(book.BookID);
				}

				let missing = storedBooks.filter(entry => newWishlist.indexOf(entry) < 0);

				for (let book of missing) {
					user.removeWishlist(book);
				}


		    return 1;
		  });


			res.send(req.body)
		} catch (error) {
				console.log(error);
				res.status(500).send(error)
		}
})

//Login a registered user
router.post('/users/login', async(req, res) => {
	const user = UserController.login(req.body)
														 .then(user => {
																res.status(200).send(user)
															})
														 .catch(error => {
															 console.log(error);
																res.status(500).send({error: error.message})
															});
})

// Log user out of the application in current device
router.post('/users/me/logout', auth, async (req, res) => {

    try {
			const token = await Token.findOne({ where: {
																										token: req.token,
																										UserId: req.user._id
																								 }
																			});
		  token.destroy();
			console.log(token);
      res.status(200).send();
    } catch (error) {
      res.status(500).send(error);
    }
});













/******* BOOKS *******/

//list all available tags
router.get("/tags", async (req, res) => {
	const tags = await Tag.findAll()
                          .then(tags => {

															//console.log(tags);
															var data = JSON.stringify(tags);
															data = JSON.parse(data);

															var tagList = [];
							                for (var i in data)
																	tagList.push(data[i].tag);

                              res.json(tag_list);
                          })
});


//Add a new book
router.post("/books/add", async (req, res) => {

	console.log('addBook', req.body);

	//Add new book
	/*const bookData = {  code: req.body.code,
											title: req.body.title,
											subtitle: req.body.subtitle,
											description: req.body.description,
											press: req.body.press,
											year: req.body.year,
											collection: req.body.collection,
											volume: req.body.volume,
											edition: req.body.edition,
											pages: req.body.pages,
											ex: req.body.ex,
											format: req.body.format,
											status: req.body.status,
											condition: req.body.condition,
											isbn: req.body.isbn,
											coverURL: req.body.coverURL,
											isAvailable: true,
											Authors: [{ name: 'Denis'}]
										};*/

	const book = await BookController.create(req.body);
	const bookID = book._id;


	/*

	//Add tags or retrieve IDs
	const tagPromises = req.body.tags.map(async tag => {
							return TagController.create({
		  							tag: tag,
							})
	});
	//Add book_tag relationship
	Promise.all(tagPromises)
	       .then(storedTags => {
					 storedTags.map(tag => {
							TagController.addBook(tag[0]._id, bookID)
					 })
				 });


 	//Add author or retrieve IDs
 	const authorPromises = req.body.author.map(async author => {
 							return AuthorController.create({
 		  							name: author,
 							})
 	});
 	//Add book_author relationship
 	Promise.all(authorPromises)
 	       .then(storedAuthor => {
 					 storedAuthor.map(author => {
 							AuthorController.addBook(author[0]._id, bookID)
 					 })
 				 });

  //Add organiser or retrieve IDs
 	const organiserPromises = req.body.organiser.map(async organiser => {
 							return OrganiserController.create({
 		  							name: organiser,
 							})
 	});
 	//Add book_organiser relationship
 	Promise.all(organiserPromises)
 	       .then(storedOrganiser => {
 					 storedOrganiser.map(organiser => {
 							OrganiserController.addBook(organiser[0]._id, bookID)
 					 })
 				 });

  //Add translator or retrieve IDs
	const translatorPromises = req.body.translator.map(async translator => {
							return TranslatorController.create({
		  							name: translator,
							})
	});
	//Add book_translator relationship
	Promise.all(translatorPromises)
	       .then(storedTranslator => {
					 storedTranslator.map(translator => {
							TranslatorController.addBook(translator[0]._id, bookID)
					 })
				 });

	 //Add local or retrieve IDs
 	const localPromises = req.body.local.map(async local => {
				return LocalController.create({
							name: local,
				})
 	});
 	//Add book_local relationship
 	Promise.all(localPromises)
 	       .then(storedLocal => {
 					 storedLocal.map(local => {
 							LocalController.addBook(local[0]._id, bookID)
 					 })
 				 });
*/
	res.status(200).send(book)
});


//List all books
router.get("/books", async (req, res) => {

	let query = { attributes: ['_id'], /*remover*/limit: 30 };
	const tagsArray = JSON.parse(req.query.tag)

	if (tagsArray.length > 0) {

		const tagPromises = tagsArray.map(async tag => {
								return TagController.findByTag({
			  							tag: tag,
								})
		});

		//Add book_tag relationship
		var tagIDList = await Promise.all(tagPromises)
		       .then(tags => {
						 	var tagList = [];
							for (let tag of tags) {
								tagList.push(tag[0]._id);
							}

							return tagList
						 })
					 .catch((err) => {
 				      console.log(">> Error while creating Tag: ", err);
 				    });


		query = {
						attributes: ['_id', [Sequelize.fn('COUNT', 'Book._id'), 'tagCount']],
						group: ["Book._id"],
						having: {'tagCount': {[Sequelize.Op.gte]: tagsArray.length}},
						include: [{
								model: Tag,
					      attributes: [],
								where: { _id: { [Sequelize.Op.or]: tagIDList } },
							  through: {
							    attributes: []
							  }
							}]
				};
	}

	const search = req.query.search ? req.query.search : "";
	const bookIDs = await Book.findAll(query)
														.then((books) => {
																	var bookIDs = [];
																	for (let i in books) {
																		bookIDs.push(books[i]._id)
																	}
													      return bookIDs;
													    });

	const bookList = await Book.findAll({
					where: {
						[Sequelize.Op.and]: [
							{ _id: { [Sequelize.Op.or]: bookIDs } },
						 	{
								[Sequelize.Op.or]: [
		 							{ title: { [Sequelize.Op.like]: '%' + search + '%' } },
		 					 		{ subtitle: { [Sequelize.Op.like]: '%' + search + '%' } },
									Sequelize.literal("`Authors`.`name` LIKE '%" + search + "%'"),
		 						]
						 }
						]
					},
					//limit: +req.query.booksPerPage,
					//offset: req.query.page * req.query.booksPerPage,
					include: [
						{
							model: Author,
							attributes: ['name'],
							through: {
								attributes: []
							}
						},
						{
							model: Tag,
							attributes: ['tag'],
							through: {
								attributes: []
							}
						},
						{
							model: Comment,
							attributes: ['_id', 'comment', "userName", "userID", "createdAt"],
							limit: 10
						}
					]
			})
			.then((books) => {
				console.log('find2');
				var bookList = [];
				for (let book of books) {
					bookList.push(formatBook(book))
				}
				return bookList;
	});

	var object = { "books": bookList,
			    			 "total": { "count": await Book.count({})
							 }
	}

	res.status(200).send(object);
});


//Borrow a single book
router.get("/book/available", async (req, res) => {
	console.log('available', req.query);
	let book = await Book.findOne({
															where: { _id: req.query.bookID }
													});

	res.status(200).send(book.isAvailable);
});


//Borrow a single book
router.get("/book/borrow", async (req, res) => {

	let book = await Book.findOne({
															where: { _id: req.query.bookID }
													});
	let user = await User.findOne({
															where: { _id: req.query.userID }
													});
	try {
		const result = await sequelize.transaction(async (t) => {

			await user.removeQueue(book);
			borrowedBook = await user.addLending(book);
			book = await book.update({ isAvailable: false });

			borrowedBook = await user.getLending({
																	where: { _id: req.query.bookID }
															});

			return borrowedBook[0];
		});


		sendBorrowMail(book, user);



		res.status(200).send(result);
	} catch (error) {
			console.log(error);
			res.status(500).send(error)
	}
});

//Return a single book
router.get("/book/return", async (req, res) => {
	console.log('return', req.query);
	let book = await Book.findOne({
															where: { _id: req.query.bookID }
													});
	let user = await User.findOne({
															where: { _id: req.query.userID }
													});
	try {
		const result = await sequelize.transaction(async (t) => {

			returnedBook = await user.removeLending(book);
			book = await book.update({ isAvailable: true });

			return book;
		});

		res.status(200).send(result);
	} catch (error) {
			console.log(error);
			res.status(500).send(error)
	}
});


//Enter book waiting list
router.get("/book/wait", async (req, res) => {
	console.log('wait', req.query);
	let book = await Book.findOne({
															where: { _id: req.query.bookID }
													});
	let user = await User.findOne({
															where: { _id: req.query.userID }
													});

	console.log('user', user);
	console.log('book', book);

	let wait = await user.addQueue(book);

	res.status(200).send(book);

});

//Leave book waiting list
router.get("/book/unwait", async (req, res) => {
	console.log('unwait', req.query);
	let book = await Book.findOne({
															where: { _id: req.query.bookID }
													});
	let user = await User.findOne({
															where: { _id: req.query.userID }
													});

	let wait = await user.removeQueue(book);

	res.status(200).send(book);

});

//Fetch a single book
router.get("/book/:id", async (req, res) => {
	console.log('fetch book');
	try {
		const book = await Book.findOne({
				where: { _id: req.params.id },
				include: [
					{
						model: Tag,
						attributes: ['tag'],
						through: {
							attributes: []
						}
					},
					{
						model: Author,
						attributes: ['name'],
						through: {
							attributes: []
						}
					},
					{
						model: Organiser,
						attributes: ['name'],
						through: {
							attributes: []
						}
					},
					{
						model: Translator,
						attributes: ['name'],
						through: {
							attributes: []
						}
					},
					{
						model: Local,
						attributes: ['name'],
						through: {
							attributes: []
						}
					},
					{
						model: Comment,
						attributes: ['_id', 'comment', "userName", "userID", "createdAt"],
						limit: 10
					}
				],

		})
    if (!book)
        throw 'null book';
		res.status(200).send(book);
	} catch (error) {
			console.log(error);
		res.status(404).send({ error: "Book doesn't exist!" })
	}
});




/************ ADMIN ************/
router.get("/admin/set", async (req, res) => {
	let user = await User.findOne({
															where: { _id: req.query.userID }
													});
	user.update({ administrator: req.query.isAdmin });

	res.status(200);

});

router.get("/admin/lendings", async (req, res) => {

	try {
		const lendings = await Book.findAll({
			include: [
				{
					model: User,
					as: 'borrowing',
					required: true,
					through: {
						attributes: ['createdAt']
					}
				},
				{
					model: User,
					as: 'waiting',
					required: false,
					through: {
						attributes: ['createdAt']
					}
				}
			],
			order: [
					[{ model: User, as: 'waiting' }, 'createdAt', 'DESC']
				]
		});

    if (!lendings)
        throw 'null book';

		console.log('lendings!!!!!');
		res.status(200).send(lendings);
	} catch (error) {
			console.log(error);
		res.status(404).send({ error: "Lending doesn't exist!" })
	}
});

//Return a single book
router.get("/admin/return", async (req, res) => {

	let book = await Book.findOne({
															where: { _id: req.query.bookID }
													});

	let user = await User.findOne({
                                include: [
                                  {
                                    model: Book,
                                    required: true,
                                    as: 'lending',
																		where: { _id: req.query.bookID }
                                  }
                                ]
  });

	try {
		const result = await sequelize.transaction(async (t) => {

			returnedBook = await user.removeLending(book);
			book = await book.update({ isAvailable: true });

			return book;
		});

		res.status(200).send(result);
	} catch (error) {
			console.log(error);
			res.status(500).send(error)
	}
});


//Return a single book
router.get("/admin/users", async (req, res) => {


	console.log('users', req.query.letter);

	let users;
	if (req.query.letter) {
		console.log('with');
		query = { where: { name: { [Sequelize.Op.like]: req.query.letter + '%' } } }
		users = await User.findAll(query);
	} else {
		console.log('without');
		users = await User.findAll();
	}


	res.status(200).send(users);
});


const StreamArray = require('stream-json/streamers/StreamArray');

router.post("/populate", async (req, res) => {
	console.log("populate");

	new Promise((resolve, reject) => {
	    fs.createReadStream('../resources/livros.json')
	      .pipe(StreamArray.withParser())
	      .on("data", row => {

					const bookData = { code: row.value.Code,
															title: row.value.Title,
															subtitle: row.value.Subtitle,
															description: row.value.Description,
															year: row.value.Year,
															collection: row.value.Collection,
															volume: row.value.Volume,
															press: row.value.Press,
															local: row.value.Local,
															edition: row.value.Edition,
															pages: row.value.Pages,
															ex: row.value.Ex,
															isbn: row.value.ISBN,
															format: row.value.Format,
															status: row.value.Status,
															condition: row.value.Condition,
															isAvailable: row.value.isAvailable,
															coverURL: row.value.CoverURL,
															createdAt: new Date()
														};

					const book = BookController.create(bookData)

					.then(book => {

						const bookID = book._id;

						//Add tags or retrieve IDs
						const tagPromises = row.value.Tags.map(async tag => {
												return TagController.create({
							  							tag: tag,
												})
						});
						//Add book_tag relationship
					 Promise.all(tagPromises)
						       .then(storedTags => {
										 storedTags.map(tag => {
												TagController.addBook(tag[0]._id, bookID)
										 })
									 });

					 	//Add author or retrieve IDs
					 	const authorPromises = row.value.Author.map(async author => {
					 							return AuthorController.create({
					 		  							name: author,
					 							})
					 	});
					 	//Add book_author relationship
					  Promise.all(authorPromises)
					 	       .then(storedAuthor => {
					 					 storedAuthor.map(author => {
					 							AuthorController.addBook(author[0]._id, bookID)
					 					 })
					 				 });

						//Add organiser or retrieve IDs
	 				 	const organiserPromises = row.value.Organiser.map(async organiser => {
	 				 							return OrganiserController.create({
	 				 		  							name: organiser,
	 				 							})
	 				 	});
	 				 	//Add book_organiser relationship
	 				  Promise.all(organiserPromises)
	 				 	       .then(storedOrganiser => {
	 				 					 storedOrganiser.map(organiser => {
	 				 							OrganiserController.addBook(organiser[0]._id, bookID)
	 				 					 })
	 				 				 });

						//Add tags or retrieve IDs
	 				 	const translatorPromises = row.value.Translator.map(async translator => {
	 				 							return TranslatorController.create({
	 				 		  							name: translator,
	 				 							})
	 				 	});
	 				 	//Add book_author relationship
	 				  Promise.all(translatorPromises)
	 				 	       .then(storedTranslator => {
	 				 					 storedTranslator.map(translator => {
	 				 							TranslatorController.addBook(translator[0]._id, bookID)
	 				 					 })
	 				 				 });

						 //Add tags or retrieve IDs
						 const localPromises = row.value.Local.map(async local => {
												 return LocalController.create({
															 name: local,
												 })
						 });
						 //Add book_author relationship
						 Promise.all(localPromises)
										.then(storedLocal => {
											storedLocal.map(local => {
												 LocalController.addBook(local[0]._id, bookID)
											})
										});

					});


	      })
	      .on("error", err => {
	        reject(err);
	      })
	      .on("end", () => {
	        console.log("CSV file successfully processed");
	        resolve();
	      });
	  });



	res.status(200).send("oi")
})







//log all other routes
router.post("**", async (req, res) => {
	console.log("**");
	res.status(404).send("Invalid route")
})

module.exports = router
