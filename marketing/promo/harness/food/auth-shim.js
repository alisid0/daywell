// Harness stand-in for app/chatgpt-auth.ts, whose server imports can't load in the browser.
export const chatGPTSignOutPath = (returnTo = "/") => `/signout-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`;
