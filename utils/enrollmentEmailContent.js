const generateEnrollmentEmailContent = (courseId) => {
    const enrollmentDate = new Date().toLocaleDateString(); // Get current date as enrollment date
  
    // Generate and return the email content
    return `<p>Thank you for enrolling in AgTeach course.</p>
            <p>Course ID: ${courseId}</p>
            <p>Enrollment Date: ${enrollmentDate}</p>`;
  };
  
  module.exports = generateEnrollmentEmailContent;