module.exports = function userDTO(user) {
  if (!user) return null;
  const base = user.base;
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    base: base ? { id: String(base._id || base.id), name: base.name, code: base.code } : null,
    isActive: user.active === false ? false : (user.isActive ?? true),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
