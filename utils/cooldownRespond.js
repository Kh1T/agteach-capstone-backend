/**
 * Checks if the given `lastSentTimestamp` is within a cooldown period (currently set to 1 minute).
 * If the cooldown is active, it sends a 429 response back to the user with a message indicating the
 * remaining cooldown period. If the cooldown is not active, it returns false.
 *
 * @param {string | number | Date} lastSentTimestamp - The timestamp when the last request was sent.
 * @param {string} useFor - The purpose of the cooldown, to be used in the response message.
 * @param {Response} res - The Express response object.
 * @returns {boolean | Response} Returns false if the cooldown is not active, or a 429 response if it is.
 */
const cooldownRespond = (lastSentTimestamp, useFor, res) => {
  const lastSent = new Date(lastSentTimestamp).getTime();
  const cooldownDuration = 1 * 60 * 1000;
  const currentTime = Date.now();
  const timeDifference = currentTime - lastSent;
  const isCooldownActive = timeDifference < cooldownDuration;

  if (isCooldownActive) {
    const remainingCooldown = cooldownDuration - timeDifference;
    return res.status(429).json({
      status: 'fail',
      message: `Your ${useFor} is in cooldown for ${remainingCooldown} milliseconds.`,
      remainingCooldown,
    });
  }

  // Return false if cooldown is not active, allowing further logic to proceed
  return false;
};

module.exports = cooldownRespond;
