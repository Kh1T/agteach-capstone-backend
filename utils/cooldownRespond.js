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
