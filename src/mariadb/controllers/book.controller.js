const { Book, Author, Tag, Organiser, Translator, Local } = require('../sequelize')


exports.create = (book, authors, organisers, translators, locals, tags) => {
  return Book.create(book)
             .then((book) => {

               try {
                 //Add authors
                 const authorPromises = authors.map(async author => {
                 				return Author.findOrCreate({where: author});
                 });
                 Promise.all(authorPromises)
                    .then(authors =>  {
                      const authorIDs = authors.map(author => author[0]._id);
                      book.setAuthors(authorIDs);
                    })
                    .catch((err) => {
                      console.log(">>>>>>> Error while creating author: ", err);
                    });

                 //Add organisers
                 const organiserPromises = organisers.map(async organiser => {
                 					return Organiser.findOrCreate({where: organiser});
                 });
                 Promise.all(organiserPromises)
                     .then(organisers =>  {
                       const organiserIDs = organisers.map(organiser => organiser[0]._id);
                       book.setOrganisers(organiserIDs);
                     })
                     .catch((err) => {
                       console.log(">>>>>>> Error while creating organiser: ", err);
                     });

                 //Add translators
                 const translatorPromises = translators.map(async translator => {
                 					return Translator.findOrCreate({where: translator});
                 });
                 Promise.all(translatorPromises)
                      .then(translators =>  {
                        const translatorIDs = translators.map(translator => translator[0]._id);
                        book.setTranslators(translatorIDs);
                      })
                      .catch((err) => {
                        console.log(">>>>>>> Error while creating translator: ", err);
                      });

                 //Add locals
                  const localPromises = locals.map(async local => {
                 						return Local.findOrCreate({where: local});
                 });
                 Promise.all(localPromises)
                       .then(locals =>  {
                         const localIDs = locals.map(local => local[0]._id);
                         book.setLocals(localIDs);
                       })
                       .catch((err) => {
                         console.log(">>>>>>> Error while creating local: ", err);
                       });

                 //Add tags
                 const tagPromises = tags.map(async tag => {
                 						return Tag.findOrCreate({where: tag});
                 });
                 Promise.all(tagPromises)
                        .then(tags =>  {
                          const tagIDs = tags.map(tag => tag[0]._id);
                          book.setTags(tagIDs);
                        })
                        .catch((err) => {
                          console.log(">>>>>>> Error while creating tag: ", err);
                        });

                return book;
              } catch(error) {
                console.log('erroo!!!!!!!!!!!!!!!!!!!!!!!', error);
              }
              })
             .catch((err) => {
               console.log(">> Error while creating Book: ", err);
             });
};

exports.update = (book, body) => {

  const authors = body.Authors;
  const organisers = body.Organisers;
  const translators = body.Translators;
  const locals = body.Locals;
  const tags = body.Tags;

  return book.update(body)
             .then((book) => {
               console.log("updated!!!!!\n", book);
                //Add authors
                const authorPromises = authors.map(async author => {
                				return Author.findOrCreate({where: author});
                });
                Promise.all(authorPromises)
                   .then(authors =>  {
                     const authorIDs = authors.map(author => author[0]._id);
                     book.setAuthors(authorIDs);
                });

                //Add organisers
                const organiserPromises = organisers.map(async organiser => {
                					return Organiser.findOrCreate({where: organiser});
                });
                Promise.all(organiserPromises)
                    .then(organisers =>  {
                      const organiserIDs = organisers.map(organiser => organiser[0]._id);
                      book.setOrganisers(organiserIDs);
                });

                //Add translators
                const translatorPromises = translators.map(async translator => {
                					return Translator.findOrCreate({where: translator});
                });
                Promise.all(translatorPromises)
                     .then(translators =>  {
                       const translatorIDs = translators.map(translator => translator[0]._id);
                       book.setTranslators(translatorIDs);
                });

                //Add locals
                 const localPromises = locals.map(async local => {
                						return Local.findOrCreate({where: local});
                });
                Promise.all(localPromises)
                      .then(locals =>  {
                        const localIDs = locals.map(local => local[0]._id);
                        book.setLocals(localIDs);
                });

                //Add tags
                const tagPromises = tags.map(async tag => {
                						return Tag.findOrCreate({where: tag});
                });
                Promise.all(tagPromises)
                       .then(tags =>  {
                         const tagIDs = tags.map(tag => tag[0]._id);
                         book.setTags(tagIDs);
                 });

                return book;
             })
             .catch((err) => {
               console.log(">> Error while creating Book: ", err);
             });
};

exports.findAll = () => {
  return Book.findAll({
    include: [
      {
        model: Tag,
        as: "tags",
        attributes: ["_id", "name"],
        through: {
          attributes: [],
        },
        // through: {
        //   attributes: ["tag_id", "book_id"],
        // },
      },
    ],
  })
    .then((books) => {
      return books;
    })
    .catch((err) => {
      console.log(">> Error while retrieving Books: ", err);
    });
};

exports.findById = (id) => {
  return Book.findByPk(id, {
    include: [
      {
        model: Author,
        attributes: ["_id", "name"],
        through: {
          attributes: [],
        },
      },
      {
        model: Organiser,
        attributes: ["_id", "name"],
        through: {
          attributes: [],
        },
      },
      {
        model: Translator,
        attributes: ["_id", "name"],
        through: {
          attributes: [],
        },
      },
      {
        model: Local,
        attributes: ["_id", "name"],
        through: {
          attributes: [],
        },
      },
      {
        model: Tag,
        attributes: ["_id", "name"],
        through: {
          attributes: [],
        },
      },
    ]
  })
    .then((book) => {
      return book;
    })
    .catch((err) => {
      console.log(">> Error while finding Book: ", err);
    });
};
