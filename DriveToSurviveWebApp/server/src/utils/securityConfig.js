/**
 * Security Config — In-memory runtime security settings
 * 
 * Allows admin to toggle security features on/off at runtime
 * for development/testing purposes.
 * State resets on server restart (defaults to all enabled).
 */

const securityConfig = {
  rateLimitEnabled: true,
  profanityFilterEnabled: true,
  contentFilterEnabled: true,
  blacklistCheckEnabled: true,
};

const getConfig = () => ({ ...securityConfig });

const updateConfig = (updates) => {
  for (const [key, value] of Object.entries(updates)) {
    if (key in securityConfig && typeof value === 'boolean') {
      securityConfig[key] = value;
    }
  }
  return getConfig();
};

const isEnabled = (feature) => {
  return securityConfig[feature] ?? true;
};

module.exports = { getConfig, updateConfig, isEnabled };
