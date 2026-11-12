const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../../database/prisma");

const imageService = require("../shared/image.service");

const JWT_SECRET = process.env.JWT_SECRET || "easyfood-secret-key-2026";

function formatUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || null
  };
}

// Cadastro: guarda o usuário com a senha em hash
async function register({ name, email, password }) {
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hash }
  });

  // Nunca devolvemos a senha
  return formatUser(user);
}

// Login: confere o e-mail, compara a senha e gera o token
async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return null; // usuário não existe
  }

  const senhaConfere = await bcrypt.compare(password, user.password);

  if (!senhaConfere) {
    return null; // senha errada
  }

  // Gera o token com o id e email do usuário, válido por 1 dia
  const token = jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  return { token, user: formatUser(user) };
}

// Busca os dados atualizados do usuário no banco (sem a senha)
async function getById(id) {
  const user = await prisma.user.findUnique({ where: { id: Number(id) } });

  if (!user) {
    return null;
  }

  return formatUser(user);
}

// Upload e otimização do avatar do usuário autenticado
async function uploadAvatar(userId, fileBuffer) {
  const id = Number(userId);
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    const error = new Error("Usuário não encontrado");
    error.statusCode = 404;
    throw error;
  }

  // Processa e otimiza a imagem em formato quadrado (avatar)
  const avatarUrl = await imageService.processAndSaveImage(fileBuffer, {
    folder: "avatars",
    width: 300,
    height: 300,
    fit: "cover",
    quality: 85
  });

  // Se já possuía avatar, remove o arquivo anterior para liberar espaço
  if (user.avatarUrl) {
    await imageService.deleteImage(user.avatarUrl);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { avatarUrl }
  });

  return formatUser(updated);
}

async function removeAvatar(userId) {
  const id = Number(userId);
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    const error = new Error("Usuário não encontrado");
    error.statusCode = 404;
    throw error;
  }

  if (user.avatarUrl) {
    await imageService.deleteImage(user.avatarUrl);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { avatarUrl: null }
  });

  return formatUser(updated);
}

module.exports = { register, login, getById, uploadAvatar, removeAvatar };