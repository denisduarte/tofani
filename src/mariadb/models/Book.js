module.exports = (sequelize, type) => {
	return sequelize.define('Book', {
		_id: {
					 type: type.INTEGER,
					 primaryKey: true,
					 autoIncrement: true
		},
		code: type.STRING,
		title: type.STRING,
		subtitle: type.STRING,
		description: type.TEXT,
		year: type.INTEGER,
		collection: type.STRING,
		volume: type.STRING,
		press: type.STRING,
		edition: type.INTEGER,
		pages: type.INTEGER,
		ex: type.STRING,
		isbn: type.STRING,
		format: type.STRING,
		status: type.STRING,
		state: type.STRING,
		cover: type.BLOB('long')
	})
}
