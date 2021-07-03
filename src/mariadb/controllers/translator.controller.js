const { Book, Translator, Tag } = require('../sequelize')

exports.create = (translator) => {
  return Translator.findOrCreate({
								where: { name: translator.name },
								defaults: { name: translator.name }
							})
    .then(translator => {
      console.log(">> Created Translator: " + JSON.stringify(translator, null, 2));
      return translator;
    })
    .catch(err => {
      console.log(">> Error while creating Translator: ", err);
    });
};

exports.findByName = (translator) => {
  return Translator.findAll({
								where: { name: translator.name }
							})
    .then(translator => {
      console.log(">> Translator Found: " + JSON.stringify(translator, null, 2));
      return translator;
    })
    .catch(err => {
      console.log(">> Error while creating Translator: ", err);
    });
};

exports.findAll = () => {
  return Translator.findAll({
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
    .then(translators => {
      return translators;
    })
    .catch(err => {
      console.log(">> Error while retrieving Translators: ", err);
    });
};

exports.findById = (id) => {
  return Translator.findByPk(id, {
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
    .then(translator => {
      return translator;
    })
    .catch(err => {
      console.log(">> Error while finding Translator: ", err);
    });
};

exports.addBook = (translatorId, bookId) => {
  return Translator.findByPk(translatorId)
    .then(translator => {
      if (!translator) {
        console.log("Translator not found!");
        return null;
      }
      return Book.findByPk(bookId).then((book) => {
        if (!book) {
          console.log("book not found!");
          return null;
        }

        translator.addBook(book);
        return translator;
      });
    })
    .catch((err) => {
      console.log(">> Error while adding Book to Translator: ", err);
    });
};
