const Product = require('../models/productModel');
const UserAccount = require('../models/userModel');
const Course = require('../models/courseModel');
const Customer = require('../models/customerModel');
const SectionLecture = require('../models/sectionLectureModel');
const Location = require('../models/locationModel');
const Lecture = require('../models/lectureModel');
const Section = require('../models/sectionModel');
const Instructor = require('../models/instructorModel');
const ProductImage = require('../models/productImageModel');

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

// Location
Instructor.hasOne(Location, { foreignKey: 'instructorId' });

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

module.exports = {
  UserAccount,
  Customer,
  Instructor,
  SectionLecture,
  Lecture,
  Section,
  Course,
  Product,
};
