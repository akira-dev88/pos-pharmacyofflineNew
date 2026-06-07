import db from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

import {
    ProductTemplate,
    ProductTemplateCreateInput,
    ProductTemplateUpdateInput
} from '../types';

export class ProductTemplateModel {

    static create(
        input: ProductTemplateCreateInput
    ): ProductTemplate {

        const templateUuid = uuidv4();

        const stmt = db.prepare(`
      INSERT INTO product_templates (
        template_uuid,
        name,
        description,
        category_uuid,
        icon,
        defaults_json,
        packaging_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            templateUuid,
            input.name,
            input.description || null,
            input.category_uuid || null,
            input.icon || null,
            JSON.stringify(input.defaults_json || {}),
            JSON.stringify(input.packaging_json || {})
        );

        return this.findById(templateUuid)!;
    }

    static findById(
        uuid: string
    ): ProductTemplate | undefined {

        const row = db.prepare(`
      SELECT *
      FROM product_templates
      WHERE template_uuid = ?
    `).get(uuid) as any;

        if (!row) return undefined;

        return {
            ...row,
            defaults_json: JSON.parse(
                row.defaults_json || '{}'
            ),
            packaging_json: JSON.parse(
                row.packaging_json || '{}'
            )
        };
    }

    static findAll(): ProductTemplate[] {

        const rows = db.prepare(`
      SELECT *
      FROM product_templates
      WHERE is_active = 1
      ORDER BY name
    `).all() as any[];

        return rows.map(row => ({
            ...row,
            defaults_json: JSON.parse(
                row.defaults_json || '{}'
            ),
            packaging_json: JSON.parse(
                row.packaging_json || '{}'
            )
        }));
    }

    static update(
        uuid: string,
        updates: ProductTemplateUpdateInput
    ): ProductTemplate | undefined {

        const existing =
            this.findById(uuid);

        if (!existing) {
            return undefined;
        }

        db.prepare(`
      UPDATE product_templates
      SET
        name = ?,
        description = ?,
        category_uuid = ?,
        icon = ?,
        defaults_json = ?,
        packaging_json = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE template_uuid = ?
    `).run(
            updates.name ?? existing.name,
            updates.description ?? existing.description,
            updates.category_uuid ?? existing.category_uuid,
            updates.icon ?? existing.icon,
            JSON.stringify(
                updates.defaults_json ??
                existing.defaults_json
            ),
            JSON.stringify(
                updates.packaging_json ??
                existing.packaging_json
            ),
            updates.is_active ??
            existing.is_active,
            uuid
        );

        return this.findById(uuid);
    }

    static delete(
        uuid: string
    ): boolean {

        const result = db.prepare(`
      DELETE FROM product_templates
      WHERE template_uuid = ?
    `).run(uuid);

        return result.changes > 0;
    }
}