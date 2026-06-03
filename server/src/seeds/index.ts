import { runMigrations } from '../database/migrations/001_initial';

import { seedCategories } from './category.seed';
import { seedAttributes } from './attribute.seed';
import { seedCategoryAttributes } from './category-attribute.seed';
import { seedProducts } from './product.seed';
import { seedProductUnits } from './productUnit.seed';
import { seedProductBatches } from './productBatch.seed';
import { seedStressData } from './stressTest.seed';
import { seedCustomers } from './customer.seed';
import { seedSuppliers } from './supplier.seed';

function runSeeds(): void {

  console.log('🔄 Running migrations...');
  runMigrations();

  console.log('✅ Migrations complete');

  seedCategories();
  seedAttributes();
  seedCategoryAttributes();
  seedProducts();
  seedProductUnits();
  seedSuppliers();
  seedProductBatches();
  seedCustomers();
  seedStressData();

  console.log('🎉 All seeds completed');
}

runSeeds();