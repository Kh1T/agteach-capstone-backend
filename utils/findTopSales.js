const Instructor = require('../models/instructorModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Course = require('../models/courseModel');
const ProductSaleHistory = require('../models/productSaleHistoryModel');
const PurchasedDetail = require('../models/purchasedDetailModel');
const { fn, col } = require('../config/db');

const getUniqueSalesTotals = async (model, idField, includeModel) => {
  const salesTotals = await model.findAll({
    attributes: [
      idField,
      [
        fn('SUM', col(`${includeModel.name.toLowerCase()}.total`)),
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

  const salesPromises = salesTotals.map(async (sale) => {
    const id = sale.get(idField);
    const totalSales = parseFloat(sale.get('totalSales')) || 0;

    const item = await Product.findOne({
      where: { [idField]: id },
      attributes: ['name', 'categoryId'],
      include: [
        {
          model: Category,
          attributes: ['name'],
        },
      ],
    });
    return {
      [idField]: id,
      name: item.get('name'),
      category: item.product_category.dataValues.name,
      totalSales,
    };
  });

  const result = await Promise.all(salesPromises);
  return result.reduce((acc, sale) => {
    const existing = acc.find((item) => item[idField] === sale[idField]);
    if (existing) {
      existing.totalSales += sale.totalSales;
    } else {
      acc.push(sale);
    }
    return acc;
  }, []);
};

module.exports = { getUniqueSalesTotals };
