const express = require('express');
const {
  createuser,
  usertable,
  updateuser,
  userselect,
  userdelete,
  useractivities,
  userstats,
  userpermisions
} = require('../controllers/useradmin');

const router = express.Router();

/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     tags:
 *       - Usuario
 *     description: Crea Usuarios
 *     summary: return access token 
 *     parameters:
 *       - name: username
 *         description: correo del usuario
 *         in: body
 *         schema:
 *           type: string
 *       - name: Password
 *         description: Puppy object
 *         in: body
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: access token and refresh token
 *       401:
 *         description: Credenciales no validas
 */
router.route('/roles/:id').get(userpermisions);
router.route('/activities/get').get(useractivities);
router.route('/stats/get').get(userstats);
router.route('/').post(createuser);
router.route('/:id').get(userselect);
router.route('/:id').put(updateuser);
router.route('/:id').delete(userdelete);
router.route('/').get(usertable);




module.exports = router;
