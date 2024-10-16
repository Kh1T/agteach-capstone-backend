const Instructor = require('../models/instructorModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const ProductSaleHistory = require('../models/productSaleHistoryModel');
const PurchasedDetail = require('../models/purchasedDetailModel');
const sequelize = require('../config/db');

const getUniqueSalesTotals = async (model, idField, includeModel) => {
  const salesTotals = await model.findAll({
    attributes: [
      idField,
      [
        sequelize.fn(
          'SUM',
          sequelize.col(`${includeModel.name.toLowerCase()}.total`),
        ),
        'totalSales',
      ],
    ],
    include: [
      {
        model: includeModel,
        attributes: [],
        required: false, // This ensures a LEFT OUTER JOIN
      },
    ],
    group: [
      `${model.name.toLowerCase()}.${idField}`,
      `${includeModel.name.toLowerCase()}.purchased_detail_id`,
    ],
  });

  return salesTotals.reduce((acc, sale) => {
    const existing = acc.find((item) => item[idField] === sale.get(idField));
    if (existing) {
      existing.totalSales += parseFloat(sale.get('totalSales'));
    } else {
      acc.push({
        [idField]: sale.get(idField),
        totalSales: parseFloat(sale.get('totalSales')),
      });
    }
    return acc;
  }, []);
};

module.exports = { getUniqueSalesTotals };
