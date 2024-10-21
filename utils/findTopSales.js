const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

// for admin
const getCourseTopSales = async () => {
  const salesCourseTotals = await sequelize.query(
    `SELECT * FROM get_course_topsales()`,
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
    `SELECT * FROM get_product_topsales()`,
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
    `SELECT * FROM get_sales_overview()`,
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

// for instructor

const getInstructorCourseTopSales = async (instructorId) => {
  const instructorCourseSales = `SELECT * FROM get_instructor_course_topsales(${instructorId})`;
};

const getInstructorOverviewSales = async (instructorId) => {
  const instructorSalesOverview = await sequelize.query(
    `SELECT * FROM get_instructor_sales_overview(:instructor_param)`,
    {
      type: QueryTypes.SELECT,
      replacements: { instructor_param: instructorId },
    },
  );
  return instructorSalesOverview.map((sales) => ({
    // ...sales,
    day: (sales.day),
    totalCourseSales: parseFloat(sales.totalcoursesales), // Convert string to number
    totalProductSales: parseFloat(sales.totalproductsales),
  }));
};
module.exports = {
  getProductSalesTotals,
  getCourseTopSales,
  getSalesOverview,
  getInstructorOverviewSales,
};
