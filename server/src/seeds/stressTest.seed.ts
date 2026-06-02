import { ProductModel } from '../models/Product';
import { ProductUnitModel } from '../models/ProductUnit';
import { ProductBatchModel } from '../models/ProductBatch';

import { CategoryModel } from '../models/Category';
import { AttributeModel } from '../models/Attribute';

const manufacturers = [
  'Cipla',
  'Sun Pharma',
  'Dr Reddy',
  'Mankind',
  'Alkem',
  'Lupin',
  'Torrent',
  'Micro Labs',
  'Glenmark'
];

const strengths = [
  '250mg',
  '500mg',
  '650mg',
  '1000mg'
];

const suppliers = [
  '2a35610e-33c8-42cd-8943-5cf4e90dae85',
  'f6bb842b-fcec-4da7-895b-81e9a0265876',
  'cad78523-de49-4090-996e-80ba2f40e7a8'
];

export function seedStressData(): void {

  console.log(
    '🚀 Generating stress test data...'
  );

  const categories =
    CategoryModel.findAll();

  if (!categories.length) {

    console.error(
      'No categories found'
    );

    return;
  }

  const strengthAttribute =
    AttributeModel.findByName(
      'Strength'
    );

  const dosageAttribute =
    AttributeModel.findByName(
      'Dosage Form'
    );

  for (
    let i = 1;
    i <= 1000;
    i++
  ) {

    const sku =
      `STRESSSKU${i}`;

    const existing =
      ProductModel.findBySku(sku);

    if (existing) {
      continue;
    }

    const category =
      categories[
      i % categories.length
      ];

    const product =
      ProductModel.create({

        name:
          `Medicine ${i}`,

        composition:
          `Drug ${i} ${
          strengths[
          i % strengths.length
          ]
          }`,

        manufacturer:
          manufacturers[
          i % manufacturers.length
          ],

        category_uuid:
          category.category_uuid,

        medicine_type:
          'Tablet',

        unit:
          'Strip',

        price:
          Math.floor(
            Math.random() * 500
          ) + 20,

        gst_percent: 12,

        barcode:
          `890000${i}`,

        sku,

        stock: 0,

        attributes: [

          ...(strengthAttribute
            ? [{
              attribute_uuid:
                strengthAttribute.attribute_uuid,
              value:
                strengths[
                i % strengths.length
                ]
            }]
            : []),

          ...(dosageAttribute
            ? [{
              attribute_uuid:
                dosageAttribute.attribute_uuid,
              value: 'Tablet'
            }]
            : [])
        ]
      });

          for (
      let b = 1;
      b <= 3;
      b++
    ) {

      ProductBatchModel.create({

        product_uuid:
          product.product_uuid,

        batch_number:
          `BATCH-${i}-${b}`,

        manufacture_date:
          '2025-01-01',

        expiry_date:
          `2028-12-${String(
            b + 10
          ).padStart(2, '0')}`,

        mrp:
          product.price,

        ptr:
          product.price * 0.9,

        rate:
          product.price * 0.8,

        purchase_price:
          product.price * 0.8,

        selling_price:
          product.price,

        gst_percent: 12,

        quantity:
          Math.floor(
            Math.random() * 500
          ) + 50,

        supplier_uuid:
          suppliers[
          b % suppliers.length
          ]
      });
    }
  }

  console.log(
    '✅ Stress data generated'
  );
}