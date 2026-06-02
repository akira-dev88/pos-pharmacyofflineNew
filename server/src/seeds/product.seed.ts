import { ProductModel } from '../models/Product';
import { CategoryModel } from '../models/Category';
import { AttributeModel } from '../models/Attribute';

const products = [
    {
        name: 'Dolo 650',
        composition: 'Paracetamol 650mg',
        manufacturer: 'Micro Labs Ltd',

        category: 'Fever',

        medicine_type: 'Tablet',
        unit: 'Strip',

        price: 35,

        schedule_type: 'NONE',

        gst_percent: 12,

        hsn_code: '300490',

        rack_location: 'A-12',

        barcode: '8901234567890',

        sku: 'DOLO650TAB',

        attributes: [
            {
                attribute: 'Strength',
                value: '650mg'
            },
            {
                attribute: 'Dosage Form',
                value: 'Tablet'
            },
            {
                attribute: 'Storage Condition',
                value: 'Room Temperature'
            },
            {
                attribute: 'Prescription Required',
                value: 'false'
            }
        ]
    },

    {
        name: 'Azithral 500',

        composition: 'Azithromycin 500mg',

        manufacturer:
            'Alembic Pharmaceuticals',

        category: 'Antibiotics',

        medicine_type: 'Tablet',

        unit: 'Strip',

        price: 125,

        schedule_type: 'H',

        gst_percent: 12,

        hsn_code: '300420',

        rack_location: 'B-05',

        barcode: '8901234567891',

        sku: 'AZI500TAB',

        attributes: [
            {
                attribute: 'Strength',
                value: '500mg'
            },
            {
                attribute: 'Dosage Form',
                value: 'Tablet'
            },
            {
                attribute: 'Storage Condition',
                value: 'Cool & Dry'
            },
            {
                attribute: 'Prescription Required',
                value: 'true'
            }
        ]
    },

    {
        name: 'Amlodipine 5mg',

        composition:
            'Amlodipine Besylate 5mg',

        manufacturer: 'Cipla Ltd',

        category: 'Blood Pressure',

        medicine_type: 'Tablet',

        unit: 'Strip',

        price: 45,

        schedule_type: 'H',

        gst_percent: 12,

        hsn_code: '300490',

        rack_location: 'C-08',

        barcode: '8901234567892',

        sku: 'AMLO5TAB',

        attributes: [
            {
                attribute: 'Strength',
                value: '5mg'
            },
            {
                attribute: 'Dosage Form',
                value: 'Tablet'
            },
            {
                attribute: 'Storage Condition',
                value: 'Room Temperature'
            },
            {
                attribute: 'Prescription Required',
                value: 'true'
            }
        ]
    },

    {
        name: 'Crocin Cold & Flu',

        composition:
            'Paracetamol + Phenylephrine + Caffeine',

        manufacturer:
            'GSK Pharmaceuticals',

        category: 'Cough & Cold',

        medicine_type: 'Syrup',

        unit: 'Bottle',

        price: 85,

        schedule_type: 'NONE',

        gst_percent: 12,

        hsn_code: '300490',

        rack_location: 'S-03',

        barcode: '8901234567893',

        sku: 'CROCFSYP',

        attributes: [
            {
                attribute: 'Flavor',
                value: 'Orange'
            },
            {
                attribute: 'Bottle Size',
                value: '60ml'
            },
            {
                attribute: 'Storage Condition',
                value: 'Room Temperature'
            }
        ]
    },

    {
        name: 'Benadryl Pediatric Drops',

        composition:
            'Diphenhydramine HCl',

        manufacturer:
            'Johnson & Johnson',

        category: 'Pediatric',

        medicine_type: 'Syrup',

        unit: 'Bottle',

        price: 65,

        schedule_type: 'NONE',

        gst_percent: 12,

        hsn_code: '300490',

        rack_location: 'P-01',

        barcode: '8901234567894',

        sku: 'BENPEDSYP',

        attributes: [
            {
                attribute: 'Flavor',
                value: 'Cherry'
            },
            {
                attribute: 'Bottle Size',
                value: '15ml'
            },
            {
                attribute: 'Storage Condition',
                value: 'Cool & Dry'
            }
        ]
    },

    {
        name: 'Lantus Insulin',

        composition:
            'Insulin Glargine',

        manufacturer:
            'Sanofi India',

        category: 'Insulin',

        medicine_type: 'Injection',

        unit: 'Vial',

        price: 450,

        schedule_type: 'H',

        gst_percent: 5,

        hsn_code: '300431',

        rack_location: 'R-02',

        barcode: '8901234567895',

        sku: 'LANINS',

        attributes: [
            {
                attribute:
                    'Cold Storage Required',

                value: 'true'
            },
            {
                attribute:
                    'Prescription Required',

                value: 'true'
            }
        ]
    }
];

export function seedProducts(): void {

    console.log(
        '🌱 Seeding products...'
    );

    for (const product of products) {

        const existing =
            ProductModel.findBySku(
                product.sku
            );
    
            
        const category =
            CategoryModel.findByName(
                product.category
            );

        if (!category) {

            console.warn(
                `Category not found: ${product.category}`
            );

            continue;
        }

        const attributes = [];

        for (
            const attr of product.attributes
        ) {

            const attribute =
                AttributeModel.findByName(
                    attr.attribute
                );

            if (!attribute) {

                console.warn(
                    `Attribute not found: ${attr.attribute}`
                );

                continue;
            }

            attributes.push({
                attribute_uuid:
                    attribute.attribute_uuid,

                value:
                    attr.value
            });
        }


        if (existing) {

            ProductModel.update(
                existing.product_uuid,
                {
                    ...product,
                    category_uuid:
                        category.category_uuid,

                    attributes
                }
            );

            continue;
        }

        ProductModel.create({

            ...product,

            category_uuid:
                category.category_uuid,

            attributes

        } as any);
    }

    console.log(
        '✅ Products seeded'
    );
}