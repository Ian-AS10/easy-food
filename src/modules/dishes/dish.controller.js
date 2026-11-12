const dishService = require("./dish.service");

function handleError(res, error) {
  const status = error.statusCode || 500;
  return res.status(status).json({
    error: status === 500 ? "Erro interno no servidor" : error.message
  });
}

async function create(req, res) {
  try {
    const dish = await dishService.createDish(req.params.restaurantId, req.body, req.user.id); // ⬅️
    return res.status(201).json(dish);
  } catch (error) {
    return handleError(res, error);
  }
}

async function list(req, res) {
  try {
    const dishes = await dishService.listDishes(req.params.restaurantId);
    return res.status(200).json(dishes);
  } catch (error) {
    return handleError(res, error);
  }
}

async function getById(req, res) {
  try {
    const dish = await dishService.getDish(req.params.dishId);
    return res.status(200).json(dish);
  } catch (error) {
    return handleError(res, error);
  }
}

async function update(req, res) {
  try {
    const dish = await dishService.updateDish(req.params.dishId, req.body, req.user.id); // ⬅️
    return res.status(200).json(dish);
  } catch (error) {
    return handleError(res, error);
  }
}

async function remove(req, res) {
  try {
    await dishService.deleteDish(req.params.dishId, req.user.id); // ⬅️
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado. Por favor, envie uma imagem." });
    }

    const dish = await dishService.uploadDishImage(
      req.params.dishId,
      req.file.buffer,
      req.user.id
    );

    return res.status(200).json({
      message: "Imagem do prato atualizada com sucesso",
      dish
    });
  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  uploadImage,
  handleError
};