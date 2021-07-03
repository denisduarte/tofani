module.exports = (sequelize, type) => {
	return sequelize.define('Author', {
		_id: {
					 type: type.INTEGER,
					 primaryKey: true,
					 autoIncrement: true
		},
		name: type.STRING
	})
};
