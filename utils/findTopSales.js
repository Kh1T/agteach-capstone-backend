const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const Instructor = require('../models/instructorModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const CourseSaleHistory = require('../models/courseSaleHistoryModel');
const ProductSaleHistory = require('../models/productSaleHistoryModel');
const PurchasedDetail = require('../models/purchasedDetailModel');
const { fn, col } = require('../config/db');

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

const getProductSalesTotals = async () => {
  const salesProductTotals = await sequelize.query(
    ` SELECT 
      product_sale_history.product_id,
      Product.name,
      product_category.name AS category,
      SUM(purchased_detail.total) AS "totalSales"
    FROM 
      product_sale_history
    LEFT OUTER JOIN 
      purchased_detail ON product_sale_history.purchased_detail_id = purchased_detail.purchased_detail_id
    INNER JOIN
      Product ON product_sale_history.product_id = Product.product_id
    INNER JOIN
      product_category ON Product.category_id = product_category.category_id
    GROUP BY 
      product_sale_history.product_id,
      Product.name,
      product_category.name
    ORDER BY 
      "totalSales" DESC
    LIMIT 5;
`,
    {
      type: QueryTypes.SELECT,
    },
  );
  return salesProductTotals.map((product) => ({
    ...product,
    totalSales: parseFloat(product.totalSales), // Convert string to number
  }));
};

const getSalesOverview = async () => {
  // const results = await sequelize.query('CALL sales_overview();');
  const salesOverview = await sequelize.query(
    `WITH date_series AS (
      SELECT generate_series(
        NOW() - INTERVAL '6 days',
        NOW(),
        '1 day'::interval
        )::date AS day
      )
      SELECT 
        ds.day,
        COALESCE(SUM(sales."totalCourseSales"), 0) AS "totalCourseSales",
        COALESCE(SUM(sales."totalProductSales"), 0) AS "totalProductSales"
      FROM date_series ds
      LEFT JOIN (
        SELECT 
          DATE_TRUNC('day', "product_sale_history"."created_at") AS day,
          0 AS "totalCourseSales",
          SUM("purchased_detail"."total") AS "totalProductSales"
        FROM 
          "product_sale_history"
        LEFT JOIN 
          "purchased_detail" ON "product_sale_history"."purchased_detail_id" = "purchased_detail"."purchased_detail_id"
        WHERE 
          "product_sale_history"."created_at" >= NOW() - INTERVAL '7 days'
        GROUP BY 
          DATE_TRUNC('day', "product_sale_history"."created_at")

        UNION ALL

        SELECT 
          DATE_TRUNC('day', "course_sale_history"."created_at") AS day,
          SUM("course_sale_history"."price") AS "totalCourseSales",
          0 AS "totalProductSales"
        FROM 
          "course_sale_history"
        WHERE 
          "course_sale_history"."created_at" >= NOW() - INTERVAL '7 days'
        GROUP BY 
          DATE_TRUNC('day', "course_sale_history"."created_at")
      ) AS sales
      ON ds.day = sales.day
      GROUP BY 
        ds.day
      ORDER BY 
        ds.day;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );
  return salesOverview.map((sales) => ({
    ...sales,
    totalCourseSales: parseFloat(sales.totalCourseSales), // Convert string to number
    totalProductSales: parseFloat(sales.totalProductSales),
  }));
};
module.exports = { getProductSalesTotals, getCourseTopSales, getSalesOverview };
