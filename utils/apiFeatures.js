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
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort
        .split(',')
        .map((field) => [field, 'ASC']);
      this.queryOptions.order = sortBy;
    } else {
      this.queryOptions.order = [['createdAt', 'DESC']];
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
