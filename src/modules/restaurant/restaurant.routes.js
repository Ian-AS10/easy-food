const express = require("express");
const controller = require("./restaurant.controller");
const authenticate = require("../auth/auth.middleware"); 
const { uploadSingle } = require("../shared/upload.middleware");

const router = express.Router();

function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = { id: 1, name: "Admin EasyFood", email: "admin@easyfood.com" };
    return next();
  }
  return authenticate(req, res, next);
}

router.get("/", controller.list);
router.post("/", optionalAuthenticate, controller.create); 
router.delete("/:restaurantId", authenticate, controller.remove);
router.post("/:restaurantId/image", authenticate, uploadSingle("image"), controller.uploadImage);
router.delete("/:restaurantId/image", authenticate, controller.removeImage);

module.exports = router;