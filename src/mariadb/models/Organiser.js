module.exports = (sequelize, type) => {
	return sequelize.define('Organiser', {
		_id: {
					 type: type.INTEGER,
					 primaryKey: true,
					 autoIncrement: true
		},
		name: type.STRING
	})
};
