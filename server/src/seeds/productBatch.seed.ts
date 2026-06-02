import {
  ProductBatchModel
} from '../models/ProductBatch';

import {
  ProductModel
} from '../models/Product';

const SUPPLIER_1 =
  '2a35610e-33c8-42cd-8943-5cf4e90dae85';

const SUPPLIER_2 =
  'f6bb842b-fcec-4da7-895b-81e9a0265876';

const SUPPLIER_3 =
  'cad78523-de49-4090-996e-80ba2f40e7a8';

const batches = [

  // DOLO

  {
    product: 'Dolo 650',

    batch_number:
      'DOLO-2025-01',

    expiry_date:
      '2026-12-31',

    manufacture_date:
      '2025-01-15',

    mrp: 35,

    ptr: 30,

    rate: 28,

    purchase_price: 28,

    selling_price: 35,

    gst_percent: 12,

    quantity: 150,

    supplier_uuid:
      SUPPLIER_1
  },

  {
    product: 'Dolo 650',

    batch_number:
      'DOLO-2025-02',

    expiry_date:
      '2027-03-31',

    manufacture_date:
      '2025-03-10',

    mrp: 35,

    ptr: 30,

    rate: 27,

    purchase_price: 27,

    selling_price: 35,

    gst_percent: 12,

    quantity: 200,

    supplier_uuid:
      SUPPLIER_2
  },

  // AZITHRAL

  {
    product:
      'Azithral 500',

    batch_number:
      'AZI-2025-001',

    expiry_date:
      '2026-08-31',

    manufacture_date:
      '2024-09-01',

    mrp: 125,

    ptr: 105,

    rate: 95,

    purchase_price: 95,

    selling_price: 125,

    gst_percent: 12,

    quantity: 80,

    supplier_uuid:
      SUPPLIER_1
  },

  // LANTUS

  {
    product:
      'Lantus Insulin',

    batch_number:
      'LANT-2025-01',

    expiry_date:
      '2026-12-31',

    manufacture_date:
      '2025-01-01',

    mrp: 450,

    ptr: 420,

    rate: 400,

    purchase_price: 400,

    selling_price: 450,

    gst_percent: 5,

    quantity: 25,

    supplier_uuid:
      SUPPLIER_3
  }
];

export function seedProductBatches(): void {

  console.log(
    '🌱 Seeding product batches...'
  );

  for (const batch of batches) {

    const product =
      ProductModel.findByName(
        batch.product
      );

    if (!product) {

      console.warn(
        `Product not found: ${batch.product}`
      );

      continue;
    }

    const existing =
      ProductBatchModel
        .findByBatchNumber(
          product.product_uuid,
          batch.batch_number
        );

    if (existing) {

      console.log({
        product_uuid: product.product_uuid,
        supplier_uuid: batch.supplier_uuid,
        batch_number: batch.batch_number
      });

      ProductBatchModel.update(
        existing.batch_uuid,
        {
          product_uuid: product.product_uuid,

          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date,
          manufacture_date: batch.manufacture_date,

          mrp: batch.mrp,
          ptr: batch.ptr,
          rate: batch.rate,

          purchase_price: batch.purchase_price,
          selling_price: batch.selling_price,

          gst_percent: batch.gst_percent,

          quantity: batch.quantity,

          supplier_uuid: batch.supplier_uuid
        }
      );

      continue;
    }

    ProductBatchModel.create({

      ...batch,

      product_uuid:
        product.product_uuid

    } as any);


  }

  console.log(
    '✅ Product batches seeded'
  );
}
