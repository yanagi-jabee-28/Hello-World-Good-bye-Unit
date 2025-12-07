
export const getApiKey = (): string | null => {
  // 1. Vite Environment Variable (Local Dev)
  // Use type assertion for import.meta to avoid TS error about missing env property
  const meta = import.meta as any;
  if (meta.env && meta.env.VITE_GEMINI_API_KEY) return meta.env.VITE_GEMINI_API_KEY;
  
  // 2. Process Env (Build-in define substitution)
  // Note: In production build, process.env.API_KEY might be undefined or empty string
  if (typeof process !== 'undefined' && process.env.API_KEY) return process.env.API_KEY;
  if (typeof process !== 'undefined' && process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  
  // 3. Local Storage (User Input for Production Build)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('rsa_user_api_key');
  }
  
  return null;
};

export const setApiKey = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rsa_user_api_key', key);
  }
};

export const hasApiKey = (): boolean => {
  return !!getApiKey();
};
