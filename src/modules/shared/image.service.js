const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Diretório base público de uploads na raiz do projeto
const UPLOAD_ROOT_DIR = path.resolve(__dirname, "../../../uploads");

/**
 * Garante que a pasta de destino exista
 * @param {string} dirPath 
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error("Erro ao criar diretório de uploads:", error);
    throw new Error("Não foi possível inicializar o diretório de arquivos.");
  }
}

/**
 * Otimiza e salva uma imagem recebida via buffer (Multer memoryStorage)
 *
 * @param {Buffer} fileBuffer - Buffer bruto da imagem
 * @param {Object} options
 * @param {string} options.folder - Subdiretório dentro de /uploads (ex: 'avatars', 'dishes')
 * @param {number} [options.width=800] - Largura máxima
 * @param {number} [options.height=800] - Altura máxima
 * @param {string} [options.fit='cover'] - Estratégia de corte/redimensionamento ('cover', 'inside', etc.)
 * @param {number} [options.quality=80] - Qualidade de compressão (1-100)
 * @returns {Promise<string>} Caminho relativo público acessível via navegador (ex: '/uploads/avatars/abc.webp')
 */
async function processAndSaveImage(fileBuffer, options = {}) {
  const {
    folder = "general",
    width = 800,
    height = 800,
    fit = "inside",
    quality = 80
  } = options;

  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error("Buffer de imagem inválido para processamento.");
  }

  const targetDir = path.join(UPLOAD_ROOT_DIR, folder);
  await ensureDirectoryExists(targetDir);

  // Gera nome único com UUID e extensão WebP
  const uniqueName = `${crypto.randomUUID()}.webp`;
  const fullFilePath = path.join(targetDir, uniqueName);

  try {
    // Processamento com Sharp: redimensionamento, conversão para WebP e compressão
    await sharp(fileBuffer)
      .resize({
        width,
        height,
        fit,
        withoutEnlargement: true
      })
      .webp({ quality })
      .toFile(fullFilePath);

    // Retorna caminho relativo servido publicamente pelo Express
    return `/uploads/${folder}/${uniqueName}`;
  } catch (error) {
    // Se ocorrer falha no Sharp, certifique-se de que nenhum arquivo parcial/corrompido permaneça no disco
    try {
      if (fs.existsSync(fullFilePath)) {
        await fs.promises.unlink(fullFilePath);
      }
    } catch (cleanupError) {
      console.warn("Falha na limpeza de arquivo após erro do Sharp:", cleanupError.message);
    }

    console.error("Erro no processamento da imagem com Sharp:", error.message);
    const err = new Error("Falha ao processar e otimizar a imagem.");
    err.statusCode = 422;
    throw err;
  }
}

/**
 * Remove um arquivo de imagem anterior do disco (caso exista)
 * @param {string} relativePath - Caminho relativo como '/uploads/avatars/abc.webp'
 */
async function deleteImage(relativePath) {
  if (!relativePath || typeof relativePath !== "string") return;

  // Garante que apenas arquivos dentro de /uploads sejam manipulados
  if (!relativePath.startsWith("/uploads/")) return;

  const localRelative = relativePath.replace(/^\/uploads\//, "");
  const fullPath = path.join(UPLOAD_ROOT_DIR, localRelative);

  try {
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  } catch (error) {
    console.warn(`Aviso: Não foi possível excluir a imagem antiga ${relativePath}:`, error.message);
  }
}

module.exports = {
  processAndSaveImage,
  deleteImage,
  UPLOAD_ROOT_DIR
};
