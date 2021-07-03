const { Book, Local, Tag } = require('../sequelize')

exports.create = (local) => {
  return Local.findOrCreate({
								where: { name: local.name },
								defaults: { name: local.name }
							})
    .then(local => {
      console.log(">> Created Local: " + JSON.stringify(local, null, 2));
      return local;
    })
    .catch(err => {
      console.log(">> Error while creating Local: ", err);
    });
};

exports.findByName = (local) => {
  return Local.findAll({
								where: { name: local.name }
							})
    .then(local => {
      console.log(">> Local Found: " + JSON.stringify(local, null, 2));
      return local;
    })
    .catch(err => {
      console.log(">> Error while creating Local: ", err);
    });
};

exports.findAll = () => {
  return Local.findAll({
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
    .then(locals => {
      return locals;
    })
    .catch(err => {
      console.log(">> Error while retrieving Locals: ", err);
    });
};

exports.findById = (id) => {
  return Local.findByPk(id, {
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
    .then(local => {
      return local;
    })
    .catch(err => {
      console.log(">> Error while finding Local: ", err);
    });
};

exports.addBook = (localId, bookId) => {
  return Local.findByPk(localId)
    .then(local => {
      if (!local) {
        console.log("Local not found!");
        return null;
      }
      return Book.findByPk(bookId).then((book) => {
        if (!book) {
          console.log("book not found!");
          return null;
        }

        local.addBook(book);
        return local;
      });
    })
    .catch((err) => {
      console.log(">> Error while adding Book to Local: ", err);
    });
};
