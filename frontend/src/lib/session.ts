/** Thin wrapper over the localStorage keys used for the signed-in user. */

const TOKEN = 'token';
const NAME = 'username';
const EMAIL = 'email';

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const getToken = () => read(TOKEN);
export const getName = () => read(NAME);
export const getEmail = () => read(EMAIL);
export const isLoggedIn = () => !!read(TOKEN);

export const saveSession = (session: { token: string; name?: string; email?: string }) => {
  try {
    localStorage.setItem(TOKEN, session.token);
    localStorage.setItem(NAME, session.name || 'User');
    if (session.email) localStorage.setItem(EMAIL, session.email);
  } catch {
    /* ignore */
  }
};

export const clearSession = () => {
  try {
    [TOKEN, NAME, EMAIL].forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
};

/** "Ada Lovelace" -> "AL", "ada@mail.com" -> "A" */
export const initialsOf = (value?: string | null) => {
  if (!value) return '?';
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
