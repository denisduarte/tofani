const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

var env = dotenv.config();
dotenvExpand(env);

const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PWD, {
  host: process.env.DB_URL,
  dialect: 'mariadb',
  dialectOptions: {
    timezone: 'Etc/GMT-3',
    connectTimeout: 600000,
    options: {
       requestTimeout: 600000
    },
  },
  pool: {
    max: 100,
    min: 0,
    acquire: 600000,
    idle: 10000
  },
  logging: false
});


//##### USERS
  const UserModel = require('./models/User');
  const TokenModel = require('./models/Token');

  const User = UserModel(sequelize, Sequelize);
  const Token = TokenModel(sequelize, Sequelize);

  User.hasMany(Token);

//##### LIBRARY
  const SectionModel = require('./models/Section');
  const Section = SectionModel(sequelize, Sequelize);


//##### BOOKS
  const BookModel = require('./models/Book');
  const TagModel = require('./models/Tag');

  const AuthorModel = require('./models/Author');
  const TranslatorModel = require('./models/Translator');
  const OrganiserModel = require('./models/Organiser');
  const LocalModel = require('./models/Local');

  const CommentModel = require('./models/Comment');

  const Book = BookModel(sequelize, Sequelize);
  const Tag = TagModel(sequelize, Sequelize);
  const BookTag = sequelize.define('book_tag', {});

  Book.belongsToMany(Tag, { through: BookTag, unique: false })
  Tag.belongsToMany(Book, { through: BookTag, unique: false })

  const Author = AuthorModel(sequelize, Sequelize)
  const BookAuthor = sequelize.define('book_author', {})
  Book.belongsToMany(Author, { through: BookAuthor, unique: false })
  Author.belongsToMany(Book, { through: BookAuthor, unique: false })

  const Organiser = OrganiserModel(sequelize, Sequelize)
  const BookOrganiser = sequelize.define('book_organiser', {})
  Book.belongsToMany(Organiser, { through: BookOrganiser, unique: false })
  Organiser.belongsToMany(Book, { through: BookOrganiser, unique: false })

  const Translator = TranslatorModel(sequelize, Sequelize)
  const BookTranslator = sequelize.define('book_translator', {})
  Book.belongsToMany(Translator, { through: BookTranslator, unique: false })
  Translator.belongsToMany(Book, { through: BookTranslator, unique: false })

  const Local = LocalModel(sequelize, Sequelize)
  const BookLocal = sequelize.define('book_local', {})
  Book.belongsToMany(Local, { through: BookLocal, unique: false })
  Local.belongsToMany(Book, { through: BookLocal, unique: false })

  const Comment = CommentModel(sequelize, Sequelize)
  Comment.belongsTo(Book);
  Book.hasMany(Comment);

  Comment.belongsTo(User);
  User.hasMany(Comment);

  const Wishlist = sequelize.define('wishlistEntry', {});
  Book.belongsToMany(User, { through: Wishlist, unique: false })
  User.belongsToMany(Book, { as: 'wishlist', through: Wishlist, unique: false })

  /*Book lending*/
  const Lend = sequelize.define('lendingEntry', { _id: {
                                        					 type: Sequelize.INTEGER,
                                        					 primaryKey: true,
                                        					 autoIncrement: true
                                              		},
                                                  dueDate: Sequelize.DATEONLY,
                                                  returned: {
                                                    type: Sequelize.BOOLEAN,
                                                    defaultValue: false
                                                  }
                                                });
  Book.belongsToMany(User, { as: 'lending', through: { model: Lend, unique: false } })
  User.belongsToMany(Book, { as: 'borrowing', through: { model: Lend, unique: false } })

  /*Book waiting*/
  const Wait = sequelize.define('waitingEntry', {expiryDate: Sequelize.DATEONLY })
  Book.belongsToMany(User, { as: 'queue', through: Wait, unique: false })
  User.belongsToMany(Book, { as: 'waiting', through: Wait, unique: false })


var flag_drop = (process.env.DB_DROP === 'true');
sequelize.sync({ force: flag_drop })
  .then(() => {
    console.log(`Database & tables created!`)
  })

module.exports = { User, Token, Book, Author, Organiser, Translator, Local, Tag, Comment, sequelize, Lend, Wait, Wishlist, Section}
