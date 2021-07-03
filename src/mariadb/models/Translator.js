module.exports = (sequelize, type) => {
	return sequelize.define('Translator', {
		_id: {
					 type: type.INTEGER,
					 primaryKey: true,
					 autoIncrement: true
		},
		name: type.STRING
	})
};
