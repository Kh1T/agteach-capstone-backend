const { Op } = require('sequelize');

class APIFeatures {
  constructor(model, queryString, memeberItems) {
    this.model = model;
    this.queryString = queryString;
    this.memeberItems = memeberItems;
    this.queryOptions = {};
  }

  search() {
    this.queryOptions.where = {
      name: { [Op.iLike]: `%${this.queryString.name}%` },
    };
    return this;
  }
  

  sort() {
    if (this.queryString.order === 'DESC') {
      this.queryOptions.order = [['createdAt', 'DESC']];
    } else if (this.queryString.order === 'ASC') {
      this.queryOptions.order = [['createdAt', 'ASC']];
    }
    return this;
  }

  userItems(userUid) {
    this.queryOptions.include = [
      {
        model: this.memeberItems,
        where: { userUid },
      },
    ];
    return this;
  }

  async execute() {
    return await this.model.findAll(this.queryOptions);
  }
}

module.exports = APIFeatures;
