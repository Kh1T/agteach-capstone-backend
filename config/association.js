const Product = require('../models/productModel');
const UserAccount = require('../models/userModel');
const Course = require('../models/courseModel');
const Customer = require('../models/customerModel');
const SectionLecture = require('../models/sectionLectureModel');
const Lecture = require('../models/lectureModel');
const Section = require('../models/sectionModel');
const Instructor = require('../models/instructorModel');
const ProductImage = require('../models/productImageModel');
const CourseSaleHistory = require('../models/courseSaleHistoryModel');

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

// Course

// One Instructor can have many Courses
Instructor.hasMany(Course, { foreignKey: 'instructor_id' });
Course.belongsTo(Instructor, { foreignKey: 'instructor_id' });

// One Course can have many Sections
// Course.hasMany(Section, { foreignKey: 'course_id' });
// Section.belongsTo(Course, { foreignKey: 'course_id' });

// One Instructor can manage many Sections
Instructor.hasMany(Section, { foreignKey: 'instructor_id' });
Section.belongsTo(Instructor, { foreignKey: 'instructor_id' });

// One Instructor can have many Lectures
Instructor.hasMany(Lecture, { foreignKey: 'instructor_id' });
Lecture.belongsTo(Instructor, { foreignKey: 'instructor_id' });

// One Section can have many SectionLectures
Section.hasMany(SectionLecture, { foreignKey: 'section_id' });
SectionLecture.belongsTo(Section, { foreignKey: 'section_id' });

// One Course can have many SectionLectures
Course.hasMany(SectionLecture, { foreignKey: 'course_id' });
SectionLecture.belongsTo(Course, { foreignKey: 'course_id' });

// One Lecture can have many SectionLectures
Lecture.hasMany(SectionLecture, { foreignKey: 'lecture_id' });
SectionLecture.belongsTo(Lecture, { foreignKey: 'lecture_id' });

// One Instructor can be responsible for many SectionLectures
Instructor.hasMany(SectionLecture, { foreignKey: 'instructor_id' });
SectionLecture.belongsTo(Instructor, { foreignKey: 'instructor_id' });

//Course Sales History Association
Course.hasMany(CourseSaleHistory, { foreignKey: 'course_id' });
CourseSaleHistory.belongsTo(Course, { foreignKey: 'course_id' });

Customer.hasMany(CourseSaleHistory, { foreignKey: 'customer_id' });
CourseSaleHistory.belongsTo(Customer, { foreignKey: 'customer_id' });

Instructor.hasMany(CourseSaleHistory, { foreignKey: 'instructor_id' });
CourseSaleHistory.belongsTo(Customer, { foreignKey: 'instructor_id' });

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
};
