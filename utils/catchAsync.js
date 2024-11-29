/**
 * Wraps a function in a try-catch block and calls next with any errors encountered.
 * This is a common pattern for Express middleware.
 *
 * @param {function} fn - The function to wrap.
 * @returns {function} A new function which wraps the original function in a try-catch block.
 */
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
