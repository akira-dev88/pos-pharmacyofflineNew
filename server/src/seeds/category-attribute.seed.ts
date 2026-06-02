import { CategoryModel } from '../models/Category';
import { AttributeModel } from '../models/Attribute';
import { CategoryAttributeModel } from '../models/CategoryAttribute';

const categoryAttributeMap = {
  Tablets: [
    'Strength',
    'Dosage Form',
    'Storage Condition',
    'Prescription Required'
  ],

  Syrups: [
    'Flavor',
    'Bottle Size',
    'Storage Condition'
  ],

  Injections: [
    'Cold Storage Required',
    'Prescription Required'
  ]
};

export function seedCategoryAttributes(): void {

  console.log(
    '🌱 Seeding category attributes...'
  );

  for (
    const [categoryName, attributeNames]
    of Object.entries(categoryAttributeMap)
  ) {

    const category =
      CategoryModel.findByName(
        categoryName
      );

    if (!category) {

      console.warn(
        `⚠️ Category not found: ${categoryName}`
      );

      continue;
    }

    let sortOrder = 1;

    for (
      const attributeName
      of attributeNames
    ) {

      const attribute =
        AttributeModel.findByName(
          attributeName
        );

      if (!attribute) {

        console.warn(
          `⚠️ Attribute not found: ${attributeName}`
        );

        continue;
      }

      const exists =
        CategoryAttributeModel.exists(
          category.category_uuid,
          attribute.attribute_uuid
        );

      if (!exists) {

        CategoryAttributeModel.assign(
          category.category_uuid,
          attribute.attribute_uuid,
          true,
          sortOrder
        );

      }

      sortOrder++;

    }

  }

  console.log(
    '✅ Category attributes seeded'
  );

}
