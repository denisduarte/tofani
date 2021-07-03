const express = require("express");
const Sequelize = require("sequelize");

const router = express.Router();
const auth = require("./middleware/auth");

const path = require('path');
const fs = require('fs');
const request = require('request');
const { sendMail } = require("../../mailer")

const { Book, Author, Organiser, Translator,
				Local, Tag, Comment, User, Token, sequelize,
				Lend, Wait, Wishlist, Section } = require('./sequelize')

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

function reserveBookToNextInQueue(BookId) {
	Wait.findOne({
							where: { BookId: BookId },
							order: [ ['createdAt', 'ASC'] ]
						})
			.then(next => {
				let expiryDate = new Date();
				expiryDate.setDate(expiryDate.getDate() + Number(process.env.RESERVATION_EXPIRY_DAYS));

				const day = expiryDate.getDate();
				const month = expiryDate.getMonth() + 1;
				const year = expiryDate.getFullYear();

				const expiryDateSrt = year + '-' + month + '-' + day;

				if (next) {
					next.update({ expiryDate: expiryDate })
					User.findByPk(next.UserId)
							.then(user => {
								Book.findByPk(next.UserId)
										.then(book => {
												sendMail('returnQueue', book.title, book.subtitle,
																				user.name, user.email,
																				expiryDateSrt);
										});
							});

				}
			})
}

router.get('/gallery/list', (req, res) => {

	const directory = '../src/assets/gallery';
	fs.readdir(directory, (err, files) => {
	  const images = files.filter(el => /\.jpg/.test(el))
	  res.status(200).send(images)
	});

   console.log('gallery')
});


/******* USER CREATION AND LOGIN *******/

// Create a new user
router.post('/users/add', async (req, res) => {
	const user = await UserController
																	.create(req.body)
																	.catch(error => {
																		console.log(error);
																		 res.status(500).send({error: error.message})
																	 });
	res.status(200).send(user)
});

router.post('/users/update', async(req, res) => {

		let userid = req.body._id;
    try {

			const result = await sequelize.transaction(async (t) => {


				const user = await User.findOne({
																					where: { _id: userid },
																				  include: {
																						model: Book,
																						as: "wishlist",
																						attributes: [['_id', 'BookId']],
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
					storedBooks.push(book.toJSON().BookId);
				}

				for (let book of req.body.wishlist) {
					newWishlist.push(book.BookId);
					user.addWishlist(book.BookId);
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

//return comment from a single user
router.post('/users/comments', async(req, res) => {
	console.log('comments', req.body.userID);

	User.findByPk(req.body.userID)
			.then(user => {
				return user.getComments({
							attributes: ['_id', 'comment', 'createdAt'],
							include: [
								{
									model: User,
									attributes: ['_id', 'name'],
								},
								{
									model: Book,
									attributes: ['_id', 'title', 'cover'],
								}
							],
							order: [ ['createdAt', 'DESC'] ]
						})
							 	 .then(comments => {
									 res.status(200).send(comments);
								 })
			})
})


//list all available sections
router.get("/sections", async (req, res) => {

	const sections = await Section.findAll({
																		attributes: ['_id', 'name', 'position'],
																		order: ['position']
																	})
															  .then(sections => {

																	//console.log(tags);
																	var data = JSON.stringify(sections);
																	data = JSON.parse(data);

		                              res.json(data);
		                          })
});


//list all available sections
router.post("/sections/reorder", async (req, res) => {

	sections = req.body.sections;

	for (let i=0; i<sections.length; i++) {

		console.log(sections[i]);

		const section = await Section.findOne({where: { name: sections[i] } });

		await section.update({ position: i+1 });
	}

	res.status(200).send();
});

//list all available sections
router.post("/sections/delete", async (req, res) => {

	console.log('delete');
	console.log(req.body.position);

	Section.destroy({ where: { position: req.body.position } })
				 .then(() => {
					 Section.increment(
											 { position: -1 },
											 { where: { position: { [Sequelize.Op.gt]: req.body.position }} }
										 )
								 .then(() => { res.status(200).send(); })
				 })
});

//list all available sections
router.post("/sections/add_update", async (req, res) => {

	console.log(req.body);

	const section = await Section.findOne({where: { position: req.body.position } });

	console.log(section);
	if (section) {
		section.update(req.body)
					 .then(() => {  res.status(200).send(); })
	} else {
		Section.create(req.body)
					 .then(() => {  res.status(200).send(); })
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
																	tagList.push(data[i].name);

                              res.json(tag_list);
                          })
});

//Add a new book
router.post("/books/add", async (req, res) => {
	if (req.body._id) {
		//update book
		BookController.findById(req.body._id)
				.then(book => {
							 BookController.update(book, req.body)
					 									 .then(book => {
															 		res.status(200).send(book);
															});
				});
	} else {
		//insert book
		BookController.create(req.body, req.body.Authors,
																req.body.Organisers,
																req.body.Translators,
																req.body.Locals,
																req.body.Tags)
									.then(book => {
										res.status(200).send(book);
									});
	}
});


//List all books
router.get("/books", async (req, res) => {

	let where;
	let searchIDs;
	let tagIDs;

	//Has search parameter
	const search = req.query.search ? req.query.search : null;
	if (search) {
				searchIDs = await sequelize.query(
					'SELECT `Book`.`_id` ' +
					'FROM `Books` AS `Book` ' +
					' LEFT OUTER JOIN ( `book_authors` AS `Authors->book_author` ' +
					'    INNER JOIN `Authors` AS `Authors` ' +
					'    ON `Authors`.`_id` = `Authors->book_author`.`AuthorId`) ' +
					' ON `Book`.`_id` = `Authors->book_author`.`BookId` ' +
					' LEFT OUTER JOIN ( `book_organisers` AS `Organisers->book_organiser` ' +
					'    INNER JOIN `Organisers` AS `Organisers` ' +
					'    ON `Organisers`.`_id` = `Organisers->book_organiser`.`OrganiserId`) ' +
					' ON `Book`.`_id` = `Organisers->book_organiser`.`BookId` ' +
					'WHERE (`Book`.`title` LIKE \'%' + search + '%\' OR ' +
					'       `Book`.`subtitle` LIKE \'%' + search + '%\' OR ' +
					'       `Authors`.`name` LIKE \'%' + search + '%\' OR ' +
					'       `Organisers`.`name` LIKE \'%' + search + '%\');'
				).then(bookIDs => {
						return bookIDs[0].map(id => id._id);
				});
	}

	//Has filter tags
	const tagsArray = JSON.parse(req.query.tag)

	if (tagsArray.length > 0) {
		const tagPromises = tagsArray.map(async tag => {
								return TagController.findByTag({
			  							name: tag,
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

		tagIDs = await Book.findAll({
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
							}]})
							.then((books) => {
										var bookIDs = [];
										for (let i in books) {
											bookIDs.push(books[i]._id)
										}
						      return bookIDs;
						    });
	}

	where = {
		[Sequelize.Op.and]: [
			searchIDs ? { _id: { [Sequelize.Op.in]: searchIDs } } : null,
			tagIDs ? { _id: { [Sequelize.Op.in]: tagIDs } } : null,
		]
	}

	const bookList = await Book.findAll({
					where: where,
					limit: +req.query.booksPerPage,
					offset: req.query.page * req.query.booksPerPage,
					include: [
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
							model: Tag,
							attributes: ['name'],
							through: {
								attributes: []
							}
						},
						{
							model: User,
							as: 'lending',
							attributes: ['_id'],
							through: {
								attributes: ['createdAt', 'dueDate']
							}
						},
						{
							model: User,
							as: 'queue',
							attributes: ['_id'],
							through: {
								attributes: ['createdAt']
							},

						}
					], 	order: [
								[req.query.sortField, req.query.sortDirection == -1 ? 'DESC' : 'ASC'],
								[{ model: User, as: 'queue' }, Wait, 'createdAt', 'ASC']
							]
			});

	var object = { "books": bookList,
			    			 "total": { "count": await Book.count({})}
							 }

	res.status(200).send(object);
});

//Check if book is available
router.get("/book/available", async (req, res) => {

	Book.findByPk(req.query.bookID,
								{
									include: {
											model: User,
											as: 'lending',
											attributes: ['_id'],
											through: {
												attributes: ['createdAt', 'dueDate']
											}
									}
								}
								)
			.then(book => {
				const isAvailable = book.lending.length ? false : true;
				res.status(200).send(isAvailable);
			})
});

//Borrow a single book
router.get("/book/cover/:bookID", async (req, res) => {

	let book = await Book.findOne({
															where: { _id: req.params.bookID }
													});

		var img = new Buffer.from(book.cover, 'base64');

		res.writeHead(200, {'Content-Type': 'image/jpeg',
		     							  'Content-Length': img.length
		   									});
	  res.end(img);


		//res.contentType('image/jpeg').send(ret)
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

			await user.removeWaiting(book);
			//borrowedBook = await user.addLending(book._id));
			dueDate = new Date();
			dueDate.setDate(dueDate.getDate() + Number(process.env.LENDING_DUE_DAYS));

			Lend.create({
						dueDate: dueDate,
						BookId: req.query.bookID,
						UserId: req.query.userID
					})
					.then(lending => {
							sendMail('borrow', book.title, book.subtitle,
															user.name, user.email,
															lending.dueDate);

							book.getLending({where: { _id: req.query.userID }})
									 .then(borrowedUser => {
										 user.getBorrowing({where: { _id: req.query.bookID }})
										 		 .then(borrowedBook => {
													 res.status(200).send({book: borrowedBook, user: borrowedUser});
												 })
									 })
					});
		});
	} catch (error) {
			console.log(error);
			res.status(500).send(error)
	}
});

//Return a single book
router.get("/book/return", async (req, res) => {

	let book = await Book.findOne({ where: { _id: req.query.bookID } });
	let user = await User.findOne({	where: { _id: req.query.userID } });

	Lend.findOne({ where: {
													BookId: req.query.bookID,
													UserId: req.query.userID,
												 	returned: false
												}
							})
			.then(lending =>  {
				lending.update({ returned: true })
				sendMail('return', book.title, book.subtitle, user.name, user.email, null);
				reserveBookToNextInQueue(req.query.bookID);
		 });

});


//Borrow a single book
router.get("/book/renew", async (req, res) => {

	let book = await Book.findOne({ where: { _id: req.query.bookID } });
	let user = await User.findOne({	where: { _id: req.query.userID } });

	try {
			Lend.findOne({ where: {
															BookId: req.query.bookID,
															UserId: req.query.userID,
														 	returned: false
											 		  }
									})
					.then(lending => {
							dueDate = new Date();
							dueDate.setDate(dueDate.getDate() + Number(process.env.LENDING_DUE_DAYS));

							lending.update({dueDate: dueDate})
										 .then(lending => {
											 sendMail('renew', book.title, book.subtitle,
 																			user.name, user.email,
 																			lending.dueDate);
											 res.status(200).send(lending);
										 })
					});



	} catch (error) {
			console.log(error);
			res.status(500).send(error)
	}
});



//Enter book waiting list
router.get("/book/wish", async (req, res) => {

	let book = await Book.findOne({
															where: { _id: req.query.bookID }
													});
	let user = await User.findOne({
															where: { _id: req.query.userID }
													});
	user.addWishlist(book)
			.then(wishlistEntry => {
					res.status(200).send(wishlistEntry);
			})
});

//Leave book waiting list
router.get("/book/unwish", async (req, res) => {

	let book = await Book.findOne({
															where: { _id: req.query.bookID }
													});
	let user = await User.findOne({
															where: { _id: req.query.userID }
													});

	user.removeWishlist(book)
			.then(wishlistEntry => {
					res.status(200).send(book);
			})
});


//Enter book waiting list
router.get("/book/wait", async (req, res) => {

	let book = await Book.findOne({
															where: { _id: req.query.bookID }
													});
	let user = await User.findOne({
															where: { _id: req.query.userID }
													});

	let wait = await user.addWaiting(book);


	waitingUser = await book.getQueue({
															where: { _id: req.query.userID }
													});
	waitingBook = await user.getWaiting({
															where: { _id: req.query.bookID }
													});


	res.status(200).send({book: waitingBook, user: waitingUser});

});

//Leave book waiting list
router.get("/book/unwait", async (req, res) => {

	let book = await Book.findOne({
															where: { _id: req.query.bookID }
													});
	let user = await User.findOne({
															where: { _id: req.query.userID }
													});

	let wait = await user.removeWaiting(book);

	res.status(200).send(book);

});

//Fetch a single book
router.get("/book/:id", async (req, res) => {

	try {
		const book = await Book.findOne({
				where: { _id: req.params.id },
				include: [
					{
						model: Tag,
						attributes: ['name'],
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
						attributes: ['_id', 'comment', "createdAt"],
						include: [
								{
									model: User,
									attributes: ['_id', 'name'],
								}
						],
						limit: 10,
						order: [ ['createdAt', 'DESC'] ]
					},
					{
						model: User,
						as: 'lending',
						attributes: ['_id'],
						through: {
							attributes: ['createdAt', 'dueDate']
						}
					},
					{
						model: User,
						as: 'queue',
						attributes: ['_id'],
						through: {
							attributes: ['createdAt']
						}
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


//Fetch a single book
router.post("/book/comment/add", async (req, res) => {

	Comment.create(req.body)
				 .then(comment => {
					 Comment.findByPk(comment._id, {
				 				attributes: ['_id', 'comment', 'createdAt'],
				 				include: [
				 					{
				 						model: User,
				 						attributes: ['_id', 'name'],
				 					},
				 					{
				 						model: Book,
				 						attributes: ['_id', 'title', 'cover'],
				 					}
				 				]})
								.then(comment => {
									res.status(200).send(comment);
								})
				 });

});

//Fetch a single book
router.delete("/book/comment/remove/:id", async (req, res) => {
	console.log('comment remove', req.params.id);

	Comment.destroy({ where: { _id: req.params.id } })
				 .then(() => {
					 res.status(200).send(req.params.id);
				 })


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
					model: User,
					as: 'lending',
					required: true,
					through: {
						where: { returned: false },
						attributes: ['createdAt']
					}
				},
				{
					model: User,
					as: 'queue',
					required: false,
					through: {
						attributes: ['createdAt']
					}
				}
			],
			order: [
					[{ model: User, as: 'lending' }, Lend, 'createdAt', 'ASC']
				]
		});

    if (!lendings)
        throw 'null book';

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
                                    as: 'borrowing',
																		where: { _id: req.query.bookID }
                                  }
                                ]
  });

	try {
		const result = await sequelize.transaction(async (t) => {

				Lend.findOne({ where: {
																BookId: book._id,
																UserId: user._id,
															 	returned: false
															}
										})
						.then(lending =>  {
							lending.update({ returned: true })
							reserveBookToNextInQueue(req.query.bookID);
					 });

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


router.post("/notify/due", async (req, res) => {
	const tomorrowStart = new Date();
	tomorrowStart.setDate(tomorrowStart.getDate() + 1);
	tomorrowStart.setHours(0,0,0,0);

	const tomorrowEnd = new Date();
	tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
	tomorrowEnd.setHours(23,59,59,999);

	Lend.findAll({where: {
									dueDate: { [Sequelize.Op.between]: [tomorrowStart, tomorrowEnd] }
								}
							})
			.then(lendings => {
					for (lending of lendings) {
						Book.findByPk(lending.BookId)
								.then(book => {
									User.findByPk(lending.UserId)
											.then(user => {
												sendMail('due', book.title, book.subtitle,
																				user.name, user.email,
																				lending.dueDate);
											})
								});

					}

				res.status(200).send(lendings);
			})
});

router.post("/expire/reservation", async (req, res) => {

	const today = new Date();
	Wait.findAll({where: {
									expiryDate: { [Sequelize.Op.lt]: today }
								}
							})
			.then(expired => {
					for (reservation of expired) {
							reservation.destroy();
							reserveBookToNextInQueue(reservation.BookId);
					}

					res.status(200).send(expired);
			})
});



const StreamArray = require('stream-json/streamers/StreamArray');

router.post("/populate", async (req, res) => {

	new Promise((resolve, reject) => {
	    /*fs.createReadStream(process.env.POPULATE_BOOKS)
	      .pipe(StreamArray.withParser())
	      .on("data", row => { BookController.create(row.value,
																									 row.value.Authors,
																									 row.value.Organisers,
																									 row.value.Translators,
																									 row.value.Locals,
																									 row.value.Tags)
														})
	      .on("error", err => { reject(err) })
	      .on("end", () => { resolve() });
				*/


				request(process.env.POPULATE_BOOKS, function (error, response, body) {

					  if (!error && response.statusCode == 200) {
					     var json = JSON.parse(body);

							 for (var row in json){
								 var book = json[row];
								 BookController.create(book,
																			 book.Authors,
																			 book.Organisers,
																			 book.Translators,
																			 book.Locals,
																			 book.Tags)
							 }
					  }
				});





	  });

	res.status(200).send("Database populated")
});







//log all other routes
router.post("**", async (req, res) => {
	console.log("**");
	res.status(404).send("Invalid route")
})

module.exports = router
