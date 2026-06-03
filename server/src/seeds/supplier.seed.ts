import { SupplierModel } from '../models/Supplier';

const companyPrefixes = [
  'Sri',
  'New',
  'Global',
  'National',
  'Prime',
  'Elite',
  'Med',
  'Health',
  'Life',
  'Care'
];

const companyNames = [
  'Distributors',
  'Pharma',
  'Medical Agencies',
  'Healthcare',
  'Drug House',
  'MediCorp',
  'Surgical Supplies',
  'Pharmaceuticals',
  'Traders',
  'Wholesalers'
];

const cities = [
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Trichy',
  'Salem',
  'Erode',
  'Tirunelveli',
  'Vellore',
  'Bangalore',
  'Hyderabad'
];

function generateSupplierName(index: number): string {
  return `${companyPrefixes[index % companyPrefixes.length]} ${
    companyNames[index % companyNames.length]
  } ${index}`;
}

export function seedSuppliers(): void {

  console.log(
    '🏭 Generating supplier stress data...'
  );

  for (
    let i = 1;
    i <= 1000;
    i++
  ) {

    const name =
      generateSupplierName(i);

    const existing =
      SupplierModel
        .search(name)
        .find(
          supplier =>
            supplier.name === name
        );

    if (existing) {
      continue;
    }

    SupplierModel.create({

      name,

      phone:
        `9${String(
          100000000 + i
        ).padStart(9, '0')}`,

      email:
        `supplier${i}@demo.com`,

      address:
        `${(i % 500) + 1},
        Medical Market,
        ${cities[
          i % cities.length
        ]}`

    });
  }

  console.log(
    '✅ Supplier stress data generated'
  );
}