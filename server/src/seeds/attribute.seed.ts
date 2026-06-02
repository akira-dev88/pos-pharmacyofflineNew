import { AttributeModel } from '../models/Attribute';

export function seedAttributes(): void {

  function createIfNotExists(
    name: string,
    display_name: string,
    data_type: string
  ) {

    const existing =
      AttributeModel.findByName(
        name
      );

    if (existing) {
      return existing;
    }

    return AttributeModel.create({
      name,
      display_name,
      data_type
    });
  }


  console.log('🌱 Seeding attributes...');

  const attributes = [
    {
      name: 'Strength',
      display_name: 'Medicine dosage strength',
      data_type: 'text'
    },
    {
      name: 'Dosage Form',
      display_name: 'Physical medicine form',
      data_type: 'select'
    },
    {
      name: 'Storage Condition',
      display_name: 'Medicine storage requirement',
      data_type: 'text'
    },
    {
      name: 'Prescription Required',
      display_name: 'Whether doctor prescription is required',
      data_type: 'boolean'
    },
    {
      name: 'Flavor',
      display_name: 'Medicine flavor/taste',
      data_type: 'select'
    },
    {
      name: 'Bottle Size',
      display_name: 'Volume of syrup bottle',
      data_type: 'text'
    },
    {
      name: 'Cold Storage Required',
      display_name: 'Requires refrigeration',
      data_type: 'boolean'
    },
    {
      name: 'Composition Type',
      display_name: 'Type of medicine composition',
      data_type: 'select'
    }
  ];

  for (const attribute of attributes) {

    createIfNotExists(
      attribute.name,
      attribute.display_name,
      attribute.data_type
    );

  }

  console.log('✅ Attributes seeded');
}