const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const Instructor = require('../models/instructorModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const CourseSaleHistory = require('../models/courseSaleHistoryModel');
const ProductSaleHistory = require('../models/productSaleHistoryModel');
const PurchasedDetail = require('../models/purchasedDetailModel');
const { fn, col } = require('../config/db');

const getProductSalesTotals = async (model, idField, includeModel) => {
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

const getCourseTopSales = async () => {
  const salesCourseTotals = await sequelize.query(
    `
  SELECT 
    "course"."course_id",
    "course"."name",
    'Course' AS "category",
    COALESCE(SUM("course_sale_history"."price"), 0) AS "totalSales"
  FROM 
    "course"
  LEFT OUTER JOIN 
    "course_sale_history" ON "course"."course_id" = "course_sale_history"."course_id"
  GROUP BY 
    "course"."course_id", "course"."name"
  ORDER BY 
    "totalSales" DESC
  LIMIT 5;
`,
    {
      type: QueryTypes.SELECT,
    },
  );
  return salesCourseTotals.map((course) => ({
    ...course,
    totalSales: parseFloat(course.totalSales), // Convert string to number
  }));
};
module.exports = { getProductSalesTotals, getCourseTopSales };
