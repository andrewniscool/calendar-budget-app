function readBooleanEnv(name) {
  return import.meta.env[name] === "true";
}

export const SKIP_AUTH = readBooleanEnv("VITE_SKIP_AUTH");
export const SKIP_CALENDAR_PICKER = readBooleanEnv("VITE_SKIP_CALENDAR_PICKER");
export const USE_MOCK_API =
  readBooleanEnv("VITE_USE_MOCK_API") || SKIP_AUTH || SKIP_CALENDAR_PICKER;

export const DEV_USER = {
  id: "dev-user",
  username: "UI Developer",
  email: "dev@example.local",
};

export const DEV_CALENDAR = {
  calendar_id: "dev-calendar",
  name: "UI Sandbox",
};
