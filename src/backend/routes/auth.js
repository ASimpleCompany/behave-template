const express = require('express');
const {
  obtaintoken,
  refreshtoken,
  updatepassword
} = require('../controllers/useradmin');

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     description: Retorna accessos jwt
 *     summary: return access token 
 *     parameters:
 *       - name: username
 *         description: correo del usuario
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *       - name: Password
 *         description: Puppy object
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: access token and refresh token
 *         content: 
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                   access:
 *                     type: string
 *                   refresh:
 *                     type: string
 *       401:
 *         description: Credenciales no validas
 */
router.route('/login').post(obtaintoken);

/**
 * @swagger
 * /api/v1/refresh/auth:
 *   post:
 *     tags:
 *       - Auth
 *     description: retorna nuevos accesos con el refresh token
 *     summary: nuevos accesso
 *     parameters:
 *       - name: refresh
 *         description: refresh token obtenido en login
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: access token and refresh token
 *         content: 
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                   access:
 *                     type: string
 *                   refresh:
 *                     type: string
 *       401:
 *         description: Token no valido o expirado
 */
router.route('/refresh').post(refreshtoken);



/**
 * @swagger
 * /api/v1/employee/password/{id}:
 *   post:
 *     tags:
 *       - Auth
 *     description: campibia contraseña
 *     summary: cambia contraseña de 
 *     parameters:
 *       - name: id_empleado
 *         description: id de empleado
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: contrasena
 *         description: mandar en cifrado base64, no es necesario
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pasword actualizado
 *       401:
 *         description: Token no valido o expirado
 */
router.route('/password/:id').post(updatepassword);

module.exports = router;
