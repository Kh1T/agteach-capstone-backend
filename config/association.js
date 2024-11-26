const Product = require('../models/productModel');
const UserAccount = require('../models/userModel');
const ProductSuggestion = require('../models/productSuggestionModel');
const Course = require('../models/courseModel');
const Customer = require('../models/customerModel');
const Location = require('../models/locationModel');
const Lecture = require('../models/lectureModel');
const Section = require('../models/sectionModel');
const Instructor = require('../models/instructorModel');
const ProductImage = require('../models/productImageModel');
const CourseSaleHistory = require('../models/courseSaleHistoryModel');
const Enroll = require('../models/enrollModel');
const Purchased = require('../models/purchasedModel');
const PurchasedDetail = require('../models/purchasedDetailModel');
const ProductSaleHistory = require('../models/productSaleHistoryModel');
const ProductCategory = require('../models/productCategoryModel');

// Account Associations

UserAccount.hasOne(Customer, { foreignKey: 'userUid' });
UserAccount.hasOne(Instructor, { foreignKey: 'userUid' });
Customer.belongsTo(UserAccount, { foreignKey: 'userUid' });
Instructor.belongsTo(UserAccount, { foreignKey: 'userUid' });

// Product
Instructor.hasMany(Product, { foreignKey: 'instructorId' });
Product.belongsTo(Instructor, { foreignKey: 'instructorId' });

Product.hasMany(ProductImage, { foreignKey: 'productId' });
ProductImage.belongsTo(Product, { foreignKey: 'productId' });

ProductCategory.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(ProductCategory, { foreignKey: 'categoryId' });

// Product Suggestion

Course.hasMany(ProductSuggestion, { foreignKey: 'courseId' });
Instructor.hasMany(ProductSuggestion, { foreignKey: 'instructorId' });

Product.hasMany(ProductSuggestion, { foreignKey: 'productId' });
ProductSuggestion.belongsTo(Product, { foreignKey: 'productId' });

ProductSuggestion.belongsTo(Course, { foreignKey: 'courseId' });
ProductSuggestion.belongsTo(Instructor, { foreignKey: 'instructorId' });

// Location

Location.hasMany(Instructor, { foreignKey: 'locationId' });
Instructor.belongsTo(Location, { foreignKey: 'locationId' });

Location.hasMany(Customer, { foreignKey: 'locationId' });
Customer.belongsTo(Location, { foreignKey: 'locationId' });

// Course

// One Instructor can have many Courses
Instructor.hasMany(Course, { foreignKey: 'instructorId' });
Course.belongsTo(Instructor, { foreignKey: 'instructorId' });

// One Course can have many Sections

Course.hasMany(Section, { foreignKey: 'courseId' });
Section.belongsTo(Course, { foreignKey: 'courseId' });

Section.hasMany(Lecture, { foreignKey: 'sectionId' });
Lecture.belongsTo(Section, { foreignKey: 'sectionId' });

// One Instructor can manage many Sections
Instructor.hasMany(Section, { foreignKey: 'instructorId' });
Section.belongsTo(Instructor, { foreignKey: 'instructorId' });

// One Instructor can have many Lectures
Instructor.hasMany(Lecture, { foreignKey: 'instructorId' });
Lecture.belongsTo(Instructor, { foreignKey: 'instructorId' });

Section.hasMany(Lecture, { foreignKey: 'sectionId' });
Lecture.belongsTo(Section, { foreignKey: 'sectionId' });

//Course Sales History Association
Course.hasMany(CourseSaleHistory, { foreignKey: 'courseId' });
CourseSaleHistory.belongsTo(Course, { foreignKey: 'courseId' });

Customer.hasMany(CourseSaleHistory, { foreignKey: 'customerId' });
CourseSaleHistory.belongsTo(Customer, { foreignKey: 'customerId' });

Instructor.hasMany(CourseSaleHistory, { foreignKey: 'instructorId' });
CourseSaleHistory.belongsTo(Instructor, { foreignKey: 'instructorId' });

//Enroll Association
Course.hasMany(Enroll, { foreignKey: 'courseId' });
Enroll.belongsTo(Course, { foreignKey: 'courseId' });

Customer.hasMany(Enroll, { foreignKey: 'customerId' });
Enroll.belongsTo(Customer, { foreignKey: 'customerId' });

//Purchased Association
Customer.hasMany(Purchased, { foreignKey: 'customerId' });
Purchased.belongsTo(Customer, { foreignKey: 'customerId' });

//Purchased Detail Association
Purchased.hasMany(PurchasedDetail, { foreignKey: 'purchasedId' });
PurchasedDetail.belongsTo(Purchased, { foreignKey: 'purchasedId' });

Product.hasMany(PurchasedDetail, { foreignKey: 'productId' });
PurchasedDetail.belongsTo(Product, { foreignKey: 'productId' });

//Product Sale History Association
Product.hasMany(ProductSaleHistory, { foreignKey: 'productId' });
ProductSaleHistory.belongsTo(Product, { foreignKey: 'productId' });

Customer.hasMany(ProductSaleHistory, { foreignKey: 'customerId' });
ProductSaleHistory.belongsTo(Customer, { foreignKey: 'customerId' });

PurchasedDetail.belongsTo(ProductSaleHistory, { foreignKey: 'purchasedId' });

PurchasedDetail.hasMany(ProductSaleHistory, {
  foreignKey: 'purchasedDetailId',
});
ProductSaleHistory.belongsTo(PurchasedDetail, {
  foreignKey: 'purchasedDetailId',
});
Purchased.hasMany(ProductSaleHistory, { foreignKey: 'purchasedId' });
ProductSaleHistory.belongsTo(Purchased, { foreignKey: 'purchasedId' });

Instructor.hasMany(ProductSaleHistory, { foreignKey: 'instructorId' });
ProductSaleHistory.belongsTo(Instructor, { foreignKey: 'instructorId' });

module.exports = {
  UserAccount,
  Customer,
  Instructor,
  Lecture,
  Section,
  Course,
  Product,
  CourseSaleHistory,
  Enroll,
  ProductSuggestion,
  Purchased,
  PurchasedDetail,
  ProductSaleHistory,
};
