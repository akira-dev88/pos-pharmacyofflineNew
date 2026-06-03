// customer.seed.ts

import db from '../database/connection';
import { CustomerModel } from '../models/Customer';

const firstNames = [
  'Arun',
  'Karthik',
  'Vijay',
  'Suresh',
  'Prakash',
  'Rajesh',
  'Manoj',
  'Dinesh',
  'Anitha',
  'Priya',
  'Divya',
  'Keerthana',
  'Lakshmi',
  'Meena',
  'Nandhini'
];

const lastNames = [
  'Kumar',
  'Raman',
  'Krishnan',
  'Subramanian',
  'Narayanan',
  'Raj',
  'Sharma',
  'Reddy',
  'Patel',
  'Singh'
];

const areas = [
  'Anna Nagar',
  'Velachery',
  'Tambaram',
  'Porur',
  'Mylapore',
  'Adyar',
  'T Nagar',
  'Chrompet',
  'Medavakkam',
  'Perambur'
];

function random(min: number, max: number): number {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function randomDate(daysBack: number): string {
  const date = new Date();

  date.setDate(
    date.getDate() - random(0, daysBack)
  );

  return date
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

export function seedCustomers(): void {

  console.log(
    '🌱 Seeding customers...'
  );

  for (let i = 1; i <= 1000; i++) {

    const mobile =
      `9${String(100000000 + i)}`;

    const existing =
      CustomerModel.findByMobile(
        mobile
      );

    if (existing) {
      continue;
    }

    const name =
      `${
        firstNames[
          random(
            0,
            firstNames.length - 1
          )
        ]
      } ${
        lastNames[
          random(
            0,
            lastNames.length - 1
          )
        ]
      }`;

    const customer =
      CustomerModel.create({

        name,

        mobile,

        address:
          `${random(1, 300)}, ${
            areas[
              random(
                0,
                areas.length - 1
              )
            ]
          }, Chennai`,

        credit_limit:
          random(
            5000,
            100000
          )
      });

    // 50% customers get credit

    if (Math.random() < 0.5) {

      const creditBalance =
        random(
          500,
          25000
        );

      db.prepare(`
        UPDATE customers
        SET credit_balance = ?
        WHERE customer_uuid = ?
      `).run(
        creditBalance,
        customer.customer_uuid
      );

      // Sale entry

      db.prepare(`
        INSERT INTO customer_ledgers (
          customer_uuid,
          type,
          amount,
          note,
          created_at
        )
        VALUES (?, ?, ?, ?, ?)
      `).run(
        customer.customer_uuid,
        'sale',
        creditBalance,
        'Credit Sale',
        randomDate(120)
      );

      // 50% of debtors made partial payment

      if (Math.random() < 0.5) {

        const payment =
          random(
            100,
            Math.floor(
              creditBalance * 0.7
            )
          );

        db.prepare(`
          INSERT INTO customer_ledgers (
            customer_uuid,
            type,
            amount,
            note,
            created_at
          )
          VALUES (?, ?, ?, ?, ?)
        `).run(
          customer.customer_uuid,
          'payment',
          payment,
          'Cash Payment',
          randomDate(60)
        );
      }
    }
  }

  console.log(
    '✅ Customers seeded'
  );
}