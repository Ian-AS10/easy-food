const authService = require("./auth.service");

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios" });
  }

  try {
    const user = await authService.register({ name, email, password });
    res.status(201).json(user);
  } catch (error) {
    // Erro comum: e-mail duplicado (violação do @unique)
    if (error.code === "P2002") {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios" });
  }

  try {
    const result = await authService.login({ email, password });

    if (!result) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function uploadAvatar(req, res) {
  try {
    // Garante que o ID venha estritamente de req.user (extraído pelo middleware de JWT)
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado. Por favor, envie uma imagem." });
    }

    const updatedUser = await authService.uploadAvatar(userId, file.buffer);

    return res.status(200).json({
      message: "Foto de perfil atualizada com sucesso",
      user: updatedUser
    });
  } catch (error) {
    console.error("Erro no upload do avatar:", error.message);
    const status = error.statusCode || 500;
    return res.status(status).json({
      error: status === 500 ? "Erro interno do servidor ao processar avatar" : error.message
    });
  }
}

module.exports = { register, login, uploadAvatar };