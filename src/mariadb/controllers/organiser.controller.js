const { Book, Organiser, Tag } = require('../sequelize')

exports.create = (organiser) => {
  return Organiser.findOrCreate({
								where: { name: organiser.name },
								defaults: { name: organiser.name }
							})
    .then(organiser => {
      console.log(">> Created Organiser: " + JSON.stringify(organiser, null, 2));
      return organiser;
    })
    .catch(err => {
      console.log(">> Error while creating Organiser: ", err);
    });
};

exports.findByName = (organiser) => {
  return Organiser.findAll({
								where: { name: organiser.name }
							})
    .then(organiser => {
      console.log(">> Organiser Found: " + JSON.stringify(organiser, null, 2));
      return organiser;
    })
    .catch(err => {
      console.log(">> Error while creating Organiser: ", err);
    });
};

exports.findAll = () => {
  return Organiser.findAll({
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
    .then(organisers => {
      return organisers;
    })
    .catch(err => {
      console.log(">> Error while retrieving Organisers: ", err);
    });
};

exports.findById = (id) => {
  return Organiser.findByPk(id, {
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
    .then(organiser => {
      return organiser;
    })
    .catch(err => {
      console.log(">> Error while finding Organiser: ", err);
    });
};

exports.addBook = (organiserId, bookId) => {
  return Organiser.findByPk(organiserId)
    .then(organiser => {
      if (!organiser) {
        console.log("Organiser not found!");
        return null;
      }
      return Book.findByPk(bookId).then((book) => {
        if (!book) {
          console.log("book not found!");
          return null;
        }

        organiser.addBook(book);
        return organiser;
      });
    })
    .catch((err) => {
      console.log(">> Error while adding Book to Organiser: ", err);
    });
};
