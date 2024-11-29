const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

// for admin

/**
 * Retrieves top selling courses.
 * @async
 * @function getCourseTopSales
 * @returns {Promise<Array<{courseId: number, name: string, price: number, saleCount: number}>>}
 */
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

/**
 * Retrieves top selling products.
 * @async
 * @function getProductSalesTotals
 * @returns {Promise<Array<{productId: number, name: string, price: number, saleCount: number}>>}
 */
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

/**
 * Retrieves sales overview data.
 * @async
 * @function getSalesOverview
 * @returns {Promise<Array<Object>>} An array of sales overview objects.
 */
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

/**
 * Retrieves top selling courses for an instructor.
 * @async
 * @function getInstructorCourseTopSales
 * @param {number} instructorId - The ID of the instructor.
 * @returns {Promise<Array<{courseId: number, name: string, price: number, saleCount: number}>>}
 */
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

/**
 * Retrieves top selling products for an instructor.
 * @async
 * @function getInstructorProductTopSales
 * @param {number} instructorId - The ID of the instructor.
 * @returns {Promise<Array<{productId: number, name: string, price: number, saleCount: number}>>}
 */
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

/**
 * Retrieves sales overview data for an instructor.
 * @async
 * @function getInstructorOverviewSales
 * @param {number} instructorId - The ID of the instructor.
 * @returns {Promise<Array<{date: string, courseId: number, courseName: string, productId: number, productName: string, salePrice: number, saleCount: number}>>}
 *   An array of sales overview objects.
 */
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
