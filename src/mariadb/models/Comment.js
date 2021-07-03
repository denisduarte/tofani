module.exports = (sequelize, type) => {
	return sequelize.define('Comment', {
		_id: {
					 type: type.INTEGER,
					 primaryKey: true,
					 autoIncrement: true
		},
		comment: type.STRING,
	})
};
