const { Book, Author, Tag } = require('../sequelize')

exports.create = (author) => {
  return Author.findOrCreate({
								where: { name: author.name },
								defaults: { name: author.name }
							})
    .then(author => {
      console.log(">> Created Author: " + JSON.stringify(author, null, 2));
      return author;
    })
    .catch(err => {
      console.log(">> Error while creating Author: ", err);
    });
};

exports.findByName = (author) => {
  return Author.findAll({
								where: { name: author.name }
							})
    .then(author => {
      console.log(">> Author Found: " + JSON.stringify(author, null, 2));
      return author;
    })
    .catch(err => {
      console.log(">> Error while creating Author: ", err);
    });
};

exports.findAll = () => {
  return Author.findAll({
    include: [
      {
        model: Book,
        as: "books",
        attributes: ["_id", "title"],
        through: {
          attributes: [],
        }
      },
    ],
  })
    .then(authors => {
      return authors;
    })
    .catch(err => {
      console.log(">> Error while retrieving Authors: ", err);
    });
};

exports.findById = (id) => {
  return Author.findByPk(id, {
    include: [
      {
        model: Book,
        as: "books",
        attributes: ["id", "title"],
        through: {
          attributes: [],
        }
      },
    ],
  })
    .then(author => {
      return author;
    })
    .catch(err => {
      console.log(">> Error while finding Author: ", err);
    });
};

exports.addBook = (authorId, bookId) => {
  return Author.findByPk(authorId)
    .then(author => {
      if (!author) {
        console.log("Author not found!");
        return null;
      }
      return Book.findByPk(bookId).then((book) => {
        if (!book) {
          console.log("book not found!");
          return null;
        }

        author.addBook(book);
        return author;
      });
    })
    .catch((err) => {
      console.log(">> Error while adding Book to Author: ", err);
    });
};
