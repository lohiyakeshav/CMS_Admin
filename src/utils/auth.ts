export const isAdmin = (): boolean => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  
  try {
    const parsedUser = JSON.parse(user);
    return parsedUser.role === 'admin';
  } catch {
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem('user');
  window.location.href = '/login';
}; 