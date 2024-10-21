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
  }));
};

// for instructor

const getInstructorCourseTopSales = async (instructorId) => {
  const instructorCourseSales = await sequelize.query(
    `SELECT * FROM get_instructor_course_topsales(${instructorId})`,
    {
      type: QueryTypes.SELECT,
    },
  );
  return instructorCourseSales.map((course) => ({
    ...course,
  }));
};

const getInstructorProductTopSales = async (instructorId) => {
  const instructorProductSales = await sequelize.query(
    `SELECT * FROM get_instructor_product_topsales(${instructorId})`,
    {
      type: QueryTypes.SELECT,
    },
  );
  return instructorProductSales.map((product) => ({
    ...product,
  }));
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
    ...sales,
  }));
};
module.exports = {
  getProductSalesTotals,
  getCourseTopSales,
  getSalesOverview,
  getInstructorOverviewSales,
  getInstructorProductTopSales,
  getInstructorCourseTopSales,
};
