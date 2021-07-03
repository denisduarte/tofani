const { Book, Author, Tag } = require('../sequelize')

exports.create = (tag) => {
  return Tag.findOrCreate({
								where: { tag: tag.name },
								defaults: { tag: tag.name }
							})
    .then(tag => {
      //console.log(">> Created Tag: " + JSON.stringify(tag, null, 2));
      return tag
    })
    .catch((err) => {
      console.log(">> Error while creating Tag: ", err);
    });
};

exports.findByTag = (tag) => {
  return Tag.findAll({
								where: { name: tag.name }
							})
    .then(tag => {
      console.log(">> Tag Found: " + JSON.stringify(tag, null, 2));
      return tag
    })
    .catch((err) => {
      console.log(">> Error while creating Tag: ", err);
    });
};

exports.findAll = () => {
  return Tag.findAll({
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
    .then((tags) => {
      return tags;
    })
    .catch((err) => {
      console.log(">> Error while retrieving Tags: ", err);
    });
};

exports.findById = (id) => {
  return Tag.findByPk(id, {
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
    .then((tag) => {
      return tag;
    })
    .catch((err) => {
      console.log(">> Error while finding Tag: ", err);
    });
};

exports.addBook = (tagId, bookId) => {
  return Tag.findByPk(tagId)
    .then((tag) => {
      if (!tag) {
        console.log("Tag not found!");
        return null;
      }
      return Book.findByPk(bookId).then((book) => {
        if (!book) {
          console.log("book not found!");
          return null;
        }

        tag.addBook(book);
        return tag;
      });
    })
    .catch((err) => {
      console.log(">> Error while adding Book to Tag: ", err);
    });
};
