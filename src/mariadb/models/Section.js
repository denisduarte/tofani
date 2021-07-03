module.exports = (sequelize, type) => {
	return sequelize.define('Section', {
		_id: {
					 type: type.INTEGER,
					 primaryKey: true,
					 autoIncrement: true
		},
		name: type.STRING,
		position: type.INTEGER
	})
};
