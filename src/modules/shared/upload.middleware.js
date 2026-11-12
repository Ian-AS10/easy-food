const multer = require("multer");

// Armazenamento em memória (Buffer) para processamento ágil e direto pelo Sharp
const storage = multer.memoryStorage();

// Tipos MIME aceitos
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

// Limite de 5 MB por arquivo
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("Formato de arquivo inválido. Apenas imagens JPEG, PNG e WebP são aceitas.");
    error.statusCode = 400;
    error.code = "INVALID_FILE_TYPE";
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});

/**
 * Middleware reutilizável para upload de arquivo único com tratamento robusto de erros do Multer
 * @param {string} fieldName - Nome do campo (padrão: "image")
 */
function uploadSingle(fieldName = "image") {
  const multerHandler = upload.single(fieldName);

  return (req, res, next) => {
    multerHandler(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              error: `Tamanho máximo de arquivo excedido. Limite permitido: ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
            });
          }
          return res.status(400).json({ error: `Erro no upload: ${err.message}` });
        }

        if (err.code === "INVALID_FILE_TYPE" || err.statusCode === 400) {
          return res.status(400).json({ error: err.message });
        }

        return res.status(500).json({ error: "Erro interno durante o upload do arquivo." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado. Por favor, envie uma imagem." });
      }

      next();
    });
  };
}

module.exports = {
  upload,
  uploadSingle,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
};
