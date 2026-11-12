const prisma = require("../../database/prisma");
const emailService = require("../shared/email.service");
const activityService = require("../shared/activity.service");
const imageService = require("../shared/image.service");

// Para quem o comercial recebe os avisos (no futuro, virá do .env ou do banco)
const COMERCIAL_EMAIL = "felipe.oliveira@pro.fecaf.com.br";

async function listRestaurants() {
  return prisma.restaurant.findMany();
}

async function createRestaurant(data, user) {
  // 1) O que realmente importa: cadastrar o restaurante
  const restaurant = await prisma.restaurant.create({
    data: {
      name: data.name,
      category: data.category,
      rating: data.rating || 0,
      ownerId: user.id // ⬅️ grava o dono (quem está logado, vindo do token)
    }
  });

  // 2) Ações secundárias — cada uma isolada por try/catch.
  //    Se qualquer uma falhar, o cadastro NÃO é afetado.

  // E-mail de boas-vindas (usa o serviço genérico)
  try {
    await emailService.sendEmail({
      to: user.email, // e-mail de quem cadastrou (vindo do token)
      toName: restaurant.name,
      subject: `Bem-vindo à EasyFood, ${restaurant.name}!`,
      header: `Olá, ${restaurant.name}!`,
      body: `Seu restaurante <strong>${restaurant.name}</strong> foi cadastrado com sucesso na EasyFood. Categoria: ${restaurant.category}.`,
      footer: "Equipe EasyFood"
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de boas-vindas:", error.message);
  }

  // Registro da atividade
  try {
    await activityService.log("RESTAURANT_CREATED", `Restaurante: ${restaurant.name}`);
  } catch (error) {
    console.error("Erro ao registrar atividade:", error.message);
  }

  // Alerta para o comercial (MESMA função genérica, outro conteúdo)
  try {
    await emailService.sendEmail({
      to: COMERCIAL_EMAIL,
      toName: "Comercial EasyFood",
      subject: `Novo restaurante cadastrado: ${restaurant.name}`,
      header: "Novo restaurante na plataforma",
      body: `Nome: ${restaurant.name}<br/>Categoria: ${restaurant.category}<br/>Avaliação: ${restaurant.rating}`,
      footer: "Notificação automática — EasyFood"
    });
  } catch (error) {
    console.error("Erro ao notificar o comercial:", error.message);
  }

  // 3) O restaurante volta independente do resultado das ações acima
  return restaurant;

  // --- Envio de sms função 
}


// --------createrestaurant.event

async function uploadRestaurantImage(restaurantId, fileBuffer, userId) {
  const id = Number(restaurantId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    const error = new Error("Identificador inválido");
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) {
    const error = new Error("Restaurante não encontrado");
    error.statusCode = 404;
    throw error;
  }

  if (restaurant.ownerId !== userId) {
    const error = new Error("Você não tem permissão para gerenciar este restaurante");
    error.statusCode = 403;
    throw error;
  }

  const imageUrl = await imageService.processAndSaveImage(fileBuffer, {
    folder: "restaurants",
    width: 800,
    height: 500,
    fit: "cover",
    quality: 82
  });

  if (restaurant.imageUrl) {
    await imageService.deleteImage(restaurant.imageUrl);
  }

  return prisma.restaurant.update({
    where: { id },
    data: { imageUrl }
  });
}

async function removeRestaurantImage(restaurantId, userId) {
  const id = Number(restaurantId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    const error = new Error("Identificador inválido");
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) {
    const error = new Error("Restaurante não encontrado");
    error.statusCode = 404;
    throw error;
  }

  if (restaurant.ownerId !== userId) {
    const error = new Error("Você não tem permissão para gerenciar este restaurante");
    error.statusCode = 403;
    throw error;
  }

  if (restaurant.imageUrl) {
    await imageService.deleteImage(restaurant.imageUrl);
  }

  return prisma.restaurant.update({
    where: { id },
    data: { imageUrl: "" }
  });
}

async function deleteRestaurant(restaurantId, userId) {
  const id = Number(restaurantId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    const error = new Error("Identificador inválido");
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) {
    const error = new Error("Restaurante não encontrado");
    error.statusCode = 404;
    throw error;
  }

  if (restaurant.ownerId !== userId) {
    const error = new Error("Você não tem permissão para gerenciar este restaurante");
    error.statusCode = 403;
    throw error;
  }

  const dishes = await prisma.dish.findMany({ where: { restaurantId: id } });
  for (const dish of dishes) {
    if (dish.imageUrl) {
      await imageService.deleteImage(dish.imageUrl);
    }
  }
  await prisma.dish.deleteMany({ where: { restaurantId: id } });

  if (restaurant.imageUrl) {
    await imageService.deleteImage(restaurant.imageUrl);
  }

  await prisma.restaurant.delete({ where: { id } });

  try {
    await activityService.log("RESTAURANT_DELETED", `Restaurante: ${restaurant.name}`);
  } catch (error) {
    console.error("Erro ao registrar atividade:", error.message);
  }
}

module.exports = {
  listRestaurants,
  createRestaurant,
  uploadRestaurantImage,
  removeRestaurantImage,
  deleteRestaurant
};