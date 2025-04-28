import { Router, Request, Response } from 'express';
import path from 'path';
import MeasureController from '../controllers/MeasureController';

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload de uma imagem de medidor
 *     tags: [Leituras]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - customer_code
 *               - measure_datetime
 *               - measure_type
 *             properties:
 *               image:
 *                 type: string
 *                 description: Imagem em formato base64
 *               customer_code:
 *                 type: string
 *                 description: Código do cliente
 *               measure_datetime:
 *                 type: string
 *                 format: date-time
 *                 description: Data e hora da medição
 *               measure_type:
 *                 type: string
 *                 enum: [WATER, GAS]
 *                 description: Tipo de medição
 *     responses:
 *       200:
 *         description: Operação realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 image_url:
 *                   type: string
 *                   description: URL temporária para acessar a imagem
 *                 measure_value:
 *                   type: integer
 *                   description: Valor numérico reconhecido pela LLM
 *                 measure_uuid:
 *                   type: string
 *                   format: uuid
 *                   description: Identificador único da medição
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: "INVALID_DATA"
 *                 error_description:
 *                   type: string
 *                   example: "Descrição detalhada do erro"
 *       409:
 *         description: Leitura do mês já realizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: "DOUBLE_REPORT"
 *                 error_description:
 *                   type: string
 *                   example: "Leitura do mês já realizada"
 */

/**
 * @swagger
 * /confirm:
 *   patch:
 *     summary: Confirmar ou corrigir valor de leitura
 *     tags: [Leituras]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - measure_uuid
 *               - confirmed_value
 *             properties:
 *               measure_uuid:
 *                 type: string
 *                 format: uuid
 *                 description: UUID da medição a ser confirmada
 *               confirmed_value:
 *                 type: integer
 *                 description: Valor numérico confirmado
 *     responses:
 *       200:
 *         description: Operação realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: "INVALID_DATA"
 *                 error_description:
 *                   type: string
 *                   example: "É necessário um measure_uuid válido"
 *       404:
 *         description: Leitura não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: "MEASURE_NOT_FOUND"
 *                 error_description:
 *                   type: string
 *                   example: "Leitura não encontrada"
 *       409:
 *         description: Leitura já confirmada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: "CONFIRMATION_DUPLICATE"
 *                 error_description:
 *                   type: string
 *                   example: "Leitura já confirmada"
 */

/**
 * @swagger
 * /{customerCode}/list:
 *   get:
 *     summary: Listar medidas de um cliente
 *     tags: [Leituras]
 *     parameters:
 *       - in: path
 *         name: customerCode
 *         schema:
 *           type: string
 *         required: true
 *         description: Código do cliente
 *       - in: query
 *         name: measure_type
 *         schema:
 *           type: string
 *           enum: [WATER, GAS, water, gas]
 *         required: false
 *         description: Tipo de medição para filtrar (case insensitive)
 *     responses:
 *       200:
 *         description: Operação realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer_code:
 *                   type: string
 *                   description: Código do cliente
 *                 measures:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       measure_uuid:
 *                         type: string
 *                         format: uuid
 *                       measure_datetime:
 *                         type: string
 *                         format: date-time
 *                       measure_type:
 *                         type: string
 *                         enum: [WATER, GAS]
 *                       has_confirmed:
 *                         type: boolean
 *                       image_url:
 *                         type: string
 *       400:
 *         description: Tipo de medição inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: "INVALID_TYPE"
 *                 error_description:
 *                   type: string
 *                   example: "Tipo de medição não permitida"
 *       404:
 *         description: Nenhum registro encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: "MEASURES_NOT_FOUND"
 *                 error_description:
 *                   type: string
 *                   example: "Nenhuma leitura encontrada"
 */

/**
 * @swagger
 * /images/{filename}:
 *   get:
 *     summary: Acessar uma imagem
 *     tags: [Imagens]
 *     parameters:
 *       - in: path
 *         name: filename
 *         schema:
 *           type: string
 *         required: true
 *         description: Nome do arquivo de imagem
 *     responses:
 *       200:
 *         description: Imagem encontrada
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Imagem não encontrada
 */

const router = Router();

router.post('/upload', MeasureController.upload);
router.patch('/confirm', MeasureController.confirm);
router.get('/:customerCode/list', MeasureController.list);

router.get('/images/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const imagePath = path.resolve(__dirname, `../../data/images/${filename}`);
  res.sendFile(imagePath);
});

export default router;