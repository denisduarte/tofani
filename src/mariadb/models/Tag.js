module.exports = (sequelize, type) => {
	return sequelize.define('Tag', {
		_id: {
					 type: type.INTEGER,
					 primaryKey: true,
					 autoIncrement: true
		},
		name: type.STRING
	})
}
