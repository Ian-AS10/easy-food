const express = require("express");
const controller = require("./restaurant.controller");
const authenticate = require("../auth/auth.middleware"); 

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

module.exports = router;