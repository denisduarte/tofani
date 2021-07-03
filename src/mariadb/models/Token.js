module.exports = (sequelize, type) => {
	return sequelize.define('Token', {
		_id: {
					 type: type.INTEGER,
					 primaryKey: true,
					 autoIncrement: true
		},
    token: type.STRING
  })
}
