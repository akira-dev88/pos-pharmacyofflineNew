import { ProductModel } from '../models/Product';
import { ProductUnitModel } from '../models/ProductUnit';

const units = [

  {
    product: 'Dolo 650',

    units: [

      {
        unit_name: 'Tablet',
        conversion_factor: 1,
        is_base_unit: 1
      },

      {
        unit_name: 'Strip',
        conversion_factor: 15,
        barcode: 'STRIP890123',
        price: 35,
        purchase_price: 28
      },

      {
        unit_name: 'Box',
        conversion_factor: 300,
        barcode: 'BOX890123',
        price: 700,
        purchase_price: 560
      }
    ]
  },

  {
    product: 'Azithral 500',

    units: [

      {
        unit_name: 'Tablet',
        conversion_factor: 1,
        is_base_unit: 1
      },

      {
        unit_name: 'Strip',
        conversion_factor: 10,
        barcode: 'AZI890123',
        price: 125,
        purchase_price: 95
      },

      {
        unit_name: 'Box',
        conversion_factor: 100,
        barcode: 'AZIBOX123',
        price: 1250,
        purchase_price: 950
      }
    ]
  },

  {
    product: 'Crocin Cold & Flu',

    units: [

      {
        unit_name: 'ml',
        conversion_factor: 1,
        is_base_unit: 1
      },

      {
        unit_name: 'Bottle',
        conversion_factor: 60,
        barcode: 'CROBOT60',
        price: 85,
        purchase_price: 65
      },

      {
        unit_name: 'Carton',
        conversion_factor: 720,
        barcode: 'CROCAR12',
        price: 1020,
        purchase_price: 780
      }
    ]
  }
];

export function seedProductUnits(): void {

  console.log(
    '🌱 Seeding product units...'
  );

  for (const item of units) {

    const product =
      ProductModel.findByName(
        item.product
      );

    if (!product) {

      console.warn(
        `Product not found: ${item.product}`
      );

      continue;
    }

    for (const unit of item.units) {

      const existing =
        ProductUnitModel.findByProductAndUnitName(
          product.product_uuid,
          unit.unit_name
        );

      if (existing) {

        ProductUnitModel.update(
          existing.unit_uuid,
          {
            ...unit,
            product_uuid:
              product.product_uuid
          }
        );

        continue;
      }

      ProductUnitModel.create({

        ...unit,

        product_uuid:
          product.product_uuid

      } as any);
    }
  }

  console.log(
    '✅ Product units seeded'
  );
}