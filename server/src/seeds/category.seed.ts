// seeds/category.seed.ts

import {
  CategoryModel,
  Category
} from '../models/Category';

interface CategoryNode {
  name: string;
  children?: CategoryNode[];
}

const categoryTree: CategoryNode[] = [
  {
    name: 'Medicines',
    children: [
      {
        name: 'Tablets',
        children: [
          { name: 'Fever' },
          { name: 'Pain Relief' },
          { name: 'Antibiotics' },
          { name: 'Blood Pressure' }
        ]
      },
      {
        name: 'Syrups',
        children: [
          { name: 'Cough & Cold' },
          { name: 'Pediatric' }
        ]
      },
      {
        name: 'Injections',
        children: [
          { name: 'Insulin' },
          { name: 'Vaccines' }
        ]
      },
      {
        name: 'Capsules'
      },
      {
        name: 'Ointments'
      }
    ]
  },
  {
    name: 'Surgical'
  },
  {
    name: 'FMCG'
  },
  {
    name: 'Ayurvedic'
  }
];

function createIfNotExists(
  name: string,
  parent_uuid?: string
): Category {

  const existing =
    CategoryModel.findByName(name);

  if (existing) {
    return existing;
  }

  return CategoryModel.create({
    name,
    parent_uuid
  });
}

function seedNode(
  node: CategoryNode,
  parent_uuid?: string
): void {

  const category =
    createIfNotExists(
      node.name,
      parent_uuid
    );

  if (!node.children?.length) {
    return;
  }

  for (const child of node.children) {

    seedNode(
      child,
      category.category_uuid
    );

  }
}

export function seedCategories(): void {

  console.log(
    '🌱 Seeding categories...'
  );

  for (const root of categoryTree) {

    seedNode(root);

  }

  console.log(
    '✅ Categories seeded'
  );
}