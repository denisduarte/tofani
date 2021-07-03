module.exports = (sequelize, type) => {
	return sequelize.define('User', {
		_id: {
			type: type.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
    name: type.STRING,
    email: {
      type: type.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: type.STRING,
      allowNull: false
    },
    acceptMailling: {
      type: type.BOOLEAN,
      defaultValue: false
    },
		administrator: {
      type: type.BOOLEAN,
      defaultValue: false
    }
  })
}
