const restaurantService = require("./restaurant.service");

async function list(req, res) {
  try {
    const restaurantes = await restaurantService.listRestaurants();
    res.json(restaurantes);
  } catch (error) {
    console.error("Erro ao buscar restaurantes:", error.message);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function create(req, res) {
  const { name, category, rating } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: "Nome e categoria são obrigatórios" });
  }

  try {
    const restaurant = await restaurantService.createRestaurant(
      { name, category, rating: rating || 0 },
      req.user
    );
    res.status(201).json(restaurant);
  } catch (error) {
    console.error("Erro ao cadastrar restaurante:", error.message);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado. Por favor, envie uma imagem." });
    }

    const restaurant = await restaurantService.uploadRestaurantImage(
      req.params.restaurantId,
      req.file.buffer,
      req.user.id
    );

    return res.status(200).json({
      message: "Imagem do restaurante atualizada com sucesso",
      restaurant
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Erro ao enviar imagem do restaurante:", error.message);
    return res.status(status).json({
      error: status === 500 ? "Erro interno do servidor" : error.message
    });
  }
}

async function removeImage(req, res) {
  try {
    const restaurant = await restaurantService.removeRestaurantImage(
      req.params.restaurantId,
      req.user.id
    );

    return res.status(200).json({
      message: "Imagem do restaurante removida com sucesso",
      restaurant
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Erro ao remover imagem do restaurante:", error.message);
    return res.status(status).json({
      error: status === 500 ? "Erro interno do servidor" : error.message
    });
  }
}

async function remove(req, res) {
  try {
    await restaurantService.deleteRestaurant(req.params.restaurantId, req.user.id);
    return res.status(204).send();
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Erro ao excluir restaurante:", error.message);
    return res.status(status).json({
      error: status === 500 ? "Erro interno do servidor" : error.message
    });
  }
}

module.exports = { list, create, uploadImage, removeImage, remove };