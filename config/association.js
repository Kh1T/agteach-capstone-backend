const Product = require('../models/productModel');
const UserAccount = require('../models/userModel');
const ProductSuggestion = require('../models/productSuggestionModel');
const Course = require('../models/courseModel');
const Customer = require('../models/customerModel');
const SectionLecture = require('../models/sectionLectureModel');
const Location = require('../models/locationModel');
const Lecture = require('../models/lectureModel');
const Section = require('../models/sectionModel');
const Instructor = require('../models/instructorModel');
const ProductImage = require('../models/productImageModel');
const CourseSaleHistory = require('../models/courseSaleHistoryModel');
const Enroll = require('../models/enrollModel');
const Purchased = require('../models/purchasedModel');

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

// Product Suggestion

Course.hasMany(ProductSuggestion, { foreignKey: 'courseId' });
Instructor.hasMany(ProductSuggestion, { foreignKey: 'instructorId' });
ProductSuggestion.belongsTo(Course, { foreignKey: 'courseId' });
ProductSuggestion.belongsTo(Instructor, { foreignKey: 'instructorId' });
// Location

Location.hasMany(Instructor, { foreignKey: 'locationId' });
Instructor.belongsTo(Location, { foreignKey: 'locationId' });

// Course

// One Instructor can have many Courses
Instructor.hasMany(Course, { foreignKey: 'instructorId' });
Course.belongsTo(Instructor, { foreignKey: 'instructorId' });

// One Course can have many Sections
// Course.hasMany(Section, { foreignKey: 'course_id' });
// Section.belongsTo(Course, { foreignKey: 'course_id' });

// One Instructor can manage many Sections
Instructor.hasMany(Section, { foreignKey: 'instructorId' });
Section.belongsTo(Instructor, { foreignKey: 'instructorId' });

// One Instructor can have many Lectures
Instructor.hasMany(Lecture, { foreignKey: 'instructorId' });
Lecture.belongsTo(Instructor, { foreignKey: 'instructorId' });

// One Section can have many SectionLectures
Section.hasMany(SectionLecture, { foreignKey: 'sectionId' });
SectionLecture.belongsTo(Section, { foreignKey: 'sectionId' });

// One Course can have many SectionLectures
Course.hasMany(SectionLecture, { foreignKey: 'courseId' });
SectionLecture.belongsTo(Course, { foreignKey: 'courseId' });

// One Lecture can have many SectionLectures
Lecture.hasMany(SectionLecture, { foreignKey: 'lectureId' });
SectionLecture.belongsTo(Lecture, { foreignKey: 'lectureId' });

// One Instructor can be responsible for many SectionLectures
Instructor.hasMany(SectionLecture, { foreignKey: 'instructorId' });
SectionLecture.belongsTo(Instructor, { foreignKey: 'instructorId' });

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

module.exports = {
  UserAccount,
  Customer,
  Instructor,
  SectionLecture,
  Lecture,
  Section,
  Course,
  Product,
  CourseSaleHistory,
  Enroll,
  ProductSuggestion,
  Purchased,
};
