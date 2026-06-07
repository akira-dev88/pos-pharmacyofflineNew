import {
    Request,
    Response
} from 'express';

import { ProductTemplateModel }
    from '../models/ProductTemplate';

export class ProductTemplateController {

    static create = (
        req: Request,
        res: Response
    ) => {

        try {

            const template =
                ProductTemplateModel.create(
                    req.body
                );

            res.status(201).json({
                success: true,
                data: template
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    static index = (
        req: Request,
        res: Response
    ) => {

        const templates =
            ProductTemplateModel.findAll();

        res.json({
            success: true,
            data: templates
        });
    };

    static show = (
        req: Request,
        res: Response
    ) => {

        const uuid = Array.isArray(req.params.uuid)
            ? req.params.uuid[0]
            : req.params.uuid;

        if (!uuid) {
            res.status(400).json({
                success: false,
                error: 'UUID is required'
            });

            return;
        }

        const template =
            ProductTemplateModel.findById(
                uuid
            );

        if (!template) {

            res.status(404).json({
                success: false,
                error: 'Template not found'
            });

            return;
        }

        res.json({
            success: true,
            data: template
        });
    };

    static update = (
        req: Request,
        res: Response
    ) => {

        const uuid = Array.isArray(req.params.uuid)
            ? req.params.uuid[0]
            : req.params.uuid;

        if (!uuid) {
            res.status(400).json({
                success: false,
                error: 'UUID is required'
            });

            return;
        }

        const template =
            ProductTemplateModel.update(
                uuid,
                req.body
            );

        if (!template) {

            res.status(404).json({
                success: false,
                error: 'Template not found'
            });

            return;
        }

        res.json({
            success: true,
            data: template
        });
    };

    static destroy = (
        req: Request,
        res: Response
    ) => {

        const uuid = Array.isArray(req.params.uuid)
            ? req.params.uuid[0]
            : req.params.uuid;

        if (!uuid) {
            res.status(400).json({
                success: false,
                error: 'UUID is required'
            });

            return;
        }

        const deleted =
            ProductTemplateModel.delete(
                uuid
            );

        if (!deleted) {

            res.status(404).json({
                success: false,
                error: 'Template not found'
            });

            return;
        }

        res.json({
            success: true,
            message: 'Deleted successfully'
        });
    };
}