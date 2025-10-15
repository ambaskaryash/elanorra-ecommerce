// src/env.ts
// This file is used to define environment variables.
// In a real application, you would typically load these from a .env file
// or similar secure configuration management.

export const env = {
  MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY || '',
  MAILCHIMP_API_SERVER: process.env.MAILCHIMP_API_SERVER || '', // e.g., 'us1', 'us2'
  MAILCHIMP_AUDIENCE_ID: process.env.MAILCHIMP_AUDIENCE_ID || '',
  // Add other environment variables here as needed
};
